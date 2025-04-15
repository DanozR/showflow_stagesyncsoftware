import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.DEV ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey && import.meta.env.DEV) {
  throw new Error('Missing Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getAuthToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (!token) {
    console.error('No token found in URL');
    return null;
  }
  return token;
};