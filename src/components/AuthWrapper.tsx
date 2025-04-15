import React, { useEffect, useState, ReactNode } from 'react';
import { checkUserSubscription } from '../utils/checkSubscription';
import { isDevelopment } from '../utils/isDevelopment';

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAccess = async () => {
      // Always grant access in development mode
      if (isDevelopment()) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const isValid = await checkUserSubscription(token);
      setHasAccess(isValid);
      setLoading(false);
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
          <p className="text-gray-600 mb-4">
            Please launch ShowFlow from your StageSync Software dashboard and ensure you have an active subscription to ShowFlow.
          </p>
          <a
            href="https://app.stagesyncsoftware.com"
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