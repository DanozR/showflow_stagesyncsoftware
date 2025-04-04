import { Student, DanceClass, Conflict } from '../types';

export const buildClassesFromStudents = (students: Student[]): DanceClass[] => {
  const classMap = new Map<string, DanceClass>();
  
  students.forEach(student => {
    student.classes.forEach(className => {
      if (!classMap.has(className)) {
        classMap.set(className, {
          name: className,
          students: [student],
          position: null,
          locked: false,
          included: true,
          title: '' // Initialize with empty title
        });
      } else {
        const existingClass = classMap.get(className)!;
        if (!existingClass.students.some(s => s.id === student.id)) {
          existingClass.students.push(student);
        }
      }
    });
  });
  
  return Array.from(classMap.values());
};

export const optimizeShowOrder = (
  classes: DanceClass[],
  minGap: number
): { orderedClasses: DanceClass[], conflicts: Conflict[] } => {
  // Only work with included classes
  const includedClasses = classes.filter(c => c.included);
  
  // If no classes are included, return empty results
  if (includedClasses.length === 0) {
    return { orderedClasses: [], conflicts: [] };
  }
  
  // Respect locked positions - CRITICAL: preserve exact positions for locked classes
  const lockedClasses = includedClasses.filter(c => c.locked && c.position !== null);
  const unlockedClasses = includedClasses.filter(c => !c.locked || c.position === null);
  
  // Sort locked classes by position
  lockedClasses.sort((a, b) => (a.position || 0) - (b.position || 0));
  
  // If all classes are locked, just return them in their current order
  if (unlockedClasses.length === 0) {
    return { 
      orderedClasses: lockedClasses,
      conflicts: detectConflicts(lockedClasses, minGap)
    };
  }
  
  // Try multiple optimization strategies and pick the best one
  const attempts = 5; // Number of optimization attempts with different starting conditions
  let bestOrderedClasses: DanceClass[] = [];
  let bestConflicts: Conflict[] = [];
  let bestScore = -Infinity;
  
  for (let attempt = 0; attempt < attempts; attempt++) {
    // Create a copy of the classes for this attempt
    const attemptLockedClasses = [...lockedClasses];
    const attemptUnlockedClasses = [...unlockedClasses];
    
    // For variety in attempts, shuffle the unlocked classes differently each time
    if (attempt > 0) {
      shuffleArray(attemptUnlockedClasses);
    } else {
      // For the first attempt, sort by number of students (most to least)
      attemptUnlockedClasses.sort((a, b) => b.students.length - a.students.length);
    }
    
    // Optimize this attempt
    const { orderedClasses, conflicts } = optimizeSingleAttempt(
      attemptLockedClasses,
      attemptUnlockedClasses,
      minGap
    );
    
    // Score this attempt (lower is better)
    const score = scoreOptimization(conflicts, minGap);
    
    // If this is the best attempt so far, save it
    if (score > bestScore) {
      bestScore = score;
      bestOrderedClasses = orderedClasses;
      bestConflicts = conflicts;
    }
  }
  
  // Assign final positions to all classes
  bestOrderedClasses.forEach((cls, index) => {
    if (!cls.locked) {
      cls.position = index;
    }
  });
  
  return { orderedClasses: bestOrderedClasses, conflicts: bestConflicts };
};

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Score an optimization result - higher score is better
function scoreOptimization(conflicts: Conflict[], minGap: number): number {
  if (conflicts.length === 0) return 10000; // Perfect score for no conflicts
  
  // Count conflicts by gap size
  const conflictsByGap = new Map<number, number>();
  for (let i = 0; i < minGap; i++) {
    conflictsByGap.set(i, 0);
  }
  
  conflicts.forEach(conflict => {
    conflictsByGap.set(conflict.gap, (conflictsByGap.get(conflict.gap) || 0) + 1);
  });
  
  // Calculate score with exponentially higher penalties for smaller gaps
  let score = 0;
  
  // HEAVILY penalize back-to-back performances (gap = 0)
  const backToBackCount = conflictsByGap.get(0) || 0;
  score -= backToBackCount * 1000;
  
  // Penalize other gaps with decreasing severity
  for (let gap = 1; gap < minGap; gap++) {
    const count = conflictsByGap.get(gap) || 0;
    score -= count * (100 / gap); // Higher penalty for smaller gaps
  }
  
  // Also consider total number of conflicts
  score -= conflicts.length * 10;
  
  // Count unique students with conflicts (we want to minimize this)
  const uniqueStudentsWithConflicts = new Set(conflicts.map(c => c.studentId)).size;
  score -= uniqueStudentsWithConflicts * 50;
  
  return score;
}

// Optimize a single attempt
function optimizeSingleAttempt(
  lockedClasses: DanceClass[],
  unlockedClasses: DanceClass[],
  minGap: number
): { orderedClasses: DanceClass[], conflicts: Conflict[] } {
  // Create a map to track the last appearance of each student
  const studentLastAppearance = new Map<string, number>();
  
  // Initialize the ordered classes with locked classes
  const orderedClasses: DanceClass[] = [...lockedClasses];
  
  // Update the student last appearance map with locked classes
  lockedClasses.forEach((cls, index) => {
    cls.students.forEach(student => {
      studentLastAppearance.set(student.id, index);
    });
  });
  
  // Place each unlocked class in the best position
  while (unlockedClasses.length > 0) {
    let bestClass: DanceClass | null = null;
    let bestPosition = -1;
    let bestScore = -Infinity;
    
    // Try each remaining class
    for (const currentClass of unlockedClasses) {
      // Try each possible position
      for (let position = 0; position <= orderedClasses.length; position++) {
        // Skip positions that would break locked classes
        if (position < orderedClasses.length && orderedClasses[position].locked) {
          continue;
        }
        
        // Calculate score for this position (higher is better)
        let score = 0;
        let worstGap = Infinity;
        let backToBackCount = 0;
        
        // Check each student in the current class
        for (const student of currentClass.students) {
          const lastAppearance = studentLastAppearance.get(student.id);
          
          if (lastAppearance !== undefined) {
            const gap = position - lastAppearance - 1;
            
            // Track the worst gap for this position
            if (gap < worstGap) {
              worstGap = gap;
            }
            
            // Count back-to-back performances
            if (gap === 0) {
              backToBackCount++;
            }
            
            // HEAVILY penalize zero gaps (back-to-back performances)
            if (gap === 0) {
              score -= 5000; // Much higher penalty for zero gaps
            }
            // Penalize gaps less than minGap with exponential scaling
            else if (gap < minGap) {
              score -= Math.pow(minGap - gap, 3) * 100;
            } else {
              // Reward positions that provide adequate gaps
              score += 10;
            }
          } else {
            // Slightly favor putting students with no previous appearance earlier
            score += 5;
          }
        }
        
        // Check for future conflicts too (look ahead)
        if (position < orderedClasses.length) {
          // Temporarily place the class at this position
          const tempOrderedClasses = [...orderedClasses];
          tempOrderedClasses.splice(position, 0, currentClass);
          
          // Create a temporary map of student appearances
          const tempStudentLastAppearance = new Map(studentLastAppearance);
          currentClass.students.forEach(student => {
            tempStudentLastAppearance.set(student.id, position);
          });
          
          // Check for conflicts with the next class
          const nextClass = tempOrderedClasses[position + 1];
          for (const student of nextClass.students) {
            const lastAppearance = tempStudentLastAppearance.get(student.id);
            if (lastAppearance !== undefined && lastAppearance === position) {
              // This would create a back-to-back conflict
              score -= 5000;
            }
          }
        }
        
        // Bonus for positions that avoid back-to-back performances
        if (backToBackCount === 0) {
          score += 1000;
        }
        
        // Update best position if this is better
        if (score > bestScore) {
          bestScore = score;
          bestPosition = position;
          bestClass = currentClass;
        }
      }
    }
    
    if (!bestClass) break; // Shouldn't happen, but just in case
    
    // Remove the best class from unlockedClasses
    unlockedClasses.splice(unlockedClasses.indexOf(bestClass), 1);
    
    // Insert the best class at the best position
    orderedClasses.splice(bestPosition, 0, bestClass);
    
    // Update student last appearances
    bestClass.students.forEach(student => {
      studentLastAppearance.set(student.id, bestPosition);
    });
    
    // Update positions of classes after insertion
    for (let i = bestPosition + 1; i < orderedClasses.length; i++) {
      if (!orderedClasses[i].locked) {
        // Only update position for display purposes, not for optimization logic
        orderedClasses[i].position = i;
      }
    }
  }
  
  // Detect conflicts
  const conflicts = detectConflicts(orderedClasses, minGap);
  
  return { orderedClasses, conflicts };
}

// Detect conflicts in a given order of classes
function detectConflicts(orderedClasses: DanceClass[], minGap: number): Conflict[] {
  const conflicts: Conflict[] = [];
  const studentAppearances = new Map<string, number[]>();
  
  // Build a map of all appearances for each student
  orderedClasses.forEach((cls, index) => {
    cls.students.forEach(student => {
      if (!studentAppearances.has(student.id)) {
        studentAppearances.set(student.id, []);
      }
      studentAppearances.get(student.id)!.push(index);
    });
  });
  
  // Check for conflicts
  studentAppearances.forEach((appearances, studentId) => {
    for (let i = 0; i < appearances.length - 1; i++) {
      const gap = appearances[i + 1] - appearances[i] - 1;
      
      if (gap < minGap) {
        // Find the student
        const student = orderedClasses[appearances[i]].students.find(s => s.id === studentId);
        if (student) {
          conflicts.push({
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            classNames: [
              orderedClasses[appearances[i]].name,
              orderedClasses[appearances[i + 1]].name
            ],
            gap
          });
        }
      }
    }
  });
  
  return conflicts;
}