export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accepted_connections: {
        Row: {
          applicant_id: string
          application_id: string | null
          assigned_role: string | null
          coffee_chat_id: string | null
          connected_at: string | null
          id: string
          notes: string | null
          opportunity_creator_id: string
          opportunity_id: string | null
          status: string | null
        }
        Insert: {
          applicant_id: string
          application_id?: string | null
          assigned_role?: string | null
          coffee_chat_id?: string | null
          connected_at?: string | null
          id?: string
          notes?: string | null
          opportunity_creator_id: string
          opportunity_id?: string | null
          status?: string | null
        }
        Update: {
          applicant_id?: string
          application_id?: string | null
          assigned_role?: string | null
          coffee_chat_id?: string | null
          connected_at?: string | null
          id?: string
          notes?: string | null
          opportunity_creator_id?: string
          opportunity_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accepted_connections_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accepted_connections_coffee_chat_id_fkey"
            columns: ["coffee_chat_id"]
            isOneToOne: false
            referencedRelation: "coffee_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accepted_connections_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          created_at: string | null
          id: string
          intro: string
          match_reason: string | null
          match_score: number | null
          opportunity_id: string
          portfolio_links: Json | null
          status: string | null
          updated_at: string | null
          why_apply: string
        }
        Insert: {
          applicant_id: string
          created_at?: string | null
          id?: string
          intro: string
          match_reason?: string | null
          match_score?: number | null
          opportunity_id: string
          portfolio_links?: Json | null
          status?: string | null
          updated_at?: string | null
          why_apply: string
        }
        Update: {
          applicant_id?: string
          created_at?: string | null
          id?: string
          intro?: string
          match_reason?: string | null
          match_score?: number | null
          opportunity_id?: string
          portfolio_links?: Json | null
          status?: string | null
          updated_at?: string | null
          why_apply?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      boosts: {
        Row: {
          amount_paid: number
          boost_type: string
          created_at: string | null
          expires_at: string
          id: string
          opportunity_id: string | null
          payment_id: string | null
          starts_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          boost_type: string
          created_at?: string | null
          expires_at: string
          id?: string
          opportunity_id?: string | null
          payment_id?: string | null
          starts_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          boost_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          opportunity_id?: string | null
          payment_id?: string | null
          starts_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_chats: {
        Row: {
          application_id: string | null
          contact_info: string | null
          created_at: string | null
          id: string
          invitation_message: string | null
          message: string | null
          opportunity_id: string | null
          owner_user_id: string
          requester_email: string
          requester_name: string | null
          requester_user_id: string | null
          status: string
          target_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          invitation_message?: string | null
          message?: string | null
          opportunity_id?: string | null
          owner_user_id: string
          requester_email: string
          requester_name?: string | null
          requester_user_id?: string | null
          status?: string
          target_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          invitation_message?: string | null
          message?: string | null
          opportunity_id?: string | null
          owner_user_id?: string
          requester_email?: string
          requester_name?: string | null
          requester_user_id?: string | null
          status?: string
          target_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coffee_chats_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coffee_chats_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_waitlist: {
        Row: {
          cohort_target: string
          created_at: string
          email: string
          id: string
          source: string
          user_agent: string | null
        }
        Insert: {
          cohort_target?: string
          created_at?: string
          email: string
          id?: string
          source?: string
          user_agent?: string | null
        }
        Update: {
          cohort_target?: string
          created_at?: string
          email?: string
          id?: string
          source?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reason: string | null
          reporter_identifier: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          reporter_identifier: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          reporter_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_hidden: boolean | null
          nickname: string
          opportunity_id: string
          report_count: number | null
          school: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_hidden?: boolean | null
          nickname: string
          opportunity_id: string
          report_count?: number | null
          school?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_hidden?: boolean | null
          nickname?: string
          opportunity_id?: string
          report_count?: number | null
          school?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_by_receiver: boolean | null
          deleted_by_sender: boolean | null
          id: string
          is_read: boolean | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_by_receiver?: boolean | null
          deleted_by_sender?: boolean | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_by_receiver?: boolean | null
          deleted_by_sender?: boolean | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          error_code: string | null
          id: string
          ip_address: string | null
          level: string
          message: string
          metadata: Json | null
          method: string | null
          request_body: Json | null
          request_headers: Json | null
          source: string
          stack_trace: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          error_code?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          message: string
          metadata?: Json | null
          method?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          source: string
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          error_code?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          message?: string
          metadata?: Json | null
          method?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          source?: string
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_applications: {
        Row: {
          applied_at: string | null
          applied_url: string | null
          created_at: string | null
          event_id: string
          id: string
          personal_notes: string | null
          preparation_checklist: Json | null
          reminder_date: string | null
          reminder_sent: boolean | null
          result_notes: string | null
          status: string
          status_updated_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_url?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          personal_notes?: string | null
          preparation_checklist?: Json | null
          reminder_date?: string | null
          reminder_sent?: boolean | null
          result_notes?: string | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          applied_url?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          personal_notes?: string | null
          preparation_checklist?: Json | null
          reminder_date?: string | null
          reminder_sent?: boolean | null
          result_notes?: string | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "startup_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bookmarks: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          notify_before_days: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          notify_before_days?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          notify_before_days?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookmarks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "startup_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_notifications: {
        Row: {
          bookmark_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          notification_type: string
          notify_date: string | null
          read_at: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          bookmark_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          notification_type: string
          notify_date?: string | null
          read_at?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          bookmark_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          notify_date?: string | null
          read_at?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_notifications_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: false
            referencedRelation: "event_bookmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "startup_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_opportunity_links: {
        Row: {
          created_at: string | null
          created_by: string
          event_id: string
          id: string
          link_type: string
          opportunity_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          event_id: string
          id?: string
          link_type?: string
          opportunity_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          event_id?: string
          id?: string
          link_type?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_opportunity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "startup_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_opportunity_links_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      help_reports: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          page_url: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          page_url?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          page_url?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      helpful_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          voter_identifier: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          voter_identifier: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          voter_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpful_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_members: {
        Row: {
          id: string
          institution_id: string
          joined_at: string
          notes: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          institution_id: string
          joined_at?: string
          notes?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          institution_id?: string
          joined_at?: string
          notes?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_programs: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          institution_id: string
          max_participants: number | null
          name: string
          start_date: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          institution_id: string
          max_participants?: number | null
          name: string
          start_date?: string | null
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          institution_id?: string
          max_participants?: number | null
          name?: string
          start_date?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          email_domains: string[] | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          type: string
          university: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email_domains?: string[] | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          type?: string
          university: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          email_domains?: string[] | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          type?: string
          university?: string
          updated_at?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string | null
          id: string
          opportunity_id: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          opportunity_id: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          opportunity_id?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          recipient_email: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          recipient_email?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          recipient_email?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_deadline_days: number | null
          email_enabled: boolean | null
          id: string
          inapp_bookmark_reminder: boolean | null
          inapp_deadline: boolean | null
          inapp_new_match: boolean | null
          preferred_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_deadline_days?: number | null
          email_enabled?: boolean | null
          id?: string
          inapp_bookmark_reminder?: boolean | null
          inapp_deadline?: boolean | null
          inapp_new_match?: boolean | null
          preferred_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_deadline_days?: number | null
          email_enabled?: boolean | null
          id?: string
          inapp_bookmark_reminder?: boolean | null
          inapp_deadline?: boolean | null
          inapp_new_match?: boolean | null
          preferred_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          priority: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          priority?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          priority?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          applications_count: number | null
          badges: string[] | null
          compensation_details: string | null
          compensation_type: string | null
          created_at: string | null
          creator_id: string
          demo_images: string[] | null
          description: string
          filled_roles: string[] | null
          id: string
          interest_count: number | null
          interest_tags: string[] | null
          location: string | null
          location_type: string | null
          needed_roles: string[] | null
          needed_skills: Json | null
          pain_point: string | null
          project_links: Json | null
          show_updates: boolean | null
          status: string | null
          time_commitment: string | null
          title: string
          type: string
          updated_at: string | null
          views_count: number | null
          vision_embedding: string | null
        }
        Insert: {
          applications_count?: number | null
          badges?: string[] | null
          compensation_details?: string | null
          compensation_type?: string | null
          created_at?: string | null
          creator_id: string
          demo_images?: string[] | null
          description: string
          filled_roles?: string[] | null
          id?: string
          interest_count?: number | null
          interest_tags?: string[] | null
          location?: string | null
          location_type?: string | null
          needed_roles?: string[] | null
          needed_skills?: Json | null
          pain_point?: string | null
          project_links?: Json | null
          show_updates?: boolean | null
          status?: string | null
          time_commitment?: string | null
          title: string
          type?: string
          updated_at?: string | null
          views_count?: number | null
          vision_embedding?: string | null
        }
        Update: {
          applications_count?: number | null
          badges?: string[] | null
          compensation_details?: string | null
          compensation_type?: string | null
          created_at?: string | null
          creator_id?: string
          demo_images?: string[] | null
          description?: string
          filled_roles?: string[] | null
          id?: string
          interest_count?: number | null
          interest_tags?: string[] | null
          location?: string | null
          location_type?: string | null
          needed_roles?: string[] | null
          needed_skills?: Json | null
          pain_point?: string | null
          project_links?: Json | null
          show_updates?: boolean | null
          status?: string | null
          time_commitment?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          views_count?: number | null
          vision_embedding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_creator_profile_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_failures: {
        Row: {
          created_at: string | null
          downgrade_at: string | null
          failure_count: number
          first_failure_at: string
          grace_period_ends_at: string
          id: string
          last_failure_at: string
          notifications_sent: string[] | null
          resolved_at: string | null
          status: string
          subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          downgrade_at?: string | null
          failure_count?: number
          first_failure_at?: string
          grace_period_ends_at: string
          id?: string
          last_failure_at?: string
          notifications_sent?: string[] | null
          resolved_at?: string | null
          status?: string
          subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          downgrade_at?: string | null
          failure_count?: number
          first_failure_at?: string
          grace_period_ends_at?: string
          id?: string
          last_failure_at?: string
          notifications_sent?: string[] | null
          resolved_at?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_failures_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          boost_id: string | null
          created_at: string | null
          currency: string | null
          external_payment_id: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_key: string | null
          payment_provider: string | null
          payment_type: string
          receipt_url: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          boost_id?: string | null
          created_at?: string | null
          currency?: string | null
          external_payment_id?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_key?: string | null
          payment_provider?: string | null
          payment_type: string
          receipt_url?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          boost_id?: string | null
          created_at?: string | null
          currency?: string | null
          external_payment_id?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_key?: string | null
          payment_provider?: string | null
          payment_type?: string
          receipt_url?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_boost_id_fkey"
            columns: ["boost_id"]
            isOneToOne: false
            referencedRelation: "boosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          link_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_interests: {
        Row: {
          created_at: string | null
          id: string
          target_profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          affiliation_type: string | null
          age_range: string | null
          ai_chat_completed: boolean | null
          ai_chat_transcript: Json | null
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          contact_email: string | null
          contact_kakao: string | null
          cover_image_url: string | null
          created_at: string | null
          current_situation: string | null
          data_consent: boolean | null
          data_consent_at: string | null
          desired_position: string | null
          extracted_profile: Json | null
          extraction_confidence: number | null
          github_url: string | null
          graduation_year: number | null
          id: string
          interest_count: number | null
          interest_tags: string[] | null
          invite_code_used: string | null
          is_admin: boolean | null
          is_premium: boolean | null
          is_uni_verified: boolean | null
          last_extraction_at: string | null
          linkedin_url: string | null
          location: string | null
          major: string | null
          nickname: string
          onboarding_completed: boolean | null
          personality: Json | null
          portfolio_url: string | null
          premium_activated_at: string | null
          profile_analysis: Json | null
          profile_analysis_at: string | null
          profile_views: number | null
          profile_visibility: string | null
          skills: Json | null
          university: string | null
          updated_at: string | null
          user_id: string
          vision_embedding: string | null
          vision_summary: string | null
        }
        Insert: {
          affiliation_type?: string | null
          age_range?: string | null
          ai_chat_completed?: boolean | null
          ai_chat_transcript?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          contact_email?: string | null
          contact_kakao?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_situation?: string | null
          data_consent?: boolean | null
          data_consent_at?: string | null
          desired_position?: string | null
          extracted_profile?: Json | null
          extraction_confidence?: number | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          interest_count?: number | null
          interest_tags?: string[] | null
          invite_code_used?: string | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          is_uni_verified?: boolean | null
          last_extraction_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          major?: string | null
          nickname: string
          onboarding_completed?: boolean | null
          personality?: Json | null
          portfolio_url?: string | null
          premium_activated_at?: string | null
          profile_analysis?: Json | null
          profile_analysis_at?: string | null
          profile_views?: number | null
          profile_visibility?: string | null
          skills?: Json | null
          university?: string | null
          updated_at?: string | null
          user_id: string
          vision_embedding?: string | null
          vision_summary?: string | null
        }
        Update: {
          affiliation_type?: string | null
          age_range?: string | null
          ai_chat_completed?: boolean | null
          ai_chat_transcript?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          contact_email?: string | null
          contact_kakao?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_situation?: string | null
          data_consent?: boolean | null
          data_consent_at?: string | null
          desired_position?: string | null
          extracted_profile?: Json | null
          extraction_confidence?: number | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          interest_count?: number | null
          interest_tags?: string[] | null
          invite_code_used?: string | null
          is_admin?: boolean | null
          is_premium?: boolean | null
          is_uni_verified?: boolean | null
          last_extraction_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          major?: string | null
          nickname?: string
          onboarding_completed?: boolean | null
          personality?: Json | null
          portfolio_url?: string | null
          premium_activated_at?: string | null
          profile_analysis?: Json | null
          profile_analysis_at?: string | null
          profile_views?: number | null
          profile_visibility?: string | null
          skills?: Json | null
          university?: string | null
          updated_at?: string | null
          user_id?: string
          vision_embedding?: string | null
          vision_summary?: string | null
        }
        Relationships: []
      }
      project_invitations: {
        Row: {
          created_at: string | null
          decline_reason: string | null
          expires_at: string | null
          id: string
          invited_user_id: string
          inviter_user_id: string
          last_reminder_at: string | null
          message: string | null
          opportunity_id: string
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decline_reason?: string | null
          expires_at?: string | null
          id?: string
          invited_user_id: string
          inviter_user_id: string
          last_reminder_at?: string | null
          message?: string | null
          opportunity_id: string
          role: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decline_reason?: string | null
          expires_at?: string | null
          id?: string
          invited_user_id?: string
          inviter_user_id?: string
          last_reminder_at?: string | null
          message?: string | null
          opportunity_id?: string
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          opportunity_id: string
          title: string
          update_type: string
          updated_at: string | null
          week_number: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          opportunity_id: string
          title: string
          update_type?: string
          updated_at?: string | null
          week_number: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          opportunity_id?: string
          title?: string
          update_type?: string
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      recruit_applications: {
        Row: {
          agreed_at: string
          ai_experience: string
          available_slots: string[]
          cohort: string
          created_at: string
          id: string
          learning_goal: string
          motivation: string
          name: string
          offline_available: string
          team_idea: string
          team_role: string
          user_agent: string | null
          weekly_hours: string
        }
        Insert: {
          agreed_at: string
          ai_experience: string
          available_slots?: string[]
          cohort?: string
          created_at?: string
          id?: string
          learning_goal: string
          motivation: string
          name: string
          offline_available: string
          team_idea: string
          team_role: string
          user_agent?: string | null
          weekly_hours: string
        }
        Update: {
          agreed_at?: string
          ai_experience?: string
          available_slots?: string[]
          cohort?: string
          created_at?: string
          id?: string
          learning_goal?: string
          motivation?: string
          name?: string
          offline_available?: string
          team_idea?: string
          team_role?: string
          user_agent?: string | null
          weekly_hours?: string
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          advice_reflected_count: number
          advice_shown_count: number
          client_fingerprint: string | null
          completion_status: string
          created_at: string
          dropoff_point: string | null
          final_score: number | null
          id: string
          idea_categories: string[]
          interaction_mode: string
          persona_engagement: Json
          personas: string[]
          score_history: Json
          session_end: string | null
          session_hash: string
          session_start: string
          total_duration_seconds: number | null
          turn_count: number
          updated_at: string
          validation_level: string
        }
        Insert: {
          advice_reflected_count?: number
          advice_shown_count?: number
          client_fingerprint?: string | null
          completion_status?: string
          created_at?: string
          dropoff_point?: string | null
          final_score?: number | null
          id?: string
          idea_categories?: string[]
          interaction_mode?: string
          persona_engagement?: Json
          personas?: string[]
          score_history?: Json
          session_end?: string | null
          session_hash: string
          session_start?: string
          total_duration_seconds?: number | null
          turn_count?: number
          updated_at?: string
          validation_level: string
        }
        Update: {
          advice_reflected_count?: number
          advice_shown_count?: number
          client_fingerprint?: string | null
          completion_status?: string
          created_at?: string
          dropoff_point?: string | null
          final_score?: number | null
          id?: string
          idea_categories?: string[]
          interaction_mode?: string
          persona_engagement?: Json
          personas?: string[]
          score_history?: Json
          session_end?: string | null
          session_hash?: string
          session_start?: string
          total_duration_seconds?: number | null
          turn_count?: number
          updated_at?: string
          validation_level?: string
        }
        Relationships: []
      }
      startup_events: {
        Row: {
          content_embedding: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          external_id: string
          id: string
          interest_tags: string[] | null
          last_synced_at: string | null
          location: string | null
          organizer: string
          prize_amount: number | null
          raw_data: Json | null
          registration_end_date: string
          registration_start_date: string | null
          registration_url: string | null
          source: string
          start_date: string | null
          status: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          content_embedding?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          external_id: string
          id?: string
          interest_tags?: string[] | null
          last_synced_at?: string | null
          location?: string | null
          organizer: string
          prize_amount?: number | null
          raw_data?: Json | null
          registration_end_date: string
          registration_start_date?: string | null
          registration_url?: string | null
          source?: string
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          content_embedding?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          external_id?: string
          id?: string
          interest_tags?: string[] | null
          last_synced_at?: string | null
          location?: string | null
          organizer?: string
          prize_amount?: number | null
          raw_data?: Json | null
          registration_end_date?: string
          registration_start_date?: string | null
          registration_url?: string | null
          source?: string
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      startup_ideas: {
        Row: {
          category: string[] | null
          collected_at: string | null
          comments_count: number | null
          created_at: string | null
          description: string | null
          external_id: string
          final_score: number | null
          funding_stage: string | null
          id: string
          interest_tags: string[] | null
          investors: string[] | null
          korea_deep_analysis: Json | null
          korea_fit_analysis: Json | null
          korea_fit_score: number | null
          logo_url: string | null
          name: string
          priority_score: number | null
          raw_data: Json | null
          similar_korea_startups: string[] | null
          source: string
          source_url: string
          status: string | null
          tagline: string | null
          tier: number | null
          total_funding: number | null
          updated_at: string | null
          upvotes: number | null
          website_url: string | null
        }
        Insert: {
          category?: string[] | null
          collected_at?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          external_id: string
          final_score?: number | null
          funding_stage?: string | null
          id?: string
          interest_tags?: string[] | null
          investors?: string[] | null
          korea_deep_analysis?: Json | null
          korea_fit_analysis?: Json | null
          korea_fit_score?: number | null
          logo_url?: string | null
          name: string
          priority_score?: number | null
          raw_data?: Json | null
          similar_korea_startups?: string[] | null
          source: string
          source_url: string
          status?: string | null
          tagline?: string | null
          tier?: number | null
          total_funding?: number | null
          updated_at?: string | null
          upvotes?: number | null
          website_url?: string | null
        }
        Update: {
          category?: string[] | null
          collected_at?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          external_id?: string
          final_score?: number | null
          funding_stage?: string | null
          id?: string
          interest_tags?: string[] | null
          investors?: string[] | null
          korea_deep_analysis?: Json | null
          korea_fit_analysis?: Json | null
          korea_fit_score?: number | null
          logo_url?: string | null
          name?: string
          priority_score?: number | null
          raw_data?: Json | null
          similar_korea_startups?: string[] | null
          source?: string
          source_url?: string
          status?: string | null
          tagline?: string | null
          tier?: number | null
          total_funding?: number | null
          updated_at?: string | null
          upvotes?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          billing_key: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          external_customer_id: string | null
          external_subscription_id: string | null
          id: string
          payment_provider: string | null
          plan_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          billing_key?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_provider?: string | null
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          billing_key?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_provider?: string | null
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean
          opportunity_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean
          opportunity_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean
          opportunity_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_announcements_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      team_checklists: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean
          opportunity_id: string
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          opportunity_id: string
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          opportunity_id?: string
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_checklists_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          applications_used: number
          boosts_purchased: number
          created_at: string | null
          id: string
          opportunities_created: number
          period_end: string
          period_start: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applications_used?: number
          boosts_purchased?: number
          created_at?: string | null
          id?: string
          opportunities_created?: number
          period_end: string
          period_start: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applications_used?: number
          boosts_purchased?: number
          created_at?: string | null
          id?: string
          opportunities_created?: number
          period_end?: string
          period_start?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_match_analyses: {
        Row: {
          analysis: Json
          created_at: string
          id: string
          model: string
          target_id: string
          viewer_id: string
        }
        Insert: {
          analysis: Json
          created_at?: string
          id?: string
          model?: string
          target_id: string
          viewer_id: string
        }
        Update: {
          analysis?: Json
          created_at?: string
          id?: string
          model?: string
          target_id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          goal: string | null
          id: string
          interests: string[] | null
          is_uni_verified: boolean | null
          name: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          org: string | null
          role: string | null
          role_detail: string | null
          role_pref: string | null
          skills: string[] | null
          stage: string | null
          team_size: string | null
          university: string | null
          updated_at: string | null
          user_type: string | null
          work_style: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          goal?: string | null
          id: string
          interests?: string[] | null
          is_uni_verified?: boolean | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          org?: string | null
          role?: string | null
          role_detail?: string | null
          role_pref?: string | null
          skills?: string[] | null
          stage?: string | null
          team_size?: string | null
          university?: string | null
          updated_at?: string | null
          user_type?: string | null
          work_style?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          goal?: string | null
          id?: string
          interests?: string[] | null
          is_uni_verified?: boolean | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          org?: string | null
          role?: string | null
          role_detail?: string | null
          role_pref?: string | null
          skills?: string[] | null
          stage?: string | null
          team_size?: string | null
          university?: string | null
          updated_at?: string | null
          user_type?: string | null
          work_style?: string | null
        }
        Relationships: []
      }
      validated_ideas: {
        Row: {
          action_plan: Json | null
          artifacts: Json | null
          conversation_history: string | null
          created_at: string | null
          id: string
          persona_scores: Json | null
          problem: string | null
          project_idea: string
          reflected_advice: string[] | null
          score: number | null
          solution: string | null
          target: string | null
          updated_at: string | null
          user_id: string
          validation_level: string | null
        }
        Insert: {
          action_plan?: Json | null
          artifacts?: Json | null
          conversation_history?: string | null
          created_at?: string | null
          id?: string
          persona_scores?: Json | null
          problem?: string | null
          project_idea: string
          reflected_advice?: string[] | null
          score?: number | null
          solution?: string | null
          target?: string | null
          updated_at?: string | null
          user_id: string
          validation_level?: string | null
        }
        Update: {
          action_plan?: Json | null
          artifacts?: Json | null
          conversation_history?: string | null
          created_at?: string | null
          id?: string
          persona_scores?: Json | null
          problem?: string | null
          project_idea?: string
          reflected_advice?: string[] | null
          score?: number | null
          solution?: string | null
          target?: string | null
          updated_at?: string | null
          user_id?: string
          validation_level?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string
          expires_at: string
          locked_until: string | null
          send_count: number | null
          send_reset_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          locked_until?: string | null
          send_count?: number | null
          send_reset_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          locked_until?: string | null
          send_count?: number | null
          send_reset_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_coffee_chat: {
        Args: { p_chat_id: string; p_contact_info: string }
        Returns: boolean
      }
      accept_project_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
      calculate_context_boost:
        | {
            Args: {
              event_end_date: string
              event_target: string
              user_location: string
            }
            Returns: number
          }
        | {
            Args: {
              event_end_date: string
              event_target: string
              user_location: string
            }
            Returns: number
          }
      calculate_tag_score: {
        Args: { event_tags: string[]; user_tags: string[] }
        Returns: number
      }
      check_defense_unlock: { Args: { p_email: string }; Returns: boolean }
      cleanup_old_error_logs: { Args: never; Returns: number }
      decline_coffee_chat: { Args: { p_chat_id: string }; Returns: boolean }
      decline_project_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
      expire_boosts: { Args: never; Returns: number }
      express_interest: {
        Args: {
          p_opportunity_id: string
          p_user_email: string
          p_user_id?: string
        }
        Returns: boolean
      }
      find_similar_opportunities: {
        Args: {
          p_match_count?: number
          p_match_threshold?: number
          p_opportunity_id: string
        }
        Returns: {
          description: string
          id: string
          interest_tags: string[]
          needed_roles: string[]
          similarity: number
          title: string
          type: string
        }[]
      }
      generate_deadline_notifications: { Args: never; Returns: number }
      get_boosted_opportunities: {
        Args: never
        Returns: {
          boost_type: string
          expires_at: string
          opportunity_id: string
        }[]
      }
      get_or_create_current_usage: {
        Args: { p_user_id: string }
        Returns: {
          applications_used: number
          boosts_purchased: number
          created_at: string | null
          id: string
          opportunities_created: number
          period_end: string
          period_start: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_limits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_prd_usage_this_month: {
        Args: { p_email: string }
        Returns: {
          count: number
          level: string
        }[]
      }
      get_user_admin_institution_ids: {
        Args: { uid: string }
        Returns: string[]
      }
      get_user_institution_ids: { Args: { uid: string }; Returns: string[] }
      has_expressed_interest: {
        Args: { p_opportunity_id: string; p_user_email: string }
        Returns: boolean
      }
      increment_opportunity_views: {
        Args: { opportunity_id: string }
        Returns: undefined
      }
      increment_usage: {
        Args: { p_type: string; p_user_id: string }
        Returns: {
          applications_used: number
          boosts_purchased: number
          created_at: string | null
          id: string
          opportunities_created: number
          period_end: string
          period_start: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_limits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      increment_view_count: {
        Args: { row_id: string; table_name: string }
        Returns: number
      }
      match_opportunities:
        | {
            Args: {
              exclude_creator_id?: string
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              applications_count: number
              compensation_details: string
              compensation_type: string
              created_at: string
              creator_id: string
              demo_images: string[]
              description: string
              id: string
              interest_tags: string[]
              location: string
              location_type: string
              needed_roles: string[]
              needed_skills: Json
              project_links: Json
              similarity: number
              status: string
              time_commitment: string
              title: string
              type: string
              updated_at: string
              views_count: number
              vision_embedding: string
            }[]
          }
        | {
            Args: {
              exclude_creator_id?: string
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              applications_count: number
              compensation_details: string
              compensation_type: string
              created_at: string
              creator_id: string
              demo_images: string[]
              description: string
              id: string
              interest_tags: string[]
              location: string
              location_type: string
              needed_roles: string[]
              needed_skills: Json
              project_links: Json
              similarity: number
              status: string
              time_commitment: string
              title: string
              type: string
              updated_at: string
              views_count: number
              vision_embedding: string
            }[]
          }
      match_users: {
        Args: {
          exclude_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          current_situation: string
          desired_position: string
          extracted_profile: Json
          id: string
          interest_tags: string[]
          location: string
          nickname: string
          personality: Json
          profile_analysis: Json
          similarity: number
          skills: Json
          user_id: string
          vision_embedding: string
          vision_summary: string
        }[]
      }
      recommend_events_by_tags: {
        Args: { p_limit?: number; p_tags: string[] }
        Returns: {
          days_until_deadline: number
          description: string
          event_id: string
          event_type: string
          interest_tags: string[]
          organizer: string
          registration_end_date: string
          registration_url: string
          tag_score: number
          title: string
        }[]
      }
      recommend_events_for_user: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          context_boost: number
          days_until_deadline: number
          description: string
          event_type: string
          id: string
          interest_tags: string[]
          organizer: string
          registration_end_date: string
          registration_url: string
          tag_score: number
          title: string
          total_score: number
          vector_score: number
        }[]
      }
      report_comment: {
        Args: {
          p_comment_id: string
          p_reason?: string
          p_reporter_identifier: string
        }
        Returns: boolean
      }
      request_coffee_chat: {
        Args: {
          p_message?: string
          p_opportunity_id: string
          p_requester_email: string
          p_requester_name: string
          p_requester_user_id?: string
        }
        Returns: string
      }
      request_person_coffee_chat: {
        Args: {
          p_message?: string
          p_requester_email: string
          p_requester_name: string
          p_requester_user_id?: string
          p_target_user_id: string
        }
        Returns: string
      }
      vote_helpful: {
        Args: { p_comment_id: string; p_voter_identifier: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
