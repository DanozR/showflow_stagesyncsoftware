import { DanceClass, Student, Conflict, ShowInfo } from '../types';
import { getAuthToken } from './supabase';

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

// @ts-ignore - This is replaced at build time
const EDGE_FUNCTION_URL = `${__SUPABASE_URL__}/functions/v1/show-service`;

const callEdgeFunction = async (
  action: string,
  method: string,
  data?: any,
  queryParams?: Record<string, string>
) => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = new URL(`${EDGE_FUNCTION_URL}/${action}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
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

  return method === 'DELETE' ? undefined : response.json();
};

export const saveShow = async (
  showName: string,
  classes: DanceClass[],
  students: Student[],
  conflicts: Conflict[],
  showInfo: ShowInfo
): Promise<SavedShow> => {
  return callEdgeFunction('save', 'POST', {
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
  return callEdgeFunction('update', 'PUT', {
    showId,
    classes,
    students,
    conflicts,
    showInfo
  });
};

export const loadShow = async (showId: string): Promise<SavedShow> => {
  return callEdgeFunction('load', 'GET', undefined, { id: showId });
};

export const listShows = async (): Promise<SavedShow[]> => {
  return callEdgeFunction('list', 'GET');
};

export const deleteShow = async (showId: string): Promise<void> => {
  return callEdgeFunction('delete', 'DELETE', undefined, { id: showId });
};