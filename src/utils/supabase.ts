import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

// Initialize client with auth configuration
export const supabase = createClient(supabaseUrl, '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};