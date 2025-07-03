import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Clock, CheckCircle, Package, Utensils, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, currentTable } = useStore();
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [order, setOrder] = useState<any>(null);

  const fetchOrderStatus = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    setOrder(data);
  };

  useEffect(() => {
    if (!currentOrder || !currentTable) {
      navigate('/tables');
      return;
    }

    // Start timer
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    fetchOrderStatus();
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, payload => {
        fetchOrderStatus();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, [currentOrder, currentTable, navigate, orderId]);

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
          {order?.status === 'served' && (
            <button
              onClick={() => navigate(`/feedback/${order.id}`)}
              className="btn-primary flex-1"
            >
              Rate Your Experience
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

        {order?.status === 'served' && (
          <button
            onClick={() => navigate(`/payment/${order.id}`)}
            className="btn-primary mt-6"
          >
            Proceed to Payment
          </button>
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