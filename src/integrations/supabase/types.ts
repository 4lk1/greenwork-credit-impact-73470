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
      job_completions: {
        Row: {
          completed_at: string | null
          earned_credits: number
          estimated_co2_kg_impact: number
          id: string
          microjob_id: string
          quiz_score_percent: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          earned_credits: number
          estimated_co2_kg_impact: number
          id?: string
          microjob_id: string
          quiz_score_percent: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          earned_credits?: number
          estimated_co2_kg_impact?: number
          id?: string
          microjob_id?: string
          quiz_score_percent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_completions_microjob_id_fkey"
            columns: ["microjob_id"]
            isOneToOne: false
            referencedRelation: "micro_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_progress: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          microjob_id: string
          quiz_answers: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          microjob_id: string
          quiz_answers?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          microjob_id?: string
          quiz_answers?: Json
          user_id?: string
        }
        Relationships: []
      }
      micro_jobs: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty_level: string
          estimated_co2_kg_impact: number
          estimated_duration_minutes: number
          id: string
          is_active: boolean | null
          location: string
          reward_credits: number
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty_level: string
          estimated_co2_kg_impact: number
          estimated_duration_minutes: number
          id?: string
          is_active?: boolean | null
          location: string
          reward_credits: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty_level?: string
          estimated_co2_kg_impact?: number
          estimated_duration_minutes?: number
          id?: string
          is_active?: boolean | null
          location?: string
          reward_credits?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_option: string
          created_at: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          training_module_id: string
        }
        Insert: {
          correct_option: string
          created_at?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          training_module_id: string
        }
        Update: {
          correct_option?: string
          created_at?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          training_module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          avg_download_mbps: number
          avg_latency_ms: number
          avg_upload_mbps: number
          climate_need_score: number
          created_at: string | null
          dominant_land_cover: string
          id: string
          inequality_score: number
          iso_country: string
          lat: number
          lon: number
          network_type: string
          priority_score: number
          recommended_microjob_category: string
          region_id: number
          region_name: string
          source_connectivity_dataset: string
          source_landcover_dataset: string
        }
        Insert: {
          avg_download_mbps: number
          avg_latency_ms: number
          avg_upload_mbps: number
          climate_need_score: number
          created_at?: string | null
          dominant_land_cover: string
          id?: string
          inequality_score: number
          iso_country: string
          lat: number
          lon: number
          network_type: string
          priority_score: number
          recommended_microjob_category: string
          region_id: number
          region_name: string
          source_connectivity_dataset: string
          source_landcover_dataset: string
        }
        Update: {
          avg_download_mbps?: number
          avg_latency_ms?: number
          avg_upload_mbps?: number
          climate_need_score?: number
          created_at?: string | null
          dominant_land_cover?: string
          id?: string
          inequality_score?: number
          iso_country?: string
          lat?: number
          lon?: number
          network_type?: string
          priority_score?: number
          recommended_microjob_category?: string
          region_id?: number
          region_name?: string
          source_connectivity_dataset?: string
          source_landcover_dataset?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          content: string
          created_at: string | null
          id: string
          learning_objectives: string[] | null
          microjob_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          learning_objectives?: string[] | null
          microjob_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          learning_objectives?: string[] | null
          microjob_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_microjob_id_fkey"
            columns: ["microjob_id"]
            isOneToOne: false
            referencedRelation: "micro_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          type: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          type: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          type?: string
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_verification_codes: { Args: never; Returns: undefined }
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
