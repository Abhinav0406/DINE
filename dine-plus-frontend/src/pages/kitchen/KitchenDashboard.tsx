import React, { useEffect, useState } from 'react';
import { Order } from '../../types';
import { Clock, Package, Utensils, CheckCircle, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(name, image_url)), tables(table_number)')
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchOrders();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) {
      alert('Failed to update order: ' + error.message);
      console.error(error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'served':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60);
    return elapsed;
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
              <p className="mt-1 text-gray-600">Manage incoming orders and update status</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 text-primary-800 px-4 py-2 rounded-lg">
                <span className="font-semibold">{filteredOrders.length}</span> orders
              </div>
              <Bell className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
            { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
            { key: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card p-6">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Table {order.tables?.table_number} • {getTimeElapsed(order.created_at)} min ago
                  </p>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-900">
                      {item.quantity}x {item.menu_items?.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              {order.special_instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> {order.special_instructions}
                  </p>
                </div>
              )}

              {/* Time Info */}
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <Clock className="w-4 h-4 mr-1" />
                <span>Est. {order.estimated_time} min</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => { console.log('Clicked Start Preparing', order.id); updateOrderStatus(order.id, 'preparing'); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Start Preparing
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button
                    onClick={() => { console.log('Clicked Mark Ready', order.id); updateOrderStatus(order.id, 'ready'); }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Mark Ready
                  </button>
                )}
                
                {order.status === 'ready' && (
                  <button
                    onClick={() => { console.log('Clicked Mark Served', order.id); updateOrderStatus(order.id, 'served'); }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Served
                  </button>
                )}
                
                {order.status === 'served' && (
                  <div className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center">
                    Order Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 'No orders yet today' : `No ${filter} orders`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDashboard; 