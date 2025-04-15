import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = isDevelopment() 
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : '';

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey && isDevelopment()) {
  throw new Error('Missing Supabase anon key in development mode');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};