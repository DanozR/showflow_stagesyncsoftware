import { useEffect, useState } from 'react';
import { checkAccess } from '../lib/auth';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'bolt.new' || 
      window.location.hostname.endsWith('.bolt.new') ||
      window.location.hostname.includes('stackblitz.io') ||
      window.location.hostname.includes('webcontainer.io');

    if (isDevelopment) {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    checkAccess()
      .then(hasAccess => {
        setIsAuthorized(hasAccess);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAuthorized(false);
        setIsLoading(false);
      });
  }, []);

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
    return null; // Redirect handled in checkAccess
  }

  return <>{children}</>;
}