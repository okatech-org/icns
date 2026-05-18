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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      administrative_archives: {
        Row: {
          access_level: string
          archiving_date: string
          category: string
          created_at: string | null
          id: string
          reference_code: string
          title: string
        }
        Insert: {
          access_level?: string
          archiving_date?: string
          category: string
          created_at?: string | null
          id?: string
          reference_code: string
          title: string
        }
        Update: {
          access_level?: string
          archiving_date?: string
          category?: string
          created_at?: string | null
          id?: string
          reference_code?: string
          title?: string
        }
        Relationships: []
      }
      analytics_voice_events: {
        Row: {
          at: string
          data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          at?: string
          data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          at?: string
          data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_voice_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          duration_ms: number | null
          id: string
          ip_address: string | null
          resource: string
          severity: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          resource: string
          severity?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          resource?: string
          severity?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budget_national: {
        Row: {
          created_at: string | null
          executed_amount: number | null
          id: string
          last_updated: string | null
          ministry_allocations: Json | null
          total_budget: number
          year: number
        }
        Insert: {
          created_at?: string | null
          executed_amount?: number | null
          id?: string
          last_updated?: string | null
          ministry_allocations?: Json | null
          total_budget: number
          year: number
        }
        Update: {
          created_at?: string | null
          executed_amount?: number | null
          id?: string
          last_updated?: string | null
          ministry_allocations?: Json | null
          total_budget?: number
          year?: number
        }
        Relationships: []
      }
      chantiers: {
        Row: {
          budget: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          ministry: string | null
          name: string
          progress: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          ministry?: string | null
          name: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          ministry?: string | null
          name?: string
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conseil_ministres_sessions: {
        Row: {
          agenda_summary: string | null
          created_at: string | null
          date: string
          id: string
          location: string | null
          status: string | null
          time: string | null
          updated_at: string | null
        }
        Insert: {
          agenda_summary?: string | null
          created_at?: string | null
          date: string
          id?: string
          location?: string | null
          status?: string | null
          time?: string | null
          updated_at?: string | null
        }
        Update: {
          agenda_summary?: string | null
          created_at?: string | null
          date?: string
          id?: string
          location?: string | null
          status?: string | null
          time?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          latency_ms: number | null
          role: string
          session_id: string
          tokens: number | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          latency_ms?: number | null
          role: string
          session_id: string
          tokens?: number | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          latency_ms?: number | null
          role?: string
          session_id?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          focus_mode: string | null
          id: string
          is_archived: boolean | null
          last_message_at: string | null
          memory_summary: string | null
          message_count: number | null
          session_name: string | null
          settings: Json | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          focus_mode?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          memory_summary?: string | null
          message_count?: number | null
          session_name?: string | null
          settings?: Json | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          focus_mode?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          memory_summary?: string | null
          message_count?: number | null
          session_name?: string | null
          settings?: Json | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      council_preparations: {
        Row: {
          agenda_items: string[]
          created_at: string | null
          documents_url: string[] | null
          id: string
          meeting_date: string
          status: string
        }
        Insert: {
          agenda_items?: string[]
          created_at?: string | null
          documents_url?: string[] | null
          id?: string
          meeting_date: string
          status?: string
        }
        Update: {
          agenda_items?: string[]
          created_at?: string | null
          documents_url?: string[] | null
          id?: string
          meeting_date?: string
          status?: string
        }
        Relationships: []
      }
      decret_comments: {
        Row: {
          comment: string
          created_at: string | null
          decret_id: string | null
          id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          decret_id?: string | null
          id?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          decret_id?: string | null
          id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decret_comments_decret_id_fkey"
            columns: ["decret_id"]
            isOneToOne: false
            referencedRelation: "decrets_ordonnances"
            referencedColumns: ["id"]
          },
        ]
      }
      decret_signatures: {
        Row: {
          decret_id: string | null
          id: string
          signature_type: string | null
          signed_at: string | null
          signed_by: string
          signed_by_name: string | null
        }
        Insert: {
          decret_id?: string | null
          id?: string
          signature_type?: string | null
          signed_at?: string | null
          signed_by: string
          signed_by_name?: string | null
        }
        Update: {
          decret_id?: string | null
          id?: string
          signature_type?: string | null
          signed_at?: string | null
          signed_by?: string
          signed_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decret_signatures_decret_id_fkey"
            columns: ["decret_id"]
            isOneToOne: false
            referencedRelation: "decrets_ordonnances"
            referencedColumns: ["id"]
          },
        ]
      }
      decrets_ordonnances: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          ministry: string | null
          publication_date: string | null
          reference_number: string
          signature_date: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          ministry?: string | null
          publication_date?: string | null
          reference_number: string
          signature_date?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          ministry?: string | null
          publication_date?: string | null
          reference_number?: string
          signature_date?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_folder_items: {
        Row: {
          added_at: string | null
          document_id: string
          folder_id: string
          id: string
        }
        Insert: {
          added_at?: string | null
          document_id: string
          folder_id: string
          id?: string
        }
        Update: {
          added_at?: string | null
          document_id?: string
          folder_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folder_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          created_at: string | null
          created_by: string | null
          folder_type: Database["public"]["Enums"]["folder_type"] | null
          icon: string | null
          id: string
          name: string
          service_role: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          folder_type?: Database["public"]["Enums"]["folder_type"] | null
          icon?: string | null
          id?: string
          name: string
          service_role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          folder_type?: Database["public"]["Enums"]["folder_type"] | null
          icon?: string | null
          id?: string
          name?: string
          service_role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_history: {
        Row: {
          action: Database["public"]["Enums"]["document_action"]
          created_at: string | null
          document_id: string
          id: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["document_action"]
          created_at?: string | null
          document_id: string
          id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["document_action"]
          created_at?: string | null
          document_id?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          structure: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          structure?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          structure?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content_scan_urls: string[] | null
          created_at: string | null
          current_holder_service: string | null
          deposited_at: string | null
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"] | null
          envelope_scan_urls: string[] | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          filename: string | null
          id: string
          is_confidential: boolean | null
          sender_name: string | null
          sender_organization: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content_scan_urls?: string[] | null
          created_at?: string | null
          current_holder_service?: string | null
          deposited_at?: string | null
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"] | null
          envelope_scan_urls?: string[] | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filename?: string | null
          id?: string
          is_confidential?: boolean | null
          sender_name?: string | null
          sender_organization?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content_scan_urls?: string[] | null
          created_at?: string | null
          current_holder_service?: string | null
          deposited_at?: string | null
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"] | null
          envelope_scan_urls?: string[] | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filename?: string | null
          id?: string
          is_confidential?: boolean | null
          sender_name?: string | null
          sender_organization?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      encrypted_messages: {
        Row: {
          content: string
          created_at: string | null
          encryption_key: string | null
          id: string
          is_read: boolean | null
          priority: string
          recipient_id: string
          security_level: string
          sender_id: string
          sender_name: string | null
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          encryption_key?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string
          recipient_id: string
          security_level?: string
          sender_id: string
          sender_name?: string | null
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          encryption_key?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string
          recipient_id?: string
          security_level?: string
          sender_id?: string
          sender_name?: string | null
          subject?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          storage_url: string | null
          template_used: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          storage_url?: string | null
          template_used?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          storage_url?: string | null
          template_used?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guest_lists: {
        Row: {
          category: string
          created_at: string | null
          event_id: string
          id: string
          name: string
          organization: string | null
          status: string
          title: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          event_id: string
          id?: string
          name: string
          organization?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          event_id?: string
          id?: string
          name?: string
          organization?: string | null
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_lists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "official_events"
            referencedColumns: ["id"]
          },
        ]
      }
      iasted_config: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          created_at: string
          default_voice_id: string | null
          id: string
          minister_voice_id: string | null
          president_voice_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          created_at?: string
          default_voice_id?: string | null
          id?: string
          minister_voice_id?: string | null
          president_voice_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          created_at?: string
          default_voice_id?: string | null
          id?: string
          minister_voice_id?: string | null
          president_voice_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      incoming_mails: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          digital_copy_url: string | null
          id: string
          notes: string | null
          received_date: string
          reference_number: string
          sender: string
          status: string
          subject: string
          type: string
          updated_at: string | null
          urgency: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          digital_copy_url?: string | null
          id?: string
          notes?: string | null
          received_date?: string
          reference_number: string
          sender: string
          status?: string
          subject: string
          type?: string
          updated_at?: string | null
          urgency?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          digital_copy_url?: string | null
          id?: string
          notes?: string | null
          received_date?: string
          reference_number?: string
          sender?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string | null
          urgency?: string
        }
        Relationships: []
      }
      institution_performance: {
        Row: {
          cas_traites: number | null
          created_at: string | null
          id: string
          institution_name: string
          ministere: string | null
          periode_debut: string | null
          periode_fin: string | null
          score_performance: number | null
          taux_resolution: number | null
        }
        Insert: {
          cas_traites?: number | null
          created_at?: string | null
          id?: string
          institution_name: string
          ministere?: string | null
          periode_debut?: string | null
          periode_fin?: string | null
          score_performance?: number | null
          taux_resolution?: number | null
        }
        Update: {
          cas_traites?: number | null
          created_at?: string | null
          id?: string
          institution_name?: string
          ministere?: string | null
          periode_debut?: string | null
          periode_fin?: string | null
          score_performance?: number | null
          taux_resolution?: number | null
        }
        Relationships: []
      }
      intelligence_items: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          embedding: string | null
          entities: Json | null
          external_id: string | null
          id: string
          published_at: string | null
          sentiment: string | null
          source_id: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          embedding?: string | null
          entities?: Json | null
          external_id?: string | null
          id?: string
          published_at?: string | null
          sentiment?: string | null
          source_id?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          entities?: Json | null
          external_id?: string | null
          id?: string
          published_at?: string | null
          sentiment?: string | null
          source_id?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "intelligence_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_processing_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          item_id: string | null
          processing_time_ms: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          item_id?: string | null
          processing_time_ms?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          item_id?: string | null
          processing_time_ms?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_processing_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "intelligence_items"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_reports: {
        Row: {
          classification: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          classification?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          source: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          classification?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      intelligence_scraping_config: {
        Row: {
          ai_providers: string[] | null
          created_at: string | null
          enabled: boolean | null
          frequency_hours: number | null
          id: string
          last_run_at: string | null
          max_cost_limit: number | null
          next_run_at: string | null
          social_networks: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_providers?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          frequency_hours?: number | null
          id?: string
          last_run_at?: string | null
          max_cost_limit?: number | null
          next_run_at?: string | null
          social_networks?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_providers?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          frequency_hours?: number | null
          id?: string
          last_run_at?: string | null
          max_cost_limit?: number | null
          next_run_at?: string | null
          social_networks?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      intelligence_sources: {
        Row: {
          created_at: string | null
          id: string
          last_crawled_at: string | null
          name: string
          status: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_crawled_at?: string | null
          name: string
          status?: string
          type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_crawled_at?: string | null
          name?: string
          status?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      interministerial_coordination: {
        Row: {
          created_at: string | null
          id: string
          meeting_date: string | null
          ministries_involved: string[]
          notes: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_date?: string | null
          ministries_involved?: string[]
          notes?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_date?: string | null
          ministries_involved?: string[]
          notes?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          access_level: string[] | null
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          file_path: string | null
          file_type: string | null
          id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string[] | null
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string[] | null
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base_chunks: {
        Row: {
          chunk_index: number | null
          content: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_reviews: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          document_title: string
          due_date: string | null
          id: string
          priority: string
          requestor: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          document_title: string
          due_date?: string | null
          id?: string
          priority?: string
          requestor: string
          status?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          document_title?: string
          due_date?: string | null
          id?: string
          priority?: string
          requestor?: string
          status?: string
        }
        Relationships: []
      }
      mail_ai_analysis: {
        Row: {
          confidentiality_level: string | null
          created_at: string | null
          id: string
          key_points: Json | null
          mail_id: string
          suggested_routing: string | null
          summary: string | null
          urgency: string | null
        }
        Insert: {
          confidentiality_level?: string | null
          created_at?: string | null
          id?: string
          key_points?: Json | null
          mail_id: string
          suggested_routing?: string | null
          summary?: string | null
          urgency?: string | null
        }
        Update: {
          confidentiality_level?: string | null
          created_at?: string | null
          id?: string
          key_points?: Json | null
          mail_id?: string
          suggested_routing?: string | null
          summary?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_ai_analysis_mail_id_fkey"
            columns: ["mail_id"]
            isOneToOne: false
            referencedRelation: "mails"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          mail_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mail_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_attachments_mail_id_fkey"
            columns: ["mail_id"]
            isOneToOne: false
            referencedRelation: "mails"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_routing: {
        Row: {
          from_service: string | null
          id: string
          mail_id: string
          notes: string | null
          routed_at: string | null
          routed_by: string | null
          to_service: string
        }
        Insert: {
          from_service?: string | null
          id?: string
          mail_id: string
          notes?: string | null
          routed_at?: string | null
          routed_by?: string | null
          to_service: string
        }
        Update: {
          from_service?: string | null
          id?: string
          mail_id?: string
          notes?: string | null
          routed_at?: string | null
          routed_by?: string | null
          to_service?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_routing_mail_id_fkey"
            columns: ["mail_id"]
            isOneToOne: false
            referencedRelation: "mails"
            referencedColumns: ["id"]
          },
        ]
      }
      mails: {
        Row: {
          content: string | null
          content_scan_urls: string[] | null
          created_at: string | null
          current_holder_service: string | null
          deposited_at: string | null
          envelope_scan_urls: string[] | null
          id: string
          reception_date: string | null
          sender_name: string | null
          sender_organization: string | null
          status: Database["public"]["Enums"]["mail_status"] | null
          subject: string | null
          tracking_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          content_scan_urls?: string[] | null
          created_at?: string | null
          current_holder_service?: string | null
          deposited_at?: string | null
          envelope_scan_urls?: string[] | null
          id?: string
          reception_date?: string | null
          sender_name?: string | null
          sender_organization?: string | null
          status?: Database["public"]["Enums"]["mail_status"] | null
          subject?: string | null
          tracking_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          content_scan_urls?: string[] | null
          created_at?: string | null
          current_holder_service?: string | null
          deposited_at?: string | null
          envelope_scan_urls?: string[] | null
          id?: string
          reception_date?: string | null
          sender_name?: string | null
          sender_organization?: string | null
          status?: Database["public"]["Enums"]["mail_status"] | null
          subject?: string | null
          tracking_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ministerial_projects: {
        Row: {
          created_at: string | null
          deadline: string
          id: string
          ministry: string
          priority: string
          progress: number
          project_name: string
          status: string
        }
        Insert: {
          created_at?: string | null
          deadline: string
          id?: string
          ministry: string
          priority?: string
          progress?: number
          project_name: string
          status?: string
        }
        Update: {
          created_at?: string | null
          deadline?: string
          id?: string
          ministry?: string
          priority?: string
          progress?: number
          project_name?: string
          status?: string
        }
        Relationships: []
      }
      national_kpis: {
        Row: {
          cas_critiques: number | null
          created_at: string | null
          date: string
          fonds_recuperes_fcfa: number | null
          id: string
          indice_transparence: number | null
          satisfaction_publique: number | null
          signalements_totaux: number | null
          taux_resolution: number | null
        }
        Insert: {
          cas_critiques?: number | null
          created_at?: string | null
          date?: string
          fonds_recuperes_fcfa?: number | null
          id?: string
          indice_transparence?: number | null
          satisfaction_publique?: number | null
          signalements_totaux?: number | null
          taux_resolution?: number | null
        }
        Update: {
          cas_critiques?: number | null
          created_at?: string | null
          date?: string
          fonds_recuperes_fcfa?: number | null
          id?: string
          indice_transparence?: number | null
          satisfaction_publique?: number | null
          signalements_totaux?: number | null
          taux_resolution?: number | null
        }
        Relationships: []
      }
      nominations: {
        Row: {
          candidate_info: Json | null
          candidate_name: string
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          id: string
          ministere: string
          poste: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          candidate_info?: Json | null
          candidate_name: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          ministere: string
          poste: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          candidate_info?: Json | null
          candidate_name?: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          ministere?: string
          poste?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      official_decrees: {
        Row: {
          created_at: string | null
          id: string
          publication_date: string | null
          reference_number: string
          signature_date: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          publication_date?: string | null
          reference_number: string
          signature_date?: string | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          publication_date?: string | null
          reference_number?: string
          signature_date?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      official_events: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          location: string
          status: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          location: string
          status?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          location?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      opinion_publique: {
        Row: {
          created_at: string | null
          date: string
          id: string
          preoccupations: Json | null
          satisfaction_globale: number | null
          sentiment_insatisfaits: number | null
          sentiment_neutres: number | null
          sentiment_satisfaits: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          preoccupations?: Json | null
          satisfaction_globale?: number | null
          sentiment_insatisfaits?: number | null
          sentiment_neutres?: number | null
          sentiment_satisfaits?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          preoccupations?: Json | null
          satisfaction_globale?: number | null
          sentiment_insatisfaits?: number | null
          sentiment_neutres?: number | null
          sentiment_satisfaits?: number | null
        }
        Relationships: []
      }
      ordre_du_jour: {
        Row: {
          created_at: string | null
          id: string
          ministry: string | null
          order_index: number | null
          presenter: string | null
          session_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ministry?: string | null
          order_index?: number | null
          presenter?: string | null
          session_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ministry?: string | null
          order_index?: number | null
          presenter?: string | null
          session_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordre_du_jour_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conseil_ministres_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_correspondence: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          priority: string
          received_date: string
          sender_name: string
          sender_organization: string | null
          status: string
          subject: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string
          received_date?: string
          sender_name: string
          sender_organization?: string | null
          status?: string
          subject: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string
          received_date?: string
          sender_name?: string
          sender_organization?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      presidential_decisions: {
        Row: {
          created_at: string | null
          decision_data: Json | null
          decision_type: string
          id: string
          motif: string | null
          president_user_id: string
          signalement_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision_data?: Json | null
          decision_type: string
          id?: string
          motif?: string | null
          president_user_id: string
          signalement_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision_data?: Json | null
          decision_type?: string
          id?: string
          motif?: string | null
          president_user_id?: string
          signalement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presidential_decisions_signalement_id_fkey"
            columns: ["signalement_id"]
            isOneToOne: false
            referencedRelation: "signalements"
            referencedColumns: ["id"]
          },
        ]
      }
      presidential_instructions: {
        Row: {
          assigned_to: string
          created_at: string | null
          due_date: string
          id: string
          instruction: string
          priority: string
          status: string
        }
        Insert: {
          assigned_to: string
          created_at?: string | null
          due_date: string
          id?: string
          instruction: string
          priority?: string
          status?: string
        }
        Update: {
          assigned_to?: string
          created_at?: string | null
          due_date?: string
          id?: string
          instruction?: string
          priority?: string
          status?: string
        }
        Relationships: []
      }
      private_audiences: {
        Row: {
          confidentiality_level: string
          created_at: string | null
          created_by: string
          date: string
          id: string
          location: string | null
          notes: string | null
          person_name: string
          person_title: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidentiality_level?: string
          created_at?: string | null
          created_by: string
          date: string
          id?: string
          location?: string | null
          notes?: string | null
          person_name: string
          person_title?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidentiality_level?: string
          created_at?: string | null
          created_by?: string
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          person_name?: string
          person_title?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      private_trips: {
        Row: {
          created_at: string | null
          destination: string
          end_date: string
          id: string
          notes: string | null
          purpose: string
          start_date: string
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          destination: string
          end_date: string
          id?: string
          notes?: string | null
          purpose: string
          start_date: string
          status?: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          destination?: string
          end_date?: string
          id?: string
          notes?: string | null
          purpose?: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projets_etat: {
        Row: {
          budget: number | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          funding_source: string | null
          id: string
          impact_score: number | null
          name: string
          progress: number | null
          responsible_entity: string | null
          sector: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          funding_source?: string | null
          id?: string
          impact_score?: number | null
          name: string
          progress?: number | null
          responsible_entity?: string | null
          sector?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          funding_source?: string | null
          id?: string
          impact_score?: number | null
          name?: string
          progress?: number | null
          responsible_entity?: string | null
          sector?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projets_presidentiels: {
        Row: {
          budget: number | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          progress: number | null
          responsible_ministry: string | null
          start_date: string | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          responsible_ministry?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          progress?: number | null
          responsible_ministry?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      protocol_procedures: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description: string
          id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      role_feedback: {
        Row: {
          created_at: string | null
          document_paths: string[] | null
          id: string
          implementation_suggestions: string | null
          role_description: string
          role_name: string
          status: string | null
          user_email: string
          work_description: string
        }
        Insert: {
          created_at?: string | null
          document_paths?: string[] | null
          id?: string
          implementation_suggestions?: string | null
          role_description: string
          role_name: string
          status?: string | null
          user_email: string
          work_description: string
        }
        Update: {
          created_at?: string | null
          document_paths?: string[] | null
          id?: string
          implementation_suggestions?: string | null
          role_description?: string
          role_name?: string
          status?: string | null
          user_email?: string
          work_description?: string
        }
        Relationships: []
      }
      service_document_settings: {
        Row: {
          created_at: string
          footer_text: string | null
          header_text: string | null
          id: string
          logo_url: string | null
          margins: Json | null
          primary_color: string | null
          secondary_color: string | null
          service_role: string
          sub_header_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          margins?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          service_role: string
          sub_header_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          margins?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          service_role?: string
          sub_header_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      signalements: {
        Row: {
          analyse_ia: string | null
          categorie: string
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          grade_fonctionnaire: string | null
          id: string
          implique_haut_fonctionnaire: boolean | null
          montant_fcfa: number | null
          preuves: Json | null
          province: string | null
          recommandation_ia: string | null
          score_priorite_ia: number | null
          secteur: string | null
          statut: string | null
          temoins: Json | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          analyse_ia?: string | null
          categorie: string
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade_fonctionnaire?: string | null
          id?: string
          implique_haut_fonctionnaire?: boolean | null
          montant_fcfa?: number | null
          preuves?: Json | null
          province?: string | null
          recommandation_ia?: string | null
          score_priorite_ia?: number | null
          secteur?: string | null
          statut?: string | null
          temoins?: Json | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          analyse_ia?: string | null
          categorie?: string
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade_fonctionnaire?: string | null
          id?: string
          implique_haut_fonctionnaire?: boolean | null
          montant_fcfa?: number | null
          preuves?: Json | null
          province?: string | null
          recommandation_ia?: string | null
          score_priorite_ia?: number | null
          secteur?: string | null
          statut?: string | null
          temoins?: Json | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      surveillance_targets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_update: string
          location: string | null
          metadata: Json | null
          name: string
          priority: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_update?: string
          location?: string | null
          metadata?: Json | null
          name: string
          priority?: string
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_update?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          priority?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      threat_indicators: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          level: string
          location: string | null
          metadata: Json | null
          timestamp: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          level?: string
          location?: string | null
          metadata?: Json | null
          timestamp?: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          level?: string
          location?: string | null
          metadata?: Json | null
          timestamp?: string
          type?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          updated_at: string
          user_id: string
          voice_continuous_mode: boolean | null
          voice_id: string | null
          voice_push_to_talk: boolean | null
          voice_silence_duration: number | null
          voice_silence_threshold: number | null
        }
        Insert: {
          created_at?: string
          updated_at?: string
          user_id: string
          voice_continuous_mode?: boolean | null
          voice_id?: string | null
          voice_push_to_talk?: boolean | null
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Update: {
          created_at?: string
          updated_at?: string
          user_id?: string
          voice_continuous_mode?: boolean | null
          voice_id?: string | null
          voice_push_to_talk?: boolean | null
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          gender: string | null
          id: string
          preferred_title: string | null
          tone_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          preferred_title?: string | null
          tone_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          preferred_title?: string | null
          tone_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_contacts: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          email: string | null
          id: string
          is_favorite: boolean | null
          last_contact_date: string | null
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_favorite?: boolean | null
          last_contact_date?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_favorite?: boolean | null
          last_contact_date?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_presets: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
          voice_continuous_mode: boolean | null
          voice_id: string
          voice_silence_duration: number | null
          voice_silence_threshold: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          voice_continuous_mode?: boolean | null
          voice_id: string
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          voice_continuous_mode?: boolean | null
          voice_id?: string
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_messages: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_president: { Args: { user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: string
          p_resource: string
          p_severity?: string
          p_success?: boolean
          p_user_id: string
        }
        Returns: string
      }
      match_knowledge_base: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          similarity: number
        }[]
      }
      query_intelligence: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          author: string
          category: string
          content: string
          entities: Json
          id: string
          published_at: string
          sentiment: string
          similarity: number
          summary: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "president"
        | "dgss"
        | "dgr"
        | "minister"
        | "user"
        | "cabinet_private"
        | "sec_gen"
        | "courrier"
        | "reception"
        | "protocol"
      document_action:
        | "deposited"
        | "scanned"
        | "opened"
        | "transferred"
        | "read"
        | "classified"
        | "archived"
        | "confidential_marked"
      document_status:
        | "deposited"
        | "scanned_envelope"
        | "opened"
        | "confidential_routed"
        | "read"
        | "archived"
      document_type: "courrier" | "file" | "note"
      folder_type: "system" | "custom"
      mail_status:
        | "received"
        | "scanning"
        | "analyzing"
        | "pending_validation"
        | "validated"
        | "distributed"
        | "processed"
        | "archived"
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
      app_role: [
        "admin",
        "president",
        "dgss",
        "dgr",
        "minister",
        "user",
        "cabinet_private",
        "sec_gen",
        "courrier",
        "reception",
        "protocol",
      ],
      document_action: [
        "deposited",
        "scanned",
        "opened",
        "transferred",
        "read",
        "classified",
        "archived",
        "confidential_marked",
      ],
      document_status: [
        "deposited",
        "scanned_envelope",
        "opened",
        "confidential_routed",
        "read",
        "archived",
      ],
      document_type: ["courrier", "file", "note"],
      folder_type: ["system", "custom"],
      mail_status: [
        "received",
        "scanning",
        "analyzing",
        "pending_validation",
        "validated",
        "distributed",
        "processed",
        "archived",
      ],
    },
  },
} as const
