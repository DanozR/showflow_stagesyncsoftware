import React, { useState, useEffect } from 'react';
import { X, History, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { ShowService } from '../services/showService';
import { formatDistanceToNow } from 'date-fns';

interface ShowVersion {
  version_id: string;
  version: number;
  created_at: string;
}

interface ShowVersionsModalProps {
  showId: string;
  currentVersion: number;
  onLoadVersion: (version: number) => void;
  onCancel: () => void;
}

const ShowVersionsModal: React.FC<ShowVersionsModalProps> = ({
  showId,
  currentVersion,
  onLoadVersion,
  onCancel
}) => {
  const [versions, setVersions] = useState<ShowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const versionHistory = await ShowService.getShowVersions(showId);
      setVersions(versionHistory);
      setError(null);
    } catch (err) {
      console.error('Error loading versions:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVersion = async () => {
    if (!selectedVersion) return;
    
    setLoadingVersion(true);
    try {
      await onLoadVersion(selectedVersion);
    } catch (err) {
      console.error('Error loading version:', err);
      setError('Failed to load version');
    } finally {
      setLoadingVersion(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading version history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <History className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Version History</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.version_id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  version.version === currentVersion
                    ? 'border-coral bg-coral/5'
                    : version.version === selectedVersion
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } cursor-pointer transition-colors`}
                onClick={() => setSelectedVersion(version.version)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-lg font-medium text-gray-900">
                      Version {version.version}
                    </span>
                    {version.version === currentVersion && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium text-coral bg-coral/10 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                  </p>
                </div>
                {version.version === selectedVersion && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
            ))}
          </div>

          {selectedVersion && selectedVersion !== currentVersion && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadVersion}
                disabled={loadingVersion}
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-coral hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral disabled:bg-coral/60 disabled:cursor-not-allowed"
              >
                {loadingVersion ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Revert to Version {selectedVersion}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowVersionsModal;