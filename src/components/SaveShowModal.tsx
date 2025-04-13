import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { ShowInfo } from '../types';
import { handleError } from '../utils/errorHandling';

interface SaveShowModalProps {
  showInfo: ShowInfo;
  onSave: (showName: string) => void;
  onCancel: () => void;
}

const SaveShowModal: React.FC<SaveShowModalProps> = ({ showInfo, onSave, onCancel }) => {
  const [showName, setShowName] = useState(showInfo.show_name || '');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    const checkShowName = async () => {
      if (!showName.trim()) {
        setError('Show name is required');
        return;
      }

      setIsChecking(true);
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!user) {
          setError('You must be logged in to save shows');
          return;
        }

        // Check for existing show with same name
        const { data: existingShow, error: queryError } = await supabase
          .from('shows')
          .select('id')
          .eq('user_id', user.id)
          .eq('show_name', showName.trim())
          .maybeSingle();

        if (queryError) throw queryError;

        if (existingShow && (!showInfo.show_id || existingShow.id !== showInfo.show_id)) {
          setError('A show with this name already exists');
        } else {
          setError(null);
        }
      } catch (err) {
        handleError(err, 'Error checking show name');
        setError('Error checking show name');
      } finally {
        setIsChecking(false);
      }
    };

    if (showName.trim()) {
      timeoutId = window.setTimeout(checkShowName, 500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showName, showInfo.show_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showName.trim()) {
      setError('Show name is required');
      return;
    }

    if (error) return;

    setIsSaving(true);
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        throw new Error('You must be logged in to save shows');
      }

      onSave(showName.trim());
    } catch (err) {
      handleError(err, 'Error saving show');
      setError('Error saving show');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Save Show</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="showName" className="block text-sm font-medium text-gray-700">
                Show Name
              </label>
              <input
                type="text"
                id="showName"
                value={showName}
                onChange={(e) => setShowName(e.target.value)}
                className={`mt-1 block w-full border ${
                  error ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Enter show name"
                required
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              {isChecking && (
                <p className="mt-2 text-sm text-gray-500">Checking availability...</p>
              )}
            </div>
          </div>
          
          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!error || isChecking || isSaving}
              className={`inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                error || isChecking || isSaving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Show'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveShowModal;