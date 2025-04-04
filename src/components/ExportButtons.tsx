import React from 'react';
import { FileText, FileSpreadsheet, List } from 'lucide-react';
import { DanceClass, Student, Conflict, ShowInfo } from '../types';
import { exportToPDF, exportToCSV, exportSimplifiedPDF } from '../utils/exportUtils';

interface ExportButtonsProps {
  classes: DanceClass[];
  students: Student[];
  conflicts: Conflict[];
  minGap: number;
  showInfo?: ShowInfo;
  showInSettings?: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  classes,
  students,
  conflicts,
  minGap,
  showInfo,
  showInSettings = false
}) => {
  const handleExportPDF = () => {
    exportToPDF(classes, conflicts, minGap, showInfo);
  };

  const handleExportSimplifiedPDF = () => {
    exportSimplifiedPDF(classes, showInfo);
  };

  const handleExportCSV = () => {
    exportToCSV(classes, students, conflicts, showInfo);
  };

  // Don't render in settings section
  if (showInSettings) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleExportPDF}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-charcoal hover:bg-charcoal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcoal"
      >
        <FileText className="h-4 w-4 mr-1" />
        Export Detailed Run of Show
      </button>
      <button
        onClick={handleExportSimplifiedPDF}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-taupe hover:bg-taupe/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-taupe"
      >
        <List className="h-4 w-4 mr-1" />
        Export Simple Run of Show
      </button>
      <button
        onClick={handleExportCSV}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-coral hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral"
      >
        <FileSpreadsheet className="h-4 w-4 mr-1" />
        Export CSV
      </button>
    </div>
  );
};

export default ExportButtons;