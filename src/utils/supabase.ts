import { createClient } from '@supabase/supabase-js';

// These variables are replaced at build time
declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;

const supabaseUrl = import.meta.env.DEV 
  ? import.meta.env.VITE_SUPABASE_URL 
  : __SUPABASE_URL__;

const supabaseKey = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : __SUPABASE_KEY__;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey) {
  throw new Error('Missing Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};