import { createClient } from '@supabase/supabase-js';

// Use the app's own Supabase URL and anon key for general app functionality
const appSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Use the dashboard's Supabase URL and anon key for subscription checks
const dashboardSupabase = createClient(
  import.meta.env.VITE_DASHBOARD_SUPABASE_URL,
  import.meta.env.VITE_DASHBOARD_SUPABASE_ANON_KEY
);

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'bolt.new' || 
  window.location.hostname.endsWith('.bolt.new') ||
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('webcontainer.io');

export async function checkAccess() {
  // Always return true in development
  if (isDevelopment) {
    console.log('Development mode detected - bypassing auth checks');
    return true;
  }

  try {
    // Get current session from the app's Supabase
    const { data: { session } } = await appSupabase.auth.getSession();
    if (!session) {
      window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`;
      return false;
    }

    // Check subscription against the dashboard's Supabase
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

    const { hasAccess } = await response.json();

    if (!hasAccess) {
      window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/account`;
      return false;
    }

    return true;
  } catch (error) {
    console.error('Access check failed:', error);
    if (isDevelopment) {
      console.log('Development mode - continuing despite error');
      return true;
    }
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`;
    return false;
  }
}