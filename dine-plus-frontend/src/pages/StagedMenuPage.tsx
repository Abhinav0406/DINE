import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MenuItem, OrderStage } from '../types';
import { supabase } from '../lib/supabase';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  ChefHat, 
  Utensils, 
  Cookie, 
  ArrowRight, 
  ArrowLeft,
  Check,
  CreditCard,
  Leaf,
  Flame,
  Star,
  Clock,
  Search,
  Filter,
  Menu as MenuIcon,
  X as CloseIcon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface StageConfig {
  stage: OrderStage;
  title: string;
  description: string;
  icon: React.ReactNode;
  categoryNames: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const stageConfigs: StageConfig[] = [
  {
    stage: 'starters',
    title: 'Soups & Starters',
    description: 'Begin your culinary journey with our delicious starters',
    icon: <ChefHat className="w-6 h-6" />,
    categoryNames: ['Soups', 'Starters', 'Chaats', 'Mumbai Specialities', 'Appetizers'],
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    stage: 'main_course',
    title: 'Main Course',
    description: 'Savor our hearty main dishes and specialties',
    icon: <Utensils className="w-6 h-6" />,
    categoryNames: ['Indian Curries', 'Chinese', 'Tandoor', 'Rice & Biryani', 'Breads', 'Mexican', 'Italian', 'Main Course'],
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    stage: 'desserts',
    title: 'Desserts & Beverages',
    description: 'Complete your meal with our sweet delights',
    icon: <Cookie className="w-6 h-6" />,
    categoryNames: ['Desserts', 'Beverages', 'Shakes & Cold Beverages'],
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

const StagedMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentTable,
    stagedOrder,
    menuCategories,
    menuItems,
    loading,
    error,
    setMenuCategories,
    setMenuItems,
    setLoading,
    setError,
    initializeStagedOrder,
    addToStage,
    removeFromStage,
    updateStageItemQuantity,
    moveToNextStage,
    moveToPreviousStage,
    finalizeOrder,
    resetStagedOrder
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterSpicy, setFilterSpicy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initial setup effect
  useEffect(() => {
    const initializeStageMenu = async () => {
      console.log('Initializing stage menu with table:', currentTable);
      if (!currentTable) {
        console.log('No table selected, redirecting to table selection');
        navigate('/tables');
        return;
      }

      try {
        setIsInitializing(true);
        // Initialize staged order if needed
        if (!stagedOrder.sessionOrderId || stagedOrder.currentStage === 'finalized') {
          console.log('No session order ID or finalized stage, initializing staged order');
          await initializeStagedOrder(currentTable.id);
        }
        
        // Fetch menu data
        await fetchMenuData();
      } catch (error) {
        console.error('Error during initialization:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize menu');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStageMenu();
  }, [currentTable, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      console.log('Fetching menu data...');
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }
      
      // Log all category names to help debug the matching
      console.log('Available category names:', categoriesData?.map(cat => cat.name));
      setMenuCategories(categoriesData || []);

      // Fetch menu items with their categories
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_categories!inner (
            id,
            name
          )
        `)
        .eq('is_available', true)
        .order('name');

      if (itemsError) {
        console.error('Error fetching menu items:', itemsError);
        throw itemsError;
      }
      
      // Log menu items grouped by category
      const itemsByCategory = itemsData?.reduce((acc, item) => {
        const catName = item.menu_categories?.name || 'Uncategorized';
        acc[catName] = acc[catName] || [];
        acc[catName].push(item.name);
        return acc;
      }, {} as Record<string, string[]>);
      
      console.log('Items by category:', itemsByCategory);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError('Failed to load menu');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Filter items effect
  useEffect(() => {
    const filterItems = () => {
      // Skip filtering if still initializing
      if (isInitializing) {
        return;
      }

      // Reset the stage if it's finalized
      if (stagedOrder.currentStage === 'finalized') {
        initializeStagedOrder(currentTable?.id || '');
        return;
      }

      const currentStageConfig = stageConfigs.find(config => config.stage === stagedOrder.currentStage);
      console.log('Filtering items for stage:', stagedOrder.currentStage, 'config:', currentStageConfig);
      
      if (!currentStageConfig) {
        console.warn('No stage config found for stage:', stagedOrder.currentStage);
        setFilteredItems([]);
        return;
      }

      const stageCategories = menuCategories.filter(cat => 
        currentStageConfig.categoryNames.includes(cat.name)
      );
      console.log('Stage categories:', stageCategories.map(cat => cat.name));

      const stageCategoryIds = stageCategories.map(cat => cat.id);
      console.log('Stage category IDs:', stageCategoryIds);
      console.log('Total menu items:', menuItems.length);

      const items = menuItems.filter(item => {
        const matchesCategory = stageCategoryIds.includes(item.category_id || '');
        const matchesSearch = !searchQuery || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVeg = !filterVegetarian || item.is_vegetarian;
        const matchesSpicy = !filterSpicy || item.is_spicy;
        const matchesSelectedCategory = !selectedCategory || item.category_id === selectedCategory;

        if (matchesCategory) {
          console.log('Item matches stage:', item.name, {
            categoryId: item.category_id,
            matchesSearch,
            matchesVeg,
            matchesSpicy,
            matchesSelectedCategory
          });
        }

        return matchesCategory && 
               matchesSearch && 
               matchesVeg && 
               matchesSpicy && 
               matchesSelectedCategory;
      });

      console.log('Filtered items:', items.length, 'items match filters');
      setFilteredItems(items);
    };

    filterItems();
  }, [
    stagedOrder.currentStage,
    menuCategories,
    menuItems,
    selectedCategory,
    searchQuery,
    filterVegetarian,
    filterSpicy,
    isInitializing,
    currentTable,
    initializeStagedOrder
  ]);

  const handleAddToStage = (item: MenuItem) => {
    addToStage(stagedOrder.currentStage, {
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
    });
  };

  const getItemInStage = (itemId: string) => {
    return stagedOrder.stageItems[stagedOrder.currentStage].find(item => item.menu_item_id === itemId);
  };

  const getStageTotal = (stage: OrderStage) => {
    return stagedOrder.stageItems[stage].reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = (stage: OrderStage) => {
    return stagedOrder.stageItems[stage].reduce((total, item) => total + item.quantity, 0);
  };

  const getCurrentStageConfig = () => {
    return stageConfigs.find(config => config.stage === stagedOrder.currentStage);
  };

  const getStageCategories = () => {
    const currentStageConfig = getCurrentStageConfig();
    if (!currentStageConfig) return [];
    
    return menuCategories.filter(cat => 
      currentStageConfig.categoryNames.includes(cat.name)
    );
  };

  const handleNextStage = async () => {
    const currentItems = getTotalItems(stagedOrder.currentStage);
    
    // Don't allow proceeding if no items selected
    if (currentItems === 0) {
      setError('Please select at least one item before proceeding');
      return;
    }

    if (stagedOrder.currentStage === 'desserts') {
      // If we're at desserts (last stage), finalize and go to order status
      await finalizeOrder();
      navigate(`/order-status/${stagedOrder.sessionOrderId}`);
    } else {
      // Move to next stage
      await moveToNextStage();
    }
  };

  if (loading || isInitializing) {
    return <LoadingSpinner text="Loading menu..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const currentStageConfig = getCurrentStageConfig();
  if (!currentStageConfig) return null;

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      {/* Header */}
      <div className="bg-primary-50 shadow-md border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <a href="https://creamcentre.com/" target="_blank" rel="noopener noreferrer">
              <img src="/images/cream-centre-logo.png" alt="Cream Centre Logo" className="h-10 w-auto mr-4" style={{filter: 'drop-shadow(0 2px 4px #daa52033)'}} />
            </a>
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-400 tracking-wide">{currentStageConfig.title}</h1>
              <p className="text-sm text-primary-900 font-sans">Table {currentTable?.table_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-primary-400 hover:bg-primary-100 rounded-full"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterVegetarian(!filterVegetarian)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full border ${filterVegetarian ? 'bg-green-100 border-green-200 text-green-700' : 'border-gray-200 text-gray-600'}`}
            >
              <Leaf className="w-4 h-4" />
              <span className="text-sm">Veg</span>
            </button>
            <button
              onClick={() => setFilterSpicy(!filterSpicy)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full border ${filterSpicy ? 'bg-red-100 border-red-200 text-red-700' : 'border-gray-200 text-gray-600'}`}
            >
              <Flame className="w-4 h-4" />
              <span className="text-sm">Spicy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 flex-row max-w-7xl mx-auto w-full px-2 py-2 gap-4">
        {/* Static Glassmorphic Sidebar for Categories (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-60 pt-8 pl-4 pr-6 sticky top-24 max-h-[80vh] overflow-y-auto z-20" style={{marginLeft: '8px'}}>
          <div className="backdrop-blur-2xl bg-white/50 border-l-0 border-r-4 rounded-3xl p-5 flex flex-col gap-4 h-full overflow-y-auto premium-sidebar-border premium-sidebar-shadow premium-sidebar-glow">
            {getStageCategories().map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-serif text-lg border-2 transition shadow-md w-full premium-category-btn ${selectedCategory === cat.id ? 'bg-gradient-to-r from-yellow-100 via-yellow-50 to-white border-yellow-400 text-yellow-700 scale-105 shadow-xl' : 'bg-white/60 border-yellow-200 text-primary-400 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-700'}`}
                style={{transition: 'all 0.2s cubic-bezier(.4,2,.6,1)'}}
              >
                <span className="text-lg">🍽️</span>
                <span className="truncate w-44 text-left font-semibold tracking-wide">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity lg:hidden" onClick={() => setSidebarOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-72 bg-white/60 z-50 shadow-2xl flex flex-col gap-4 pt-10 px-7 transition-transform duration-300 lg:hidden animate-slide-in max-h-screen overflow-y-auto premium-sidebar-border premium-sidebar-shadow premium-sidebar-glow backdrop-blur-2xl">
              <button className="self-end mb-4 text-yellow-400 hover:text-yellow-600" onClick={() => setSidebarOpen(false)}>
                <CloseIcon className="w-7 h-7" />
              </button>
              <div className="flex flex-col gap-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 5rem)'}}>
                {getStageCategories().map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-serif text-lg border-2 transition shadow-md w-full premium-category-btn ${selectedCategory === cat.id ? 'bg-gradient-to-r from-yellow-100 via-yellow-50 to-white border-yellow-400 text-yellow-700 scale-105 shadow-xl' : 'bg-white/60 border-yellow-200 text-primary-400 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-700'}`}
                    style={{transition: 'all 0.2s cubic-bezier(.4,2,.6,1)'}}
                  >
                    <span className="text-lg">🍽️</span>
                    <span className="truncate w-44 text-left font-semibold tracking-wide">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3 pb-24 pt-2 w-full min-w-0">
          {filteredItems.map(item => {
            const stageItem = getItemInStage(item.id);
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
                    {stageItem ? (
                      <div className="flex items-center bg-primary-100 rounded-full shadow-inner animate-pulse-gentle">
                        <button onClick={() => { const newQuantity = stageItem.quantity - 1; if (newQuantity > 0) { updateStageItemQuantity(stagedOrder.currentStage, item.id, newQuantity); } else { removeFromStage(stagedOrder.currentStage, item.id); } }} className="p-1 text-primary-400 hover:bg-primary-200 rounded-l-full transition-all duration-200"><Minus className="w-4 h-4" /></button>
                        <span className="px-2 py-1 text-primary-400 font-bold font-sans">{stageItem.quantity}</span>
                        <button onClick={() => handleAddToStage(item)} className="p-1 text-primary-400 hover:bg-primary-200 rounded-r-full transition-all duration-200"><Plus className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => handleAddToStage(item)} className="flex items-center px-3 py-1 text-sm font-serif rounded-full bg-primary-200 text-primary-900 shadow-md hover:bg-primary-300 hover:scale-105 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary-200 active:scale-95">
                        <Plus className="w-4 h-4 mr-1 group-hover:animate-bounce" />Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={moveToPreviousStage}
            disabled={stagedOrder.currentStage === 'starters'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-serif ${stagedOrder.currentStage === 'starters' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`}
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500">Stage Total</span>
            <span className="text-lg font-bold text-primary-700">₹{getStageTotal(stagedOrder.currentStage)}</span>
          </div>
          <button
            onClick={handleNextStage}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-serif text-white bg-yellow-500 hover:bg-yellow-600 transition-colors"
          >
            {stagedOrder.currentStage === 'desserts' ? (
              <>
                Proceed to Payment
                <CreditCard className="w-5 h-5" />
              </>
            ) : (
              <>
                Next Course
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StagedMenuPage;