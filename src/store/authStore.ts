import { create } from 'zustand';
import { AuthState, User } from '../types/auth';
import { isDevelopment } from '../utils/isDevelopment';
import { supabase } from '../utils/supabase';

// Mock user for development
const mockUser: User = {
  id: 'dev-user',
  email: 'dev@example.com',
  subscription_status: 'active',
  subscription_tier: 'pro',
  subscription_period_end: '2025-12-31',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmation_sent_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

interface AuthStore extends AuthState {
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ loading: true, error: null });

      if (isDevelopment()) {
        set({ user: mockUser, loading: false });
        return;
      }

      const { data: { user } } = await supabase!.auth.getUser();

      if (user) {
        const { data: userData, error: userError } = await supabase!
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        if (userData.subscription_status !== 'active' && userData.subscription_status !== 'trialing') {
          throw new Error('Your subscription is not active');
        }

        set({ user: userData as User, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Authentication error', loading: false });
      if (!isDevelopment()) {
        window.location.href = import.meta.env.VITE_DASHBOARD_URL;
      }
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });

      if (isDevelopment()) {
        set({ user: null, loading: false });
        return;
      }

      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
      
      set({ user: null, loading: false });
      if (!isDevelopment()) {
        window.location.href = import.meta.env.VITE_DASHBOARD_URL;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Sign out error', loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      if (isDevelopment()) {
        set({ user: mockUser, loading: false });
        return;
      }

      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      set({ user: data.user as User, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Sign in error', loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      if (isDevelopment()) {
        set({ user: mockUser, loading: false });
        return;
      }

      const { data, error } = await supabase!.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      set({ user: data.user as User, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Sign up error', loading: false });
    }
  }
}));