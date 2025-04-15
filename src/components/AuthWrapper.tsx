import React, { useEffect, useState, ReactNode } from 'react';
import { isDevelopment } from '../utils/isDevelopment';
import { supabase, getAuthToken } from '../utils/supabase';

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // Always grant access in development mode
        if (isDevelopment()) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        const token = await getAuthToken();
        if (!token) {
          throw new Error('No access token provided');
        }

        // Verify the session using Supabase client
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error('Invalid or expired session');
        }

        setHasAccess(true);
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin h-8 w-8 border-4 border-coral border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Access Denied</h2>
          {error && (
            <p className="text-red-600 mb-4">
              Error: {error}
            </p>
          )}
          <p className="text-gray-600 mb-4">
            Please launch ShowFlow from your StageSync Software dashboard and ensure you have an active subscription to ShowFlow.
          </p>
          <a
            href={import.meta.env.VITE_DASHBOARD_URL}
            className="inline-block px-4 py-2 bg-coral text-white rounded-md hover:bg-coral/90 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}