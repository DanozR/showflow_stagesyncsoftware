import { isDevelopment } from './isDevelopment';
import { callSupabaseFunction } from './supabase';

interface SubscriptionResult {
  valid: boolean;
  user?: {
    id: string;
    email: string;
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
        id: 'test-user',
        email: 'test@example.com'
      }
    };
  }

  try {
    console.log('checkUserSubscription: Calling proxy endpoint');
    const response = await fetch('/.netlify/functions/supabase/verify-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
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

    // Check for expected response format
    if (typeof data.valid !== 'boolean') {
      console.log('checkUserSubscription: Invalid response format - missing valid flag');
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
      user: data.user
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