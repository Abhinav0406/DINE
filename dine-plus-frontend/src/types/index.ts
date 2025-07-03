// Core Types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer' | 'staff' | 'admin' | 'kitchen_staff';
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: any;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  position: { x: number; y: number } | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
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
  menu_categories?: MenuCategory;
}

export interface Order {
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
  order_items?: OrderItem[];
  tables?: Table;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  created_at: string;
  menu_items?: MenuItem;
}

export interface Feedback {
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
  orders?: Order;
}

// Cart Types
export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  special_instructions?: string;
}

// Store Types
export interface StoreState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Current session
  currentTable: Table | null;
  currentOrder: Order | null;
  
  // Cart
  cart: CartItem[];
  cartTotal: number;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Data
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  
  // Actions
  setUser: (user: User | null) => void;
  setCurrentTable: (table: Table | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartItemQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMenuCategories: (categories: MenuCategory[]) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setTables: (tables: Table[]) => void;
  setOrders: (orders: Order[]) => void;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Analytics Types
export interface OrderAnalytics {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  preparing_orders: number;
  ready_orders: number;
}

export interface FeedbackAnalytics {
  total_feedback: number;
  average_rating: number;
  average_service_rating: number;
  average_food_rating: number;
  average_ambiance_rating: number;
  rating_distribution: { [key: number]: number };
}

export interface TableOccupancy {
  total_tables: number;
  available: number;
  occupied: number;
  reserved: number;
  occupancy_rate: string;
} 