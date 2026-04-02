export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      client_issues: {
        Row: {
          id: string
          occurrence_date: string
          client_id: string
          issue_type: string
          issue_content: string
          occurrence_subject: string
          root_cause: string
          title: string
          manager_name: string
          construction_team: string
          file_url: string | null
          file_name: string | null
          action_taken: string | null
          fu_required_team: string | null
          preventive_measure: string | null
          author_name: string
          responder_name: string | null
          response_file_url: string | null
          response_file_name: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          occurrence_date: string
          client_id: string
          issue_type: string
          issue_content: string
          occurrence_subject: string
          root_cause: string
          title: string
          manager_name: string
          construction_team: string
          file_url?: string | null
          file_name?: string | null
          action_taken?: string | null
          fu_required_team?: string | null
          preventive_measure?: string | null
          author_name: string
          responder_name?: string | null
          response_file_url?: string | null
          response_file_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          occurrence_date?: string
          client_id?: string
          issue_type?: string
          issue_content?: string
          occurrence_subject?: string
          root_cause?: string
          title?: string
          manager_name?: string
          construction_team?: string
          file_url?: string | null
          file_name?: string | null
          action_taken?: string | null
          fu_required_team?: string | null
          preventive_measure?: string | null
          author_name?: string
          responder_name?: string | null
          response_file_url?: string | null
          response_file_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      client_onboarding: {
        Row: {
          client_id: string
          contract_date: string | null
          contract_end_date: string | null
          initial_sku_count: number | null
          operation_difficulty: number | null
          operation_readiness: number | null
          sales_start_date: string | null
          service_end_date: string | null
          service_start_date: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          contract_date?: string | null
          contract_end_date?: string | null
          initial_sku_count?: number | null
          operation_difficulty?: number | null
          operation_readiness?: number | null
          sales_start_date?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          contract_date?: string | null
          contract_end_date?: string | null
          initial_sku_count?: number | null
          operation_difficulty?: number | null
          operation_readiness?: number | null
          sales_start_date?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          updated_at?: string
        }
      }
      clients: {
        Row: {
          approval_link: string | null
          brand_name: string | null
          business_number: string | null
          company_name: string
          contract_type: string | null
          cost_center_id: string | null
          created_at: string
          id: string
          operation_manager_id: string | null
          product_category: string | null
          progress_status: string
          remarks: string | null
          sales_manager_id: string | null
          service_type_id: string | null
          updated_at: string
        }
        Insert: {
          approval_link?: string | null
          brand_name?: string | null
          business_number?: string | null
          company_name: string
          contract_status?: string
          contract_type?: string | null
          cost_center_id?: string | null
          created_at?: string
          id?: string
          operation_manager_id?: string | null
          product_category?: string | null
          progress_status?: string
          remarks?: string | null
          sales_manager_id?: string | null
          service_type_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_link?: string | null
          brand_name?: string | null
          business_number?: string | null
          company_name?: string
          contract_status?: string
          contract_type?: string | null
          cost_center_id?: string | null
          created_at?: string
          id?: string
          operation_manager_id?: string | null
          product_category?: string | null
          progress_status?: string
          remarks?: string | null
          sales_manager_id?: string | null
          service_type_id?: string | null
          updated_at?: string
        }
      }
      cost_centers: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
        }
      }
      sales: {
        Row: {
          client_id: string
          created_at: string
          deposit_status: string
          id: string
          payment_lead_time: number | null
          sales_month: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deposit_status?: string
          id?: string
          payment_lead_time?: number | null
          sales_month: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deposit_status?: string
          id?: string
          payment_lead_time?: number | null
          sales_month?: string
          total_amount?: number
          updated_at?: string
        }
      }
      service_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
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
