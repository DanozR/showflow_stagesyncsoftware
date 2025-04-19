import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isDevelopment } from '../utils/isDevelopment';
import { checkUserSubscription } from '../utils/checkSubscription';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyAccess = async () => {
      console.log('AuthWrapper: Starting access verification');
      
      // Always grant access in development mode
      if (isDevelopment()) {
        console.log('AuthWrapper: Development mode detected, granting access');
        setLoading(false);
        return;
      }

      const token = searchParams.get('token');
      console.log('AuthWrapper: Token from URL:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('AuthWrapper: No token found, showing error');
        setError('Access Denied');
        setLoading(false);
        return;
      }

      try {
        console.log('AuthWrapper: Verifying token with subscription service');
        const result = await checkUserSubscription(token);
        console.log('AuthWrapper: Verification result:', result);
        
        if (!result.valid) {
          console.log('AuthWrapper: Invalid token, showing error');
          setError(result.error || 'Access Denied');
        }
      } catch (err) {
        console.error('AuthWrapper: Verification error:', err);
        setError('Access Denied');
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [searchParams]); // Re-run when URL params change

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
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