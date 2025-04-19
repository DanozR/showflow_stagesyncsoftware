import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

// Create Supabase client
export const supabase = isDevelopment() 
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    )
  : null;

// Get auth token
export const getAuthToken = async () => {
  if (isDevelopment()) {
    const { data: { session } } = await supabase!.auth.getSession();
    return session?.access_token;
  }
  return null;
};