export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      organization_users: {
        Row: {
          organization_id: string
          user_id: string
          role: string
          created_at: string | null
        }
        Insert: {
          organization_id: string
          user_id: string
          role?: string
          created_at?: string | null
        }
        Update: {
          organization_id?: string
          user_id?: string
          role?: string
          created_at?: string | null
        }
      }
      shows: {
        Row: {
          id: string
          organization_id: string
          name: string
          date: string | null
          time: string | null
          location: string | null
          min_gap: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          date?: string | null
          time?: string | null
          location?: string | null
          min_gap?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          date?: string | null
          time?: string | null
          location?: string | null
          min_gap?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}