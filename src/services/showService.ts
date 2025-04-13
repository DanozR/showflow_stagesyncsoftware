import { supabase } from '../utils/supabase';
import { ShowData, ShowInfo, SavedShow } from '../types';

export class ShowService {
  private static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error('Authentication error: ' + error.message);
    if (!user?.id) throw new Error('No authenticated user found');
    return user.id;
  }

  static async saveShow(showData: ShowData, showName: string): Promise<string> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated to save shows');

    const { showInfo, students, classes, conflicts, minGap } = showData;
    const data = {
      students,
      classes,
      conflicts,
      minGap,
      showInfo: {
        ...showInfo,
        show_name: showName
      }
    };

    // Start a transaction
    const { data: show, error: saveError } = await supabase
      .from('shows')
      .upsert({
        id: showInfo.show_id,
        user_id: userId,
        show_name: showName,
        name: showInfo.name,
        date: showInfo.date,
        time: showInfo.time,
        location: showInfo.location,
        data,
        version: showInfo.version || 1
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Save version history
    const { error: versionError } = await supabase
      .from('show_versions')
      .insert({
        show_id: show.id,
        version: show.version,
        data
      });

    if (versionError) throw versionError;

    return show.id;
  }

  static async loadShow(showId: string): Promise<ShowData> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated to load shows');

    const { data: show, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!show) throw new Error('Show not found');

    return show.data;
  }

  static async getShowVersions(showId: string): Promise<any[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated to get show versions');

    const { data: versions, error } = await supabase
      .from('show_versions')
      .select('version_id, version, created_at')
      .eq('show_id', showId)
      .order('version', { ascending: false });

    if (error) throw error;
    return versions || [];
  }

  static async getShowVersion(showId: string, version: number): Promise<ShowData> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated to get show version');

    const { data: versionData, error } = await supabase
      .from('show_versions')
      .select('data')
      .eq('show_id', showId)
      .eq('version', version)
      .single();

    if (error) throw error;
    if (!versionData) throw new Error('Version not found');

    return versionData.data;
  }

  static async getUserShows(): Promise<SavedShow[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated to get shows');

    const { data: shows, error } = await supabase
      .from('shows')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return shows || [];
  }

  static async deleteShow(showId: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User must be authenticated to delete shows');

    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', showId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}