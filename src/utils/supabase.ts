import { createClient } from '@supabase/supabase-js';

// Create Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Get auth token from URL
export const getAuthToken = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};