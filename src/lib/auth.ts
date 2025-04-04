import { createClient } from '@supabase/supabase-js';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'bolt.new' || 
  window.location.hostname.endsWith('.bolt.new') ||
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('webcontainer.io');

// Create Supabase clients
const appSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const dashboardSupabase = createClient(
  import.meta.env.VITE_DASHBOARD_SUPABASE_URL,
  import.meta.env.VITE_DASHBOARD_SUPABASE_ANON_KEY
);

export async function checkAccess() {
  if (isDevelopment) {
    console.log('Development mode detected - skipping auth check');
    return true;
  }

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await appSupabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      throw sessionError;
    }

    if (!session) {
      console.log('No session found, redirecting to login...');
      window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`;
      return false;
    }

    // Check subscription
    const response = await fetch(
      `${import.meta.env.VITE_DASHBOARD_URL}/api/check-subscription`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          appName: 'showflow'
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Subscription check failed: ${response.statusText}`);
    }

    const { hasAccess } = await response.json();

    if (!hasAccess) {
      window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/account`;
      return false;
    }

    return true;
  } catch (error) {
    console.error('Access check failed:', error);
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`;
    return false;
  }
}