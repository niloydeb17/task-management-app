import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bijbjbsncbbwajokvxck.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpamJqYnNuY2Jid2Fqb2t2eGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTQyNjAsImV4cCI6MjA3NDUzMDI2MH0.GJ5SKp4r35LsoM82bgAel3ykE_75deybhQunLqYFWd4';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types matching our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar?: string;
          team_id?: string;
          role: 'admin' | 'member' | 'lead';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar?: string;
          team_id?: string;
          role?: 'admin' | 'member' | 'lead';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar?: string;
          team_id?: string;
          role?: 'admin' | 'member' | 'lead';
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          type: 'design' | 'content' | 'development' | 'marketing' | 'other';
          color: string;
          board_template: any; // JSON
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'design' | 'content' | 'development' | 'marketing' | 'other';
          color?: string;
          board_template?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'design' | 'content' | 'development' | 'marketing' | 'other';
          color?: string;
          board_template?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description?: string;
          status: any; // JSON
          priority: 'low' | 'medium' | 'high' | 'urgent';
          assignee_id?: string;
          team_id: string;
          column_id: string;
          tags: string[];
          attachments: any[]; // JSON
          comments: any[]; // JSON
          handoff_history: any[]; // JSON
          created_at: string;
          updated_at: string;
          due_date?: string;
          completed_at?: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          status?: any;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assignee_id?: string;
          team_id: string;
          column_id: string;
          tags?: string[];
          attachments?: any[];
          comments?: any[];
          handoff_history?: any[];
          created_at?: string;
          updated_at?: string;
          due_date?: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: any;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          assignee_id?: string;
          team_id?: string;
          column_id?: string;
          tags?: string[];
          attachments?: any[];
          comments?: any[];
          handoff_history?: any[];
          created_at?: string;
          updated_at?: string;
          due_date?: string;
          completed_at?: string;
        };
      };
      board_templates: {
        Row: {
          id: string;
          name: string;
          team_type: 'design' | 'content' | 'development' | 'marketing' | 'other';
          columns: any; // JSON
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          team_type: 'design' | 'content' | 'development' | 'marketing' | 'other';
          columns?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          team_type?: 'design' | 'content' | 'development' | 'marketing' | 'other';
          columns?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_streaks: {
        Row: {
          id: string;
          team_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string;
          total_tasks_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string;
          total_tasks_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string;
          total_tasks_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description?: string;
          icon: string;
          type: 'team' | 'individual';
          criteria: any; // JSON
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          icon: string;
          type: 'team' | 'individual';
          criteria?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          type?: 'team' | 'individual';
          criteria?: any;
          created_at?: string;
        };
      };
    };
  };
}
