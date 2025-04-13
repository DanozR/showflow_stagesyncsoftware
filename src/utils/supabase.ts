import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In production, the anon key will be injected at runtime
const getAnonKey = () => {
  if (import.meta.env.PROD) {
    // Get the key from a meta tag that will be injected by the server
    const metaTag = document.querySelector('meta[name="supabase-anon-key"]');
    return metaTag?.getAttribute('content') || '';
  }
  return supabaseAnonKey;
};

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL environment variable');
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, getAnonKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});