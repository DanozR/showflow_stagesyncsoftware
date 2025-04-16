import { isDevelopment } from './isDevelopment';
import * as jose from 'jose';

export const checkUserSubscription = async (token: string): Promise<boolean> => {
  console.log('Checking subscription with token:', token);

  if (isDevelopment()) {
    console.log('Development mode: allowing access');
    return true;
  }

  try {
    // First verify the JWT locally
    const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET);
    
    try {
      console.log('Verifying JWT...');
      // Verify the token
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: 'stagesyncsoftware.com',
        audience: 'showflow'
      });
      console.log('JWT verified successfully:', payload);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return false;
    }

    // If JWT verification succeeds, verify subscription with dashboard
    const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'https://app.stagesyncsoftware.com';
    console.log('Verifying subscription with dashboard:', DASHBOARD_URL);
    
    const response = await fetch(
      `${DASHBOARD_URL}/.netlify/functions/verify-token?token=${token}`,
      { method: 'GET' }
    );
    
    console.log('Dashboard response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Verify Error:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('Dashboard verification result:', data);
    
    const { valid, app } = data;
    return valid === true && app === 'showflow';
  } catch (err) {
    console.error('Token verification failed:', err);
    return false;
  }
};