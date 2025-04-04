import { useEffect, useState } from 'react';
import { checkAccess } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Keep consistent with auth.ts and supabase.ts
    const isDevelopment = process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'bolt.new' || 
      window.location.hostname.endsWith('.bolt.new') ||
      window.location.hostname.includes('stackblitz.io') ||
      window.location.hostname.includes('webcontainer.io');

    console.log('AuthWrapper Environment Check:', {
      isDevelopment,
      NODE_ENV: process.env.NODE_ENV,
      hostname: window.location.hostname
    });

    if (isDevelopment) {
      console.log('Development mode detected in AuthWrapper - skipping auth check');
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    console.log('Starting access check...');
    checkAccess()
      .then(hasAccess => {
        console.log('Access check complete:', { hasAccess });
        setIsAuthorized(hasAccess);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Access check failed in AuthWrapper:', error);
        setIsAuthorized(false);
        setIsLoading(false);
      });
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('AuthWrapper state updated:', {
      isAuthorized,
      isLoading
    });
  }, [isAuthorized, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    console.log('User not authorized, rendering null (redirect handled in checkAccess)');
    return null;
  }

  console.log('User authorized, rendering children');
  return <>{children}</>;
}