import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

// Create a basic client without the anon key
export const supabase = createClient(supabaseUrl, 'dummy-key');

export const getAuthToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (!token) {
    console.error('No token found in URL');
    return null;
  }
  return token;
};

export const getSession = async () => {
  const token = await getAuthToken();
  if (!token) {
    console.error('No auth token available');
    return null;
  }

  try {
    console.log('Fetching session with token:', token); // Add logging

    // Call the auth edge function to verify the token
    const response = await fetch(`${supabaseUrl}/functions/v1/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    console.log('Session response status:', response.status); // Add logging

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Session error data:', errorData); // Add logging
      throw new Error(errorData.error || 'Failed to verify session');
    }

    const data = await response.json();
    console.log('Session data:', data); // Add logging
    return data;
  } catch (error) {
    console.error('Session error:', error);
    throw error;
  }
};