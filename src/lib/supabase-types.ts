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
      administrator_account: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          mechanic_id: string | null
          notes: string | null
          payment_status: string | null
          profile_id: string | null
          selected_date: string | null
          selected_time: string | null
          service_details: Json | null
          services: string[]
          status: string | null
          total_price: number | null
          updated_at: string
          user_id: string
          vehicle_id: string | null
          workshop_id: string
          workshop_name: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          payment_status?: string | null
          profile_id?: string | null
          selected_date?: string | null
          selected_time?: string | null
          service_details?: Json | null
          services: string[]
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
          workshop_id: string
          workshop_name: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          payment_status?: string | null
          profile_id?: string | null
          selected_date?: string | null
          selected_time?: string | null
          service_details?: Json | null
          services?: string[]
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
          workshop_id?: string
          workshop_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          vehicle_type: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          vehicle_type?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          mechanic_id: string | null
          mechanic_name: string | null
          user_id: string
          workshop_id: string
          workshop_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          mechanic_id?: string | null
          mechanic_name?: string | null
          user_id: string
          workshop_id: string
          workshop_name: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          mechanic_id?: string | null
          mechanic_name?: string | null
          user_id?: string
          workshop_id?: string
          workshop_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          mechanic_id: string | null
          mechanic_name: string | null
          user_id: string
          workshop_id: string
          workshop_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          mechanic_id?: string | null
          mechanic_name?: string | null
          user_id: string
          workshop_id: string
          workshop_name: string
        }
        Update: {
          created_at?: string
          id?: string
          mechanic_id?: string | null
          mechanic_name?: string | null
          user_id?: string
          workshop_id?: string
          workshop_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_services: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          is_available: boolean | null
          mechanic_id: string
          price: number
          service_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_available?: boolean | null
          mechanic_id: string
          price: number
          service_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_available?: boolean | null
          mechanic_id?: string
          price?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_services_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          avatar_url: string | null
          certifications: string[] | null
          created_at: string
          description: string | null
          email: string | null
          experience_years: number | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          rating: number | null
          review_count: number | null
          specializations: string[] | null
          updated_at: string
          workshop_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          specializations?: string[] | null
          updated_at?: string
          workshop_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          certifications?: string[] | null
          created_at?: string
          description?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          specializations?: string[] | null
          updated_at?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanics_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["workshop_id"]
          },
          {
            foreignKeyName: "mechanics_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          id: string
          is_read: boolean
          media_url: string | null
          message_type: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          body_type: string | null
          brand_id: string
          created_at: string
          fuel_type: string | null
          id: string
          name: string
          year_end: number | null
          year_start: number | null
        }
        Insert: {
          body_type?: string | null
          brand_id: string
          created_at?: string
          fuel_type?: string | null
          id?: string
          name: string
          year_end?: number | null
          year_start?: number | null
        }
        Update: {
          body_type?: string | null
          brand_id?: string
          created_at?: string
          fuel_type?: string | null
          id?: string
          name?: string
          year_end?: number | null
          year_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          images: string[] | null
          mechanic_id: string | null
          rating: number
          user_id: string
          workshop_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          mechanic_id?: string | null
          rating: number
          user_id: string
          workshop_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          mechanic_id?: string | null
          rating?: number
          user_id?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["workshop_id"]
          },
          {
            foreignKeyName: "reviews_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          category: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          icon_url: string | null
          id: string
          is_popular: boolean | null
          name: string
        }
        Insert: {
          base_price?: number | null
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon_url?: string | null
          id?: string
          is_popular?: boolean | null
          name: string
        }
        Update: {
          base_price?: number | null
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon_url?: string | null
          id?: string
          is_popular?: boolean | null
          name?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          booking_id: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          mechanic_id: string | null
          start_time: string
          workshop_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          mechanic_id?: string | null
          start_time: string
          workshop_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          mechanic_id?: string | null
          start_time?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slots_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["workshop_id"]
          },
          {
            foreignKeyName: "time_slots_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand_id: string | null
          color: string | null
          created_at: string | null
          id: string
          model_id: string | null
          plate_number: string
          profile_id: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          brand_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          model_id?: string | null
          plate_number: string
          profile_id: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          brand_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          model_id?: string | null
          plate_number?: string
          profile_id?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_accounts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string | null
          role_id: string | null
          updated_at: string | null
          user_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_accounts_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "workshop_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_accounts_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["workshop_id"]
          },
          {
            foreignKeyName: "workshop_accounts_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          workshop_account_id: string | null
          workshop_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          workshop_account_id?: string | null
          workshop_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          workshop_account_id?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_activity_logs_workshop_account_id_fkey"
            columns: ["workshop_account_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "workshop_activity_logs_workshop_account_id_fkey"
            columns: ["workshop_account_id"]
            isOneToOne: false
            referencedRelation: "workshop_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_activity_logs_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["workshop_id"]
          },
          {
            foreignKeyName: "workshop_activity_logs_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_notifications_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["workshop_id"]
          },
          {
            foreignKeyName: "workshop_notifications_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          permissions: Json | null
          role: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          permissions?: Json | null
          role: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          permissions?: Json | null
          role?: string
        }
        Relationships: []
      }
      workshop_services: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          is_available: boolean | null
          price: number
          service_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_available?: boolean | null
          price: number
          service_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_available?: boolean | null
          price?: number
          service_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_services_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["workshop_id"]
          },
          {
            foreignKeyName: "workshop_services_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          user_agent: string | null
          workshop_account_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          user_agent?: string | null
          workshop_account_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          user_agent?: string | null
          workshop_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_sessions_workshop_account_id_fkey"
            columns: ["workshop_account_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "workshop_sessions_workshop_account_id_fkey"
            columns: ["workshop_account_id"]
            isOneToOne: false
            referencedRelation: "workshop_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          address: string
          capacity_mobil: number | null
          capacity_motor: number | null
          city: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          province: string
          rating: number | null
          review_count: number | null
          specialist_type: string | null
          specializations: string[] | null
          status: string | null
          status_approval:
            | Database["public"]["Enums"]["workshop_status_enum"]
            | null
          supported_brands: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          capacity_mobil?: number | null
          capacity_motor?: number | null
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          province: string
          rating?: number | null
          review_count?: number | null
          specialist_type?: string | null
          specializations?: string[] | null
          status?: string | null
          status_approval?:
            | Database["public"]["Enums"]["workshop_status_enum"]
            | null
          supported_brands?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          capacity_mobil?: number | null
          capacity_motor?: number | null
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string
          rating?: number | null
          review_count?: number | null
          specialist_type?: string | null
          specializations?: string[] | null
          status?: string | null
          status_approval?:
            | Database["public"]["Enums"]["workshop_status_enum"]
            | null
          supported_brands?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "workshop_account_details"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "workshops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "workshop_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      workshop_account_details: {
        Row: {
          account_id: string | null
          city: string | null
          created_at: string | null
          is_active: boolean | null
          phone: string | null
          province: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
          workshop_email: string | null
          workshop_id: string | null
          workshop_name: string | null
          workshop_status: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_email_exists: { Args: { email_check: string }; Returns: boolean }
      get_booking_trend_7_days: {
        Args: never
        Returns: {
          count: number
          date: string
        }[]
      }
    }
    Enums: {
      workshop_status_enum: "APPROVED" | "PENDING" | "REJECTED"
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
      workshop_status_enum: ["APPROVED", "PENDING", "REJECTED"],
    },
  },
} as const
