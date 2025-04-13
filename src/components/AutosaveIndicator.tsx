import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface AutosaveIndicatorProps {
  status: 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ status, lastSaved, error }) => {
  if (status === 'saving') {
    return (
      <div className="flex items-center text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
        <span className="text-sm">Saving...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center text-red-600">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span className="text-sm">{error || 'Error saving'}</span>
      </div>
    );
  }

  if (status === 'saved' && lastSaved) {
    return (
      <div className="flex items-center text-green-600">
        <Check className="h-4 w-4 mr-2" />
        <span className="text-sm">
          Saved at {lastSaved.toLocaleTimeString()}
        </span>
      </div>
    );
  }

  return null;
};

export default AutosaveIndicator;