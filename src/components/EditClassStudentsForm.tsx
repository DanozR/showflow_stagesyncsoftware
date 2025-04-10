import React, { useState } from 'react';
import { Student, DanceClass } from '../types';
import { X, Search, Check } from 'lucide-react';

interface EditClassStudentsFormProps {
  danceClass: DanceClass;
  allStudents: Student[];
  onSave: (className: string, selectedStudents: Student[]) => void;
  onCancel: () => void;
}

const EditClassStudentsForm: React.FC<EditClassStudentsFormProps> = ({
  danceClass,
  allStudents,
  onSave,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(danceClass.students.map(s => s.id))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStudents = allStudents.filter(student => 
      selectedStudentIds.has(student.id)
    );
    onSave(danceClass.name, selectedStudents);
  };

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudentIds(newSelected);
  };

  const filteredStudents = allStudents.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Edit Students in {danceClass.name}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Students
            </label>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {filteredStudents.map(student => (
                  <li key={student.id}>
                    <label className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {student.firstName} {student.lastName} ({student.id})
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-2 text-sm text-gray-500">
              {selectedStudentIds.size} students selected
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
              disabled={selectedStudentIds.size === 0}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 mr-1" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClassStudentsForm;