import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

// Create a basic client without the anon key
export const supabase = createClient(supabaseUrl, 'dummy-key');

export const getAuthToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

export const getSession = async () => {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    // Call the auth edge function to verify the token
    const response = await fetch(`${supabaseUrl}/functions/v1/auth/session?token=${token}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Session error:', error);
    throw new Error('Failed to get session');
  }
};