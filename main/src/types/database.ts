export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          read_at: string | null
          deleted_by_sender: boolean
          deleted_by_receiver: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          read_at?: string | null
          deleted_by_sender?: boolean
          deleted_by_receiver?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
          read_at?: string | null
          deleted_by_sender?: boolean
          deleted_by_receiver?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'free' | 'pro' | 'team'
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          billing_cycle: 'monthly' | 'yearly' | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean | null
          payment_provider: string | null
          external_subscription_id: string | null
          external_customer_id: string | null
          billing_key: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_type?: 'free' | 'pro' | 'team'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          billing_cycle?: 'monthly' | 'yearly' | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          payment_provider?: string | null
          external_subscription_id?: string | null
          external_customer_id?: string | null
          billing_key?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'free' | 'pro' | 'team'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          billing_cycle?: 'monthly' | 'yearly' | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          payment_provider?: string | null
          external_subscription_id?: string | null
          external_customer_id?: string | null
          billing_key?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          id: string
          user_id: string
          period_start: string
          period_end: string
          applications_used: number
          opportunities_created: number
          boosts_purchased: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          period_start: string
          period_end: string
          applications_used?: number
          opportunities_created?: number
          boosts_purchased?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          period_start?: string
          period_end?: string
          applications_used?: number
          opportunities_created?: number
          boosts_purchased?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      boosts: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string | null
          boost_type: 'opportunity_boost' | 'opportunity_premium' | 'profile_spotlight' | 'weekly_feature'
          status: 'active' | 'expired' | 'canceled'
          starts_at: string | null
          expires_at: string
          amount_paid: number
          payment_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          opportunity_id?: string | null
          boost_type: 'opportunity_boost' | 'opportunity_premium' | 'profile_spotlight' | 'weekly_feature'
          status?: 'active' | 'expired' | 'canceled'
          starts_at?: string | null
          expires_at: string
          amount_paid: number
          payment_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          opportunity_id?: string | null
          boost_type?: 'opportunity_boost' | 'opportunity_premium' | 'profile_spotlight' | 'weekly_feature'
          status?: 'active' | 'expired' | 'canceled'
          starts_at?: string | null
          expires_at?: string
          amount_paid?: number
          payment_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boosts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_history: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          boost_id: string | null
          payment_type: 'subscription' | 'boost' | 'one_time'
          amount: number
          currency: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded' | 'canceled'
          payment_provider: string | null
          external_payment_id: string | null
          payment_key: string | null
          order_id: string | null
          receipt_url: string | null
          failure_reason: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          boost_id?: string | null
          payment_type: 'subscription' | 'boost' | 'one_time'
          amount: number
          currency?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'canceled'
          payment_provider?: string | null
          external_payment_id?: string | null
          payment_key?: string | null
          order_id?: string | null
          receipt_url?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          boost_id?: string | null
          payment_type?: 'subscription' | 'boost' | 'one_time'
          amount?: number
          currency?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'canceled'
          payment_provider?: string | null
          external_payment_id?: string | null
          payment_key?: string | null
          order_id?: string | null
          receipt_url?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_boost_id_fkey"
            columns: ["boost_id"]
            isOneToOne: false
            referencedRelation: "boosts"
            referencedColumns: ["id"]
          }
        ]
      }
      accepted_connections: {
        Row: {
          applicant_id: string
          application_id: string
          assigned_role: string | null
          connected_at: string | null
          id: string
          notes: string | null
          opportunity_creator_id: string
          opportunity_id: string | null
          status: string | null
        }
        Insert: {
          applicant_id: string
          application_id: string
          assigned_role?: string | null
          connected_at?: string | null
          id?: string
          notes?: string | null
          opportunity_creator_id: string
          opportunity_id?: string | null
          status?: string | null
        }
        Update: {
          applicant_id?: string
          application_id?: string
          assigned_role?: string | null
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
      onboarding_status: {
        Row: {
          ai_chat_completed: boolean | null
          completed_at: string | null
          step_1_completed: boolean | null
          step_2_completed: boolean | null
          step_3_completed: boolean | null
          step_4_completed: boolean | null
          step_5_completed: boolean | null
          user_id: string
        }
        Insert: {
          ai_chat_completed?: boolean | null
          completed_at?: string | null
          step_1_completed?: boolean | null
          step_2_completed?: boolean | null
          step_3_completed?: boolean | null
          step_4_completed?: boolean | null
          step_5_completed?: boolean | null
          user_id: string
        }
        Update: {
          ai_chat_completed?: boolean | null
          completed_at?: string | null
          step_1_completed?: boolean | null
          step_2_completed?: boolean | null
          step_3_completed?: boolean | null
          step_4_completed?: boolean | null
          step_5_completed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          applications_count: number | null
          compensation_details: string | null
          compensation_type: string | null
          created_at: string | null
          creator_id: string
          deadline: string | null
          demo_images: string[] | null
          description: string
          id: string
          interest_count: number | null
          interest_tags: string[] | null
          is_boosted: boolean | null
          location: string | null
          location_type: string | null
          needed_roles: string[] | null
          needed_skills: Json | null
          pain_point: string | null
          project_links: Json | null
          project_stage: string | null
          show_updates: boolean | null
          source_event_id: string | null
          status: string | null
          team_size: number | null
          time_commitment: string | null
          title: string
          type: string
          updated_at: string | null
          views_count: number | null
          vision_embedding: string | null
        }
        Insert: {
          applications_count?: number | null
          compensation_details?: string | null
          compensation_type?: string | null
          created_at?: string | null
          creator_id: string
          deadline?: string | null
          demo_images?: string[] | null
          description: string
          id?: string
          interest_count?: number | null
          interest_tags?: string[] | null
          is_boosted?: boolean | null
          location?: string | null
          location_type?: string | null
          needed_roles?: string[] | null
          needed_skills?: Json | null
          pain_point?: string | null
          project_links?: Json | null
          project_stage?: string | null
          show_updates?: boolean | null
          source_event_id?: string | null
          status?: string | null
          team_size?: number | null
          time_commitment?: string | null
          title: string
          type: string
          updated_at?: string | null
          views_count?: number | null
          vision_embedding?: string | null
        }
        Update: {
          applications_count?: number | null
          compensation_details?: string | null
          compensation_type?: string | null
          created_at?: string | null
          creator_id?: string
          deadline?: string | null
          demo_images?: string[] | null
          description?: string
          id?: string
          interest_count?: number | null
          interest_tags?: string[] | null
          is_boosted?: boolean | null
          location?: string | null
          location_type?: string | null
          needed_roles?: string[] | null
          needed_skills?: Json | null
          pain_point?: string | null
          project_links?: Json | null
          project_stage?: string | null
          show_updates?: boolean | null
          source_event_id?: string | null
          status?: string | null
          team_size?: number | null
          time_commitment?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          views_count?: number | null
          vision_embedding?: string | null
        }
        Relationships: []
      }
      profile_interests: {
        Row: {
          id: string
          user_id: string
          target_profile_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          target_profile_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          target_profile_id?: string
          created_at?: string | null
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
          data_consent: boolean | null
          affiliation_type: string | null
          extracted_profile: Json | null
          portfolio_url: string | null
          linkedin_url: string | null
          github_url: string | null
          current_situation: string | null
          desired_position: string | null
          graduation_year: number | null
          id: string
          interest_tags: string[] | null
          invite_code_used: string | null
          is_premium: boolean | null
          is_uni_verified: boolean | null
          location: string | null
          major: string | null
          nickname: string
          onboarding_completed: boolean | null
          personality: Json | null
          premium_activated_at: string | null
          profile_analysis: Json | null
          profile_analysis_at: string | null
          interest_count: number | null
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
          age_range?: string | null
          ai_chat_completed?: boolean | null
          ai_chat_transcript?: Json | null
          affiliation_type?: string | null
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          contact_email?: string | null
          contact_kakao?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          data_consent?: boolean | null
          current_situation?: string | null
          extracted_profile?: Json | null
          portfolio_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          desired_position?: string | null
          graduation_year?: number | null
          id?: string
          interest_tags?: string[] | null
          invite_code_used?: string | null
          is_premium?: boolean | null
          is_uni_verified?: boolean | null
          location?: string | null
          major?: string | null
          nickname: string
          onboarding_completed?: boolean | null
          personality?: Json | null
          premium_activated_at?: string | null
          profile_analysis?: Json | null
          profile_analysis_at?: string | null
          profile_visibility?: string | null
          skills?: Json | null
          university?: string | null
          updated_at?: string | null
          user_id: string
          vision_embedding?: string | null
          vision_summary?: string | null
        }
        Update: {
          age_range?: string | null
          ai_chat_completed?: boolean | null
          ai_chat_transcript?: Json | null
          affiliation_type?: string | null
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          contact_email?: string | null
          contact_kakao?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          data_consent?: boolean | null
          current_situation?: string | null
          extracted_profile?: Json | null
          portfolio_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          desired_position?: string | null
          graduation_year?: number | null
          id?: string
          interest_tags?: string[] | null
          invite_code_used?: string | null
          is_premium?: boolean | null
          is_uni_verified?: boolean | null
          location?: string | null
          major?: string | null
          nickname?: string
          onboarding_completed?: boolean | null
          personality?: Json | null
          premium_activated_at?: string | null
          profile_analysis?: Json | null
          profile_analysis_at?: string | null
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
      portfolio_items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          image_url: string | null
          link_url: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          image_url?: string | null
          link_url?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          image_url?: string | null
          link_url?: string | null
          display_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          id: string
          code: string
          created_by: string | null
          recipient_email: string | null
          used_by: string | null
          used_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          code: string
          created_by?: string | null
          recipient_email?: string | null
          used_by?: string | null
          used_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          created_by?: string | null
          recipient_email?: string | null
          used_by?: string | null
          used_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string | null
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
          organizer: string
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
          organizer: string
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
          organizer?: string
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
      waitlist_signups: {
        Row: {
          id: string
          email: string
          current_situation: 'solo_want_team' | 'has_project_need_member' | 'want_to_join' | 'just_curious' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          current_situation?: 'solo_want_team' | 'has_project_need_member' | 'want_to_join' | 'just_curious' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          current_situation?: 'solo_want_team' | 'has_project_need_member' | 'want_to_join' | 'just_curious' | null
          created_at?: string | null
        }
        Relationships: []
      }
      payment_failures: {
        Row: {
          id: string
          user_id: string
          subscription_id: string
          status: 'initial_failure' | 'retry_failed' | 'final_warning' | 'downgraded'
          failure_count: number
          first_failure_at: string
          last_failure_at: string
          grace_period_ends_at: string
          downgrade_at: string | null
          resolved_at: string | null
          notifications_sent: string[]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id: string
          status?: 'initial_failure' | 'retry_failed' | 'final_warning' | 'downgraded'
          failure_count?: number
          first_failure_at: string
          last_failure_at: string
          grace_period_ends_at: string
          downgrade_at?: string | null
          resolved_at?: string | null
          notifications_sent?: string[]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string
          status?: 'initial_failure' | 'retry_failed' | 'final_warning' | 'downgraded'
          failure_count?: number
          first_failure_at?: string
          last_failure_at?: string
          grace_period_ends_at?: string
          downgrade_at?: string | null
          resolved_at?: string | null
          notifications_sent?: string[]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_failures_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          priority: string
          data: Json | null
          read: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          priority?: string
          data?: Json | null
          read?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          priority?: string
          data?: Json | null
          read?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      business_plans: {
        Row: {
          id: string
          user_id: string
          template_type: 'yebi-chogi' | 'student-300' | 'saengae-chungnyeon' | 'oneul-jeongtong' | 'gyeonggi-g-star'
          status: 'draft' | 'in_progress' | 'completed'
          title: string | null
          basic_info: Json | null
          problem_data: Json | null
          solution_data: Json | null
          scaleup_data: Json | null
          team_data: Json | null
          extra_sections: Json | null
          validation_score: number | null
          validated_idea_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          template_type: 'yebi-chogi' | 'student-300' | 'saengae-chungnyeon' | 'oneul-jeongtong' | 'gyeonggi-g-star'
          status?: 'draft' | 'in_progress' | 'completed'
          title?: string | null
          basic_info?: Json | null
          problem_data?: Json | null
          solution_data?: Json | null
          scaleup_data?: Json | null
          team_data?: Json | null
          extra_sections?: Json | null
          validation_score?: number | null
          validated_idea_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          template_type?: 'yebi-chogi' | 'student-300' | 'saengae-chungnyeon' | 'oneul-jeongtong' | 'gyeonggi-g-star'
          status?: 'draft' | 'in_progress' | 'completed'
          title?: string | null
          basic_info?: Json | null
          problem_data?: Json | null
          solution_data?: Json | null
          scaleup_data?: Json | null
          team_data?: Json | null
          extra_sections?: Json | null
          validation_score?: number | null
          validated_idea_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      validated_ideas: {
        Row: {
          id: string
          user_id: string
          project_idea: string
          conversation_history: string | null
          reflected_advice: string[]
          artifacts: Json | null
          score: number | null
          persona_scores: Json | null
          action_plan: Json | null
          validation_level: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_idea: string
          conversation_history?: string | null
          reflected_advice?: string[]
          artifacts?: Json | null
          score?: number | null
          persona_scores?: Json | null
          action_plan?: Json | null
          validation_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_idea?: string
          conversation_history?: string | null
          reflected_advice?: string[]
          artifacts?: Json | null
          score?: number | null
          persona_scores?: Json | null
          action_plan?: Json | null
          validation_level?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      // ---- Manually added: startup_ideas & korea_startup_references ----
      // Note: If regenerating via `npx supabase gen types typescript`, these will be overwritten.
      startup_ideas: {
        Row: {
          id: string
          external_id: string
          source: string
          source_url: string
          name: string
          tagline: string | null
          description: string | null
          category: string[]
          logo_url: string | null
          website_url: string | null
          funding_stage: string | null
          total_funding: number | null
          investors: string[]
          upvotes: number
          comments_count: number
          korea_fit_score: number | null
          korea_fit_analysis: Json | null
          similar_korea_startups: string[]
          interest_tags: string[]
          tier: number
          priority_score: number
          status: string
          raw_data: Json | null
          korea_deep_analysis: Json | null
          final_score: number | null
          collected_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          external_id: string
          source: string
          source_url: string
          name: string
          tagline?: string | null
          description?: string | null
          category?: string[]
          logo_url?: string | null
          website_url?: string | null
          funding_stage?: string | null
          total_funding?: number | null
          investors?: string[]
          upvotes?: number
          comments_count?: number
          korea_fit_score?: number | null
          korea_fit_analysis?: Json | null
          similar_korea_startups?: string[]
          interest_tags?: string[]
          tier?: number
          priority_score?: number
          status?: string
          raw_data?: Json | null
          korea_deep_analysis?: Json | null
          final_score?: number | null
          collected_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          external_id?: string
          source?: string
          source_url?: string
          name?: string
          tagline?: string | null
          description?: string | null
          category?: string[]
          logo_url?: string | null
          website_url?: string | null
          funding_stage?: string | null
          total_funding?: number | null
          investors?: string[]
          upvotes?: number
          comments_count?: number
          korea_fit_score?: number | null
          korea_fit_analysis?: Json | null
          similar_korea_startups?: string[]
          interest_tags?: string[]
          tier?: number
          priority_score?: number
          status?: string
          raw_data?: Json | null
          korea_deep_analysis?: Json | null
          final_score?: number | null
          collected_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      korea_startup_references: {
        Row: {
          id: string
          external_id: string | null
          source: string
          name: string
          description: string | null
          category: string[]
          website_url: string | null
          raw_data: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          external_id?: string | null
          source: string
          name: string
          description?: string | null
          category?: string[]
          website_url?: string | null
          raw_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          external_id?: string | null
          source?: string
          name?: string
          description?: string | null
          category?: string[]
          website_url?: string | null
          raw_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      // ---- Manually added: comments, helpful_votes, comment_reports, interests, coffee_chats, session_analytics ----
      comments: {
        Row: {
          id: string
          opportunity_id: string
          user_id: string | null
          nickname: string
          school: string | null
          content: string
          helpful_count: number | null
          report_count: number | null
          is_hidden: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          user_id?: string | null
          nickname: string
          school?: string | null
          content: string
          helpful_count?: number | null
          report_count?: number | null
          is_hidden?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          user_id?: string | null
          nickname?: string
          school?: string | null
          content?: string
          helpful_count?: number | null
          report_count?: number | null
          is_hidden?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      helpful_votes: {
        Row: {
          id: string
          comment_id: string
          voter_identifier: string
          created_at: string | null
        }
        Insert: {
          id?: string
          comment_id: string
          voter_identifier: string
          created_at?: string | null
        }
        Update: {
          id?: string
          comment_id?: string
          voter_identifier?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "helpful_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      comment_reports: {
        Row: {
          id: string
          comment_id: string
          reporter_identifier: string
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          comment_id: string
          reporter_identifier: string
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          comment_id?: string
          reporter_identifier?: string
          reason?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      interests: {
        Row: {
          id: string
          opportunity_id: string
          user_email: string
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          user_email: string
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          user_email?: string
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interests_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      coffee_chats: {
        Row: {
          id: string
          opportunity_id: string
          requester_email: string
          requester_user_id: string | null
          requester_name: string | null
          owner_user_id: string
          target_user_id: string | null
          status: 'pending' | 'accepted' | 'declined'
          outcome: string | null
          contact_info: string | null
          message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          requester_email: string
          requester_user_id?: string | null
          requester_name?: string | null
          owner_user_id: string
          target_user_id?: string | null
          status?: 'pending' | 'accepted' | 'declined'
          outcome?: string | null
          contact_info?: string | null
          message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          requester_email?: string
          requester_user_id?: string | null
          requester_name?: string | null
          owner_user_id?: string
          target_user_id?: string | null
          status?: 'pending' | 'accepted' | 'declined'
          outcome?: string | null
          contact_info?: string | null
          message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coffee_chats_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      session_analytics: {
        Row: {
          id: string
          session_hash: string
          validation_level: string | null
          total_turns: number | null
          completed: boolean | null
          dropped_at_turn: number | null
          idea_category: string[] | null
          idea_word_count: number | null
          score_history: Json | null
          final_score: Json | null
          advice_shown: number | null
          advice_reflected: number | null
          reflected_categories: string[] | null
          persona_engagement: Json | null
          from_startup_idea: boolean | null
          startup_source: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_hash: string
          validation_level?: string | null
          total_turns?: number | null
          completed?: boolean | null
          dropped_at_turn?: number | null
          idea_category?: string[] | null
          idea_word_count?: number | null
          score_history?: Json | null
          final_score?: Json | null
          advice_shown?: number | null
          advice_reflected?: number | null
          reflected_categories?: string[] | null
          persona_engagement?: Json | null
          from_startup_idea?: boolean | null
          startup_source?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_hash?: string
          validation_level?: string | null
          total_turns?: number | null
          completed?: boolean | null
          dropped_at_turn?: number | null
          idea_category?: string[] | null
          idea_word_count?: number | null
          score_history?: Json | null
          final_score?: Json | null
          advice_shown?: number | null
          advice_reflected?: number | null
          reflected_categories?: string[] | null
          persona_engagement?: Json | null
          from_startup_idea?: boolean | null
          startup_source?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          id: string
          created_at: string | null
          level: string
          source: string
          error_code: string | null
          message: string
          stack_trace: string | null
          endpoint: string | null
          method: string | null
          user_id: string | null
          request_body: Json | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          level: string
          source: string
          error_code?: string | null
          message: string
          stack_trace?: string | null
          endpoint?: string | null
          method?: string | null
          user_id?: string | null
          request_body?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          level?: string
          source?: string
          error_code?: string | null
          message?: string
          stack_trace?: string | null
          endpoint?: string | null
          method?: string | null
          user_id?: string | null
          request_body?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      project_invitations: {
        Row: {
          id: string
          opportunity_id: string
          inviter_user_id: string
          invited_user_id: string
          role: string
          message: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          inviter_user_id: string
          invited_user_id: string
          role: string
          message?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          inviter_user_id?: string
          invited_user_id?: string
          role?: string
          message?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      event_applications: {
        Row: {
          id: string
          user_id: string
          event_id: string
          status: string
          status_updated_at: string | null
          applied_at: string | null
          applied_url: string | null
          result_notes: string | null
          personal_notes: string | null
          preparation_checklist: Json | null
          reminder_date: string | null
          reminder_sent: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          status?: string
          status_updated_at?: string | null
          applied_at?: string | null
          applied_url?: string | null
          result_notes?: string | null
          personal_notes?: string | null
          preparation_checklist?: Json | null
          reminder_date?: string | null
          reminder_sent?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          status?: string
          status_updated_at?: string | null
          applied_at?: string | null
          applied_url?: string | null
          result_notes?: string | null
          personal_notes?: string | null
          preparation_checklist?: Json | null
          reminder_date?: string | null
          reminder_sent?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "startup_events"
            referencedColumns: ["id"]
          }
        ]
      }
      event_application_history: {
        Row: {
          id: string
          application_id: string
          previous_status: string | null
          new_status: string
          changed_at: string | null
        }
        Insert: {
          id?: string
          application_id: string
          previous_status?: string | null
          new_status: string
          changed_at?: string | null
        }
        Update: {
          id?: string
          application_id?: string
          previous_status?: string | null
          new_status?: string
          changed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_application_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "event_applications"
            referencedColumns: ["id"]
          }
        ]
      }
      event_opportunity_links: {
        Row: {
          id: string
          event_id: string
          opportunity_id: string
          created_by: string
          link_type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          opportunity_id: string
          created_by: string
          link_type?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          opportunity_id?: string
          created_by?: string
          link_type?: string
          created_at?: string | null
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
          }
        ]
      }
      team_checklists: {
        Row: {
          id: string
          opportunity_id: string
          title: string
          description: string | null
          is_completed: boolean
          sort_order: number
          assigned_to: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          title: string
          description?: string | null
          is_completed?: boolean
          sort_order?: number
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          title?: string
          description?: string | null
          is_completed?: boolean
          sort_order?: number
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_checklists_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      team_announcements: {
        Row: {
          id: string
          opportunity_id: string
          author_id: string
          title: string
          content: string
          is_pinned: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          author_id: string
          title: string
          content: string
          is_pinned?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          author_id?: string
          title?: string
          content?: string
          is_pinned?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_announcements_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      project_updates: {
        Row: {
          id: string
          opportunity_id: string
          author_id: string
          week_number: number
          title: string
          content: string
          update_type: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          opportunity_id: string
          author_id: string
          week_number: number
          title: string
          content: string
          update_type?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          opportunity_id?: string
          author_id?: string
          week_number?: number
          title?: string
          content?: string
          update_type?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          }
        ]
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          category: string
          title: string
          description: string
          page_url: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          title: string
          description: string
          page_url?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          title?: string
          description?: string
          page_url?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_current_usage: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          user_id: string
          period_start: string
          period_end: string
          applications_used: number
          opportunities_created: number
          boosts_purchased: number
          created_at: string
          updated_at: string
        }
      }
      increment_usage: {
        Args: { p_user_id: string; p_type: string }
        Returns: {
          id: string
          user_id: string
          period_start: string
          period_end: string
          applications_used: number
          opportunities_created: number
          boosts_purchased: number
          created_at: string
          updated_at: string
        }
      }
      get_user_subscription: {
        Args: { p_user_id: string }
        Returns: {
          plan_type: string
          status: string
          billing_cycle: string | null
          current_period_end: string | null
        }[]
      }
      expire_boosts: {
        Args: Record<string, never>
        Returns: number
      }
      get_boosted_opportunities: {
        Args: Record<string, never>
        Returns: {
          opportunity_id: string
          boost_type: string
          expires_at: string
        }[]
      }
      calculate_context_boost: {
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
      generate_deadline_notifications: { Args: never; Returns: number }
      get_unread_notification_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      match_opportunities: {
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
          location: string
          nickname: string
          similarity: number
          skills: Json
          user_id: string
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
          event_id: string
          event_type: string
          interest_tags: string[]
          organizer: string
          registration_end_date: string
          registration_url: string
          tag_score: number
          title: string
          total_score: number
        }[]
      }
      recommend_events_with_embedding: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          context_boost: number
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
          total_score: number
          vector_score: number
        }[]
      }
      get_waitlist_count: {
        Args: Record<string, never>
        Returns: number
      }
      // ---- Manually added: startup_ideas RPC functions ----
      calculate_final_score: {
        Args: {
          p_korea_fit_score: number
          p_upvotes: number
          p_korea_exists: boolean
          p_difficulty: string
        }
        Returns: number
      }
      update_startup_final_scores: {
        Args: Record<string, never>
        Returns: { updated_count: number }[]
      }
      get_top_startup_ideas: {
        Args: {
          p_limit?: number
          p_sort?: string
        }
        Returns: {
          id: string
          name: string
          tagline: string | null
          description: string | null
          category: string[]
          logo_url: string | null
          website_url: string | null
          source: string
          source_url: string
          upvotes: number
          korea_fit_score: number | null
          final_score: number | null
          korea_deep_analysis: Json | null
        }[]
      }
      calculate_startup_priority: {
        Args: {
          p_upvotes: number
          p_total_funding: number
          p_korea_fit_score: number
          p_tier: number
        }
        Returns: number
      }
      // ---- Manually added: community & analytics RPC functions ----
      vote_helpful: {
        Args: {
          p_comment_id: string
          p_voter_identifier: string
        }
        Returns: boolean
      }
      report_comment: {
        Args: {
          p_comment_id: string
          p_reporter_identifier: string
          p_reason?: string | null
        }
        Returns: boolean
      }
      express_interest: {
        Args: {
          p_opportunity_id: string
          p_user_email: string
          p_user_id?: string | null
        }
        Returns: boolean
      }
      has_expressed_interest: {
        Args: {
          p_opportunity_id: string
          p_user_email: string
        }
        Returns: boolean
      }
      request_coffee_chat: {
        Args: {
          p_opportunity_id: string
          p_requester_email: string
          p_requester_name: string
          p_message?: string | null
          p_requester_user_id?: string | null
        }
        Returns: string
      }
      accept_coffee_chat: {
        Args: {
          p_chat_id: string
          p_contact_info: string
        }
        Returns: boolean
      }
      decline_coffee_chat: {
        Args: {
          p_chat_id: string
        }
        Returns: boolean
      }
      get_session_analytics_summary: {
        Args: {
          p_days?: number
        }
        Returns: {
          total_sessions: number
          completed_sessions: number
          completion_rate: number
          avg_turns: number
          top_categories: string[]
          avg_final_score: number
        }[]
      }
      find_similar_events: {
        Args: {
          p_event_id: string
          p_limit: number
          p_min_similarity: number
        }
        Returns: {
          event_id: string
          title: string
          event_type: string
          registration_end_date: string
          similarity_score: number
        }[]
      }
      increment_view_count: {
        Args: {
          table_name: string
          row_id: string
        }
        Returns: number
      }
      match_users: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          exclude_user_id: string
        }
        Returns: {
          id: string
          user_id: string
          nickname: string
          desired_position: string | null
          skills: Json | null
          interest_tags: string[] | null
          personality: Json | null
          current_situation: string | null
          vision_summary: string | null
          location: string | null
          profile_analysis: Json | null
          extracted_profile: Json | null
          similarity: number
        }[]
      }
      request_person_coffee_chat: {
        Args: {
          p_target_user_id: string
          p_requester_email: string
          p_requester_name: string
          p_message: string | null
          p_requester_user_id: string | null
        }
        Returns: string
      }
      get_weekly_digest_events: {
        Args: {
          p_user_id: string
          p_recommended_limit: number
          p_popular_limit: number
        }
        Returns: {
          id: string
          title: string
          organizer: string
          event_type: string | null
          registration_end_date: string
          registration_url: string | null
          interest_tags: string[] | null
          category: string
        }[]
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
