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
      <div className="bg-white shadow-sm border-b">
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
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
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-l-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQuantity(item.menu_item_id, item.quantity + 1)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-r-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.menu_item_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Special Instructions */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests or dietary requirements..."
                className="input-field resize-none h-20"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={handlePlaceOrder}
                  className="btn-primary w-full py-3 text-lg flex items-center justify-center"
                  disabled={loading}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              )}

              {/* Table Info */}
              <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Table:</span> {currentTable.table_number}
                  <br />
                  <span className="font-medium">Capacity:</span> {currentTable.capacity} guests
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 