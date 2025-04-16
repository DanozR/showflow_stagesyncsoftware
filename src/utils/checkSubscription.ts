import { isDevelopment } from './isDevelopment';

interface SubscriptionResult {
  valid: boolean;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
}

export const checkUserSubscription = async (token: string): Promise<SubscriptionResult> => {
  console.log('Checking subscription with token:', token);

  if (isDevelopment()) {
    console.log('Development mode: allowing access');
    return {
      valid: true,
      user: {
        id: 'test-user',
        email: 'test@example.com'
      }
    };
  }

  if (!token) {
    console.error('No token provided');
    return {
      valid: false,
      error: 'Missing token'
    };
  }

  try {
    const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'https://app.stagesyncsoftware.com';
    console.log('Verifying subscription with dashboard:', DASHBOARD_URL);
    
    const response = await fetch(
      `${DASHBOARD_URL}/.netlify/functions/verify-token?token=${token}`,
      { method: 'GET' }
    );
    
    console.log('Dashboard response status:', response.status);

    // Check content type before attempting to parse response
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage: string;
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || 'Verification failed';
      } else {
        // Log the raw response for debugging
        const rawResponse = await response.text();
        console.error('Non-JSON error response:', rawResponse);
        errorMessage = 'Invalid response format from verification service';
      }
      
      console.error('Verify Error:', errorMessage);
      return {
        valid: false,
        error: errorMessage
      };
    }

    // Verify response is JSON before parsing
    if (!contentType?.includes('application/json')) {
      const rawResponse = await response.text();
      console.error('Unexpected non-JSON response:', rawResponse);
      return {
        valid: false,
        error: 'Invalid response format from verification service'
      };
    }
    
    const data = await response.json();
    console.log('Dashboard verification result:', data);
    
    const { valid, user, app } = data;
    if (valid && app === 'showflow' && user) {
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email
        }
      };
    }

    return {
      valid: false,
      error: 'Invalid token or app'
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Token verification failed:', errorMessage);
    return {
      valid: false,
      error: errorMessage
    };
  }
};