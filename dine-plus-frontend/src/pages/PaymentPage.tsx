import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Order } from '../types';
import { ArrowLeft, CreditCard, Smartphone, Wallet, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Add Razorpay type to window
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface LocationState {
  specialInstructions?: string;
}

// Razorpay script loader (move to top)
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { orderId } = useParams<{ orderId: string }>();
  
  const { 
    currentTable, 
    cart, 
    cartTotal,
    clearCart
  } = useStore();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name, price, image_url))')
        .eq('id', orderId)
        .single();
      if (error) setError('Failed to fetch order details.');
      setOrder(data);
    };
    fetchOrder();
  }, [orderId]);

  if (!order) {
    return <div>Loading...</div>;
  }

  // Calculate totals from order items
  const subtotal = order.order_items?.reduce((sum, item) => sum + (item.total_price || (item.menu_items?.price || 0) * item.quantity), 0) || 0;
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      description: 'Pay using Google Pay, PhonePe, Paytm etc.',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, RuPay cards accepted',
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      description: 'Paytm, Amazon Pay, MobiKwik',
      icon: Wallet,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: currentTable.id,
          status: 'pending',
          total_amount: cartTotal,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
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
      navigate(`/order-status/${order.id}`);
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!order) return;
    if (!selectedPaymentMethod) {
      setError('Please select a payment method.');
      return;
    }
    setLoading(true);
    setError(null);

    // Wait for Razorpay script to load
    const loaded = await loadRazorpayScript();
    if (!loaded || typeof window.Razorpay !== 'function') {
      setError('Failed to load Razorpay payment gateway. Please try again.');
      setLoading(false);
      return;
    }

    const amount = Math.round(total * 100); // Razorpay expects paise
    const options = {
      key: 'rzp_test_k6jDxBqiDPqkVj', // TODO: Replace with your Razorpay Key ID
      amount: amount,
      currency: 'INR',
      name: 'DINE+ Restaurant',
      description: `Order #${order.order_number}`,
      handler: async function (response) {
        // On successful payment, update order in Supabase
        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            payment_method: selectedPaymentMethod,
            status: 'completed',
            updated_at: new Date().toISOString(),
            razorpay_payment_id: response.razorpay_payment_id,
          })
          .eq('id', orderId);

        // Insert payment record for analytics
        await supabase.from('payments').insert([
          {
            order_id: orderId,
            amount: total,
            payment_method: selectedPaymentMethod,
            razorpay_payment_id: response.razorpay_payment_id,
            status: 'success',
            created_at: new Date().toISOString(),
          },
        ]);

        // Redirect to feedback page
        navigate(`/feedback/${orderId}`);
        setLoading(false);
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      theme: {
        color: '#6366f1',
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    };
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/cart')}
              className="btn-secondary mr-4 flex items-center"
              disabled={isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
              <p className="text-sm text-gray-600">Table {currentTable.table_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Payment Method</h2>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      disabled={isProcessing}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-lg ${method.bgColor} flex items-center justify-center mr-4`}>
                          <Icon className={`w-6 h-6 ${method.color}`} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <CheckCircle className="w-6 h-6 text-primary-600 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="mb-2 text-sm text-gray-600">
                <div>Order #: <span className="font-medium text-gray-900">{order.order_number}</span></div>
                <div>Table: <span className="font-medium text-gray-900">{order.table_id}</span></div>
                <div>Status: <span className="font-medium text-gray-900 capitalize">{order.status}</span></div>
              </div>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.menu_items?.name || 'Item'}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.menu_items?.price?.toFixed(2) ?? item.unit_price?.toFixed(2) ?? '0.00'}</p>
                    </div>
                    <span className="font-medium text-gray-900">
                      ₹{(item.total_price || (item.menu_items?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              {order.special_instructions && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Special Instructions:</h4>
                  <p className="text-sm text-gray-700">{order.special_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRazorpayPayment}
                disabled={!selectedPaymentMethod || isProcessing || loading}
                className={`w-full py-3 text-lg font-medium rounded-lg transition-colors ${
                  !selectedPaymentMethod || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {isProcessing || loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay & Place Order`
                )}
              </button>

              <div className="mt-4 text-center text-xs text-gray-500">
                <p>Your payment is secured with 256-bit SSL encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 