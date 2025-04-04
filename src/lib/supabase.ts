import { createClient } from '@supabase/supabase-js';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'bolt.new' || 
  window.location.hostname.endsWith('.bolt.new') ||
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('webcontainer.io');

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  // Skip redirects in development
  if (!isDevelopment && (event === 'SIGNED_OUT' || event === 'USER_DELETED')) {
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`;
  }
});