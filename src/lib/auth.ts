import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const appSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const appSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const dashboardSupabaseUrl = import.meta.env.VITE_DASHBOARD_SUPABASE_URL;
const dashboardSupabaseAnonKey = import.meta.env.VITE_DASHBOARD_SUPABASE_ANON_KEY;
const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL;

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'bolt.new' || 
  window.location.hostname.endsWith('.bolt.new') ||
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('webcontainer.io');

// In development, use default values if env vars are missing
const getEnvVar = (value: string | undefined, defaultValue: string): string => {
  if (isDevelopment) {
    return value || defaultValue;
  }
  return value || '';
};

// Set up environment variables with development fallbacks
const env = {
  appUrl: getEnvVar(appSupabaseUrl, 'https://avehrshbpoivtjmrfflr.supabase.co'),
  appKey: getEnvVar(appSupabaseAnonKey, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZWhyc2hicG9pdnRqbXJmZmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NDMyMTcsImV4cCI6MjA1ODAxOTIxN30.mtVlPhnopLbZcV8Iw6JvEBInYPajt3X8wpVxMDAB6q4'),
  dashboardUrl: getEnvVar(dashboardUrl, 'https://app.stagesyncsoftware.com'),
  dashboardSupabaseUrl: getEnvVar(dashboardSupabaseUrl, 'https://utsdvojhtdxuudgeecgj.supabase.co'),
  dashboardSupabaseKey: getEnvVar(dashboardSupabaseAnonKey, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0c2R2b2podGR4dXVkZ2VlY2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MzAwNDIsImV4cCI6MjA1ODEwNjA0Mn0.KItV_gEtaxSNKStv6fZ6CjGAnUUrMPe2nuXg6ERKmyo')
};

// Validate environment variables in production
if (!isDevelopment) {
  const missingVars = Object.entries(env).filter(([_, value]) => !value);
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', {
      hasAppUrl: !!env.appUrl,
      hasAppKey: !!env.appKey,
      hasDashboardUrl: !!env.dashboardUrl,
      hasDashboardSupabaseUrl: !!env.dashboardSupabaseUrl,
      hasDashboardKey: !!env.dashboardSupabaseKey
    });
    throw new Error('Required environment variables are missing');
  }
}

// Create Supabase clients
const appSupabase = createClient(env.appUrl, env.appKey);
const dashboardSupabase = createClient(env.dashboardSupabaseUrl, env.dashboardSupabaseKey);

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
      window.location.href = `${env.dashboardUrl}/login`;
      return false;
    }

    // Check subscription
    const response = await fetch(
      `${env.dashboardUrl}/api/check-subscription`,
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
      window.location.href = `${env.dashboardUrl}/account`;
      return false;
    }

    return true;
  } catch (error) {
    console.error('Access check failed:', error);
    window.location.href = `${env.dashboardUrl}/login`;
    return false;
  }
}