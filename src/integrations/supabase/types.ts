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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          cluster_id: string | null
          created_at: string
          email: string
          id: string
          last_activity: string
          name: string
          payment_count: number
          refund_count: number
          risk_level: string
          status: string
          trial_count: number
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          email: string
          id: string
          last_activity?: string
          name?: string
          payment_count?: number
          refund_count?: number
          risk_level?: string
          status?: string
          trial_count?: number
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_activity?: string
          name?: string
          payment_count?: number
          refund_count?: number
          risk_level?: string
          status?: string
          trial_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounts_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_notes: {
        Row: {
          analyst_name: string
          cluster_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          analyst_name?: string
          cluster_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          analyst_name?: string
          cluster_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_notes_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      analysts: {
        Row: {
          avatar: string
          capacity: number
          cases_count: number
          created_at: string
          id: string
          name: string
        }
        Insert: {
          avatar?: string
          capacity?: number
          cases_count?: number
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          avatar?: string
          capacity?: number
          cases_count?: number
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clusters: {
        Row: {
          abuse_type: string
          ai_summary: string
          created_at: string
          disputes: number
          exposure: number
          id: string
          last_activity: string
          linked_accounts: number
          owner: string
          payment_attempts: number
          recommended_action: string
          refunds: number
          risk_level: string
          risk_score: number
          status: string
          top_abuse_reason: string
          trial_signups: number
          updated_at: string
        }
        Insert: {
          abuse_type?: string
          ai_summary?: string
          created_at?: string
          disputes?: number
          exposure?: number
          id: string
          last_activity?: string
          linked_accounts?: number
          owner?: string
          payment_attempts?: number
          recommended_action?: string
          refunds?: number
          risk_level?: string
          risk_score?: number
          status?: string
          top_abuse_reason?: string
          trial_signups?: number
          updated_at?: string
        }
        Update: {
          abuse_type?: string
          ai_summary?: string
          created_at?: string
          disputes?: number
          exposure?: number
          id?: string
          last_activity?: string
          linked_accounts?: number
          owner?: string
          payment_attempts?: number
          recommended_action?: string
          refunds?: number
          risk_level?: string
          risk_score?: number
          status?: string
          top_abuse_reason?: string
          trial_signups?: number
          updated_at?: string
        }
        Relationships: []
      }
      derived_features: {
        Row: {
          account_age_days: number
          cluster_id: string | null
          computed_at: string
          device_reuse: number
          disputes_90d: number
          entity_id: string
          entity_type: string
          id: string
          ip_reuse: number
          latest_event_at: string | null
          linked_accounts_count: number
          payment_method_reuse: number
          prior_actions_count: number
          promo_redemptions_30d: number
          refund_rate_90d: number
          refunds_30d: number
          unique_devices: number
          unique_ips: number
          unique_payment_methods: number
          velocity_refunds_7d: number
          velocity_signups_24h: number
        }
        Insert: {
          account_age_days?: number
          cluster_id?: string | null
          computed_at?: string
          device_reuse?: number
          disputes_90d?: number
          entity_id: string
          entity_type: string
          id?: string
          ip_reuse?: number
          latest_event_at?: string | null
          linked_accounts_count?: number
          payment_method_reuse?: number
          prior_actions_count?: number
          promo_redemptions_30d?: number
          refund_rate_90d?: number
          refunds_30d?: number
          unique_devices?: number
          unique_ips?: number
          unique_payment_methods?: number
          velocity_refunds_7d?: number
          velocity_signups_24h?: number
        }
        Update: {
          account_age_days?: number
          cluster_id?: string | null
          computed_at?: string
          device_reuse?: number
          disputes_90d?: number
          entity_id?: string
          entity_type?: string
          id?: string
          ip_reuse?: number
          latest_event_at?: string | null
          linked_accounts_count?: number
          payment_method_reuse?: number
          prior_actions_count?: number
          promo_redemptions_30d?: number
          refund_rate_90d?: number
          refunds_30d?: number
          unique_devices?: number
          unique_ips?: number
          unique_payment_methods?: number
          velocity_refunds_7d?: number
          velocity_signups_24h?: number
        }
        Relationships: []
      }
      devices: {
        Row: {
          account_count: number
          browser: string
          created_at: string
          fingerprint: string
          id: string
          last_seen: string
          os: string
          risk_level: string
          type: string
        }
        Insert: {
          account_count?: number
          browser?: string
          created_at?: string
          fingerprint?: string
          id: string
          last_seen?: string
          os?: string
          risk_level?: string
          type?: string
        }
        Update: {
          account_count?: number
          browser?: string
          created_at?: string
          fingerprint?: string
          id?: string
          last_seen?: string
          os?: string
          risk_level?: string
          type?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          account_id: string | null
          amount: number | null
          cluster_id: string | null
          created_at: string
          description: string
          event_type: string
          id: string
          risk_level: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          cluster_id?: string | null
          created_at?: string
          description?: string
          event_type: string
          id: string
          risk_level?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          cluster_id?: string | null
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_addresses: {
        Row: {
          account_count: number
          address: string
          created_at: string
          id: string
          is_vpn: boolean
          last_seen: string
          location: string
          risk_level: string
        }
        Insert: {
          account_count?: number
          address?: string
          created_at?: string
          id: string
          is_vpn?: boolean
          last_seen?: string
          location?: string
          risk_level?: string
        }
        Update: {
          account_count?: number
          address?: string
          created_at?: string
          id?: string
          is_vpn?: boolean
          last_seen?: string
          location?: string
          risk_level?: string
        }
        Relationships: []
      }
      link_edges: {
        Row: {
          cluster_id: string | null
          created_at: string
          edge_type: string
          id: string
          label: string
          source_id: string
          target_id: string
          weight: number
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          edge_type: string
          id: string
          label?: string
          source_id: string
          target_id: string
          weight?: number
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          edge_type?: string
          id?: string
          label?: string
          source_id?: string
          target_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "link_edges_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_count: number
          brand: string
          created_at: string
          id: string
          last4: string
          risk_level: string
          total_refunds: number
          total_transactions: number
          type: string
        }
        Insert: {
          account_count?: number
          brand?: string
          created_at?: string
          id: string
          last4?: string
          risk_level?: string
          total_refunds?: number
          total_transactions?: number
          type?: string
        }
        Update: {
          account_count?: number
          brand?: string
          created_at?: string
          id?: string
          last4?: string
          risk_level?: string
          total_refunds?: number
          total_transactions?: number
          type?: string
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          completed_at: string | null
          entities_scored: number
          error_message: string | null
          events_failed: number
          events_processed: number
          id: string
          run_type: string
          score_version: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          entities_scored?: number
          error_message?: string | null
          events_failed?: number
          events_processed?: number
          id?: string
          run_type: string
          score_version?: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          entities_scored?: number
          error_message?: string | null
          events_failed?: number
          events_processed?: number
          id?: string
          run_type?: string
          score_version?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      policy_actions: {
        Row: {
          action_type: string
          analyst_name: string
          cluster_id: string
          created_at: string
          id: string
          new_status: string
          notes: string
          previous_status: string
        }
        Insert: {
          action_type: string
          analyst_name?: string
          cluster_id: string
          created_at?: string
          id?: string
          new_status?: string
          notes?: string
          previous_status?: string
        }
        Update: {
          action_type?: string
          analyst_name?: string
          cluster_id?: string
          created_at?: string
          id?: string
          new_status?: string
          notes?: string
          previous_status?: string
        }
        Relationships: []
      }
      policy_config: {
        Row: {
          device_burst_weight: number
          id: string
          merchant_id: string
          payment_reuse_weight: number
          promo_weight: number
          refund_weight: number
          review_capacity: number
          risk_threshold: number
          trial_weight: number
          updated_at: string
        }
        Insert: {
          device_burst_weight?: number
          id?: string
          merchant_id?: string
          payment_reuse_weight?: number
          promo_weight?: number
          refund_weight?: number
          review_capacity?: number
          risk_threshold?: number
          trial_weight?: number
          updated_at?: string
        }
        Update: {
          device_burst_weight?: number
          id?: string
          merchant_id?: string
          payment_reuse_weight?: number
          promo_weight?: number
          refund_weight?: number
          review_capacity?: number
          risk_threshold?: number
          trial_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      raw_events: {
        Row: {
          cluster_id: string | null
          created_at: string
          dedupe_key: string
          entity_id: string
          entity_type: string
          event_time: string
          event_type: string
          id: string
          ingestion_status: string
          payload_json: Json
          source_system: string
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          dedupe_key?: string
          entity_id?: string
          entity_type?: string
          event_time?: string
          event_type: string
          id?: string
          ingestion_status?: string
          payload_json?: Json
          source_system?: string
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          dedupe_key?: string
          entity_id?: string
          entity_type?: string
          event_time?: string
          event_type?: string
          id?: string
          ingestion_status?: string
          payload_json?: Json
          source_system?: string
        }
        Relationships: []
      }
      rule_triggers: {
        Row: {
          cluster_id: string
          created_at: string
          description: string
          id: string
          severity: string
        }
        Insert: {
          cluster_id: string
          created_at?: string
          description: string
          id?: string
          severity?: string
        }
        Update: {
          cluster_id?: string
          created_at?: string
          description?: string
          id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_triggers_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      score_results: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          risk_band: string
          score: number
          score_version: string
          scored_at: string
          top_reasons: Json
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          risk_band?: string
          score?: number
          score_version?: string
          scored_at?: string
          top_reasons?: Json
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          risk_band?: string
          score?: number
          score_version?: string
          scored_at?: string
          top_reasons?: Json
        }
        Relationships: []
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
