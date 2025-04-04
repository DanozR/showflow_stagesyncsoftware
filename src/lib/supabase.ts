import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'bolt.new' || 
  window.location.hostname.endsWith('.bolt.new') ||
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('webcontainer.io');

// Get environment variables with development fallbacks
const supabaseUrl = isDevelopment 
  ? (import.meta.env.VITE_SUPABASE_URL || 'https://avehrshbpoivtjmrfflr.supabase.co')
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = isDevelopment
  ? (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZWhyc2hicG9pdnRqbXJmZmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NDMyMTcsImV4cCI6MjA1ODAxOTIxN30.mtVlPhnopLbZcV8Iw6JvEBInYPajt3X8wpVxMDAB6q4')
  : import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables in production
if (!isDevelopment && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Required environment variables are missing');
}

// Create the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
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
  if (event === 'SIGNED_OUT' && !isDevelopment) {
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`;
  }
});