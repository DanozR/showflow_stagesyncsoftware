import { ReactNode } from 'react';

interface DevModeWrapperProps {
  children: ReactNode;
}

export function DevModeWrapper({ children }: DevModeWrapperProps) {
  const isDevelopment = import.meta.env.DEV || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'bolt.new' || 
    window.location.hostname.endsWith('.bolt.new') ||
    window.location.hostname.includes('stackblitz.io') ||
    window.location.hostname.includes('webcontainer.io');

  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Access Restricted</h2>
          <p className="text-gray-600">
            This application is currently in development mode only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}