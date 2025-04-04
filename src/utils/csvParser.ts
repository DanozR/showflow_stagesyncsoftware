import Papa from 'papaparse';
import { Student } from '../types';

export const parseCSV = (file: File, excludePrivateLessons: boolean = true): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const students: Student[] = [];
          const studentMap = new Map<string, Student>();
          let autoIncrementId = 1;

          results.data.forEach((row: any) => {
            // Check for required fields
            if (!row.first_name || !row.last_name || !row.classes) {
              throw new Error('CSV file must contain first_name, last_name, and classes columns');
            }

            // Check for either performer_id or student_id
            let performerId = (row.performer_id || row.student_id || '').toString().trim();
            
            // If no ID is provided, generate one
            if (!performerId) {
              performerId = autoIncrementId.toString().padStart(4, '0');
              autoIncrementId++;
            }

            // Filter out private lessons if excludePrivateLessons is true
            const classes = row.classes
              .split(',')
              .map((cls: string) => cls.trim())
              .filter((cls: string) => 
                cls && 
                (!excludePrivateLessons || 
                  (!cls.toLowerCase().includes('private lesson') && 
                   !cls.toLowerCase().includes('private')))
              );

            if (!studentMap.has(performerId)) {
              studentMap.set(performerId, {
                id: performerId,
                firstName: row.first_name,
                lastName: row.last_name,
                classes: classes
              });
            } else {
              // If performer already exists, add any new classes
              const existingStudent = studentMap.get(performerId)!;
              const newClasses = classes.filter(cls => !existingStudent.classes.includes(cls));
              existingStudent.classes = [...existingStudent.classes, ...newClasses];
            }
          });

          resolve(Array.from(studentMap.values()));
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};