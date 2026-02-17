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
          connected_at: string | null
          id: string
          opportunity_creator_id: string
        }
        Insert: {
          applicant_id: string
          application_id: string
          connected_at?: string | null
          id?: string
          opportunity_creator_id: string
        }
        Update: {
          applicant_id?: string
          application_id?: string
          connected_at?: string | null
          id?: string
          opportunity_creator_id?: string
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
          demo_images: string[] | null
          description: string
          id: string
          interest_tags: string[] | null
          location: string | null
          location_type: string | null
          needed_roles: string[] | null
          needed_skills: Json | null
          project_links: Json | null
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
          compensation_details?: string | null
          compensation_type?: string | null
          created_at?: string | null
          creator_id: string
          demo_images?: string[] | null
          description: string
          id?: string
          interest_tags?: string[] | null
          location?: string | null
          location_type?: string | null
          needed_roles?: string[] | null
          needed_skills?: Json | null
          project_links?: Json | null
          status?: string | null
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
          demo_images?: string[] | null
          description?: string
          id?: string
          interest_tags?: string[] | null
          location?: string | null
          location_type?: string | null
          needed_roles?: string[] | null
          needed_skills?: Json | null
          project_links?: Json | null
          status?: string | null
          time_commitment?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          views_count?: number | null
          vision_embedding?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          ai_chat_completed: boolean | null
          ai_chat_transcript: Json | null
          contact_email: string | null
          contact_kakao: string | null
          created_at: string | null
          current_situation: string | null
          desired_position: string | null
          graduation_year: number | null
          id: string
          interest_tags: string[] | null
          invite_code_used: string | null
          is_premium: boolean | null
          location: string | null
          major: string | null
          nickname: string
          onboarding_completed: boolean | null
          personality: Json | null
          premium_activated_at: string | null
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
          contact_email?: string | null
          contact_kakao?: string | null
          created_at?: string | null
          current_situation?: string | null
          desired_position?: string | null
          graduation_year?: number | null
          id?: string
          interest_tags?: string[] | null
          invite_code_used?: string | null
          is_premium?: boolean | null
          location?: string | null
          major?: string | null
          nickname: string
          onboarding_completed?: boolean | null
          personality?: Json | null
          premium_activated_at?: string | null
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
          contact_email?: string | null
          contact_kakao?: string | null
          created_at?: string | null
          current_situation?: string | null
          desired_position?: string | null
          graduation_year?: number | null
          id?: string
          interest_tags?: string[] | null
          invite_code_used?: string | null
          is_premium?: boolean | null
          location?: string | null
          major?: string | null
          nickname?: string
          onboarding_completed?: boolean | null
          personality?: Json | null
          premium_activated_at?: string | null
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
