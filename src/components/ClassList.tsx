import React, { useState } from 'react';
import { DanceClass, Conflict } from '../types';
import { ChevronDown, ChevronUp, Users, Copy, Trash2, Edit } from 'lucide-react';

interface ClassListProps {
  classes: DanceClass[];
  onToggleIncluded: (className: string) => void;
  onDuplicateClass?: (className: string) => void;
  onDeleteClass?: (className: string) => void;
  onUpdateTitle?: (className: string, title: string) => void;
  conflicts: Conflict[];
}

const ClassList: React.FC<ClassListProps> = ({
  classes,
  onToggleIncluded,
  onDuplicateClass,
  onDeleteClass,
  onUpdateTitle,
  conflicts
}) => {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState<string>('');

  const toggleExpand = (className: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(className)) {
        newSet.delete(className);
      } else {
        newSet.add(className);
      }
      return newSet;
    });
  };

  const handleDeleteClick = (className: string) => {
    setConfirmDelete(className);
  };

  const handleConfirmDelete = (className: string) => {
    if (onDeleteClass) {
      onDeleteClass(className);
    }
    setConfirmDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleEditTitleClick = (className: string, currentTitle: string = '') => {
    setEditingTitle(className);
    setTitleInput(currentTitle);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
  };

  const handleTitleSubmit = () => {
    if (editingTitle && onUpdateTitle) {
      onUpdateTitle(editingTitle, titleInput);
    }
    setEditingTitle(null);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditingTitle(null);
    }
  };

  // Get student IDs with conflicts
  const studentsWithConflicts = new Set(conflicts.map(c => c.studentId));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Class List</h3>
        <div className="text-xs text-gray-500">Click Yes/No to include in show</div>
      </div>
      <ul className="divide-y divide-gray-200">
        {classes.map((danceClass) => (
          <li 
            key={danceClass.name}
            className={`${!danceClass.included ? 'bg-red-50' : ''}`}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{danceClass.name}</p>
                {danceClass.title && (
                  <p className="text-sm text-blue-600 italic">"{danceClass.title}"</p>
                )}
                <p className="text-sm text-gray-500">{danceClass.students.length} performers</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <button
                    onClick={() => onToggleIncluded(danceClass.name)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      danceClass.included 
                        ? 'bg-green-500 text-white' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => onToggleIncluded(danceClass.name)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      !danceClass.included 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    No
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  {onUpdateTitle && (
                    <button
                      onClick={() => handleEditTitleClick(danceClass.name, danceClass.title)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit performance title"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {onDuplicateClass && (
                    <button
                      onClick={() => onDuplicateClass(danceClass.name)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Duplicate class"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                  {onDeleteClass && (
                    <button
                      onClick={() => handleDeleteClick(danceClass.name)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete class"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(danceClass.name)}
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <Users size={16} className="mr-1" />
                    {expandedClasses.has(danceClass.name) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {editingTitle === danceClass.name && (
              <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">
                <div className="mb-2">
                  <label htmlFor="title-input" className="block text-sm font-medium text-blue-800 mb-1">
                    Performance Title:
                  </label>
                  <input
                    id="title-input"
                    type="text"
                    value={titleInput}
                    onChange={handleTitleChange}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="Add Number Title Here"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleTitleSubmit}
                    className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTitle(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {confirmDelete === danceClass.name && (
              <div className="bg-red-50 px-4 py-3 border-t border-red-200">
                <p className="text-sm text-red-800 mb-2">
                  Are you sure you want to delete <strong>{danceClass.name}</strong>? This cannot be undone.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleConfirmDelete(danceClass.name)}
                    className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {expandedClasses.has(danceClass.name) && (
              <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Performers in this class:</h4>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {danceClass.students.map(student => {
                    const hasConflict = studentsWithConflicts.has(student.id);
                    return (
                      <li 
                        key={student.id}
                        className={`text-sm py-1 px-2 rounded ${
                          hasConflict 
                            ? 'bg-red-50 text-red-800' 
                            : 'text-gray-700'
                        }`}
                      >
                        {student.firstName} {student.lastName}
                        {hasConflict && (
                          <span className="ml-2 text-xs font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                            Conflict
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassList;