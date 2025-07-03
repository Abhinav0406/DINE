import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'customer' | 'staff' | 'admin' | 'kitchen_staff';
          created_at: string;
          updated_at: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          opening_hours: any;
          created_at: string;
          updated_at: string;
        };
      };
      tables: {
        Row: {
          id: string;
          restaurant_id: string;
          table_number: number;
          capacity: number;
          status: 'available' | 'occupied' | 'reserved';
          position: any;
          created_at: string;
          updated_at: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          is_vegetarian: boolean;
          is_vegan: boolean;
          is_spicy: boolean;
          preparation_time: number;
          calories: number | null;
          allergens: string[] | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_id: string | null;
          table_id: string | null;
          order_number: string;
          status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          special_instructions: string | null;
          estimated_time: number | null;
          payment_status: string;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          special_instructions: string | null;
          created_at: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          restaurant_id: string;
          order_id: string | null;
          customer_id: string | null;
          rating: number;
          comment: string | null;
          service_rating: number | null;
          food_rating: number | null;
          ambiance_rating: number | null;
          created_at: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']; 