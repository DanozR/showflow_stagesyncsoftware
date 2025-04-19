import { User } from './auth';

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
}

export type { User };