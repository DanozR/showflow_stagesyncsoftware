import React from 'react';
import { Conflict, DanceClass } from '../types';
import { AlertTriangle } from 'lucide-react';

interface ConflictListProps {
  conflicts: Conflict[];
  minGap: number;
  classes?: DanceClass[]; // Optional prop to get position information
}

const ConflictList: React.FC<ConflictListProps> = ({ conflicts, minGap, classes = [] }) => {
  if (conflicts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">
              No conflicts detected! All students have at least {minGap} performance{minGap !== 1 ? 's' : ''} between their appearances.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group conflicts by gap size to highlight zero gaps more prominently
  const zeroGapConflicts = conflicts.filter(c => c.gap === 0);
  const otherConflicts = conflicts.filter(c => c.gap > 0);

  // Create a map of class names to their positions (for display)
  const classPositions = new Map<string, number>();
  if (classes.length > 0) {
    // Sort classes by position to get the correct display order
    const sortedClasses = [...classes].filter(c => c.included && c.position !== null)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Assign sequential positions (1-based) for display
    sortedClasses.forEach((cls, index) => {
      classPositions.set(cls.name, index + 1);
    });
  }

  // Helper function to get class display with position
  const getClassDisplay = (className: string) => {
    const position = classPositions.get(className);
    return position ? `${position}. ${className}` : className;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-red-800">
            Conflicts Detected ({conflicts.length})
            {zeroGapConflicts.length > 0 && 
              <span className="ml-2 text-sm font-bold bg-red-200 text-red-800 px-2 py-1 rounded-full">
                {zeroGapConflicts.length} back-to-back performances!
              </span>
            }
          </h3>
        </div>
      </div>
      
      {zeroGapConflicts.length > 0 && (
        <div className="bg-red-100 px-4 py-2 border-b border-red-200">
          <p className="text-sm font-semibold text-red-800">
            Warning: {zeroGapConflicts.length} student{zeroGapConflicts.length !== 1 ? 's' : ''} have back-to-back performances with no break!
          </p>
        </div>
      )}
      
      <ul className="divide-y divide-gray-200">
        {conflicts.map((conflict, index) => (
          <li 
            key={index} 
            className={`px-4 py-3 ${conflict.gap === 0 ? 'bg-red-100' : 'bg-red-50'}`}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <p className="font-medium text-red-800">
                  {conflict.studentName} (ID: {conflict.studentId})
                  {conflict.gap === 0 && 
                    <span className="ml-2 text-xs font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                      BACK-TO-BACK
                    </span>
                  }
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {conflict.gap === 0 
                    ? <span className="font-semibold">No break between performances!</span>
                    : `Only ${conflict.gap} performance${conflict.gap !== 1 ? 's' : ''} between classes:`
                  }
                </p>
                <div className="mt-1 text-sm">
                  <span className="font-medium">{getClassDisplay(conflict.classNames[0])}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium">{getClassDisplay(conflict.classNames[1])}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConflictList;