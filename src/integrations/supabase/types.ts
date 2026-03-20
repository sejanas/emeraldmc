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
      activity_logs: {
        Row: {
          action_source: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_address: string | null
          request_id: string | null
          user_id: string | null
        }
        Insert: {
          action_source?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          request_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_source?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          request_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author: string | null
          author_credentials: string | null
          category: string | null
          content: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_order: number | null
          excerpt: string | null
          external_url: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time: string | null
          scheduled_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          author?: string | null
          author_credentials?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          excerpt?: string | null
          external_url?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          scheduled_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          author?: string | null
          author_credentials?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          excerpt?: string | null
          external_url?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      booking_updates: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string | null
          id: string
          new_value: string | null
          note: string | null
          old_value: string | null
          update_type: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          update_type: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_updates_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          assigned_to: string | null
          booking_source: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          email: string | null
          extra_phones: string[] | null
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string
          phone: string
          preferred_date: string
          preferred_time: string
          sample_collected_at: string | null
          selected_package: string | null
          selected_tests: string[] | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          booking_source?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string | null
          extra_phones?: string[] | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          phone: string
          preferred_date: string
          preferred_time: string
          sample_collected_at?: string | null
          selected_package?: string | null
          selected_tests?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          booking_source?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string | null
          extra_phones?: string[] | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          sample_collected_at?: string | null
          selected_package?: string | null
          selected_tests?: string[] | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          authority_logo: string | null
          certificate_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_verified: boolean | null
          issuing_authority: string | null
          name: string
          slug: string
          updated_at: string | null
          updated_by: string | null
          valid_till: string | null
        }
        Insert: {
          authority_logo?: string | null
          certificate_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          issuing_authority?: string | null
          name: string
          slug: string
          updated_at?: string | null
          updated_by?: string | null
          valid_till?: string | null
        }
        Update: {
          authority_logo?: string | null
          certificate_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          issuing_authority?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          updated_by?: string | null
          valid_till?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_order: number
          experience_years: number | null
          extra_fields: Json | null
          id: string
          name: string
          profile_image: string | null
          qualification: string | null
          slug: string
          specialization: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number
          experience_years?: number | null
          extra_fields?: Json | null
          id?: string
          name: string
          profile_image?: string | null
          qualification?: string | null
          slug: string
          specialization: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number
          experience_years?: number | null
          extra_fields?: Json | null
          id?: string
          name?: string
          profile_image?: string | null
          qualification?: string | null
          slug?: string
          specialization?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_order: number
          id: string
          is_active: boolean
          question: string
          slug: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          slug: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          slug?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          category: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string
          title: string
          updated_at: string | null
          updated_by: string | null
          uploaded_at: string
        }
        Insert: {
          category?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
          uploaded_at?: string
        }
        Update: {
          category?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      package_tests: {
        Row: {
          id: string
          package_id: string
          test_id: string
        }
        Insert: {
          id?: string
          package_id: string
          test_id: string
        }
        Update: {
          id?: string
          package_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_tests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          discount_percent: number | null
          discounted_price: number | null
          display_order: number
          featured_test_ids: string[] | null
          id: string
          image_url: string | null
          instructions: string | null
          is_popular: boolean
          name: string
          original_price: number
          savings_override: number | null
          show_test_count: boolean | null
          slug: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          display_order?: number
          featured_test_ids?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_popular?: boolean
          name: string
          original_price?: number
          savings_override?: number | null
          show_test_count?: boolean | null
          slug: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_percent?: number | null
          discounted_price?: number | null
          display_order?: number
          featured_test_ids?: string[] | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_popular?: boolean
          name?: string
          original_price?: number
          savings_override?: number | null
          show_test_count?: boolean | null
          slug?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      test_categories: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          name: string
          slug: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          name: string
          slug: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      test_category_map: {
        Row: {
          category_id: string
          id: string
          test_id: string
        }
        Insert: {
          category_id: string
          id?: string
          test_id: string
        }
        Update: {
          category_id?: string
          id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_category_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "test_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_category_map_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_tests: {
        Row: {
          id: string
          test_id: string
          name: string
          is_visible: boolean
          display_order: number
          show_as_individual: boolean
          price: number | null
          original_price: number | null
          discounted_price: number | null
          discount_override: number | null
          sample_type: string | null
          report_time: string | null
          fasting_required: boolean
          description: string | null
          slug: string | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          name: string
          is_visible?: boolean
          display_order?: number
          show_as_individual?: boolean
          price?: number | null
          original_price?: number | null
          discounted_price?: number | null
          discount_override?: number | null
          sample_type?: string | null
          report_time?: string | null
          fasting_required?: boolean
          description?: string | null
          slug?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          name?: string
          is_visible?: boolean
          display_order?: number
          show_as_individual?: boolean
          price?: number | null
          original_price?: number | null
          discounted_price?: number | null
          discount_override?: number | null
          sample_type?: string | null
          report_time?: string | null
          fasting_required?: boolean
          description?: string | null
          slug?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          discount_override: number | null
          discounted_price: number | null
          display_order: number
          fasting_required: boolean
          id: string
          is_active: boolean
          name: string
          original_price: number | null
          preparation: string | null
          price: number
          report_time: string
          sample_type: string
          show_on_homepage: boolean | null
          slug: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_override?: number | null
          discounted_price?: number | null
          display_order?: number
          fasting_required?: boolean
          id?: string
          is_active?: boolean
          name: string
          original_price?: number | null
          preparation?: string | null
          price?: number
          report_time?: string
          sample_type?: string
          show_on_homepage?: boolean | null
          slug: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_override?: number | null
          discounted_price?: number | null
          display_order?: number
          fasting_required?: boolean
          id?: string
          is_active?: boolean
          name?: string
          original_price?: number | null
          preparation?: string | null
          price?: number
          report_time?: string
          sample_type?: string
          show_on_homepage?: boolean | null
          slug?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "test_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_phones: {
        Row: {
          created_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          clinic_role: string | null
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          declined_by: string | null
          id: string
          name: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          clinic_role?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          declined_by?: string | null
          id?: string
          name: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          clinic_role?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          declined_by?: string | null
          id?: string
          name?: string
          role?: string
          status?: string
          user_id?: string
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
      visitors: {
        Row: {
          city: string | null
          country: string | null
          id: string
          ip_hash: string | null
          page: string
          referrer: string | null
          region: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          id?: string
          ip_hash?: string | null
          page?: string
          referrer?: string | null
          region?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          id?: string
          ip_hash?: string | null
          page?: string
          referrer?: string | null
          region?: string | null
          user_agent?: string | null
          visited_at?: string
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "booking_manager"
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
      app_role: ["admin", "user", "booking_manager"],
    },
  },
} as const
