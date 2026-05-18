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
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          birthdate: string
          created_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          birthdate: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          birthdate?: string
          created_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          invite_code: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          owner_id?: string
          created_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          name: string
          emoji: string | null
          user_id: string | null
          role: 'owner' | 'adult' | 'child'
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          emoji?: string | null
          user_id?: string | null
          role: 'owner' | 'adult' | 'child'
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          emoji?: string | null
          user_id?: string | null
          role?: 'owner' | 'adult' | 'child'
          points?: number
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          household_id: string
          title: string
          description: string | null
          status: 'pending' | 'done'
          assigned_member_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'done'
          assigned_member_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'done'
          assigned_member_id?: string | null
          created_at?: string
        }
      }
      task_completions: {
        Row: {
          id: string
          task_id: string
          member_id: string
          done_by_user_id: string | null
          done_at: string
        }
        Insert: {
          id?: string
          task_id: string
          member_id: string
          done_by_user_id?: string | null
          done_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          member_id?: string
          done_by_user_id?: string | null
          done_at?: string
        }
      }
    }
  }
}
