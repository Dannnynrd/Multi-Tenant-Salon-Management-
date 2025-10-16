export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          tenant_id: string
          user_id: string
          role: 'OWNER' | 'ADMIN' | 'MEMBER'
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          user_id: string
          role: 'OWNER' | 'ADMIN' | 'MEMBER'
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          user_id?: string
          role?: 'OWNER' | 'ADMIN' | 'MEMBER'
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          tenant_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: 'FREE' | 'STARTER' | 'PRO'
          status: string | null
          trial_end: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: 'FREE' | 'STARTER' | 'PRO'
          status?: string | null
          trial_end?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: 'FREE' | 'STARTER' | 'PRO'
          status?: string | null
          trial_end?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          tenant_id: string
          email: string
          role: 'OWNER' | 'ADMIN' | 'MEMBER'
          token: string
          expires_at: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          role: 'OWNER' | 'ADMIN' | 'MEMBER'
          token?: string
          expires_at: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          role?: 'OWNER' | 'ADMIN' | 'MEMBER'
          token?: string
          expires_at?: string
          created_at?: string
          created_by?: string
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