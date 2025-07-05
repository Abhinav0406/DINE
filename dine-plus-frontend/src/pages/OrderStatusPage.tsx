import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Clock, CheckCircle, Package, Utensils, ThumbsUp, CreditCard, Timer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Lottie from 'lottie-react';
import deliveryAnimation from '../assets/lottie/loading-food.json';

const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, currentTable } = useStore();
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [order, setOrder] = useState<any>(null);
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [isEarlyDelivery, setIsEarlyDelivery] = useState(false);

  const fetchOrderStatus = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (data) {
      setOrder(data);
      
      // Check if order was just served
      if (data.status === 'served' && !timeSaved) {
        const estimatedDeliveryTime = data.estimated_time * 60; // Convert to seconds
        const actualDeliveryTime = Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000);
        
        if (actualDeliveryTime < estimatedDeliveryTime) {
          setIsEarlyDelivery(true);
          setTimeSaved(Math.floor((estimatedDeliveryTime - actualDeliveryTime) / 60)); // Convert to minutes
        }
      }
    }
  };

  useEffect(() => {
    if (!currentOrder || !currentTable) {
      navigate('/tables');
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    // Only start timer if order is not served
    if (order?.status !== 'served') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    fetchOrderStatus();
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, payload => {
        fetchOrderStatus();
      })
      .subscribe();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      supabase.removeChannel(subscription);
    };
  }, [currentOrder, currentTable, navigate, orderId, order?.status]);

  // Stop timer and calculate time saved when order becomes served
  useEffect(() => {
    if (order?.status === 'served') {
      const estimatedDeliveryTime = order.estimated_time * 60; // Convert to seconds
      const actualDeliveryTime = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000);
      
      if (actualDeliveryTime < estimatedDeliveryTime) {
        setIsEarlyDelivery(true);
        setTimeSaved(Math.floor((estimatedDeliveryTime - actualDeliveryTime) / 60)); // Convert to minutes
      }
    }
  }, [order?.status]);

  if (!currentOrder || !currentTable) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'served':
        return 3;
      default:
        return 0;
    }
  };

  const statusSteps = [
    {
      id: 'pending',
      title: 'Order Confirmed',
      description: 'Your order has been received',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'preparing',
      title: 'Being Prepared',
      description: 'Our chefs are preparing your food',
      icon: Utensils,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'ready',
      title: 'Ready to Serve',
      description: 'Your order is ready',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      id: 'served',
      title: 'Served',
      description: 'Enjoy your meal!',
      icon: ThumbsUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const currentStep = getStatusStep(order?.status || 'pending');
  const estimatedTime = order?.estimated_time || 25;
  const timeRemaining = Math.max(0, estimatedTime * 60 - timeElapsed);

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Order Status</h1>
            <p className="mt-2 text-gray-600">Table {currentTable.table_number} • Order #{currentOrder.order_number}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Time Display */}
        <div className="text-center mb-8">
          {order?.status === 'served' ? (
            <div className="bg-white rounded-xl shadow-card p-6">
              {isEarlyDelivery ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto">
                    <Lottie animationData={deliveryAnimation} loop={false} />
                  </div>
                  <div className="text-green-600 font-semibold text-xl">
                    Order Delivered Early! 🎉
                  </div>
                  <div className="text-gray-600">
                    <p>We saved you {timeSaved} minutes</p>
                    <p className="text-sm mt-1">Total time taken: {formatTime(timeElapsed)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                  <div>
                    <p className="text-xl font-semibold text-gray-900">Order Delivered!</p>
                    <p className="text-sm text-gray-600">Total time: {formatTime(timeElapsed)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center bg-white rounded-xl shadow-card p-6">
              <Clock className="w-8 h-8 text-primary-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">
                  {timeRemaining > 0 ? 'Estimated time remaining' : 'Order should be ready'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {timeRemaining > 0 ? formatTime(timeRemaining) : 'Any moment now!'}
                </p>
                <p className="text-xs text-gray-500">
                  Time elapsed: {formatTime(timeElapsed)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Steps */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Progress</h2>
          
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mr-4
                    ${isCompleted ? step.bgColor : 'bg-gray-100'}
                    ${isCurrent ? 'ring-4 ring-primary-200' : ''}
                  `}>
                    <Icon className={`w-6 h-6 ${isCompleted ? step.color : 'text-gray-400'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {isCompleted && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          
          <div className="space-y-3">
            {order?.order_items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <h4 className="font-medium text-gray-900">{item.menu_items?.name || item.menu_item_id}</h4>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <span className="font-medium text-gray-900">
                  ₹{item.total_price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Total Amount</span>
              <span>₹{order?.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {order?.special_instructions && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1">Special Instructions:</h4>
              <p className="text-sm text-gray-700">{order.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Show payment button only when order is served and not paid */}
          {order?.status === 'served' && order?.payment_status !== 'completed' && (
            <button
              onClick={() => navigate(`/payment/${order.id}`)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Make Payment
            </button>
          )}
          
          <button
            onClick={() => navigate('/menu')}
            className="btn-secondary flex-1"
          >
            Order More Items
          </button>
          
          <button
            onClick={() => navigate('/tables')}
            className="btn-secondary flex-1"
          >
            New Order
          </button>
        </div>

        {/* Payment Status Banner */}
        {order?.status === 'served' && order?.payment_status !== 'completed' && (
          <div className="mt-6 p-4 rounded-lg bg-yellow-50 text-yellow-700">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>Your order has been served. Please proceed to make payment.</span>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 card p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-800 text-sm mb-3">
            If you have any questions about your order or need assistance, please don't hesitate to ask our staff.
          </p>
          <div className="text-blue-800 text-sm">
            <p><strong>Table Number:</strong> {currentTable.table_number}</p>
            <p><strong>Order Number:</strong> {currentOrder.order_number}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage; 