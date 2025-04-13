import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, Clock, Calendar } from 'lucide-react';
import { ShowService } from '../services/showService';
import { SavedShow } from '../types';
import { formatDistanceToNow, format } from 'date-fns';

interface LoadShowsModalProps {
  onLoad: (showId: string) => void;
  onCancel: () => void;
}

const LoadShowsModal: React.FC<LoadShowsModalProps> = ({ onLoad, onCancel }) => {
  const [shows, setShows] = useState<SavedShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      const userShows = await ShowService.getUserShows();
      setShows(userShows);
      setError(null);
    } catch (err) {
      console.error('Error loading shows:', err);
      setError('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (showId: string) => {
    try {
      await ShowService.deleteShow(showId);
      setShows(shows.filter(show => show.id !== showId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting show:', err);
      setError('Failed to delete show');
    }
  };

  const filteredShows = shows.filter(show =>
    show.show_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading your shows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">My Shows</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-coral focus:border-coral sm:text-sm"
                placeholder="Search shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Shows list */}
          {filteredShows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No shows found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShows.map(show => (
                <div
                  key={show.id}
                  className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {showDeleteConfirm === show.id ? (
                    <div className="p-4 bg-red-50">
                      <p className="text-sm text-red-800 mb-3">
                        Are you sure you want to delete "{show.show_name}"?
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(show.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {show.show_name}
                          </h4>
                          {show.name && (
                            <p className="text-sm text-gray-600 mt-1">
                              {show.name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(show.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete show"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {show.date && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            {format(new Date(show.date), 'MMMM d, yyyy')}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          Updated {formatDistanceToNow(new Date(show.updated_at), { addSuffix: true })}
                        </div>
                      </div>

                      <button
                        onClick={() => onLoad(show.id)}
                        className="mt-4 w-full px-4 py-2 bg-coral text-white text-sm font-medium rounded-md hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral"
                      >
                        Load Show
                      </button>
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

export default LoadShowsModal;