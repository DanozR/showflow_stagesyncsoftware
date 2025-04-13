export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classes: string[];
}

export interface DanceClass {
  name: string;
  students: Student[];
  position: number | null;
  locked: boolean;
  included: boolean;
  title?: string;
}

export interface Conflict {
  studentId: string;
  studentName: string;
  classNames: string[];
  gap: number;
}

export interface ShowInfo {
  name: string;
  date: string;
  time: string;
  location: string;
  show_id?: string;
  show_name?: string;
  version?: number;
}

export interface SavedShow {
  id: string;
  show_name: string;
  name: string;
  date: string;
  time: string;
  location: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ShowData {
  showInfo: ShowInfo;
  students: Student[];
  classes: DanceClass[];
  conflicts: Conflict[];
  minGap: number;
}