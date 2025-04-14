import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

// Get anon key only in development mode
const getAnonKey = (): string => {
  if (isDevelopment()) {
    // In development, use the anon key from .env
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) {
      console.warn('Development mode: Missing Supabase anon key');
    }
    return anonKey || '';
  }
  // In production, don't use anon key
  return '';
};

// Initialize client with anon key only in development
export const supabase = createClient(supabaseUrl, getAnonKey(), {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};