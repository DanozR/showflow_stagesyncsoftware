import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey) {
  throw new Error('Missing Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (isDevelopment()) {
      // In development, return the anon key as the token
      return supabaseKey;
    }
    return session?.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    if (isDevelopment()) {
      // In development, return the anon key as the token
      return supabaseKey;
    }
    return null;
  }
};