import { isDevelopment } from './isDevelopment';

export const checkUserSubscription = async (token: string): Promise<boolean> => {
  console.log('Checking subscription with token:', token); // Log the token
  if (isDevelopment()) {
    console.log('Development mode: allowing access');
    return true;
  }

  try {
    const DASHBOARD_URL = process.env.REACT_APP_DASHBOARD_URL || 'https://app.stagesyncsoftware.com';
    console.log('Calling verify-token at:', `${DASHBOARD_URL}/.netlify/functions/verify-token?token=${token}`);
    const response = await fetch(
      `${DASHBOARD_URL}/.netlify/functions/verify-token?token=${token}`,
      { method: 'GET' }
    );
    
    console.log('Verify Response:', response.status, response.statusText); // Log the response status
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Verify Error:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('Verification Result:', data); // Log the response data
    const { valid, app } = data;
    console.log('Valid:', valid, 'App:', app); // Log the extracted values
    return valid === true && app === 'showflow';
  } catch (err) {
    console.error('Token verification failed:', err);
    return false;
  }
};