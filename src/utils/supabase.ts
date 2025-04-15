import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://avehrshbpoivtjmrfflr.supabase.co',
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZWhyc2hicG9pdnRqbXJmZmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NDMyMTcsImV4cCI6MjA1ODAxOTIxN30.mtVlPhnopLbZcV8Iw6JvEBInYPajt3X8wpVxMDAB6q4',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return isDevelopment() || Boolean(supabaseUrl && supabaseKey);
};

// Get auth token helper
export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};