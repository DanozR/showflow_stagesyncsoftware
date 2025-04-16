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
export const getAuthToken = () => {
  if (isDevelopment()) {
    return 'development-token';
  }

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

// Call Netlify function to interact with Supabase
export const callSupabaseFunction = async (method: string, data?: any) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('/.netlify/functions/supabase', {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      // Prevent caching
      cache: 'no-store'
    });

    // Check for 401 Unauthorized first
    if (response.status === 401) {
      window.location.href = import.meta.env.VITE_DASHBOARD_URL + '/login';
      throw new Error('Authentication failed: Unauthorized');
    }

    // Check if response is JSON before trying to parse
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON and not 401, might be HTML error page
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid response format');
    }

    // Parse JSON response
    const jsonData = await response.json();

    // Check for error in JSON response
    if (!response.ok) {
      throw new Error(jsonData.error || 'An error occurred');
    }

    return jsonData;
  } catch (error) {
    // If it's an authentication error, redirect to login
    if (error instanceof Error && 
        (error.message.includes('Authentication failed') || 
         error.message.includes('No authentication token found'))) {
      window.location.href = import.meta.env.VITE_DASHBOARD_URL + '/login';
    }
    
    throw error;
  }
};