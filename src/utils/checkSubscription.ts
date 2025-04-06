import { isDevelopment } from './isDevelopment';

export const checkUserSubscription = async (token: string): Promise<boolean> => {
  // Always allow access in development mode
  if (isDevelopment()) {
    return true;
  }

  try {
    const response = await fetch(
      'https://app.stagesyncsoftware.com/.netlify/functions/verify-token?token=' + token,
      { method: 'GET' }
    );
    
    if (!response.ok) return false;
    
    const { valid, app } = await response.json();
    return valid === true && app === 'showflow';
  } catch (err) {
    console.error('Token verification failed:', err);
    return false;
  }
};