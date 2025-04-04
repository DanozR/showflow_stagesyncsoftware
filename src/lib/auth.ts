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

// Use the app's own Supabase URL and anon key for general app functionality
const appSupabase = createClient(
  appSupabaseUrl,
  appSupabaseAnonKey
);

// Use the dashboard's Supabase URL and anon key for subscription checks
const dashboardSupabase = createClient(
  dashboardSupabaseUrl,
  dashboardSupabaseAnonKey
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
  // Log environment variables and development status
  console.log('Environment Check:', {
    isDevelopment,
    hasAppUrl: !!appSupabaseUrl,
    hasAppKey: !!appSupabaseAnonKey,
    hasDashboardUrl: !!dashboardSupabaseUrl,
    hasDashboardKey: !!dashboardSupabaseAnonKey,
    hasDashboardWebUrl: !!dashboardUrl,
    NODE_ENV: process.env.NODE_ENV,
    hostname: window.location.hostname
  });

  // Always return true in development
  if (isDevelopment) {
    console.log('Development mode detected - bypassing auth checks');
    return true;
  }

  try {
    // Get current session from the app's Supabase
    console.log('Fetching Supabase session...');
    const { data: { session }, error: sessionError } = await appSupabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      throw sessionError;
    }

    console.log('Session status:', {
      hasSession: !!session,
      userId: session?.user?.id,
      // Redact sensitive information but confirm presence
      hasAccessToken: !!session?.access_token
    });

    if (!session) {
      console.log('No session found, redirecting to login...');
      window.location.href = `${dashboardUrl}/login`;
      return false;
    }

    // Construct subscription check URL
    const subscriptionCheckUrl = `${dashboardUrl}/api/check-subscription`;
    console.log('Checking subscription at:', subscriptionCheckUrl);

    // Prepare request details
    const requestBody = {
      userId: session.user.id,
      appName: 'showflow'
    };

    console.log('Subscription check request:', {
      url: subscriptionCheckUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]'
      },
      body: requestBody
    });

    // Check subscription against the dashboard's Supabase
    const response = await fetch(
      subscriptionCheckUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Subscription check response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      console.error('Subscription check failed:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Subscription check failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Subscription check result:', responseData);

    const { hasAccess } = responseData;

    if (!hasAccess) {
      console.log('No access, redirecting to account page...');
      window.location.href = `${dashboardUrl}/account`;
      return false;
    }

    console.log('Access check successful');
    return true;
  } catch (error) {
    console.error('Access check failed:', error);
    if (isDevelopment) {
      console.log('Development mode - continuing despite error');
      return true;
    }
    window.location.href = `${dashboardUrl}/login`;
    return false;
  }
}