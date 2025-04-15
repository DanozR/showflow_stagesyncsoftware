import { isDevelopment } from './isDevelopment';

export const checkUserSubscription = async (token: string): Promise<boolean> => {
  if (isDevelopment()) {
    return true;
  }

  try {
    // @ts-ignore - This is replaced at build time
    const DASHBOARD_URL = __DASHBOARD_URL__ || 'https://app.stagesyncsoftware.com';
    
    const response = await fetch(
      `${DASHBOARD_URL}/.netlify/functions/verify-token?token=${token}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Verify Error:', errorData);
      return false;
    }
    
    const data = await response.json();
    const { valid, app } = data;
    return valid === true && app === 'showflow';
  } catch (err) {
    console.error('Token verification failed:', err);
    return false;
  }
};