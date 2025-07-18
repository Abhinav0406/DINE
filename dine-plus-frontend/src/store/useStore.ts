import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreState, CartItem, User, Table, Order, MenuCategory, MenuItem, OrderStage } from '../types';
// import { supabase } from '../lib/supabase';

// Separate the store into persisted and non-persisted parts
const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Persisted state
      user: null,
      isAuthenticated: false,
      currentTable: null,
      currentOrder: null,
      cart: [],
      cartTotal: 0,
      stagedOrder: {
        currentStage: 'starters',
        sessionOrderId: null,
        stageItems: {
          starters: [],
          main_course: [],
          desserts: []
        },
        completedStages: [],
        isFinalized: false
      },

      // Non-persisted state (will be reset on page reload)
      loading: false,
      error: null,
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

        const newCart = cart.map(cartItem =>
          cartItem.menu_item_id === menuItemId
            ? { ...cartItem, quantity }
            : cartItem
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

      // Staged ordering actions
      initializeStagedOrder: async (tableId: string) => {
        try {
          set({ loading: true, error: null });
          console.log('Initializing staged order for table:', tableId);

          // Check for existing order session
          const response = await fetch(`http://localhost:4000/api/orders/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              table_id: tableId
            }),
          });

          console.log('Response status:', response.status);
          const responseData = await response.json();
          console.log('Response data:', responseData);

          if (!response.ok) {
            throw new Error(responseData.error || 'Failed to initialize order session');
          }

          const { session } = responseData;

          if (!session || !session.id) {
            throw new Error('Invalid session data received');
          }

          set({
            stagedOrder: {
              currentStage: session.stage,
              sessionOrderId: session.id,
              stageItems: {
                starters: [],
                main_course: [],
                desserts: []
              },
              completedStages: [],
              isFinalized: false
            },
            currentOrder: {
              id: session.id,
              restaurant_id: 'default-restaurant-id',
              customer_id: null,
              table_id: session.tableId,
              order_number: session.orderNumber,
              status: session.status || 'staged',
              status_text: 'staged',
              order_items: [],
              subtotal: 0,
              tax_amount: 0,
              total_amount: 0,
              special_instructions: null,
              estimated_time: null,
              payment_status: 'pending',
              payment_method: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
          });
        } catch (error) {
          console.error('Error initializing staged order:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to initialize staged ordering' });
        } finally {
          set({ loading: false });
        }
      },

      addToStage: (stage: OrderStage, item: CartItem) => {
        const { stagedOrder } = get();
        const existingItem = stagedOrder.stageItems[stage].find(stageItem => stageItem.menu_item_id === item.menu_item_id);

        let newStageItems;
        if (existingItem) {
          newStageItems = stagedOrder.stageItems[stage].map(stageItem =>
            stageItem.menu_item_id === item.menu_item_id
              ? { ...stageItem, quantity: stageItem.quantity + item.quantity }
              : stageItem
          );
        } else {
          newStageItems = [...stagedOrder.stageItems[stage], item];
        }

        set({
          stagedOrder: {
            ...stagedOrder,
            stageItems: {
              ...stagedOrder.stageItems,
              [stage]: newStageItems
            }
          }
        });
      },

      removeFromStage: (stage: OrderStage, menuItemId: string) => {
        const { stagedOrder } = get();
        const newStageItems = stagedOrder.stageItems[stage].filter(item => item.menu_item_id !== menuItemId);

        set({
          stagedOrder: {
            ...stagedOrder,
            stageItems: {
              ...stagedOrder.stageItems,
              [stage]: newStageItems
            }
          }
        });
      },

      updateStageItemQuantity: (stage: OrderStage, menuItemId: string, quantity: number) => {
        const { stagedOrder } = get();
        if (quantity <= 0) {
          get().removeFromStage(stage, menuItemId);
          return;
        }

        const newStageItems = stagedOrder.stageItems[stage].map(stageItem =>
          stageItem.menu_item_id === menuItemId
            ? { ...stageItem, quantity }
            : stageItem
        );

        set({
          stagedOrder: {
            ...stagedOrder,
            stageItems: {
              ...stagedOrder.stageItems,
              [stage]: newStageItems
            }
          }
        });
      },

      clearStage: (stage: OrderStage) => {
        const { stagedOrder } = get();
        set({
          stagedOrder: {
            ...stagedOrder,
            stageItems: {
              ...stagedOrder.stageItems,
              [stage]: []
            }
          }
        });
      },

      moveToNextStage: async () => {
        try {
          const { stagedOrder } = get();
          
          if (!stagedOrder.sessionOrderId) {
            throw new Error('No active order session');
          }

          // Save current stage items to backend
          const currentStageItems = stagedOrder.stageItems[stagedOrder.currentStage];
          if (currentStageItems.length > 0) {
            const response = await fetch(`http://localhost:4000/api/orders/${stagedOrder.sessionOrderId}/items`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                items: currentStageItems.map(item => ({
                  menu_item_id: item.menu_item_id,
                  quantity: item.quantity,
                  unit_price: item.price,
                  special_instructions: null
                })),
                stage: stagedOrder.currentStage
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to save stage items');
            }
          }

          // Determine next stage
          const stageOrder: OrderStage[] = ['starters', 'main_course', 'desserts'];
          const currentIndex = stageOrder.indexOf(stagedOrder.currentStage);
          const nextStage = stageOrder[currentIndex + 1];

          if (nextStage) {
            set({
              stagedOrder: {
                ...stagedOrder,
                currentStage: nextStage,
                completedStages: [...stagedOrder.completedStages, stagedOrder.currentStage]
              }
            });
          }
        } catch (error) {
          set({ error: 'Failed to move to next stage' });
        }
      },

      moveToPreviousStage: () => {
        const { stagedOrder } = get();
        const stageOrder: OrderStage[] = ['starters', 'main_course', 'desserts'];
        const currentIndex = stageOrder.indexOf(stagedOrder.currentStage);
        const previousStage = stageOrder[currentIndex - 1];

        if (previousStage) {
          set({
            stagedOrder: {
              ...stagedOrder,
              currentStage: previousStage,
              completedStages: stagedOrder.completedStages.filter(stage => stage !== previousStage)
            }
          });
        }
      },

      finalizeOrder: async () => {
        try {
          const { stagedOrder } = get();
          
          if (!stagedOrder.sessionOrderId) {
            throw new Error('No active order session');
          }

          // Save current stage items if any
          const currentStageItems = stagedOrder.stageItems[stagedOrder.currentStage];
          if (currentStageItems.length > 0) {
            await fetch(`http://localhost:4000/api/orders/${stagedOrder.sessionOrderId}/items`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                items: currentStageItems.map(item => ({
                  menu_item_id: item.menu_item_id,
                  quantity: item.quantity,
                  unit_price: item.price,
                  special_instructions: null
                })),
                stage: stagedOrder.currentStage
              }),
            });
          }

          // Finalize the order
          const response = await fetch(`http://localhost:4000/api/orders/${stagedOrder.sessionOrderId}/finalize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to finalize order');
          }

          const { order } = await response.json();

          // Combine all items from all stages into the cart
          const allItems = [
            ...stagedOrder.stageItems.starters,
            ...stagedOrder.stageItems.main_course,
            ...stagedOrder.stageItems.desserts
          ];

          // Calculate total
          const cartTotal = allItems.reduce((total, item) => total + (item.price * item.quantity), 0);

          set({
            stagedOrder: {
              ...stagedOrder,
              currentStage: 'finalized',
              isFinalized: true
            },
            currentOrder: order,
            cart: allItems,
            cartTotal: cartTotal
          });
        } catch (error) {
          set({ error: 'Failed to finalize order' });
        }
      },

      resetStagedOrder: () => {
        set({
          stagedOrder: {
            currentStage: 'starters',
            sessionOrderId: null,
            stageItems: {
              starters: [],
              main_course: [],
              desserts: []
            },
            completedStages: [],
            isFinalized: false
          },
          currentOrder: null
        });
      },

      // Data actions
      setMenuCategories: (categories: MenuCategory[]) => {
        set({ menuCategories: categories });
      },

      setMenuItems: (items: MenuItem[]) => {
        set({ menuItems: items });
      },

      setTables: (tables: Table[]) => {
        set({ tables: tables });
      },

      setOrders: (orders: Order[]) => {
        set({ orders: orders });
      },

      // Loading actions
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'dine-plus-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentTable: state.currentTable,
        currentOrder: state.currentOrder,
        cart: state.cart,
        cartTotal: state.cartTotal,
        stagedOrder: state.stagedOrder
      })
    }
  )
);

export { useStore };