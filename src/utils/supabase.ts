import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

// Only create the client in development mode
export const supabase = isDevelopment() 
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false, // Don't persist auth state in development
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
  : null;

// Get auth token from URL in production, or from Supabase in development
export const getAuthToken = async () => {
  if (isDevelopment()) {
    const { data: { session } } = await supabase!.auth.getSession();
    return session?.access_token;
  }

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};