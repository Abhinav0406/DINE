import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoreState, CartItem, User, Table, Order, MenuCategory, MenuItem } from '../types';

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      isAuthenticated: false,

      // Current session
      currentTable: null,
      currentOrder: null,

      // Cart state
      cart: [],
      cartTotal: 0,

      // Loading states
      loading: false,
      error: null,

      // Data
      menuCategories: [],
      menuItems: [],
      tables: [],
      orders: [],

      // Auth actions
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      // Session actions
      setCurrentTable: (table: Table | null) => {
        set({ currentTable: table });
      },

      setCurrentOrder: (order: Order | null) => {
        set({ currentOrder: order });
      },

      // Cart actions
      addToCart: (item: CartItem) => {
        const { cart } = get();
        const existingItem = cart.find(cartItem => cartItem.menu_item_id === item.menu_item_id);

        let newCart;
        if (existingItem) {
          newCart = cart.map(cartItem =>
            cartItem.menu_item_id === item.menu_item_id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          );
        } else {
          newCart = [...cart, item];
        }

        const newCartTotal = newCart.reduce((total, cartItem) => total + (cartItem.price * cartItem.quantity), 0);

        set({
          cart: newCart,
          cartTotal: newCartTotal,
        });
      },

      removeFromCart: (menuItemId: string) => {
        const { cart } = get();
        const newCart = cart.filter(item => item.menu_item_id !== menuItemId);
        const newCartTotal = newCart.reduce((total, cartItem) => total + (cartItem.price * cartItem.quantity), 0);

        set({
          cart: newCart,
          cartTotal: newCartTotal,
        });
      },

      updateCartItemQuantity: (menuItemId: string, quantity: number) => {
        const { cart } = get();
        
        if (quantity <= 0) {
          get().removeFromCart(menuItemId);
          return;
        }

        const newCart = cart.map(item =>
          item.menu_item_id === menuItemId
            ? { ...item, quantity }
            : item
        );

        const newCartTotal = newCart.reduce((total, cartItem) => total + (cartItem.price * cartItem.quantity), 0);

        set({
          cart: newCart,
          cartTotal: newCartTotal,
        });
      },

      clearCart: () => {
        set({
          cart: [],
          cartTotal: 0,
        });
      },

      // Loading and error actions
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Data actions
      setMenuCategories: (categories: MenuCategory[]) => {
        set({ menuCategories: categories });
      },

      setMenuItems: (items: MenuItem[]) => {
        set({ menuItems: items });
      },

      setTables: (tables: Table[]) => {
        set({ tables });
      },

      setOrders: (orders: Order[]) => {
        set({ orders });
      },
    }),
    {
      name: 'dine-plus-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentTable: state.currentTable,
        cart: state.cart,
        cartTotal: state.cartTotal,
      }),
    }
  )
);