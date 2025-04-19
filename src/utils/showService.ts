export interface SavedShow {
  id: string;
  user_id: string;
  show_name: string;
  name: string;
  data: {
    classes: any[];
    students: any[];
    conflicts: any[];
    showInfo: any;
  };
  created_at: string;
  updated_at: string;
}

const getAuthHeaders = () => {
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const saveShow = async (
  showName: string,
  classes: any[],
  students: any[],
  conflicts: any[],
  showInfo: any
): Promise<SavedShow> => {
  const headers = await getAuthHeaders();
  const response = await fetch('/.netlify/functions/supabase', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      showName,
      classes,
      students,
      conflicts,
      showInfo
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save show');
  }

  return response.json();
};

export const updateShow = async (
  showId: string,
  classes: any[],
  students: any[],
  conflicts: any[],
  showInfo: any
): Promise<SavedShow> => {
  const headers = await getAuthHeaders();
  const response = await fetch('/.netlify/functions/supabase', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      showId,
      classes,
      students,
      conflicts,
      showInfo
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update show');
  }

  return response.json();
};

export const listShows = async (): Promise<SavedShow[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch('/.netlify/functions/supabase', {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list shows');
  }

  return response.json();
};

export const deleteShow = async (showId: string): Promise<void> => {
  const headers = await getAuthHeaders();
  const response = await fetch('/.netlify/functions/supabase', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ showId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete show');
  }
};