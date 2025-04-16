import React, { useEffect, useState, ReactNode } from 'react';
import { isDevelopment } from '../utils/isDevelopment';
import { callSupabaseFunction } from '../utils/supabase';

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Always grant access in development mode
        if (isDevelopment()) {
          setLoading(false);
          return;
        }

        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Test token by making a request
        await callSupabaseFunction('GET');
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    checkAccess();
  }, [window.location.search]); // Re-run when URL changes

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

  if (error && !isDevelopment()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Please launch ShowFlow from your StageSync Software dashboard.
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