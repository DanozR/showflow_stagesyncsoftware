import { createClient } from '@supabase/supabase-js';
import { isDevelopment } from './isDevelopment';

// Only create the client in development mode
export const supabase = isDevelopment() 
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
  : null;

// Get auth token from URL in production, or from Supabase in development
export const getAuthToken = async () => {
  console.log('getAuthToken: Getting authentication token');
  
  if (isDevelopment()) {
    console.log('getAuthToken: Development mode, getting token from Supabase');
    const { data: { session } } = await supabase!.auth.getSession();
    return session?.access_token;
  }

  console.log('getAuthToken: Production mode, getting token from URL');
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  console.log('getAuthToken: Token present:', !!token);
  return token;
};

// Call Netlify function to interact with Supabase
export const callSupabaseFunction = async (method: string, data?: any) => {
  console.log('callSupabaseFunction: Starting', method, 'request');
  try {
    const token = await getAuthToken();
    if (!token) {
      console.log('callSupabaseFunction: No token found');
      throw new Error('No authentication token found');
    }

    console.log('callSupabaseFunction: Making request to Netlify function');
    const response = await fetch('/.netlify/functions/supabase', {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    // Check for 401 Unauthorized first
    if (response.status === 401) {
      console.log('callSupabaseFunction: Unauthorized, redirecting to login');
      window.location.href = import.meta.env.VITE_DASHBOARD_URL + '/login';
      throw new Error('Authentication failed: Unauthorized');
    }

    // Check if response is JSON before trying to parse
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('callSupabaseFunction: Response is not JSON');
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid response format');
    }

    // Parse JSON response
    const jsonData = await response.json();
    console.log('callSupabaseFunction: Response data:', jsonData);

    // Check for error in JSON response
    if (!response.ok) {
      console.log('callSupabaseFunction: Response not OK:', response.status);
      throw new Error(jsonData.error || 'An error occurred');
    }

    console.log('callSupabaseFunction: Request successful');
    return jsonData;
  } catch (error) {
    console.error('callSupabaseFunction: Error:', error);
    
    // If it's an authentication error, redirect to login
    if (error instanceof Error && 
        (error.message.includes('Authentication failed') || 
         error.message.includes('No authentication token found'))) {
      console.log('callSupabaseFunction: Authentication error, redirecting to login');
      window.location.href = import.meta.env.VITE_DASHBOARD_URL + '/login';
      throw error;
    }
    
    // Re-throw other errors
    throw error;
  }
};