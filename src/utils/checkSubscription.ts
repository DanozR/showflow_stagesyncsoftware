import { isDevelopment } from './isDevelopment';

interface SubscriptionResult {
  valid: boolean;
  user?: {
    id: string;
  };
  error?: string;
}

export const checkUserSubscription = async (token: string): Promise<SubscriptionResult> => {
  console.log('checkUserSubscription: Starting verification process');

  if (isDevelopment()) {
    console.log('Development mode: allowing access');
    return {
      valid: true,
      user: {
        id: 'test-user'
      }
    };
  }

  try {
    const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL;
    if (!dashboardUrl) {
      throw new Error('Dashboard URL not configured');
    }

    // Construct the verification URL with proper encoding
    const verifyUrl = new URL('/netlify/functions/verify-token', dashboardUrl);
    verifyUrl.searchParams.append('token', token);
    
    console.log('checkUserSubscription: Verifying token');

    const response = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log('checkUserSubscription: Response status:', response.status);

    // Always try to get the response text first
    const responseText = await response.text();
    console.log('checkUserSubscription: Raw response:', responseText);

    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('checkUserSubscription: Parsed JSON response:', data);
    } catch (parseError) {
      console.error('checkUserSubscription: Failed to parse JSON:', parseError);
      return {
        valid: false,
        error: 'Invalid response format from verification service'
      };
    }

    if (!response.ok) {
      console.log('checkUserSubscription: Response not OK');
      return {
        valid: false,
        error: data.error || 'Verification failed'
      };
    }

    // Check if this is a ShowFlow token
    if (data.app !== 'showflow') {
      console.log('checkUserSubscription: Invalid app type:', data.app);
      return {
        valid: false,
        error: 'Invalid application token'
      };
    }

    // Check for expected response format
    if (typeof data.valid !== 'boolean' || !data.userId) {
      console.log('checkUserSubscription: Invalid response format - missing valid flag or userId');
      return {
        valid: false,
        error: 'Invalid response format from verification service'
      };
    }

    if (!data.valid) {
      console.log('checkUserSubscription: Token invalid according to response');
      return {
        valid: false,
        error: data.error || 'Invalid token'
      };
    }

    console.log('checkUserSubscription: Verification successful');
    return {
      valid: true,
      user: {
        id: data.userId
      }
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('checkUserSubscription: Error during verification:', errorMessage);
    return {
      valid: false,
      error: errorMessage
    };
  }
};