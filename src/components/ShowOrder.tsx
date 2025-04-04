import React, { useState } from 'react';
import { DanceClass, Conflict } from '../types';
import { Lock, Unlock, ChevronDown, ChevronUp, Users, Edit } from 'lucide-react';

interface ShowOrderProps {
  classes: DanceClass[];
  onToggleLocked: (className: string) => void;
  onUpdatePosition: (className: string, newPosition: number) => void;
  onUpdateTitle?: (className: string, title: string) => void;
  conflicts: Conflict[];
}

const ShowOrder: React.FC<ShowOrderProps> = ({ 
  classes, 
  onToggleLocked, 
  onUpdatePosition,
  onUpdateTitle,
  conflicts 
}) => {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [positionInput, setPositionInput] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState<string>('');

  // Filter included classes and sort by position
  const includedClasses = classes
    .filter(c => c.included && c.position !== null)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

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

  const startEditingPosition = (className: string, currentPosition: number) => {
    setEditingPosition(className);
    setPositionInput((currentPosition + 1).toString());
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPositionInput(value);
  };

  const handlePositionSubmit = (className: string) => {
    const newPosition = parseInt(positionInput, 10);
    if (!isNaN(newPosition) && newPosition > 0 && newPosition <= includedClasses.length) {
      onUpdatePosition(className, newPosition);
    }
    setEditingPosition(null);
  };

  const handlePositionKeyDown = (e: React.KeyboardEvent, className: string) => {
    if (e.key === 'Enter') {
      handlePositionSubmit(className);
    } else if (e.key === 'Escape') {
      setEditingPosition(null);
    }
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
  const studentsWithConflicts = new Map<string, Conflict[]>();
  conflicts.forEach(conflict => {
    conflict.classNames.forEach(className => {
      if (!studentsWithConflicts.has(className)) {
        studentsWithConflicts.set(className, []);
      }
      studentsWithConflicts.get(className)!.push(conflict);
    });
  });

  if (includedClasses.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No classes in the show yet. Select classes to include in the show from the Settings panel.</p>
      </div>
    );
  }

  // Display classes with sequential positions (1, 2, 3, ...) regardless of internal position values
  const displayClasses = includedClasses.map((cls, index) => ({
    ...cls,
    displayPosition: index + 1
  }));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Show Order</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class / Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performers
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayClasses.map((danceClass) => {
              const hasConflicts = studentsWithConflicts.has(danceClass.name);
              const classConflicts = hasConflicts ? studentsWithConflicts.get(danceClass.name)! : [];
              
              return (
                <React.Fragment key={danceClass.name}>
                  <tr className={hasConflicts ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingPosition === danceClass.name ? (
                        <input
                          type="text"
                          value={positionInput}
                          onChange={handlePositionChange}
                          onBlur={() => handlePositionSubmit(danceClass.name)}
                          onKeyDown={(e) => handlePositionKeyDown(e, danceClass.name)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditingPosition(danceClass.name, danceClass.displayPosition - 1)}
                          className="hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          {danceClass.displayPosition}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{danceClass.name}</div>
                        {danceClass.title ? (
                          <div className="text-blue-600 italic">"{danceClass.title}"</div>
                        ) : (
                          <div className="text-gray-400 text-xs italic cursor-pointer" onClick={() => onUpdateTitle && handleEditTitleClick(danceClass.name)}>
                            Add Number Title Here
                          </div>
                        )}
                        {hasConflicts && (
                          <span className="ml-2 text-xs font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                            Conflicts
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {danceClass.students.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {onUpdateTitle && (
                          <button
                            onClick={() => handleEditTitleClick(danceClass.name, danceClass.title)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Edit performance title"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => onToggleLocked(danceClass.name)}
                          className={`${danceClass.locked ? 'text-amber-500' : 'text-gray-400'} hover:text-amber-600`}
                          title={danceClass.locked ? "Unlock position" : "Lock position"}
                        >
                          {danceClass.locked ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                        <button
                          onClick={() => toggleExpand(danceClass.name)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Show performers"
                        >
                          <Users size={18} />
                          {expandedClasses.has(danceClass.name) ? (
                            <ChevronUp size={16} className="inline ml-1" />
                          ) : (
                            <ChevronDown size={16} className="inline ml-1" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingTitle === danceClass.name && (
                    <tr>
                      <td colSpan={4} className="px-6 py-3 bg-blue-50 border-t border-blue-200">
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
                      </td>
                    </tr>
                  )}
                  {expandedClasses.has(danceClass.name) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="pl-4 border-l-2 border-gray-300">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Performers in this class:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {danceClass.students.map(student => {
                              // Check if this student has conflicts in this class
                              const studentConflicts = classConflicts.filter(c => c.studentId === student.id);
                              const hasConflict = studentConflicts.length > 0;
                              
                              return (
                                <div 
                                  key={student.id}
                                  className={`text-sm py-1 px-2 rounded ${
                                    hasConflict 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {student.firstName} {student.lastName}
                                  {hasConflict && (
                                    <div className="mt-1 text-xs">
                                      {studentConflicts.map((conflict, idx) => (
                                        <div key={idx} className="font-medium">
                                          {conflict.gap === 0 
                                            ? "Back-to-back performance" 
                                            : `Only ${conflict.gap} gap with ${
                                                conflict.classNames.find(c => c !== danceClass.name) || ''
                                              }`
                                          }
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShowOrder;