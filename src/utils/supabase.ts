const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

export const getAuthToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

export const getSession = async () => {
  const token = await getAuthToken();
  if (!token) return null;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/auth/session?token=${token}`,
    {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get session');
  }

  return response.json();
};