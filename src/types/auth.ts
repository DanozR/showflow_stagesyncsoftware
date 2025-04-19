import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  subscription_status: 'active' | 'trialing' | 'inactive';
  subscription_tier: 'basic' | 'pro';
  subscription_period_end: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}