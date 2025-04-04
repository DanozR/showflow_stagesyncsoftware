import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Check if we're in development mode - keep consistent with auth.ts
const isDevelopment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'bolt.new' || 
  window.location.hostname.endsWith('.bolt.new') ||
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('webcontainer.io');

// Log environment check
console.log('Supabase Client Environment Check:', {
  isDevelopment,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  NODE_ENV: process.env.NODE_ENV,
  hostname: window.location.hostname
});

// Create the Supabase client
export const supabase = createClient<Database>(
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
  console.log('Auth state changed:', {
    event,
    hasSession: !!session,
    userId: session?.user?.id
  });

  // Skip redirects in development
  if (!isDevelopment && event === 'SIGNED_OUT') {
    console.log('User signed out, redirecting to login...');
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`;
  }
});