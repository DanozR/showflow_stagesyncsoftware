import { DanceClass, Student, Conflict, ShowInfo } from '../types';

export interface SavedShow {
  id: string;
  user_id: string;
  show_name: string;
  name: string;
  data: {
    classes: DanceClass[];
    students: Student[];
    conflicts: Conflict[];
    showInfo: ShowInfo;
  };
  version: number;
  created_at: string;
  updated_at: string;
}

const callNetlifyFunction = async (
  method: string,
  data?: any
): Promise<any> => {
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('/.netlify/functions/supabase', {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
};

export const saveShow = async (
  showName: string,
  classes: DanceClass[],
  students: Student[],
  conflicts: Conflict[],
  showInfo: ShowInfo
): Promise<SavedShow> => {
  return callNetlifyFunction('POST', {
    showName,
    classes,
    students,
    conflicts,
    showInfo
  });
};

export const updateShow = async (
  showId: string,
  classes: DanceClass[],
  students: Student[],
  conflicts: Conflict[],
  showInfo: ShowInfo
): Promise<SavedShow> => {
  return callNetlifyFunction('PUT', {
    showId,
    classes,
    students,
    conflicts,
    showInfo
  });
};

export const listShows = async (): Promise<SavedShow[]> => {
  return callNetlifyFunction('GET');
};

export const deleteShow = async (showId: string): Promise<void> => {
  return callNetlifyFunction('DELETE', { showId });
};