import { supabase } from './supabase';
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

export const saveShow = async (
  showName: string,
  classes: DanceClass[],
  students: Student[],
  conflicts: Conflict[],
  showInfo: ShowInfo
): Promise<SavedShow> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const showData = {
      classes,
      students,
      conflicts,
      showInfo
    };

    const { data, error } = await supabase
      .from('shows')
      .insert({
        user_id: user.user.id,
        show_name: showName,
        name: showInfo.name,
        data: showData,
        version: 1
      })
      .select()
      .single();

    if (error) throw error;
    return data as SavedShow;
  } catch (error) {
    console.error('Error saving show:', error);
    throw error;
  }
};

export const updateShow = async (
  showId: string,
  classes: DanceClass[],
  students: Student[],
  conflicts: Conflict[],
  showInfo: ShowInfo
): Promise<SavedShow> => {
  try {
    const showData = {
      classes,
      students,
      conflicts,
      showInfo
    };

    const { data, error } = await supabase
      .from('shows')
      .update({
        name: showInfo.name,
        data: showData
      })
      .eq('id', showId)
      .select()
      .single();

    if (error) throw error;
    return data as SavedShow;
  } catch (error) {
    console.error('Error updating show:', error);
    throw error;
  }
};

export const loadShow = async (showId: string): Promise<SavedShow> => {
  try {
    const { data, error } = await supabase
      .from('shows')
      .select()
      .eq('id', showId)
      .single();

    if (error) throw error;
    return data as SavedShow;
  } catch (error) {
    console.error('Error loading show:', error);
    throw error;
  }
};

export const listShows = async (): Promise<SavedShow[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('shows')
      .select()
      .eq('user_id', user.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as SavedShow[];
  } catch (error) {
    console.error('Error listing shows:', error);
    throw error;
  }
};

export const deleteShow = async (showId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', showId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting show:', error);
    throw error;
  }
};