import { createClient } from '@supabase/supabase-js';

// Get environment variables from meta tags
const getMetaContent = (name: string): string => {
  const meta = document.querySelector(`meta[name="${name}"]`);
  return meta?.getAttribute('content') || '';
};

const supabaseUrl = getMetaContent('supabase-url');
const supabaseAnonKey = getMetaContent('supabase-anon-key');

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key');
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});