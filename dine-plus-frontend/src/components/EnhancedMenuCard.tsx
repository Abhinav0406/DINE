import React, { useState } from 'react';
import { MenuItem } from '../types';
import { Plus, Minus } from 'lucide-react';

interface EnhancedMenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  cartQuantity?: number;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  socialProof?: 'trending' | 'chef-choice' | 'popular';
  isLimitedTime?: boolean;
  originalPrice?: number;
}

const EnhancedMenuCard: React.FC<EnhancedMenuCardProps> = ({
  item,
  onAddToCart,
  cartQuantity = 0,
  onUpdateQuantity,
  socialProof,
  isLimitedTime,
  originalPrice
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Slightly longer for better feedback
    onAddToCart(item);
    setIsAdding(false);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (onUpdateQuantity && newQuantity >= 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  // Only show badge if truly important (Limited Time only)
  const showBadge = isLimitedTime || socialProof === 'popular';
  const badgeText = isLimitedTime ? 'Limited Time' : socialProof === 'popular' ? 'Popular' : '';
  const badgeColor = isLimitedTime ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className="clean-menu-card">
      <div className="card-wrapper">
        {/* Minimal Badge - Only for truly important items */}
        {showBadge && (
          <div className={`badge ${badgeColor}`}>
            {badgeText}
          </div>
        )}

        <div className="card-content">
          {/* Food Image */}
          <div className="food-image">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="food-img"
              />
            ) : (
              <div className="placeholder">
                🍽️
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="content">
            {/* Name FIRST - Most Important */}
            <h3 className="item-name">{item.name}</h3>

            {/* Price SECOND - Bold and Prominent */}
            <div className="price-section">
              <span className="current-price">₹{item.price}</span>
              {originalPrice && originalPrice > item.price && (
                <span className="original-price">₹{originalPrice}</span>
              )}
            </div>

            {/* Brief description if needed */}
            {item.description && (
              <p className="description">{item.description}</p>
            )}

            {/* Dietary indicators - minimal */}
            <div className="dietary-tags">
              {item.is_vegetarian && <span className="veg">🌱</span>}
              {item.is_spicy && <span className="spicy">🌶️</span>}
            </div>
          </div>

          {/* BOLD KEY ACTION - Prominent Add Button */}
          <div className="action-section">
            {cartQuantity > 0 ? (
              <div className="quantity-controls">
                <button 
                  className="qty-btn qty-decrease"
                  onClick={() => handleQuantityChange(cartQuantity - 1)}
                >
                  <Minus size={18} />
                </button>
                <span className="quantity">{cartQuantity}</span>
                <button 
                  className="qty-btn qty-increase"
                  onClick={() => handleQuantityChange(cartQuantity + 1)}
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`add-btn-bold ${isAdding ? 'adding' : ''}`}
              >
                <div className="btn-content">
                  <Plus size={20} className="btn-icon" />
                  <span className="btn-text">{isAdding ? 'Adding...' : 'Add'}</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .clean-menu-card {
          margin-bottom: 8px;
        }

        .card-wrapper {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .card-wrapper:hover {
          border-color: #ffd700;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.1);
        }

        /* Minimal badge - top-left only when important */
        .badge {
          position: absolute;
          top: 8px;
          left: 8px;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 6px;
          z-index: 1;
        }

        .card-content {
          display: flex;
          padding: 12px 16px;
          gap: 12px;
          align-items: center;
        }

        /* Food Image */
        .food-image {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          background: #f9fafb;
        }

        .food-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #9ca3af;
        }

        /* Content Section */
        .content {
          flex: 1;
          min-width: 0;
        }

        /* 1. Name FIRST - Most Important */
        .item-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* 2. Price SECOND */
        .price-section {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .current-price {
          font-size: 15px;
          font-weight: 700;
          color: #d4af37;
        }

        .original-price {
          font-size: 13px;
          color: #9ca3af;
          text-decoration: line-through;
        }

        /* 3. Description - Optional */
        .description {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Dietary Tags - Minimal */
        .dietary-tags {
          display: flex;
          gap: 4px;
        }

        .veg, .spicy {
          font-size: 12px;
        }

        /* Action Section */
        .action-section {
          flex-shrink: 0;
        }

        .add-btn-bold {
          background: #d4af37;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 60px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-btn-bold:hover {
          background: #b8941f;
        }

        .add-btn-bold.adding {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .btn-icon {
          flex-shrink: 0;
        }

        .btn-text {
          font-size: 13px;
          font-weight: 600;
        }

        /* Quantity Controls */
        .quantity-controls {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 2px;
        }

        .qty-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #374151;
        }

        .qty-decrease:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .qty-increase:hover {
          background: #dcfce7;
          color: #16a34a;
        }

        .quantity {
          padding: 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          min-width: 24px;
          text-align: center;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .card-content {
            padding: 10px 12px;
            gap: 10px;
          }

          .food-image {
            width: 50px;
            height: 50px;
          }

          .item-name {
            font-size: 15px;
          }

          .current-price {
            font-size: 14px;
          }

          .add-btn-bold {
            padding: 6px 10px;
            font-size: 12px;
            min-width: 50px;
            height: 28px;
          }

          .qty-btn {
            width: 24px;
            height: 24px;
          }

          .quantity {
            padding: 0 6px;
            font-size: 13px;
          }
        }

        /* Accessibility */
        .add-btn-bold:focus,
        .qty-btn:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.3);
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .card-wrapper,
          .add-btn-bold,
          .qty-btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedMenuCard; 