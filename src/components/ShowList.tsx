import React, { useState, useEffect } from 'react';
import { listShows, deleteShow, SavedShow } from '../utils/showService';
import { Trash2, Clock, Calendar, X } from 'lucide-react';

interface ShowListProps {
  onLoadShow: (show: SavedShow) => void;
  onClose: () => void;
}

const ShowList: React.FC<ShowListProps> = ({ onLoadShow, onClose }) => {
  const [shows, setShows] = useState<SavedShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listShows();
      setShows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (showId: string) => {
    try {
      setDeleting(showId);
      await deleteShow(showId);
      setShows(shows.filter(show => show.id !== showId));
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete show');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">My Shows</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading shows...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
              <button
                onClick={loadShows}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : shows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved shows found
            </div>
          ) : (
            <div className="space-y-4">
              {shows.map(show => (
                <div
                  key={show.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">
                        {show.show_name}
                      </h4>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created: {formatDate(show.created_at)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Updated: {formatDate(show.updated_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onLoadShow(show)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => setConfirmDelete(show.id)}
                        disabled={deleting === show.id}
                        className="p-1 text-red-600 hover:text-red-800 disabled:text-red-300"
                      >
                        {deleting === show.id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {confirmDelete === show.id && (
                    <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded">
                      <p className="text-sm text-red-700">
                        Are you sure you want to delete this show? This action cannot be undone.
                      </p>
                      <div className="mt-2 flex space-x-3">
                        <button
                          onClick={() => handleDelete(show.id)}
                          disabled={deleting === show.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
                        >
                          {deleting === show.id ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowList;