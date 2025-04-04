import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const appSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const appSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const dashboardSupabaseUrl = import.meta.env.VITE_DASHBOARD_SUPABASE_URL;
const dashboardSupabaseAnonKey = import.meta.env.VITE_DASHBOARD_SUPABASE_ANON_KEY;
const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL;

// Validate required environment variables
if (!appSupabaseUrl || !appSupabaseAnonKey || !dashboardSupabaseUrl || !dashboardSupabaseAnonKey || !dashboardUrl) {
  console.error('Missing required environment variables:', {
    hasAppUrl: !!appSupabaseUrl,
    hasAppKey: !!appSupabaseAnonKey,
    hasDashboardUrl: !!dashboardSupabaseUrl,
    hasDashboardKey: !!dashboardSupabaseAnonKey,
    hasDashboardWebUrl: !!dashboardUrl
  });
  throw new Error('Required environment variables are missing');
}

// Create Supabase clients
const appSupabase = createClient(appSupabaseUrl, appSupabaseAnonKey);
const dashboardSupabase = createClient(dashboardSupabaseUrl, dashboardSupabaseAnonKey);

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'bolt.new' || 
  window.location.hostname.endsWith('.bolt.new') ||
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('webcontainer.io');

export async function checkAccess() {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await appSupabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      throw sessionError;
    }

    if (!session) {
      console.log('No session found, redirecting to login...');
      window.location.href = `${dashboardUrl}/login`;
      return false;
    }

    // Check subscription
    const response = await fetch(
      `${dashboardUrl}/api/check-subscription`,
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
      window.location.href = `${dashboardUrl}/account`;
      return false;
    }

    return true;
  } catch (error) {
    console.error('Access check failed:', error);
    window.location.href = `${dashboardUrl}/login`;
    return false;
  }
}