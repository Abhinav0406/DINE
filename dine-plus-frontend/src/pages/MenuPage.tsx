import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MenuItem } from '../types';
import { supabase } from '../lib/supabase';

import EnhancedMenuCard from '../components/EnhancedMenuCard';

// Simple 4-category system
const MAIN_CATEGORIES = [
  {
    id: 'beverages',
    name: 'Beverages',
    subcategories: ['Beverages', 'Shakes & Cold Beverages', 'Mocktails', 'Coffee']
  },
  {
    id: 'starters',
    name: 'Starters & Snacks',
    subcategories: ['Soups', 'Starters', 'Chaats', 'Mumbai Specialities']
  },
  {
    id: 'mains',
    name: 'Main Course',
    subcategories: ['Chinese', 'Indian Curries', 'Tandoor', 'Rice Bowls', 'Sizzlers', 'Baos']
  },
  {
    id: 'desserts',
    name: 'Desserts & More',
    subcategories: ['Desserts', 'Ice Cream', 'Sweets']
  }
];

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentTable, 
    cart, 
    cartTotal,
    menuCategories, 
    menuItems, 
    setMenuCategories,
    setMenuItems,
    addToCart,
    updateCartItemQuantity,
    setLoading,
    setError 
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (!currentTable) {
      navigate('/tables');
      return;
    }
    fetchMenuData();
  }, [currentTable, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;
      setMenuCategories(categoriesData || []);

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories (
            id,
            name
          )
        `)
        .eq('is_available', true)
        .order('sort_order');

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);
    } catch (error) {
      setError('Failed to load menu');
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group menu items by main categories
  const getItemsByMainCategory = (mainCategoryId: string) => {
    const mainCategory = MAIN_CATEGORIES.find(cat => cat.id === mainCategoryId);
    if (!mainCategory) return [];

    return menuItems.filter(item => {
      const itemCategory = menuCategories.find(cat => cat.id === item.category_id);
      return itemCategory && mainCategory.subcategories.includes(itemCategory.name);
    });
  };

  // Get filtered items based on selected category
  const filteredItems = selectedCategory 
    ? getItemsByMainCategory(selectedCategory)
    : menuItems;

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
    });
  };

  const getItemInCart = (itemId: string) => {
    return cart.find(item => item.menu_item_id === itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/cream-centre-logo.png" 
                alt="Cream Centre" 
                className="h-8 w-auto" 
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Our Menu</h1>
                <p className="text-xs text-gray-600">Table {currentTable?.table_number}</p>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="hidden md:flex items-center px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm border border-yellow-400/20"
                   style={{
                     background: 'linear-gradient(135deg, #d4af37 0%, #ffbf00 100%)',
                     color: 'white',
                     boxShadow: '0 4px 16px rgba(212, 175, 55, 0.2)'
                   }}>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                </svg>
                {cart.length} items • ₹{cartTotal}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple 4-Category Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {MAIN_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl font-semibold transition-all duration-300 border backdrop-blur-sm ${
                  selectedCategory === category.id
                    ? 'text-white shadow-xl transform scale-105 border-yellow-400/20'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:transform hover:scale-[1.02]'
                }`}
                style={selectedCategory === category.id ? {
                  background: 'linear-gradient(135deg, #d4af37 0%, #ffbf00 100%)',
                  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)'
                } : {}}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
        {/* Category Info */}
        {selectedCategory && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {MAIN_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
            </h2>
            <p className="text-gray-600 text-sm">
              {filteredItems.length} items available
            </p>
          </div>
        )}

        {/* Menu Items List */}
        <div className="space-y-2 pb-20">
          {filteredItems.map(item => {
            const cartItem = getItemInCart(item.id);
            return (
              <EnhancedMenuCard
                key={item.id}
                item={item}
                cartQuantity={cartItem ? cartItem.quantity : 0}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={(itemId, newQuantity) => {
                  updateCartItemQuantity(itemId, newQuantity);
                }}
              />
            );
          })}
          
          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600 mb-4">Try selecting a different category</p>
              <button 
                onClick={() => setSelectedCategory('')}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                View all items
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Button - Always Visible on Mobile */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl border border-yellow-400/20 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #ffbf00 100%)',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/25 rounded-full p-2.5 mr-4 backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold tracking-wide">View Cart</div>
                  <div className="text-sm text-white/90 font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)} items selected</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold tracking-tight">₹{cartTotal}</div>
                <div className="text-xs text-white/80 font-medium">Total</div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Desktop Cart Button - Bottom Right */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 hidden md:block">
          <button
            onClick={() => navigate('/cart')}
            className="text-white font-semibold py-3 px-6 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-yellow-400/20 backdrop-blur-sm flex items-center space-x-3"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #ffbf00 100%)',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="bg-white/25 rounded-full p-2 backdrop-blur-sm">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="font-bold text-sm tracking-wide">Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})</div>
              <div className="font-bold text-lg tracking-tight">₹{cartTotal}</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuPage; 