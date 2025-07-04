import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MenuItem } from '../types';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, Search, Filter, Leaf, Flame, Star, Egg, Drumstick, PhoneCall, Menu as MenuIcon, ClipboardList, X as CloseIcon } from 'lucide-react';

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
  const [filterEgg, setFilterEgg] = useState(false);
  const [filterNonVeg, setFilterNonVeg] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    if (selectedCategory && item.category_id !== selectedCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterVegetarian && !item.is_vegetarian) return false;
    if (filterSpicy && !item.is_spicy) return false;
    if (filterEgg && !item.name.toLowerCase().includes('egg')) return false;
    if (filterNonVeg && item.is_vegetarian) return false;
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
    <div className="min-h-screen bg-background-light flex flex-col">
      {/* Header */}
      <div className="bg-primary-50 shadow-md border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <a href="https://creamcentre.com/" target="_blank" rel="noopener noreferrer">
            <img src="/images/cream-centre-logo.png" alt="Cream Centre Logo" className="h-10 w-auto mr-4" style={{filter: 'drop-shadow(0 2px 4px #daa52033)'}} />
          </a>
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary-400 tracking-wide">Our Menu</h1>
            <p className="text-sm text-primary-900 font-sans">Table {currentTable?.table_number}</p>
          </div>
        </div>
      </div>
      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 flex-row max-w-7xl mx-auto w-full px-2 py-2 gap-4">
        {/* Static Glassmorphic Sidebar for Categories (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-56 pt-8 pl-4 pr-6 sticky top-24 max-h-[80vh] overflow-y-auto z-10" style={{marginLeft: '8px'}}>
          <div className="backdrop-blur-xl bg-white/60 border-l-0 border-r-2 border-primary-200 shadow-lg rounded-3xl p-4 flex flex-col gap-3 h-full overflow-y-auto" style={{boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.08)'}}>
            {menuCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-serif text-base border transition shadow-sm backdrop-blur-md w-full ${selectedCategory === cat.id ? 'bg-primary-100 border-primary-400 text-primary-900 scale-105 shadow-lg' : 'bg-white/70 border-primary-200 text-primary-400 hover:bg-primary-50'}`}
                style={{transition: 'all 0.2s cubic-bezier(.4,2,.6,1)'}}
              >
                <span className="truncate w-44 text-left">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity lg:hidden" onClick={() => setSidebarOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-2xl flex flex-col gap-4 pt-8 px-6 transition-transform duration-300 lg:hidden animate-slide-in max-h-screen overflow-y-auto">
              <button className="self-end mb-4 text-primary-400 hover:text-primary-600" onClick={() => setSidebarOpen(false)}>
                <CloseIcon className="w-7 h-7" />
              </button>
              <div className="flex flex-col gap-3 overflow-y-auto" style={{maxHeight: 'calc(100vh - 5rem)'}}>
                {menuCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSidebarOpen(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-serif text-base border transition shadow-sm w-full ${selectedCategory === cat.id ? 'bg-primary-100 border-primary-400 text-primary-900 scale-105 shadow-lg' : 'bg-white border-primary-200 text-primary-400 hover:bg-primary-50'}`}
                  >
                    <span className="truncate w-44 text-left">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3 pb-24 pt-2 w-full min-w-0">
          {filteredItems.map(item => {
            const cartItem = getItemInCart(item.id);
            const isFeatured = item.is_featured;
            return (
              <div key={item.id}
                className={`relative bg-white/90 rounded-2xl border border-primary-100 shadow-card flex flex-row items-center gap-2 overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1 ${isFeatured ? 'border-2 border-primary-200' : ''} ${window.innerWidth < 640 ? 'p-2' : 'p-4'}`}
                style={{boxShadow: '0 4px 24px 0 rgba(218,165,32,0.07)', minHeight: '80px', maxHeight: '110px'}}
              >
                {/* Image */}
                <div className="flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 mr-2">
                  <div className="rounded-full border-2 border-primary-200 shadow bg-primary-50 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
                    ) : (
                      <Star className="w-8 h-8 text-amber-200" />
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center p-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.is_vegetarian && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center"><Leaf className="w-3 h-3 mr-1" />Veg</span>}
                    {item.is_spicy && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center"><Flame className="w-3 h-3 mr-1" />Spicy</span>}
                  </div>
                  <h3 className="font-serif text-base font-bold text-primary-400 leading-tight mb-0.5 truncate">{item.name}</h3>
                  <p className="text-primary-900 text-xs mb-1 font-sans line-clamp-1 truncate">{item.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-base font-bold text-primary-200 font-sans tracking-wide flex items-center gap-1">
                      <span className="text-sm">₹</span>{item.price}
                    </span>
                    {cartItem ? (
                      <div className="flex items-center bg-primary-100 rounded-full shadow-inner animate-pulse-gentle">
                        <button onClick={() => { const newQuantity = cartItem.quantity - 1; if (newQuantity > 0) { addToCart({ menu_item_id: item.id, name: item.name, price: item.price, quantity: -1, image_url: item.image_url, }); } }} className="p-1 text-primary-400 hover:bg-primary-200 rounded-l-full transition-all duration-200"><Minus className="w-4 h-4" /></button>
                        <span className="px-2 py-1 text-primary-400 font-bold font-sans">{cartItem.quantity}</span>
                        <button onClick={() => handleAddToCart(item)} className="p-1 text-primary-400 hover:bg-primary-200 rounded-r-full transition-all duration-200"><Plus className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleAddToCart(item)} className="flex items-center px-3 py-1 text-sm font-serif rounded-full bg-primary-200 text-primary-900 shadow-md hover:bg-primary-300 hover:scale-105 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-200 active:scale-95">
                        <Plus className="w-4 h-4 mr-1 group-hover:animate-bounce" />Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <img src="/images/cream-centre-logo.png" alt="No items" className="mx-auto mb-4 opacity-20 w-32 h-32 object-contain" />
              <h3 className="text-lg font-serif font-bold text-primary-400 mb-2">No items found</h3>
              <p className="text-primary-900 font-sans">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
      {/* Bottom Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-primary-400 shadow-2xl z-30 flex justify-center items-center py-3 px-4 rounded-t-2xl max-w-2xl mx-auto w-full animate-fade-in gap-2">
        {/* Hamburger only on mobile */}
        <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center bg-white hover:bg-primary-100 text-primary-400 font-bold text-lg px-4 py-3 rounded-full shadow-lg transition-all duration-200 lg:hidden">
          <MenuIcon className="w-6 h-6" />
        </button>
        <button onClick={() => navigate('/cart')} className="flex items-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-primary-900 font-bold text-lg px-8 py-3 rounded-full shadow-lg transition-all duration-200 relative">
          <ShoppingCart className="w-6 h-6" />
          View Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
          <span className="ml-2 text-base font-semibold">₹{cartTotal.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};

export default MenuPage; 