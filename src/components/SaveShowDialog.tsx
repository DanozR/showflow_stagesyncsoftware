import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { saveShow, updateShow, listShows, SavedShow } from '../utils/showService';
import { DanceClass, Student, Conflict, ShowInfo } from '../types';

interface SaveShowDialogProps {
  classes: DanceClass[];
  students: Student[];
  conflicts: Conflict[];
  showInfo: ShowInfo;
  onSave: () => void;
  onCancel: () => void;
}

const SaveShowDialog: React.FC<SaveShowDialogProps> = ({
  classes,
  students,
  conflicts,
  showInfo,
  onSave,
  onCancel
}) => {
  const [showName, setShowName] = useState(showInfo.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingShows, setExistingShows] = useState<SavedShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOverwrite, setConfirmOverwrite] = useState<SavedShow | null>(null);

  useEffect(() => {
    loadExistingShows();
  }, []);

  const loadExistingShows = async () => {
    try {
      const shows = await listShows();
      setExistingShows(shows);
    } catch (err) {
      console.error('Error loading existing shows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showName.trim()) return;

    // Check if a show with this name already exists
    const existingShow = existingShows.find(show => show.show_name.toLowerCase() === showName.trim().toLowerCase());
    
    if (existingShow && !confirmOverwrite) {
      setConfirmOverwrite(existingShow);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (confirmOverwrite) {
        await updateShow(confirmOverwrite.id, classes, students, conflicts, showInfo);
      } else {
        await saveShow(showName.trim(), classes, students, conflicts, showInfo);
      }
      onSave();
    } catch (err) {
      let errorMessage = 'Failed to save show';
      if (err instanceof Error) {
        if (err.message.includes('unique constraint')) {
          errorMessage = 'A show with this name already exists';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
                onChange={(e) => {
                  setShowName(e.target.value);
                  setConfirmOverwrite(null);
                  setError(null);
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter show name"
                required
              />
            </div>
            
            {confirmOverwrite && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <p className="font-medium">A show with this name already exists.</p>
                <p className="mt-1 text-sm">Do you want to overwrite it?</p>
                <div className="mt-3 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOverwrite(null)}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    Yes, Overwrite
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
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
              disabled={saving || !showName.trim()}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : confirmOverwrite ? (
                'Overwrite Show'
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

export default SaveShowDialog;