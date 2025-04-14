import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAuthToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

export const getSession = async () => {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return { user };
  } catch (error) {
    console.error('Session error:', error);
    throw new Error('Failed to get session');
  }
};