import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { DanceClass, Student, Conflict, ShowInfo } from '../types';

// Helper function to get display position (1-based)
const getDisplayPosition = (classes: DanceClass[], className: string): number => {
  const sortedClasses = classes
    .filter(c => c.included && c.position !== null)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  
  const index = sortedClasses.findIndex(c => c.name === className);
  return index !== -1 ? index + 1 : 0;
};

// Format date for display
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
};

// Format time for display
const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

// Export simplified show order to PDF
export const exportSimplifiedPDF = (
  classes: DanceClass[],
  showInfo?: ShowInfo
): void => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Load the logo
  const img = new Image();
  img.src = 'https://i.imgur.com/o5iWGOq.png';

  img.onload = () => {
    // Calculate logo dimensions (80px width)
    const logoWidth = 80;
    const aspectRatio = img.height / img.width;
    const logoHeight = logoWidth * aspectRatio;
    
    // Convert pixels to mm (assuming 72 DPI)
    const mmWidth = (logoWidth / 72) * 25.4;
    const mmHeight = (logoHeight / 72) * 25.4;
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Function to add logo to current page
    const addLogoToPage = () => {
      doc.addImage(
        img, 
        'PNG', 
        pageWidth - mmWidth - 14, // Right margin
        pageHeight - mmHeight - 10, // Bottom margin
        mmWidth, 
        mmHeight
      );
    };

    // Set initial y position
    let yPos = 25;

    // Add show title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    const showName = showInfo?.name || 'Dance Show Order';
    doc.text(showName, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 20;

    // Add show info if available in a more compact format
    if (showInfo) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Combine date and time on one line
      let dateTimeStr = '';
      if (showInfo.date) {
        dateTimeStr += formatDate(showInfo.date);
      }
      if (showInfo.time) {
        dateTimeStr += dateTimeStr ? ' at ' : '';
        dateTimeStr += formatTime(showInfo.time);
      }
      
      if (dateTimeStr) {
        doc.text(dateTimeStr, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      }
      
      // Location on next line
      if (showInfo.location) {
        doc.text(showInfo.location, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      }
    }

    // Add generation info
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128); // Gray text
    doc.text(
      `Generated ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.width / 2,
      yPos,
      { align: 'center' }
    );
    yPos += 15;

    // Reset text color to black
    doc.setTextColor(0, 0, 0);

    // Filter and sort classes for the show
    const showClasses = classes
      .filter(c => c.included && c.position !== null)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    // Add performance list
    doc.setFontSize(16);
    showClasses.forEach((cls, index) => {
      // Check if we need a new page
      if (yPos > doc.internal.pageSize.height - mmHeight - 30) { // Leave space for logo
        addLogoToPage(); // Add logo to current page
        doc.addPage();
        yPos = 20;
      }

      // Performance number and title
      const performanceNumber = (index + 1).toString().padStart(2, '0');
      const title = cls.title || cls.name;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${performanceNumber}.`, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(title, 35, yPos);
      
      yPos += 12;
    });

    // Add logo to the last page
    addLogoToPage();

    // Save the PDF
    const fileName = showInfo?.name 
      ? `${showInfo.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-simplified.pdf`
      : 'dance-show-order-simplified.pdf';
    
    doc.save(fileName);
  };

  // Handle image loading error
  img.onerror = () => {
    console.error('Failed to load logo image');
    // Continue with PDF generation without the logo
    doc.save('dance-show-order-simplified.pdf');
  };
};

// Export show order to PDF
export const exportToPDF = (
  classes: DanceClass[],
  conflicts: Conflict[],
  minGap: number,
  showInfo?: ShowInfo
): void => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add logo
  const img = new Image();
  img.src = 'https://i.imgur.com/o5iWGOq.png';
  
  // Wait for image to load
  img.onload = () => {
    // Calculate logo dimensions (80px width)
    const logoWidth = 80;
    const aspectRatio = img.height / img.width;
    const logoHeight = logoWidth * aspectRatio;
    
    // Convert pixels to mm (assuming 72 DPI)
    const mmWidth = (logoWidth / 72) * 25.4;
    const mmHeight = (logoHeight / 72) * 25.4;
    
    // Position logo in upper right
    const pageWidth = doc.internal.pageSize.width;
    doc.addImage(img, 'PNG', pageWidth - mmWidth - 14, 10, mmWidth, mmHeight);
    
    // Add title
    doc.setFontSize(20);
    doc.text(showInfo?.name || 'Dance Show Order', 14, 20);
    
    // Add show info
    let startY = 40; // Default starting Y position
    
    if (showInfo) {
      doc.setFontSize(12);
      let yPos = 30;
      
      if (showInfo.date) {
        doc.text(`Date: ${formatDate(showInfo.date)}`, 14, yPos);
        yPos += 6;
      }
      
      if (showInfo.time) {
        doc.text(`Time: ${formatTime(showInfo.time)}`, 14, yPos);
        yPos += 6;
      }
      
      if (showInfo.location) {
        doc.text(`Location: ${showInfo.location}`, 14, yPos);
        yPos += 6;
      }
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, yPos);
      
      // Adjust the starting Y position based on how much show info we have
      startY = yPos + 15; // Add extra space after the show info
    } else {
      // Add date if no show info
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);
    }
    
    // Filter and sort classes for the show
    const showClasses = classes
      .filter(c => c.included && c.position !== null)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Show order table
    doc.setFontSize(14);
    doc.text('Show Order', 14, startY);
    
    const showOrderData = showClasses.map((cls, index) => [
      (index + 1).toString(),
      cls.name,
      cls.title || '',
      cls.students.length.toString(),
      cls.locked ? 'Yes' : 'No'
    ]);
    
    autoTable(doc, {
      startY: startY + 5,
      head: [['#', 'Performance Name', 'Performance Title', 'Performers', 'Locked']],
      body: showOrderData,
      theme: 'striped',
      headStyles: { fillColor: [51, 51, 51] } // Use charcoal color
    });
    
    // Conflicts section
    if (conflicts.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || (startY + 5);
      const pageHeight = doc.internal.pageSize.height;
      const requiredHeight = 100; // Estimated height needed for conflicts section
      
      // Check if there's enough space for the conflicts section
      if (finalY + requiredHeight > pageHeight - 20) {
        // Not enough space, start a new page
        doc.addPage();
        doc.addImage(img, 'PNG', pageWidth - mmWidth - 14, 10, mmWidth, mmHeight);
        startY = 40;
      } else {
        startY = finalY + 15;
      }
      
      doc.setFontSize(14);
      doc.text('Conflicts', 14, startY);
      
      // Group conflicts by type
      const backToBackConflicts = conflicts.filter(c => c.gap === 0);
      const otherConflicts = conflicts.filter(c => c.gap > 0);
      
      // Summary text
      doc.setFontSize(10);
      doc.text(`Total conflicts: ${conflicts.length}`, 14, startY + 10);
      doc.text(`Back-to-back performances: ${backToBackConflicts.length}`, 14, startY + 15);
      
      // Conflicts table data
      const conflictsData = conflicts.map(conflict => {
        const class1 = conflict.classNames[0];
        const class2 = conflict.classNames[1];
        const pos1 = getDisplayPosition(classes, class1);
        const pos2 = getDisplayPosition(classes, class2);
        
        return [
          conflict.studentName,
          conflict.studentId,
          `${pos1}. ${class1}`,
          `${pos2}. ${class2}`,
          conflict.gap.toString(),
          conflict.gap === 0 ? 'BACK-TO-BACK' : (conflict.gap < minGap ? 'WARNING' : 'OK')
        ];
      });
      
      // Add conflicts table
      autoTable(doc, {
        startY: startY + 20,
        head: [['Performer', 'ID', 'First Performance', 'Second Performance', 'Gap', 'Status']],
        body: conflictsData,
        theme: 'striped',
        headStyles: { fillColor: [242, 140, 130] }, // Use coral color
        styles: { overflow: 'linebreak' },
        columnStyles: {
          5: {
            fontStyle: 'bold',
            halign: 'center'
          }
        },
        didParseCell: (data) => {
          // Highlight back-to-back conflicts
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'BACK-TO-BACK') {
              data.cell.styles.fillColor = [255, 200, 200];
              data.cell.styles.textColor = [180, 0, 0];
            } else if (data.cell.raw === 'WARNING') {
              data.cell.styles.fillColor = [255, 235, 200];
              data.cell.styles.textColor = [180, 95, 0];
            }
          }
        }
      });
    }
    
    // Save the PDF with show name if available
    const fileName = showInfo?.name 
      ? showInfo.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.pdf'
      : 'dance-show-order.pdf';
    
    doc.save(fileName);
  };
  
  // Handle image loading error
  img.onerror = () => {
    console.error('Failed to load logo image');
    // Continue with PDF generation without the logo
    doc.save('dance-show-order.pdf');
  };
};

// Export detailed show data to CSV
export const exportToCSV = (
  classes: DanceClass[],
  students: Student[],
  conflicts: Conflict[],
  showInfo?: ShowInfo
): void => {
  // Filter and sort classes for the show
  const showClasses = classes
    .filter(c => c.included && c.position !== null)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // Create a map of student IDs to their conflicts
  const studentConflicts = new Map<string, string[]>();
  conflicts.forEach(conflict => {
    if (!studentConflicts.has(conflict.studentId)) {
      studentConflicts.set(conflict.studentId, []);
    }
    const conflictDesc = conflict.gap === 0
      ? `BACK-TO-BACK: ${conflict.classNames[0]} → ${conflict.classNames[1]}`
      : `GAP TOO SMALL (${conflict.gap}): ${conflict.classNames[0]} → ${conflict.classNames[1]}`;
    studentConflicts.get(conflict.studentId)!.push(conflictDesc);
  });

  // Create a map of student IDs to their performance numbers
  const studentPerformances = new Map<string, number[]>();
  showClasses.forEach((cls, index) => {
    const performanceNumber = index + 1;
    cls.students.forEach(student => {
      if (!studentPerformances.has(student.id)) {
        studentPerformances.set(student.id, []);
      }
      studentPerformances.get(student.id)!.push(performanceNumber);
    });
  });

  // Create the CSV data
  const csvData = [];

  // Add a row for each student in each performance
  showClasses.forEach((cls, index) => {
    const performanceNumber = index + 1;
    
    cls.students.forEach(student => {
      csvData.push({
        export_date: new Date().toISOString().split('T')[0],
        show_name: showInfo?.name || '',
        date: showInfo?.date || '',
        time: showInfo?.time || '',
        location: showInfo?.location || '',
        performance_number: performanceNumber,
        class_name: cls.name,
        performance_title: cls.title || '',
        student_count: cls.students.length,
        student_id: student.id,
        first_name: student.firstName,
        last_name: student.lastName,
        student_performance_order: studentPerformances.get(student.id)?.join(',') || '',
        conflict: studentConflicts.get(student.id)?.join('; ') || ''
      });
    });
  });

  // Convert to CSV
  const csv = Papa.unparse(csvData, {
    header: true,
    columns: [
      'export_date',
      'show_name',
      'date',
      'time',
      'location',
      'performance_number',
      'class_name',
      'performance_title',
      'student_count',
      'student_id',
      'first_name',
      'last_name',
      'student_performance_order',
      'conflict'
    ]
  });

  // Create and download the file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Use show name for file name if available
  const fileName = showInfo?.name 
    ? showInfo.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.csv'
    : 'dance-show-data.csv';
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};