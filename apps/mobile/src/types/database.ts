export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      adoptable_animals: {
        Row: {
          age_text: string
          breed: string | null
          gender: string
          id: string
          name: string
          photo_url: string | null
          shelter_id: string
          sterilized: boolean
          story: string
          vaccinated: boolean
        }
        Insert: {
          age_text?: string
          breed?: string | null
          gender?: string
          id?: string
          name: string
          photo_url?: string | null
          shelter_id: string
          sterilized?: boolean
          story?: string
          vaccinated?: boolean
        }
        Update: {
          age_text?: string
          breed?: string | null
          gender?: string
          id?: string
          name?: string
          photo_url?: string | null
          shelter_id?: string
          sterilized?: boolean
          story?: string
          vaccinated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "adoptable_animals_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      case_status_history: {
        Row: {
          case_id: string
          changed_at: string
          changed_by: string | null
          id: number
          status: Database["public"]["Enums"]["case_status"]
        }
        Insert: {
          case_id: string
          changed_at?: string
          changed_by?: string | null
          id?: never
          status: Database["public"]["Enums"]["case_status"]
        }
        Update: {
          case_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: never
          status?: Database["public"]["Enums"]["case_status"]
        }
        Relationships: [
          {
            foreignKeyName: "case_status_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          address: string | null
          breed: string | null
          claimed_by: string | null
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          ngo_notes: string
          note: string
          photo_url: string | null
          reporter_id: string
          species: Database["public"]["Enums"]["case_species"]
          status: Database["public"]["Enums"]["case_status"]
          tags: string[]
          updated_at: string
          urgency: Database["public"]["Enums"]["case_urgency"]
        }
        Insert: {
          address?: string | null
          breed?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          ngo_notes?: string
          note?: string
          photo_url?: string | null
          reporter_id: string
          species: Database["public"]["Enums"]["case_species"]
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[]
          updated_at?: string
          urgency: Database["public"]["Enums"]["case_urgency"]
        }
        Update: {
          address?: string | null
          breed?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          ngo_notes?: string
          note?: string
          photo_url?: string | null
          reporter_id?: string
          species?: Database["public"]["Enums"]["case_species"]
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[]
          updated_at?: string
          urgency?: Database["public"]["Enums"]["case_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "cases_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          case_id: string
          created_at: string
          id: number
          sender_id: string
          text: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: never
          sender_id: string
          text: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: never
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          read_at: string | null
          related_case_id: string | null
          text: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          read_at?: string | null
          related_case_id?: string | null
          text: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          read_at?: string | null
          related_case_id?: string | null
          text?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_case_id_fkey"
            columns: ["related_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          language_code: string
          notif_prefs_on: boolean
          org_name: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          language_code?: string
          notif_prefs_on?: boolean
          org_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          language_code?: string
          notif_prefs_on?: boolean
          org_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          expo_push_token: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expo_push_token: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          expo_push_token?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shelters: {
        Row: {
          address: string
          hours_text: string
          id: string
          is_open: boolean
          lat: number
          lng: number
          name: string
          phone: string | null
          rating: number
          review_count: number
          services: string[]
        }
        Insert: {
          address: string
          hours_text?: string
          id?: string
          is_open?: boolean
          lat: number
          lng: number
          name: string
          phone?: string | null
          rating?: number
          review_count?: number
          services?: string[]
        }
        Update: {
          address?: string
          hours_text?: string
          id?: string
          is_open?: boolean
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          rating?: number
          review_count?: number
          services?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_case: {
        Args: { p_case_id: string }
        Returns: {
          address: string | null
          breed: string | null
          claimed_by: string | null
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          ngo_notes: string
          note: string
          photo_url: string | null
          reporter_id: string
          species: Database["public"]["Enums"]["case_species"]
          status: Database["public"]["Enums"]["case_status"]
          tags: string[]
          updated_at: string
          urgency: Database["public"]["Enums"]["case_urgency"]
        }
        SetofOptions: {
          from: "*"
          to: "cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_case: {
        Args: { p_case_id: string; p_volunteer_id: string }
        Returns: {
          address: string | null
          breed: string | null
          claimed_by: string | null
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          ngo_notes: string
          note: string
          photo_url: string | null
          reporter_id: string
          species: Database["public"]["Enums"]["case_species"]
          status: Database["public"]["Enums"]["case_status"]
          tags: string[]
          updated_at: string
          urgency: Database["public"]["Enums"]["case_urgency"]
        }
        SetofOptions: {
          from: "*"
          to: "cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_case: {
        Args: { p_case_id: string }
        Returns: {
          address: string | null
          breed: string | null
          claimed_by: string | null
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          ngo_notes: string
          note: string
          photo_url: string | null
          reporter_id: string
          species: Database["public"]["Enums"]["case_species"]
          status: Database["public"]["Enums"]["case_status"]
          tags: string[]
          updated_at: string
          urgency: Database["public"]["Enums"]["case_urgency"]
        }
        SetofOptions: {
          from: "*"
          to: "cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { p_notification_id: number }
        Returns: {
          created_at: string
          id: number
          read_at: string | null
          related_case_id: string | null
          text: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_chat_message: {
        Args: { p_case_id: string; p_text: string }
        Returns: {
          case_id: string
          created_at: string
          id: number
          sender_id: string
          text: string
        }
        SetofOptions: {
          from: "*"
          to: "chat_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_case_ngo_notes: {
        Args: { p_case_id: string; p_notes: string }
        Returns: {
          address: string | null
          breed: string | null
          claimed_by: string | null
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          ngo_notes: string
          note: string
          photo_url: string | null
          reporter_id: string
          species: Database["public"]["Enums"]["case_species"]
          status: Database["public"]["Enums"]["case_status"]
          tags: string[]
          updated_at: string
          urgency: Database["public"]["Enums"]["case_urgency"]
        }
        SetofOptions: {
          from: "*"
          to: "cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_case: {
        Args: { p_case_id: string }
        Returns: {
          address: string | null
          breed: string | null
          claimed_by: string | null
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          ngo_notes: string
          note: string
          photo_url: string | null
          reporter_id: string
          species: Database["public"]["Enums"]["case_species"]
          status: Database["public"]["Enums"]["case_status"]
          tags: string[]
          updated_at: string
          urgency: Database["public"]["Enums"]["case_urgency"]
        }
        SetofOptions: {
          from: "*"
          to: "cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      case_species: "Dog" | "Cat" | "Cattle"
      case_status:
        | "open"
        | "claimed"
        | "in_progress"
        | "pending_verification"
        | "resolved"
      case_urgency: "critical" | "attention" | "monitoring"
      notification_type: "new" | "claim" | "chat" | "status"
      user_role: "reporter" | "volunteer" | "ngo"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      case_species: ["Dog", "Cat", "Cattle"],
      case_status: [
        "open",
        "claimed",
        "in_progress",
        "pending_verification",
        "resolved",
      ],
      case_urgency: ["critical", "attention", "monitoring"],
      notification_type: ["new", "claim", "chat", "status"],
      user_role: ["reporter", "volunteer", "ngo"],
    },
  },
} as const


// Friendly aliases for app code (Row shapes only — Insert/Update accessed
// via Database['public']['Tables'][...] directly where needed).
export type Profile = Tables<'profiles'>
export type Case = Tables<'cases'>
export type CaseStatusHistoryRow = Tables<'case_status_history'>
export type Shelter = Tables<'shelters'>
export type AdoptableAnimal = Tables<'adoptable_animals'>
export type NotificationRow = Tables<'notifications'>
export type ChatMessage = Tables<'chat_messages'>

export type UserRole = Enums<'user_role'>
export type CaseSpecies = Enums<'case_species'>
export type CaseUrgency = Enums<'case_urgency'>
export type CaseStatus = Enums<'case_status'>
export type NotificationType = Enums<'notification_type'>
