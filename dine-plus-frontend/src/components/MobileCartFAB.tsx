import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface MobileCartFABProps {
  cart: CartItem[];
  cartTotal: number;
  onViewCart: () => void;
}

const MobileCartFAB: React.FC<MobileCartFABProps> = ({
  cart,
  cartTotal,
  onViewCart
}) => {
  if (cart.length === 0) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="clean-fab-container">
      <button
        onClick={onViewCart}
        className="clean-fab-button"
        aria-label={`View cart with ${totalItems} items, total ₹${cartTotal}`}
      >
        <div className="fab-content">
          {/* Left: Cart Icon + Count */}
          <div className="fab-left">
            <div className="cart-icon-wrapper">
              <ShoppingCart size={24} className="cart-icon" />
              <div className="item-count">
                {totalItems}
              </div>
            </div>
          </div>

          {/* Center: Action Text */}
          <div className="fab-center">
            <span className="fab-text">View Cart</span>
          </div>

          {/* Right: Total Amount */}
          <div className="fab-right">
            <span className="fab-total">₹{cartTotal}</span>
          </div>
        </div>

        {/* Shimmer Effect */}
        <div className="fab-shimmer"></div>
      </button>

      <style>{`
        .clean-fab-container {
          position: fixed;
          bottom: 20px;
          left: 16px;
          right: 16px;
          z-index: 9999;
          pointer-events: none;
        }

        .clean-fab-button {
          width: 100%;
          min-height: 64px; /* Excellent touch target */
          background: linear-gradient(135deg, #d4af37 0%, #ffbf00 100%);
          color: white;
          border: none;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(212, 175, 55, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
          pointer-events: auto;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          /* Force visibility for debugging */
          opacity: 1 !important;
          visibility: visible !important;
        }

        .clean-fab-button:hover {
          background: linear-gradient(135deg, #b8941f 0%, #d4af37 100%);
          box-shadow: 0 12px 40px rgba(212, 175, 55, 0.5);
          transform: translateY(-2px);
        }

        .clean-fab-button:active {
          transform: translateY(0);
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
        }

        .fab-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 64px;
          position: relative;
          z-index: 2;
        }

        /* Left Section - Cart Icon + Count */
        .fab-left {
          display: flex;
          align-items: center;
        }

        .cart-icon-wrapper {
          position: relative;
          padding: 8px;
        }

        .cart-icon {
          transition: transform 0.2s ease;
        }

        .clean-fab-button:hover .cart-icon {
          transform: scale(1.1);
        }

        .item-count {
          position: absolute;
          top: -2px;
          right: -2px;
          background: white;
          color: #d4af37;
          font-size: 12px;
          font-weight: 800;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          animation: pulse-count 2s ease-in-out infinite;
        }

        /* Center Section - Action Text */
        .fab-center {
          flex: 1;
          text-align: center;
          margin: 0 16px;
        }

        .fab-text {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        /* Right Section - Total */
        .fab-right {
          display: flex;
          align-items: center;
        }

        .fab-total {
          font-size: 20px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 12px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          min-width: 80px;
          text-align: center;
        }

        /* Shimmer Effect */
        .fab-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.6s ease;
          z-index: 1;
        }

        .clean-fab-button:hover .fab-shimmer {
          left: 100%;
        }

        /* Pulse Animation for Count */
        @keyframes pulse-count {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        /* Tablet Responsive */
        @media (min-width: 768px) {
          .clean-fab-container {
            max-width: 400px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
          }

          .fab-content {
            padding: 0 24px;
          }

          .fab-text {
            font-size: 19px;
          }

          .fab-total {
            font-size: 21px;
            min-width: 90px;
          }
        }

        /* Hide FAB - We now have dedicated mobile/desktop buttons */
        .clean-fab-container {
          display: none;
        }

        /* Accessibility */
        .clean-fab-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.5), 0 8px 32px rgba(212, 175, 55, 0.4);
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .clean-fab-button,
          .cart-icon,
          .fab-shimmer {
            transition: none;
            animation: none;
          }
          
          .item-count {
            animation: none;
          }
        }

        /* High Contrast Mode */
        @media (prefers-contrast: high) {
          .clean-fab-button {
            border: 2px solid white;
          }
          
          .item-count {
            border: 1px solid #d4af37;
          }
        }

        /* Safe Area Support for iOS */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .clean-fab-container {
            bottom: calc(20px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
};

export default MobileCartFAB; 