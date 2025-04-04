import { useEffect, useState } from 'react';
import { checkAccess } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isDevelopment = import.meta.env.DEV || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'bolt.new' || 
      window.location.hostname.endsWith('.bolt.new') ||
      window.location.hostname.includes('stackblitz.io') ||
      window.location.hostname.includes('webcontainer.io');

    if (isDevelopment) {
      console.log('Development mode detected - skipping auth check');
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    const checkUserAccess = async () => {
      try {
        const hasAccess = await checkAccess();
        setIsAuthorized(hasAccess);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAccess();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        checkUserAccess();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthorized(false);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.href = `${import.meta.env.VITE_DASHBOARD_URL}/login`}
            className="mt-6 w-full bg-coral text-white py-2 px-4 rounded hover:bg-coral/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}