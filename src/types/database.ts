/**
 * Generated from the Koffito Supabase project (public schema).
 * Regenerate with `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      event_participants: {
        Row: {
          cancelled_at: string | null;
          confirmed_24h_at: string | null;
          confirmed_3h_at: string | null;
          event_id: string;
          group_id: string | null;
          id: string;
          joined_at: string;
          status: Database["public"]["Enums"]["participant_status"];
          user_id: string;
        };
        Insert: {
          cancelled_at?: string | null;
          confirmed_24h_at?: string | null;
          confirmed_3h_at?: string | null;
          event_id: string;
          group_id?: string | null;
          id?: string;
          joined_at?: string;
          status?: Database["public"]["Enums"]["participant_status"];
          user_id: string;
        };
        Update: {
          cancelled_at?: string | null;
          confirmed_24h_at?: string | null;
          confirmed_3h_at?: string | null;
          event_id?: string;
          group_id?: string | null;
          id?: string;
          joined_at?: string;
          status?: Database["public"]["Enums"]["participant_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_ratings: {
        Row: {
          comment: string;
          created_at: string;
          event_id: string;
          id: string;
          rating: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment?: string;
          created_at?: string;
          event_id: string;
          id?: string;
          rating: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          rating?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_ratings_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          capacity: number;
          created_at: string;
          created_by: string | null;
          default_venue_id: string | null;
          event_at: string;
          id: string;
          reveal_at: string;
          status: Database["public"]["Enums"]["event_status"];
          target_group_size: number;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          capacity?: number;
          created_at?: string;
          created_by?: string | null;
          default_venue_id?: string | null;
          event_at: string;
          id?: string;
          reveal_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          target_group_size?: number;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          created_by?: string | null;
          default_venue_id?: string | null;
          event_at?: string;
          id?: string;
          reveal_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          target_group_size?: number;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_default_venue_id_fkey";
            columns: ["default_venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          avg_distance: number | null;
          created_at: string;
          event_id: string;
          id: string;
          reservation_notes: string | null;
          reservation_status: Database["public"]["Enums"]["reservation_status"];
          reserved_by: string | null;
          venue_id: string | null;
        };
        Insert: {
          avg_distance?: number | null;
          created_at?: string;
          event_id: string;
          id?: string;
          reservation_notes?: string | null;
          reservation_status?: Database["public"]["Enums"]["reservation_status"];
          reserved_by?: string | null;
          venue_id?: string | null;
        };
        Update: {
          avg_distance?: number | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          reservation_notes?: string | null;
          reservation_status?: Database["public"]["Enums"]["reservation_status"];
          reserved_by?: string | null;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "groups_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "groups_reserved_by_fkey";
            columns: ["reserved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "groups_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_languages: {
        Row: {
          created_at: string;
          id: string;
          language: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          language: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          language?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_languages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_emoji: string | null;
          avatar_url: string | null;
          created_at: string;
          date_of_birth: string | null;
          display_name: string;
          favorite_coffee: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_admin: boolean;
          occupation: string | null;
          onboarded_at: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_emoji?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          display_name?: string;
          favorite_coffee?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_admin?: boolean;
          occupation?: string | null;
          onboarded_at?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_emoji?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          display_name?: string;
          favorite_coffee?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          is_admin?: boolean;
          occupation?: string | null;
          onboarded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          details: string;
          event_id: string | null;
          handled_by: string | null;
          id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reported_user_id: string | null;
          reporter_id: string;
          status: Database["public"]["Enums"]["report_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          details: string;
          event_id?: string | null;
          handled_by?: string | null;
          id?: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reported_user_id?: string | null;
          reporter_id: string;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string;
          event_id?: string | null;
          handled_by?: string | null;
          id?: string;
          reason?: Database["public"]["Enums"]["report_reason"];
          reported_user_id?: string | null;
          reporter_id?: string;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey";
            columns: ["reported_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      surveys: {
        Row: {
          completed_at: string | null;
          created_at: string;
          embedding: string | null;
          embedding_version: number | null;
          id: string;
          survey_data: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          embedding?: string | null;
          embedding_version?: number | null;
          id?: string;
          survey_data?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          embedding?: string | null;
          embedding_version?: number | null;
          id?: string;
          survey_data?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "surveys_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_settings: {
        Row: {
          created_at: string;
          notifications_enabled: boolean;
          reminders_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          notifications_enabled?: boolean;
          reminders_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          notifications_enabled?: boolean;
          reminders_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          address: string;
          capacity: number | null;
          created_at: string;
          description: string;
          google_place_id: string | null;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          maps_url: string | null;
          name: string;
          phone: string | null;
          photo_url: string | null;
          popular_times: number[] | null;
          rating: number | null;
          website: string | null;
        };
        Insert: {
          address: string;
          capacity?: number | null;
          created_at?: string;
          description?: string;
          google_place_id?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          maps_url?: string | null;
          name: string;
          phone?: string | null;
          photo_url?: string | null;
          popular_times?: number[] | null;
          rating?: number | null;
          website?: string | null;
        };
        Update: {
          address?: string;
          capacity?: number | null;
          created_at?: string;
          description?: string;
          google_place_id?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          maps_url?: string | null;
          name?: string;
          phone?: string | null;
          photo_url?: string | null;
          popular_times?: number[] | null;
          rating?: number | null;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      admin_reports: {
        Row: {
          created_at: string | null;
          details: string | null;
          event_id: string | null;
          handled_by: string | null;
          id: string | null;
          reason: Database["public"]["Enums"]["report_reason"] | null;
          reported_by: string | null;
          reported_user_id: string | null;
          reported_user_name: string | null;
          reporter_id: string | null;
          status: Database["public"]["Enums"]["report_status"] | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey";
            columns: ["reported_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      attended_event: { Args: { eid: string }; Returns: boolean };
      can_see_venue: { Args: { vid: string }; Returns: boolean };
      create_event: {
        Args: {
          p_capacity?: number;
          p_default_venue_id?: string;
          p_event_at: string;
          p_location_hidden?: boolean;
          p_status?: Database["public"]["Enums"]["event_status"];
          p_target_group_size?: number;
          p_title?: string;
        };
        Returns: string;
      };
      get_my_events: {
        Args: never;
        Returns: {
          cafe: Json;
          event_at: string;
          id: string;
          joined: boolean;
          location_hidden: boolean;
          max_participants: number;
          my_rating: number;
          participant_status: Database["public"]["Enums"]["participant_status"];
          participants: Json;
          reveal_at: string;
          status: string;
        }[];
      };
      get_my_visited_venues: { Args: never; Returns: Json[] };
      get_open_events: {
        Args: never;
        Returns: {
          event_at: string;
          id: string;
          joined: boolean;
          max_participants: number;
          spots_left: number;
        }[];
      };
      get_public_profile: { Args: { p_user_id: string }; Returns: Json };
      group_revealed: { Args: { gid: string }; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      is_group_member: { Args: { gid: string }; Returns: boolean };
      is_valid_survey_data: { Args: { data: Json }; Returns: boolean };
      join_event: { Args: { p_event_id: string }; Returns: undefined };
      leave_event: { Args: { p_event_id: string }; Returns: undefined };
      profile_card: { Args: { p_user_id: string }; Returns: Json };
      set_my_languages: { Args: { p_languages: string[] }; Returns: string[] };
      shares_revealed_group: { Args: { other: string }; Returns: boolean };
      venue_card: { Args: { p_venue_id: string }; Returns: Json };
    };
    Enums: {
      event_status: "draft" | "open" | "matched" | "confirmed" | "completed" | "cancelled";
      gender: "female" | "male" | "non_binary" | "prefer_not_to_say";
      participant_status: "joined" | "matched" | "confirmed_24h" | "confirmed_3h" | "declined" | "cancelled" | "no_show";
      report_reason: "no-show" | "rude" | "unsafe" | "fake" | "other";
      report_status: "open" | "reviewing" | "resolved";
      reservation_status: "pending" | "confirmed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type Functions<Name extends keyof DefaultSchema["Functions"]> = DefaultSchema["Functions"][Name];

export const Constants = {
  public: {
    Enums: {
      event_status: ["draft", "open", "matched", "confirmed", "completed", "cancelled"],
      gender: ["female", "male", "non_binary", "prefer_not_to_say"],
      participant_status: ["joined", "matched", "confirmed_24h", "confirmed_3h", "declined", "cancelled", "no_show"],
      report_reason: ["no-show", "rude", "unsafe", "fake", "other"],
      report_status: ["open", "reviewing", "resolved"],
      reservation_status: ["pending", "confirmed", "cancelled"],
    },
  },
} as const;
