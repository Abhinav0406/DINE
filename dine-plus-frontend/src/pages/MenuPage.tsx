import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MenuItem } from '../types';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, Search, Filter, Leaf, Flame, Star } from 'lucide-react';

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
    setLoading,
    setError 
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterSpicy, setFilterSpicy] = useState(false);

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

  const filteredItems = menuItems.filter(item => {
    // Category filter
    if (selectedCategory && item.category_id !== selectedCategory) return false;
    
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Vegetarian filter
    if (filterVegetarian && !item.is_vegetarian) return false;
    
    // Spicy filter
    if (filterSpicy && !item.is_spicy) return false;
    
    return true;
  });

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
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Our Menu</h1>
              <p className="text-sm text-gray-600">Table {currentTable?.table_number}</p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => navigate('/cart')}
              className="relative btn-primary flex items-center"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile: Horizontal Scrollable Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 lg:hidden">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === '' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All Items
            </button>
            {menuCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {/* Sidebar: Desktop Only */}
          <div className="lg:w-64 space-y-6 hidden lg:block">
            {/* Search */}
            <div className="card p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            {/* Categories */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  All Items
                </button>
                {menuCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Filters */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Dietary Filters</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterVegetarian}
                    onChange={(e) => setFilterVegetarian(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Leaf className="w-4 h-4 ml-2 mr-1 text-green-600" />
                  <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterSpicy}
                    onChange={(e) => setFilterSpicy(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <Flame className="w-4 h-4 ml-2 mr-1 text-red-600" />
                  <span className="text-sm">Spicy</span>
                </label>
              </div>
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="card p-4 bg-primary-50 border-primary-200">
                <h3 className="font-semibold text-gray-900 mb-2">Cart Summary</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </p>
                <p className="text-lg font-bold text-primary-600">
                  ₹{cartTotal.toFixed(2)}
                </p>
                <button
                  onClick={() => navigate('/cart')}
                  className="btn-primary w-full mt-3"
                >
                  View Cart
                </button>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map(item => {
                const cartItem = getItemInCart(item.id);
                return (
                  <div key={item.id} className="card-hover overflow-hidden">
                    {/* Image */}
                    <div className="h-48 bg-gray-200 relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Star className="w-12 h-12" />
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.is_vegetarian && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                            <Leaf className="w-3 h-3 mr-1" />
                            Veg
                          </span>
                        )}
                        {item.is_spicy && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center">
                            <Flame className="w-3 h-3 mr-1" />
                            Spicy
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                        <span className="text-xl font-bold text-primary-600">
                          ₹{item.price}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {item.preparation_time} mins
                        </span>
                        
                        {cartItem ? (
                          <div className="flex items-center bg-primary-100 rounded-lg">
                            <button
                              onClick={() => {
                                const newQuantity = cartItem.quantity - 1;
                                if (newQuantity > 0) {
                                  addToCart({
                                    menu_item_id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    quantity: -1,
                                    image_url: item.image_url,
                                  });
                                }
                              }}
                              className="p-2 text-primary-600 hover:bg-primary-200 rounded-l-lg"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-2 text-primary-600 font-medium">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="p-2 text-primary-600 hover:bg-primary-200 rounded-r-lg"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="btn-primary flex items-center"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage; 