export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_agent_tools: {
        Row: {
          agent_id: string
          created_at: string
          enabled: boolean
          tool_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          enabled?: boolean
          tool_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          enabled?: boolean
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "ai_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          instructions: string | null
          model: string
          name: string
          temperature: number
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          instructions?: string | null
          model?: string
          name: string
          temperature?: number
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          instructions?: string | null
          model?: string
          name?: string
          temperature?: number
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          agent_id: string
          created_at: string
          created_by: string
          id: string
          metadata: Json
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_sources: {
        Row: {
          active: boolean
          agent_id: string | null
          config: Json
          created_at: string
          created_by: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          agent_id?: string | null
          config?: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          agent_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          agent_id: string | null
          created_at: string
          created_by: string | null
          details: Json
          event: string
          id: string
          level: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          event: string
          id?: string
          level?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          event?: string
          id?: string
          level?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tools: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          requires_secret: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          requires_secret?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          requires_secret?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          id: string
          name: string
          start_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          id?: string
          name: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          id?: string
          name?: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Relationships: []
      }
      company_research: {
        Row: {
          brand_voice: Json
          company_id: string
          competitors: Json
          content_pillars: Json
          created_at: string
          created_by: string
          id: string
          industry_trends: Json
          insights: Json
          raw_content: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["research_status"]
          updated_at: string
        }
        Insert: {
          brand_voice?: Json
          company_id: string
          competitors?: Json
          content_pillars?: Json
          created_at?: string
          created_by: string
          id?: string
          industry_trends?: Json
          insights?: Json
          raw_content?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["research_status"]
          updated_at?: string
        }
        Update: {
          brand_voice?: Json
          company_id?: string
          competitors?: Json
          content_pillars?: Json
          created_at?: string
          created_by?: string
          id?: string
          industry_trends?: Json
          insights?: Json
          raw_content?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["research_status"]
          updated_at?: string
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          metadata: Json
          provider: string
          refresh_token: string | null
          scopes: string[]
          status: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          provider: string
          refresh_token?: string | null
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          provider?: string
          refresh_token?: string | null
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          agent_id: string | null
          campaign_id: string | null
          channel: Database["public"]["Enums"]["distribution_channel"]
          company_id: string
          content: string | null
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["content_kind"]
          metadata: Json
          research_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["distribution_channel"]
          company_id: string
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind: Database["public"]["Enums"]["content_kind"]
          metadata?: Json
          research_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["distribution_channel"]
          company_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["content_kind"]
          metadata?: Json
          research_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_schedule: {
        Row: {
          channel: Database["public"]["Enums"]["distribution_channel"]
          connected_account_id: string | null
          content_id: string
          created_at: string
          created_by: string
          id: string
          publish_result: Json
          scheduled_for: string
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["distribution_channel"]
          connected_account_id?: string | null
          content_id: string
          created_at?: string
          created_by: string
          id?: string
          publish_result?: Json
          scheduled_for: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["distribution_channel"]
          connected_account_id?: string | null
          content_id?: string
          created_at?: string
          created_by?: string
          id?: string
          publish_result?: Json
          scheduled_for?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          content: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          due_at: string | null
          id: string
          subject: string | null
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          due_at?: string | null
          id?: string
          subject?: string | null
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          due_at?: string | null
          id?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          address: string | null
          annual_revenue: number | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          email: string | null
          employee_count: number | null
          id: string
          industry: string | null
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          address: string | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          mobile_phone: string | null
          notes: string | null
          personal_email: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          work_email: string | null
          work_phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          mobile_phone?: string | null
          notes?: string | null
          personal_email?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          work_email?: string | null
          work_phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          mobile_phone?: string | null
          notes?: string | null
          personal_email?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          work_email?: string | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          expected_close_date: string | null
          id: string
          lost_at: string | null
          lost_reason: string | null
          pipeline_id: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at: string
          value: number
          won_at: string | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          pipeline_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at?: string
          value?: number
          won_at?: string | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          pipeline_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title?: string
          updated_at?: string
          value?: number
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_links: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          id: string
          is_primary: boolean | null
          label: string | null
          link_type: string
          updated_at: string
          url: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          link_type: string
          updated_at?: string
          url: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          link_type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_stages: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          pipeline_id: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          pipeline_id: string
          position: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      engagement_events: {
        Row: {
          campaign_id: string | null
          channel: Database["public"]["Enums"]["engagement_channel"]
          contact_id: string
          content_preview: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          event_type: Database["public"]["Enums"]["engagement_event_type"]
          id: string
          metadata: Json
          occurred_at: string
        }
        Insert: {
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["engagement_channel"]
          contact_id: string
          content_preview?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          event_type: Database["public"]["Enums"]["engagement_event_type"]
          id?: string
          metadata?: Json
          occurred_at?: string
        }
        Update: {
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["engagement_channel"]
          contact_id?: string
          content_preview?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          event_type?: Database["public"]["Enums"]["engagement_event_type"]
          id?: string
          metadata?: Json
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          created_by: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      publish_jobs: {
        Row: {
          content_id: string | null
          created_at: string
          created_by: string
          error: string | null
          id: string
          provider: string | null
          response: Json
          schedule_id: string | null
          status: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          created_by: string
          error?: string | null
          id?: string
          provider?: string | null
          response?: Json
          schedule_id?: string | null
          status?: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          created_by?: string
          error?: string | null
          id?: string
          provider?: string | null
          response?: Json
          schedule_id?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "call"
        | "email"
        | "meeting"
        | "note"
        | "task"
        | "sms"
        | "whatsapp"
        | "social_dm"
        | "other"
      app_role: "admin" | "user"
      campaign_status: "draft" | "active" | "paused" | "completed"
      content_kind:
        | "social_post"
        | "email"
        | "sms"
        | "whatsapp"
        | "youtube_script"
        | "youtube_video"
      content_status:
        | "draft"
        | "generated"
        | "approved"
        | "scheduled"
        | "published"
        | "failed"
        | "archived"
      deal_status: "open" | "won" | "lost"
      distribution_channel: "social" | "email" | "sms" | "whatsapp" | "youtube"
      engagement_channel:
        | "email"
        | "whatsapp"
        | "sms"
        | "social"
        | "site"
        | "other"
      engagement_event_type:
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "replied"
        | "bounced"
        | "unsubscribed"
        | "message_received"
        | "message_sent"
        | "comment"
        | "like"
        | "share"
      research_status: "pending" | "in_progress" | "completed" | "failed"
      schedule_status:
        | "scheduled"
        | "queued"
        | "running"
        | "published"
        | "failed"
        | "canceled"
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
    Enums: {
      activity_type: [
        "call",
        "email",
        "meeting",
        "note",
        "task",
        "sms",
        "whatsapp",
        "social_dm",
        "other",
      ],
      app_role: ["admin", "user"],
      campaign_status: ["draft", "active", "paused", "completed"],
      content_kind: [
        "social_post",
        "email",
        "sms",
        "whatsapp",
        "youtube_script",
        "youtube_video",
      ],
      content_status: [
        "draft",
        "generated",
        "approved",
        "scheduled",
        "published",
        "failed",
        "archived",
      ],
      deal_status: ["open", "won", "lost"],
      distribution_channel: ["social", "email", "sms", "whatsapp", "youtube"],
      engagement_channel: [
        "email",
        "whatsapp",
        "sms",
        "social",
        "site",
        "other",
      ],
      engagement_event_type: [
        "sent",
        "delivered",
        "opened",
        "clicked",
        "replied",
        "bounced",
        "unsubscribed",
        "message_received",
        "message_sent",
        "comment",
        "like",
        "share",
      ],
      research_status: ["pending", "in_progress", "completed", "failed"],
      schedule_status: [
        "scheduled",
        "queued",
        "running",
        "published",
        "failed",
        "canceled",
      ],
    },
  },
} as const
