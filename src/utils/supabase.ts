import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey) {
  throw new Error('Missing Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getAuthToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};