import React from 'react';
import { OrderStage } from '../types';
import { useStore } from '../store/useStore';
import { ChefHat, Utensils, Cookie, Check, ArrowRight, Edit2, X } from 'lucide-react';

interface StageNavigationProps {
  onStageChange?: (stage: OrderStage) => void;
  showEditOptions?: boolean;
  compact?: boolean;
}

interface StageConfig {
  stage: OrderStage;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const stageConfigs: StageConfig[] = [
  {
    stage: 'starters',
    title: 'Starters & Appetizers',
    shortTitle: 'Starters',
    icon: <ChefHat className="w-5 h-5" />,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    stage: 'main_course',
    title: 'Main Course',
    shortTitle: 'Main Course',
    icon: <Utensils className="w-5 h-5" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    stage: 'desserts',
    title: 'Desserts & Treats',
    shortTitle: 'Desserts',
    icon: <Cookie className="w-5 h-5" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

const StageNavigation: React.FC<StageNavigationProps> = ({ 
  onStageChange, 
  showEditOptions = false, 
  compact = false 
}) => {
  const { 
    stagedOrder, 
    removeFromStage, 
    updateStageItemQuantity,
    clearStage 
  } = useStore();

  const getStageTotal = (stage: OrderStage) => {
    return stagedOrder.stageItems[stage].reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = (stage: OrderStage) => {
    return stagedOrder.stageItems[stage].reduce((total, item) => total + item.quantity, 0);
  };

  const getStageStatus = (stage: OrderStage) => {
    if (stagedOrder.completedStages.includes(stage)) {
      return 'completed';
    } else if (stage === stagedOrder.currentStage) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  const handleStageClick = (stage: OrderStage) => {
    if (onStageChange && (stagedOrder.completedStages.includes(stage) || stage === stagedOrder.currentStage)) {
      onStageChange(stage);
    }
  };

  const handleRemoveItem = (stage: OrderStage, menuItemId: string) => {
    removeFromStage(stage, menuItemId);
  };

  const handleUpdateQuantity = (stage: OrderStage, menuItemId: string, quantity: number) => {
    updateStageItemQuantity(stage, menuItemId, quantity);
  };

  const handleClearStage = (stage: OrderStage) => {
    if (window.confirm(`Are you sure you want to clear all items from ${stageConfigs.find(c => c.stage === stage)?.title}?`)) {
      clearStage(stage);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white border-b">
        <div className="flex items-center space-x-4">
          {stageConfigs.map((config, index) => {
            const status = getStageStatus(config.stage);
            const items = getTotalItems(config.stage);
            const total = getStageTotal(config.stage);
            
            return (
              <div key={config.stage} className="flex items-center">
                <button
                  onClick={() => handleStageClick(config.stage)}
                  disabled={status === 'upcoming'}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                    ${status === 'current' 
                      ? `${config.bgColor} ${config.borderColor} ${config.color} border-2` 
                      : status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    {status === 'completed' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      config.icon
                    )}
                  </div>
                  <span className="text-sm font-medium">{config.shortTitle}</span>
                  {items > 0 && (
                    <span className="text-xs bg-white rounded-full px-2 py-1">
                      {items}
                    </span>
                  )}
                </button>
                
                {index < stageConfigs.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-sm text-gray-600">
          Total: ₹{(getStageTotal('starters') + getStageTotal('main_course') + getStageTotal('desserts')).toFixed(2)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stage Progress */}
        <div className="flex items-center justify-between mb-6">
          {stageConfigs.map((config, index) => {
            const status = getStageStatus(config.stage);
            const items = getTotalItems(config.stage);
            const total = getStageTotal(config.stage);
            
            return (
              <div key={config.stage} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStageClick(config.stage)}
                    disabled={status === 'upcoming'}
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-full border-2 mb-2 transition-colors
                      ${status === 'current' 
                        ? `${config.bgColor} ${config.borderColor} ${config.color}` 
                        : status === 'completed'
                          ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      config.icon
                    )}
                  </button>
                  
                  <div className="text-center">
                    <div className={`text-sm font-medium ${
                      status === 'current' ? config.color : 
                      status === 'completed' ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {config.shortTitle}
                    </div>
                    <div className="text-xs text-gray-500">
                      {items} items • ₹{total.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {index < stageConfigs.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-gray-400 mx-4 mt-[-2rem]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Stage Items (Edit Mode) */}
        {showEditOptions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stageConfigs.map((config) => {
              const stageItems = stagedOrder.stageItems[config.stage];
              const status = getStageStatus(config.stage);
              
              if (stageItems.length === 0) return null;
              
              return (
                <div key={config.stage} className={`
                  border-2 rounded-lg p-4 ${config.borderColor} ${config.bgColor}
                `}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-medium ${config.color}`}>
                      {config.title}
                    </h3>
                    {status === 'completed' && (
                      <button
                        onClick={() => handleClearStage(config.stage)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {stageItems.map((item) => (
                      <div key={item.menu_item_id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        
                        {status === 'completed' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQuantity(config.stage, item.menu_item_id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <span className="text-sm">-</span>
                            </button>
                            <span className="text-sm font-medium px-2">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(config.stage, item.menu_item_id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <span className="text-sm">+</span>
                            </button>
                            <button
                              onClick={() => handleRemoveItem(config.stage, item.menu_item_id)}
                              className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center hover:bg-red-300 transition-colors text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      Stage Total: ₹{getStageTotal(config.stage).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StageNavigation; 