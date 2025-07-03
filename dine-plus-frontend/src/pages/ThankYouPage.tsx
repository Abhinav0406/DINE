import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CheckCircle, Star, RefreshCw, Home } from 'lucide-react';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentOrder, currentTable, setCurrentOrder, setCurrentTable } = useStore();

  useEffect(() => {
    // Auto redirect after 30 seconds
    const timer = setTimeout(() => {
      handleNewOrder();
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleNewOrder = () => {
    setCurrentOrder(null);
    setCurrentTable(null);
    navigate('/tables');
  };

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="card p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Thank You Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          
          <p className="text-gray-600 mb-6">
            We hope you enjoyed your dining experience at DINE+. 
            Your order has been completed successfully.
          </p>

          {/* Order Summary */}
          {currentOrder && currentTable && (
            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Order:</span> #{currentOrder.order_number}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Table:</span> {currentTable.table_number}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total:</span> ₹{currentOrder.total_amount.toFixed(2)}
              </p>
            </div>
          )}

          {/* Rating Prompt */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-yellow-500 mr-1" />
              <span className="text-sm font-medium text-yellow-800">Rate Your Experience</span>
            </div>
            <p className="text-xs text-yellow-700">
              Your feedback helps us serve you better
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {currentOrder && (
              <button
                onClick={() => navigate(`/feedback/${currentOrder.id}`)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Star className="w-5 h-5 mr-2" />
                Rate Your Experience
              </button>
            )}
            
            <button
              onClick={handleNewOrder}
              className="w-full btn-primary py-3 flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Place New Order
            </button>
            
            <button
              onClick={() => navigate('/tables')}
              className="w-full btn-secondary py-3 flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </button>
          </div>

          {/* Auto Redirect Notice */}
          <p className="text-xs text-gray-500 mt-6">
            You'll be redirected to the home page in 30 seconds
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Thank you for dining with us! 🍽️
          </p>
          <p className="text-xs text-gray-400 mt-1">
            DINE+ Restaurant Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage; 