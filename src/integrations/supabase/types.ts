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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          theme_color: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          theme_color: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_challans: {
        Row: {
          approved_at: string | null
          cancelled_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_gstin: string | null
          customer_name: string
          document_date: string
          document_number: string
          id: string
          items: Json
          notes: string | null
          pdf_path: string | null
          po_number: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number | null
          total: number | null
          transport_mode: string | null
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          approved_at?: string | null
          cancelled_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name: string
          document_date?: string
          document_number: string
          id?: string
          items?: Json
          notes?: string | null
          pdf_path?: string | null
          po_number?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          transport_mode?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          approved_at?: string | null
          cancelled_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string
          document_date?: string
          document_number?: string
          id?: string
          items?: Json
          notes?: string | null
          pdf_path?: string | null
          po_number?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          transport_mode?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_challans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      document_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          document_id: string
          document_type: string
          from_status: Database["public"]["Enums"]["doc_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["doc_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          document_id: string
          document_type: string
          from_status?: Database["public"]["Enums"]["doc_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["doc_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          document_id?: string
          document_type?: string
          from_status?: Database["public"]["Enums"]["doc_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["doc_status"]
        }
        Relationships: []
      }
      documents: {
        Row: {
          approval_due_at: string
          cancelled_at: string | null
          company_name: string
          company_slug: string
          created_at: string
          created_by: string | null
          customer_name: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          payload: Json
          pdf_path: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          approval_due_at?: string
          cancelled_at?: string | null
          company_name: string
          company_slug: string
          created_at?: string
          created_by?: string | null
          customer_name: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          payload?: Json
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          approval_due_at?: string
          cancelled_at?: string | null
          company_name?: string
          company_slug?: string
          created_at?: string
          created_by?: string | null
          customer_name?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          payload?: Json
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          approved_at: string | null
          cancelled_by: string | null
          cgst: number | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_gstin: string | null
          customer_name: string
          document_date: string
          document_number: string
          id: string
          igst: number | null
          items: Json
          notes: string | null
          pdf_path: string | null
          place_of_supply: string | null
          po_number: string | null
          rejected_at: string | null
          sgst: number | null
          status: Database["public"]["Enums"]["doc_status"]
          subtotal: number | null
          total: number | null
          transport_mode: string | null
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          approved_at?: string | null
          cancelled_by?: string | null
          cgst?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name: string
          document_date?: string
          document_number: string
          id?: string
          igst?: number | null
          items?: Json
          notes?: string | null
          pdf_path?: string | null
          place_of_supply?: string | null
          po_number?: string | null
          rejected_at?: string | null
          sgst?: number | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          transport_mode?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          approved_at?: string | null
          cancelled_by?: string | null
          cgst?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string
          document_date?: string
          document_number?: string
          id?: string
          igst?: number | null
          items?: Json
          notes?: string | null
          pdf_path?: string | null
          place_of_supply?: string | null
          po_number?: string | null
          rejected_at?: string | null
          sgst?: number | null
          status?: Database["public"]["Enums"]["doc_status"]
          subtotal?: number | null
          total?: number | null
          transport_mode?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
      companies_public: {
        Row: {
          id: string | null
          name: string | null
          slug: string | null
          theme_color: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          slug?: string | null
          theme_color?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          slug?: string | null
          theme_color?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_approve_documents: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      doc_status: "draft" | "generated" | "approved" | "rejected"
      document_status: "generated" | "approved" | "cancelled"
      document_type: "challan" | "invoice"
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
      app_role: ["admin", "user"],
      doc_status: ["draft", "generated", "approved", "rejected"],
      document_status: ["generated", "approved", "cancelled"],
      document_type: ["challan", "invoice"],
    },
  },
} as const
