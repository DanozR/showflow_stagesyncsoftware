import React, { useEffect, useState, ReactNode } from 'react';
import { isDevelopment } from '../utils/isDevelopment';

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Always grant access in development mode
    if (isDevelopment()) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // In production, check for token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // If token exists, grant access
    setHasAccess(true);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin h-8 w-8 border-4 border-coral border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Development Mode</h2>
          <p className="text-gray-600 mb-4">
            This application is currently in development mode.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}