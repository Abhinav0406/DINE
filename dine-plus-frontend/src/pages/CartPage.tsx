import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentTable, 
    cart, 
    cartTotal,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    setCurrentOrder
  } = useStore();

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentTable) {
    navigate('/tables');
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background-light">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/menu')}
                className="btn-secondary mr-4 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-xl p-8 shadow-card">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items from our menu to get started!</p>
            <button
              onClick={() => navigate('/menu')}
              className="btn-primary w-full"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tax = cartTotal * 0.18; // 18% tax
  const total = cartTotal + tax;

  const handleProceedToPayment = () => {
    navigate('/payment', { 
      state: { 
        specialInstructions 
      }
    });
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const subtotal = cartTotal;
      const tax_amount = parseFloat((cartTotal * 0.18).toFixed(2));
      const total_amount = parseFloat((cartTotal + tax_amount).toFixed(2));
      const orderData = {
        restaurant_id: 'default', // or your actual restaurant id
        customer_id: 'guest',     // or actual customer id if you have auth
        table_id: currentTable.id,
        order_number: `ORD${Date.now()}`,
        status: 'pending',
        subtotal,
        tax_amount,
        total_amount,
        special_instructions: specialInstructions || null,
        estimated_time: 20, // or your logic
        payment_status: 'pending',
        payment_method: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // 1. Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      if (orderError) throw orderError;

      // 2. Insert order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        created_at: new Date().toISOString(),
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      setCurrentOrder(order);
      navigate(`/order-status/${order.id}`);
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/menu')}
                className="btn-secondary mr-4 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
                <p className="text-sm text-gray-600">Table {currentTable.table_number}</p>
              </div>
            </div>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 flex items-center text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-2 py-6 flex flex-col lg:flex-row gap-6">
        {/* Cart Items */}
        <div className="flex-1 w-full space-y-4">
          {cart.map((item) => (
            <div key={item.menu_item_id} className="card p-4">
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <CreditCard className="w-8 h-8" />
                    </div>
                  )}
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-primary-600 font-medium">₹{item.price}</p>
                  {item.special_instructions && (
                    <p className="text-sm text-gray-600 mt-1">
                      Note: {item.special_instructions}
                    </p>
                  )}
                </div>
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateCartItemQuantity(item.menu_item_id, item.quantity - 1)}
                      className="px-2 py-1 text-primary-400 hover:bg-primary-100 rounded-l"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-primary-400 font-bold font-sans">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItemQuantity(item.menu_item_id, item.quantity + 1)}
                      className="px-2 py-1 text-primary-400 hover:bg-primary-100 rounded-r"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.menu_item_id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Summary & Special Instructions */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          {/* Special Instructions */}
          <div className="bg-white rounded-xl shadow-card p-4 border border-primary-100">
            <h3 className="font-semibold text-primary-400 mb-2">Special Instructions</h3>
            <textarea
              className="w-full rounded-lg border border-primary-100 p-2 focus:ring-2 focus:ring-primary-200 focus:outline-none resize-none min-h-[60px]"
              placeholder="Any special requests or dietary requirements..."
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
            />
          </div>
          {/* Order Summary */}
          <div className="bg-primary-50 rounded-xl shadow-card p-4 border border-primary-100">
            <h3 className="font-semibold text-primary-400 mb-2">Order Summary</h3>
            <div className="flex justify-between text-gray-700 mb-1">
              <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 mb-1">
              <span>Tax (18%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary-400 mt-2">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            <button
              onClick={handlePlaceOrder}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-lg py-3"
              disabled={loading}
            >
              <CreditCard className="w-5 h-5" />
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 