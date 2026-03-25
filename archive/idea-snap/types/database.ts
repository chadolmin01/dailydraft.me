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
      fragments: {
        Row: {
          id: string
          user_id: string
          type: 'photo' | 'memo'
          content: string | null
          photo_url: string | null
          thumbnail_url: string | null
          location: {
            lat: number
            lng: number
            address?: string
          } | null
          captured_at: string
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'photo' | 'memo'
          content?: string | null
          photo_url?: string | null
          thumbnail_url?: string | null
          location?: {
            lat: number
            lng: number
            address?: string
          } | null
          captured_at?: string
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'photo' | 'memo'
          content?: string | null
          photo_url?: string | null
          thumbnail_url?: string | null
          location?: {
            lat: number
            lng: number
            address?: string
          } | null
          captured_at?: string
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          nickname: string | null
          contact_email: string | null
          onboarding_completed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          nickname?: string | null
          contact_email?: string | null
          onboarding_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          nickname?: string | null
          contact_email?: string | null
          onboarding_completed?: boolean | null
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

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Fragment = Tables<'fragments'>
export type FragmentInsert = TablesInsert<'fragments'>
export type FragmentUpdate = TablesUpdate<'fragments'>
export type Profile = Tables<'profiles'>
