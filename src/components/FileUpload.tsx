import React, { useState } from 'react';
import { Upload, FileDown } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { Student } from '../types';
import Papa from 'papaparse';

interface FileUploadProps {
  onStudentsLoaded: (students: Student[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onStudentsLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [excludePrivateLessons, setExcludePrivateLessons] = useState(true);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const students = await parseCSV(file, excludePrivateLessons);
      onStudentsLoaded(students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    // Sample data
    const sampleData = [
      {
        performer_id: '1001',
        first_name: 'Emma',
        last_name: 'Johnson',
        classes: 'Ballet 1, Jazz 2, Contemporary'
      },
      {
        performer_id: '1002',
        first_name: 'Olivia',
        last_name: 'Smith',
        classes: 'Ballet 1, Tap 1'
      },
      {
        performer_id: '1003',
        first_name: 'Ava',
        last_name: 'Williams',
        classes: 'Jazz 2, Hip Hop 1'
      },
      {
        performer_id: '1004',
        first_name: 'Sophia',
        last_name: 'Brown',
        classes: 'Contemporary, Modern'
      },
      {
        performer_id: '1005',
        first_name: 'Isabella',
        last_name: 'Jones',
        classes: 'Ballet 1, Modern, Jazz 2'
      }
    ];

    // Convert to CSV
    const csv = Papa.unparse(sampleData);
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-performers.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-taupe bg-taupe/10' : 'border-taupe/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-taupe" />
        <h3 className="mt-2 text-sm font-semibold text-charcoal">Upload a CSV file</h3>
        <p className="mt-1 text-xs text-gray-500">
          File should contain performer_id (or student_id), first_name, last_name, and classes columns
        </p>
        
        <div className="mt-4 flex items-center justify-center">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={excludePrivateLessons} 
              onChange={(e) => setExcludePrivateLessons(e.target.checked)}
              className="form-checkbox h-4 w-4 text-coral transition duration-150 ease-in-out"
            />
            <span className="ml-2 text-sm text-charcoal">Exclude private lessons from show</span>
          </label>
        </div>
        
        <div className="mt-4 flex justify-center space-x-3">
          <label className="cursor-pointer rounded-md bg-coral px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-coral/90">
            Select CSV file
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          
          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center rounded-md bg-charcoal px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-charcoal/90"
          >
            <FileDown className="h-4 w-4 mr-1" />
            Download Sample CSV
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-coral/10 border border-coral/20 text-charcoal rounded">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-coral border-r-transparent"></div>
          <p className="mt-2 text-sm text-charcoal">Processing file...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;