import React from 'react';

interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

interface EnhancedCategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  layout?: 'grid' | 'list';
}

const EnhancedCategoryNav: React.FC<EnhancedCategoryNavProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  layout = 'grid'
}) => {
  return (
    <div className="clean-category-nav">
      <div className="category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
          >
            <div className="category-content">
              {/* Icon */}
              <div className="category-icon">
                {category.icon || '🍽️'}
              </div>
              
              {/* Name */}
              <span className="category-name">{category.name}</span>
              
              {/* Count Badge - Clean red circle like your design */}
              {category.count !== undefined && category.count > 0 && (
                <div className="count-badge">
                  {category.count}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .clean-category-nav {
          padding: 16px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-width: 600px;
          margin: 0 auto;
        }

        @media (min-width: 480px) {
          .category-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 768px) {
          .category-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .category-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        .category-btn {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-btn:hover {
          border-color: #ffd700;
          background: #fffbf0;
        }

        .category-btn.active {
          border-color: #ffd700;
          background: #ffd700;
          color: #374151;
        }

        .category-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          width: 100%;
          position: relative;
        }

        .category-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .category-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          line-height: 1.2;
          word-break: break-word;
          hyphens: auto;
        }

        .category-btn.active .category-name {
          color: #374151;
          font-weight: 600;
        }

        /* Clean red count badge - matching your design */
        .count-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        /* Mobile optimization */
        @media (max-width: 640px) {
          .clean-category-nav {
            padding: 12px;
          }

          .category-grid {
            gap: 8px;
          }

          .category-btn {
            padding: 12px 8px;
            min-height: 70px;
          }

          .category-icon {
            font-size: 20px;
          }

          .category-name {
            font-size: 12px;
          }

          .count-badge {
            font-size: 10px;
            padding: 1px 4px;
            min-width: 16px;
            height: 16px;
          }
        }

        /* Accessibility */
        .category-btn:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.5);
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .category-btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedCategoryNav; 