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
          intro: string | null
          match_reason: string | null
          match_score: number | null
          opportunity_id: string
          portfolio_links: Json | null
          source: string
          status: string | null
          updated_at: string | null
          why_apply: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string | null
          id?: string
          intro?: string | null
          match_reason?: string | null
          match_score?: number | null
          opportunity_id: string
          portfolio_links?: Json | null
          source?: string
          status?: string | null
          updated_at?: string | null
          why_apply?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string | null
          id?: string
          intro?: string | null
          match_reason?: string | null
          match_score?: number | null
          opportunity_id?: string
          portfolio_links?: Json | null
          source?: string
          status?: string | null
          updated_at?: string | null
          why_apply?: string | null
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
      bot_interventions: {
        Row: {
          bot_message_id: string | null
          club_id: string
          confidence: number
          created_at: string
          discord_channel_id: string
          discord_guild_id: string
          id: string
          pattern_type: string
          trigger_type: string
          user_response: string | null
        }
        Insert: {
          bot_message_id?: string | null
          club_id: string
          confidence: number
          created_at?: string
          discord_channel_id: string
          discord_guild_id: string
          id?: string
          pattern_type: string
          trigger_type?: string
          user_response?: string | null
        }
        Update: {
          bot_message_id?: string | null
          club_id?: string
          confidence?: number
          created_at?: string
          discord_channel_id?: string
          discord_guild_id?: string
          id?: string
          pattern_type?: string
          trigger_type?: string
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_interventions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_announcement_reads: {
        Row: {
          announcement_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "club_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      club_announcements: {
        Row: {
          author_id: string
          club_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          published_at: string | null
          scheduled_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          club_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          club_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_announcements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_credentials: {
        Row: {
          club_id: string
          created_at: string
          credential_type: string
          id: string
          university_id: string | null
          verification_method: string
          verified_at: string
          verified_by: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          credential_type: string
          id?: string
          university_id?: string | null
          verification_method: string
          verified_at?: string
          verified_by?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          credential_type?: string
          id?: string
          university_id?: string | null
          verification_method?: string
          verified_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_credentials_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_credentials_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      club_events: {
        Row: {
          all_day: boolean
          club_id: string
          cohort: string | null
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          event_type: string
          id: string
          location: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          club_id: string
          cohort?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          club_id?: string
          cohort?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_ghostwriter_settings: {
        Row: {
          ai_tone: string
          checkin_day: number
          checkin_template: string | null
          club_id: string
          current_week: number | null
          custom_prompt_hint: string | null
          generate_day: number
          id: string
          min_messages: number
          timeout_hours: number
          updated_at: string
          week_started_at: string | null
        }
        Insert: {
          ai_tone?: string
          checkin_day?: number
          checkin_template?: string | null
          club_id: string
          current_week?: number | null
          custom_prompt_hint?: string | null
          generate_day?: number
          id?: string
          min_messages?: number
          timeout_hours?: number
          updated_at?: string
          week_started_at?: string | null
        }
        Update: {
          ai_tone?: string
          checkin_day?: number
          checkin_template?: string | null
          club_id?: string
          current_week?: number | null
          custom_prompt_hint?: string | null
          generate_day?: number
          id?: string
          min_messages?: number
          timeout_hours?: number
          updated_at?: string
          week_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_ghostwriter_settings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_harness_connectors: {
        Row: {
          club_id: string
          connector_type: string
          created_at: string
          credentials: Json
          display_name: string | null
          enabled: boolean
          id: string
          last_error: string | null
          last_fetched_at: string | null
          opportunity_id: string | null
          updated_at: string
        }
        Insert: {
          club_id: string
          connector_type: string
          created_at?: string
          credentials?: Json
          display_name?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          opportunity_id?: string | null
          updated_at?: string
        }
        Update: {
          club_id?: string
          connector_type?: string
          created_at?: string
          credentials?: Json
          display_name?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          opportunity_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_harness_connectors_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_harness_connectors_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      club_invite_codes: {
        Row: {
          club_id: string
          code: string
          cohort: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          role: string
          use_count: number
        }
        Insert: {
          club_id: string
          code: string
          cohort?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          role?: string
          use_count?: number
        }
        Update: {
          club_id?: string
          code?: string
          cohort?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          role?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_invite_codes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          cohort: string | null
          display_role: string | null
          ghost_metadata: Json
          ghost_name: string | null
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          club_id: string
          cohort?: string | null
          display_role?: string | null
          ghost_metadata?: Json
          ghost_name?: string | null
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          club_id?: string
          cohort?: string | null
          display_role?: string | null
          ghost_metadata?: Json
          ghost_name?: string | null
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_notification_channels: {
        Row: {
          channel_type: string
          club_id: string
          created_at: string
          created_by: string
          enabled: boolean
          event_types: string[]
          id: string
          label: string
          webhook_url: string
        }
        Insert: {
          channel_type: string
          club_id: string
          created_at?: string
          created_by: string
          enabled?: boolean
          event_types?: string[]
          id?: string
          label?: string
          webhook_url: string
        }
        Update: {
          channel_type?: string
          club_id?: string
          created_at?: string
          created_by?: string
          enabled?: boolean
          event_types?: string[]
          id?: string
          label?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_notification_channels_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_semester_cycles: {
        Row: {
          club_id: string
          cohort_number: string | null
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          semester_ref: string
          start_date: string
        }
        Insert: {
          club_id: string
          cohort_number?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          semester_ref: string
          start_date: string
        }
        Update: {
          club_id?: string
          cohort_number?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          semester_ref?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_semester_cycles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          operator_channel_id: string | null
          require_approval: boolean
          slug: string
          team_channel_visibility: string
          updated_at: string
          visibility: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          operator_channel_id?: string | null
          require_approval?: boolean
          slug: string
          team_channel_visibility?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          operator_channel_id?: string | null
          require_approval?: boolean
          slug?: string
          team_channel_visibility?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
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
      discord_bot_installations: {
        Row: {
          club_id: string
          discord_guild_id: string
          discord_guild_name: string | null
          id: string
          installed_at: string
          installed_by: string
        }
        Insert: {
          club_id: string
          discord_guild_id: string
          discord_guild_name?: string | null
          id?: string
          installed_at?: string
          installed_by: string
        }
        Update: {
          club_id?: string
          discord_guild_id?: string
          discord_guild_name?: string | null
          id?: string
          installed_at?: string
          installed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_bot_installations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_role_mappings: {
        Row: {
          club_id: string
          created_at: string
          discord_guild_id: string
          discord_role_id: string
          discord_role_name: string | null
          draft_value: string
          id: string
          mapping_type: string
        }
        Insert: {
          club_id: string
          created_at?: string
          discord_guild_id: string
          discord_role_id: string
          discord_role_name?: string | null
          draft_value: string
          id?: string
          mapping_type: string
        }
        Update: {
          club_id?: string
          created_at?: string
          discord_guild_id?: string
          discord_role_id?: string
          discord_role_name?: string | null
          draft_value?: string
          id?: string
          mapping_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_role_mappings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_team_channels: {
        Row: {
          channel_type: number
          club_id: string
          created_at: string
          created_by: string
          discord_category_id: string | null
          discord_channel_id: string
          discord_channel_name: string | null
          discord_role_id: string | null
          file_tracking_enabled: boolean
          id: string
          last_fetched_message_id: string | null
          opportunity_id: string | null
        }
        Insert: {
          channel_type?: number
          club_id: string
          created_at?: string
          created_by: string
          discord_category_id?: string | null
          discord_channel_id: string
          discord_channel_name?: string | null
          discord_role_id?: string | null
          file_tracking_enabled?: boolean
          id?: string
          last_fetched_message_id?: string | null
          opportunity_id?: string | null
        }
        Update: {
          channel_type?: number
          club_id?: string
          created_at?: string
          created_by?: string
          discord_category_id?: string | null
          discord_channel_id?: string
          discord_channel_name?: string | null
          discord_role_id?: string | null
          file_tracking_enabled?: boolean
          id?: string
          last_fetched_message_id?: string | null
          opportunity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discord_team_channels_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discord_team_channels_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
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
      file_logs: {
        Row: {
          ai_summary: string | null
          category: string | null
          club_id: string
          created_at: string
          discord_channel_id: string
          discord_message_id: string
          file_size: number | null
          file_type: string | null
          filename: string
          forum_post_tags: Json | null
          forum_post_title: string | null
          id: string
          parent_file_id: string | null
          responded_at: string | null
          response_status: string
          source_channel_type: number
          tags: Json | null
          thread_id: string | null
          uploader_discord_id: string
          uploader_name: string
          user_response: string | null
          version: number
        }
        Insert: {
          ai_summary?: string | null
          category?: string | null
          club_id: string
          created_at?: string
          discord_channel_id: string
          discord_message_id: string
          file_size?: number | null
          file_type?: string | null
          filename: string
          forum_post_tags?: Json | null
          forum_post_title?: string | null
          id?: string
          parent_file_id?: string | null
          responded_at?: string | null
          response_status?: string
          source_channel_type?: number
          tags?: Json | null
          thread_id?: string | null
          uploader_discord_id: string
          uploader_name: string
          user_response?: string | null
          version?: number
        }
        Update: {
          ai_summary?: string | null
          category?: string | null
          club_id?: string
          created_at?: string
          discord_channel_id?: string
          discord_message_id?: string
          file_size?: number | null
          file_type?: string | null
          filename?: string
          forum_post_tags?: Json | null
          forum_post_title?: string | null
          id?: string
          parent_file_id?: string | null
          responded_at?: string | null
          response_status?: string
          source_channel_type?: number
          tags?: Json | null
          thread_id?: string | null
          uploader_discord_id?: string
          uploader_name?: string
          user_response?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_logs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_logs_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "file_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      github_events: {
        Row: {
          ai_summary: string | null
          branch: string
          club_id: string
          commits: Json
          created_at: string
          delivery_id: string | null
          discord_message_id: string | null
          id: string
          project_id: string | null
          pusher_github_username: string
          pusher_member_id: string | null
          repo_name: string
        }
        Insert: {
          ai_summary?: string | null
          branch: string
          club_id: string
          commits?: Json
          created_at?: string
          delivery_id?: string | null
          discord_message_id?: string | null
          id?: string
          project_id?: string | null
          pusher_github_username: string
          pusher_member_id?: string | null
          repo_name: string
        }
        Update: {
          ai_summary?: string | null
          branch?: string
          club_id?: string
          commits?: Json
          created_at?: string
          delivery_id?: string | null
          discord_message_id?: string | null
          id?: string
          project_id?: string | null
          pusher_github_username?: string
          pusher_member_id?: string | null
          repo_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_events_pusher_member_id_fkey"
            columns: ["pusher_member_id"]
            isOneToOne: false
            referencedRelation: "club_members"
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
      member_activity_stats: {
        Row: {
          channels_active: number
          checkin_submitted: boolean
          club_id: string
          created_at: string
          discord_user_id: string
          discord_username: string | null
          id: string
          message_count: number
          updated_at: string
          week_number: number
          year: number
        }
        Insert: {
          channels_active?: number
          checkin_submitted?: boolean
          club_id: string
          created_at?: string
          discord_user_id: string
          discord_username?: string | null
          id?: string
          message_count?: number
          updated_at?: string
          week_number: number
          year?: number
        }
        Update: {
          channels_active?: number
          checkin_submitted?: boolean
          club_id?: string
          created_at?: string
          discord_user_id?: string
          discord_username?: string | null
          id?: string
          message_count?: number
          updated_at?: string
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_activity_stats_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_prompts_cooldown: {
        Row: {
          consecutive_skips: number
          last_shown_at: string | null
          next_available_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consecutive_skips?: number
          last_shown_at?: string | null
          next_available_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consecutive_skips?: number
          last_shown_at?: string | null
          next_available_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      micro_prompts_log: {
        Row: {
          action: string
          context: string | null
          created_at: string
          id: string
          question_id: string
          response: Json | null
          user_id: string
        }
        Insert: {
          action: string
          context?: string | null
          created_at?: string
          id?: string
          question_id: string
          response?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          context?: string | null
          created_at?: string
          id?: string
          question_id?: string
          response?: Json | null
          user_id?: string
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
          club_id: string | null
          cohort: string | null
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
          club_id?: string | null
          cohort?: string | null
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
          club_id?: string | null
          cohort?: string | null
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
            foreignKeyName: "opportunities_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
      pending_discord_setups: {
        Row: {
          claimed_at: string | null
          created_at: string
          discord_guild_id: string
          discord_guild_name: string | null
          discord_owner_id: string
          id: string
          selected_channels: Json | null
          selected_tone: string
          status: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          discord_guild_id: string
          discord_guild_name?: string | null
          discord_owner_id: string
          id?: string
          selected_channels?: Json | null
          selected_tone?: string
          status?: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          discord_guild_id?: string
          discord_guild_name?: string | null
          discord_owner_id?: string
          id?: string
          selected_channels?: Json | null
          selected_tone?: string
          status?: string
        }
        Relationships: []
      }
      persona_automations: {
        Row: {
          active: boolean
          auto_publish: boolean
          created_at: string
          created_by: string | null
          daily_count: number
          default_metadata: Json
          event_type: string
          frequency: string
          id: string
          last_run_at: string | null
          last_run_status: string | null
          next_run_at: string | null
          persona_id: string
          run_day_of_month: number | null
          run_hour: number
          run_minute: number
          run_weekday: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          auto_publish?: boolean
          created_at?: string
          created_by?: string | null
          daily_count?: number
          default_metadata?: Json
          event_type: string
          frequency: string
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          next_run_at?: string | null
          persona_id: string
          run_day_of_month?: number | null
          run_hour?: number
          run_minute?: number
          run_weekday?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          auto_publish?: boolean
          created_at?: string
          created_by?: string | null
          daily_count?: number
          default_metadata?: Json
          event_type?: string
          frequency?: string
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          next_run_at?: string | null
          persona_id?: string
          run_day_of_month?: number | null
          run_hour?: number
          run_minute?: number
          run_weekday?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_automations_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_channel_credentials: {
        Row: {
          account_ref: string
          active: boolean
          channel_type: string
          created_at: string
          encrypted_token: string | null
          expires_at: string | null
          id: string
          installed_by: string | null
          persona_id: string
          refresh_token_ref: string | null
          scope: string[]
          updated_at: string
        }
        Insert: {
          account_ref: string
          active?: boolean
          channel_type: string
          created_at?: string
          encrypted_token?: string | null
          expires_at?: string | null
          id?: string
          installed_by?: string | null
          persona_id: string
          refresh_token_ref?: string | null
          scope?: string[]
          updated_at?: string
        }
        Update: {
          account_ref?: string
          active?: boolean
          channel_type?: string
          created_at?: string
          encrypted_token?: string | null
          expires_at?: string | null
          id?: string
          installed_by?: string | null
          persona_id?: string
          refresh_token_ref?: string | null
          scope?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_channel_credentials_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_corpus_sources: {
        Row: {
          active: boolean
          created_at: string
          id: string
          last_synced_at: string | null
          persona_id: string
          role_weight_rules: Json
          source_ref: string
          source_type: string
          weight: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          last_synced_at?: string | null
          persona_id: string
          role_weight_rules?: Json
          source_ref: string
          source_type: string
          weight?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          last_synced_at?: string | null
          persona_id?: string
          role_weight_rules?: Json
          source_ref?: string
          source_type?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "persona_corpus_sources_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_fields: {
        Row: {
          confidence: number
          field_key: string
          id: string
          locked: boolean
          merge_strategy: string
          persona_id: string
          source: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          confidence?: number
          field_key: string
          id?: string
          locked?: boolean
          merge_strategy?: string
          persona_id: string
          source?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          confidence?: number
          field_key?: string
          id?: string
          locked?: boolean
          merge_strategy?: string
          persona_id?: string
          source?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "persona_fields_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_idea_cards: {
        Row: {
          bundle_id: string | null
          created_at: string
          created_by: string | null
          description: string
          event_type_hint: string
          id: string
          persona_id: string
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          event_type_hint?: string
          id?: string
          persona_id: string
          source: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bundle_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          event_type_hint?: string
          id?: string
          persona_id?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_idea_cards_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "persona_output_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_idea_cards_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_output_bundles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          event_metadata: Json
          event_type: string
          id: string
          persona_id: string
          published_at: string | null
          rejected_reason: string | null
          semester_ref: string | null
          status: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          event_metadata?: Json
          event_type: string
          id?: string
          persona_id: string
          published_at?: string | null
          rejected_reason?: string | null
          semester_ref?: string | null
          status?: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          event_metadata?: Json
          event_type?: string
          id?: string
          persona_id?: string
          published_at?: string | null
          rejected_reason?: string | null
          semester_ref?: string | null
          status?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_output_bundles_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_outputs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bundle_id: string | null
          channel_format: string | null
          created_at: string
          destination: string | null
          external_ref: string | null
          format_constraints: Json | null
          generated_content: string
          id: string
          input_context: Json
          is_copy_only: boolean
          output_type: string
          persona_id: string
          prompt_template_id: string | null
          published_at: string | null
          rejected_reason: string | null
          scheduled_at: string | null
          scheduled_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bundle_id?: string | null
          channel_format?: string | null
          created_at?: string
          destination?: string | null
          external_ref?: string | null
          format_constraints?: Json | null
          generated_content: string
          id?: string
          input_context?: Json
          is_copy_only?: boolean
          output_type: string
          persona_id: string
          prompt_template_id?: string | null
          published_at?: string | null
          rejected_reason?: string | null
          scheduled_at?: string | null
          scheduled_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bundle_id?: string | null
          channel_format?: string | null
          created_at?: string
          destination?: string | null
          external_ref?: string | null
          format_constraints?: Json | null
          generated_content?: string
          id?: string
          input_context?: Json
          is_copy_only?: boolean
          output_type?: string
          persona_id?: string
          prompt_template_id?: string | null
          published_at?: string | null
          rejected_reason?: string | null
          scheduled_at?: string | null
          scheduled_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_outputs_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "persona_output_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_outputs_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          fields_snapshot: Json
          id: string
          name: string
          owner_id: string
          source_persona_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields_snapshot?: Json
          id?: string
          name: string
          owner_id: string
          source_persona_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fields_snapshot?: Json
          id?: string
          name?: string
          owner_id?: string
          source_persona_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_templates_source_persona_id_fkey"
            columns: ["source_persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_training_runs: {
        Row: {
          completed_at: string | null
          corpus_snapshot_hash: string | null
          error_message: string | null
          extracted_diff: Json
          id: string
          model_version: string | null
          persona_id: string
          started_at: string
          status: string
          trigger: string
        }
        Insert: {
          completed_at?: string | null
          corpus_snapshot_hash?: string | null
          error_message?: string | null
          extracted_diff?: Json
          id?: string
          model_version?: string | null
          persona_id: string
          started_at?: string
          status?: string
          trigger: string
        }
        Update: {
          completed_at?: string | null
          corpus_snapshot_hash?: string | null
          error_message?: string | null
          extracted_diff?: Json
          id?: string
          model_version?: string | null
          persona_id?: string
          started_at?: string
          status?: string
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_training_runs_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_id: string
          owner_last_edited_at: string | null
          parent_persona_id: string | null
          status: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_id: string
          owner_last_edited_at?: string | null
          parent_persona_id?: string | null
          status?: string
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_id?: string
          owner_last_edited_at?: string | null
          parent_persona_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "personas_parent_persona_id_fkey"
            columns: ["parent_persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
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
          department: string | null
          desired_position: string | null
          discord_user_id: string | null
          discord_username: string | null
          entrance_year: number | null
          extracted_profile: Json | null
          extraction_confidence: number | null
          github_url: string | null
          github_username: string | null
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
          locations: string[] | null
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
          student_id: string | null
          student_verification_method: string | null
          student_verified_at: string | null
          university: string | null
          university_id: string | null
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
          department?: string | null
          desired_position?: string | null
          discord_user_id?: string | null
          discord_username?: string | null
          entrance_year?: number | null
          extracted_profile?: Json | null
          extraction_confidence?: number | null
          github_url?: string | null
          github_username?: string | null
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
          locations?: string[] | null
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
          student_id?: string | null
          student_verification_method?: string | null
          student_verified_at?: string | null
          university?: string | null
          university_id?: string | null
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
          department?: string | null
          desired_position?: string | null
          discord_user_id?: string | null
          discord_username?: string | null
          entrance_year?: number | null
          extracted_profile?: Json | null
          extraction_confidence?: number | null
          github_url?: string | null
          github_username?: string | null
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
          locations?: string[] | null
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
          student_id?: string | null
          student_verification_method?: string | null
          student_verified_at?: string | null
          university?: string | null
          university_id?: string | null
          updated_at?: string | null
          user_id?: string
          vision_embedding?: string | null
          vision_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
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
      team_decisions: {
        Row: {
          club_id: string
          decided_at: string
          discord_channel_id: string | null
          id: string
          opportunity_id: string | null
          options: Json | null
          result: string
          source_intervention_id: string | null
          topic: string
          vote_message_id: string | null
        }
        Insert: {
          club_id: string
          decided_at?: string
          discord_channel_id?: string | null
          id?: string
          opportunity_id?: string | null
          options?: Json | null
          result: string
          source_intervention_id?: string | null
          topic: string
          vote_message_id?: string | null
        }
        Update: {
          club_id?: string
          decided_at?: string
          discord_channel_id?: string | null
          id?: string
          opportunity_id?: string | null
          options?: Json | null
          result?: string
          source_intervention_id?: string | null
          topic?: string
          vote_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_decisions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_decisions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_decisions_source_intervention_id_fkey"
            columns: ["source_intervention_id"]
            isOneToOne: false
            referencedRelation: "bot_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_resources: {
        Row: {
          club_id: string
          created_at: string
          discord_channel_id: string | null
          id: string
          label: string
          opportunity_id: string | null
          resource_type: string | null
          shared_by_name: string
          shared_by_user_id: string | null
          source_intervention_id: string | null
          url: string
        }
        Insert: {
          club_id: string
          created_at?: string
          discord_channel_id?: string | null
          id?: string
          label: string
          opportunity_id?: string | null
          resource_type?: string | null
          shared_by_name: string
          shared_by_user_id?: string | null
          source_intervention_id?: string | null
          url: string
        }
        Update: {
          club_id?: string
          created_at?: string
          discord_channel_id?: string | null
          id?: string
          label?: string
          opportunity_id?: string | null
          resource_type?: string | null
          shared_by_name?: string
          shared_by_user_id?: string | null
          source_intervention_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_resources_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_resources_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_resources_source_intervention_id_fkey"
            columns: ["source_intervention_id"]
            isOneToOne: false
            referencedRelation: "bot_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_tasks: {
        Row: {
          assignee_name: string
          assignee_user_id: string | null
          club_id: string
          completed_at: string | null
          created_at: string
          deadline: string | null
          discord_channel_id: string | null
          id: string
          opportunity_id: string | null
          source_intervention_id: string | null
          status: string
          task_description: string
        }
        Insert: {
          assignee_name: string
          assignee_user_id?: string | null
          club_id: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          discord_channel_id?: string | null
          id?: string
          opportunity_id?: string | null
          source_intervention_id?: string | null
          status?: string
          task_description: string
        }
        Update: {
          assignee_name?: string
          assignee_user_id?: string | null
          club_id?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          discord_channel_id?: string | null
          id?: string
          opportunity_id?: string | null
          source_intervention_id?: string | null
          status?: string
          task_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_tasks_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_tasks_source_intervention_id_fkey"
            columns: ["source_intervention_id"]
            isOneToOne: false
            referencedRelation: "bot_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string
          email_domains: string[]
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          email_domains?: string[]
          id?: string
          logo_url?: string | null
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          email_domains?: string[]
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string | null
        }
        Relationships: []
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
      weekly_update_drafts: {
        Row: {
          content: string
          created_at: string
          feedback_note: string | null
          feedback_score: number | null
          id: string
          opportunity_id: string
          published_update_id: string | null
          reviewed_at: string | null
          source_message_count: number
          status: string
          target_user_id: string
          title: string
          update_type: string
          week_number: number
        }
        Insert: {
          content: string
          created_at?: string
          feedback_note?: string | null
          feedback_score?: number | null
          id?: string
          opportunity_id: string
          published_update_id?: string | null
          reviewed_at?: string | null
          source_message_count?: number
          status?: string
          target_user_id: string
          title: string
          update_type?: string
          week_number: number
        }
        Update: {
          content?: string
          created_at?: string
          feedback_note?: string | null
          feedback_score?: number | null
          id?: string
          opportunity_id?: string
          published_update_id?: string | null
          reviewed_at?: string | null
          source_message_count?: number
          status?: string
          target_user_id?: string
          title?: string
          update_type?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_update_drafts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_update_drafts_published_update_id_fkey"
            columns: ["published_update_id"]
            isOneToOne: false
            referencedRelation: "project_updates"
            referencedColumns: ["id"]
          },
        ]
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
              user_locations: string[]
            }
            Returns: number
          }
      calculate_tag_score: {
        Args: { event_tags: string[]; user_tags: string[] }
        Returns: number
      }
      can_create_persona: {
        Args: { p_owner_id: string; p_type: string; p_user_id: string }
        Returns: boolean
      }
      can_edit_persona: {
        Args: { p_persona_id: string; p_user_id: string }
        Returns: boolean
      }
      can_edit_persona_owner: {
        Args: { p_owner_id: string; p_type: string; p_user_id: string }
        Returns: boolean
      }
      can_view_persona: {
        Args: { p_persona_id: string; p_user_id: string }
        Returns: boolean
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
      is_club_admin: {
        Args: { p_club_id: string; p_user_id: string }
        Returns: boolean
      }
      is_club_member: {
        Args: { p_club_id: string; p_user_id: string }
        Returns: boolean
      }
      is_club_owner: {
        Args: { p_club_id: string; p_user_id: string }
        Returns: boolean
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
      match_profiles_for_opportunity: {
        Args: {
          exclude_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          desired_position: string
          id: string
          interest_tags: string[]
          locations: string[]
          nickname: string
          similarity: number
          skills: Json
          user_id: string
          vision_summary: string
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
          locations: string[]
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
      preview_invite_code: { Args: { p_code: string }; Returns: Json }
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
      recommend_events_with_embedding: {
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
      redeem_invite_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
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
