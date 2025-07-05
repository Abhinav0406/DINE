import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Star,
  Calendar,
  BarChart3,
  LogOut,
  Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';
import Analysis from './Analysis';
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('today');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Real analytics state
  const [revenue, setRevenue] = useState(0);
  const [orders, setOrders] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [rating, setRating] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<{ date: string, total: number }[]>([]);
  const [feedbackStats, setFeedbackStats] = useState({
    avgOverall: 0,
    avgFood: 0,
    avgService: 0,
    avgAmbiance: 0,
    latest: null as null | { comment: string; overall_rating: number; created_at: string },
  });
  const [tableRevenue, setTableRevenue] = useState<{ table_id: string, table_number: number, revenue: number }[]>([]);
  const [exportType, setExportType] = useState('revenueByTable');
  const [showAllTables, setShowAllTables] = useState(false);

  useEffect(() => {
    // Fetch revenue
    supabase.from('payments').select('amount').then(({ data }) => {
      const total = (data || []).reduce((sum, p) => sum + Number(p.amount), 0);
      setRevenue(total);
    });
    // Fetch orders count
    supabase.from('orders').select('id').then(({ data }) => setOrders((data || []).length));
    // Fetch customers count (unique table_ids in orders as a proxy)
    supabase.from('orders').select('table_id').then(({ data }) => {
      const unique = new Set((data || []).map((o: any) => o.table_id));
      setCustomers(unique.size);
    });
    // Fetch average rating
    supabase.from('feedback').select('overall_rating').then(({ data }) => {
      if (data && data.length) {
        const avg = data.reduce((sum, f) => sum + f.overall_rating, 0) / data.length;
        setRating(avg);
      }
    });
    // Fetch recent orders
    supabase.from('orders').select('id, order_number, table_id, total_amount, status, created_at').order('created_at', { ascending: false }).limit(4).then(({ data }) => {
      setRecentOrders(data || []);
    });
    // Fetch top selling items
    supabase
      .from('order_items')
      .select('menu_item_id, quantity, menu_items(name, price)')
      .then(({ data }) => {
        const itemMap: Record<string, { name: string; orders: number; revenue: number }> = {};
        (data || []).forEach((item: any) => {
          const id = item.menu_item_id;
          const name = item.menu_items?.name || 'Unknown';
          const price = item.menu_items?.price || 0;
          if (!itemMap[id]) itemMap[id] = { name, orders: 0, revenue: 0 };
          itemMap[id].orders += item.quantity;
          itemMap[id].revenue += price * item.quantity;
        });
        const sorted = Object.values(itemMap).sort((a, b) => b.orders - a.orders).slice(0, 4);
        setTopItems(sorted);
      });
    // Fetch revenue trend (daily)
    supabase
      .from('payments')
      .select('amount, created_at')
      .then(({ data }) => {
        if (!data) return;
        const trend: Record<string, number> = {};
        data.forEach((p: any) => {
          const date = new Date(p.created_at).toLocaleDateString();
          trend[date] = (trend[date] || 0) + Number(p.amount);
        });
        setRevenueTrend(Object.entries(trend).map(([date, total]) => ({ date, total })));
      });
    // Fetch feedback analytics
    supabase
      .from('feedback')
      .select('overall_rating, food_rating, service_rating, ambiance_rating, comment, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const avgOverall = data.reduce((sum, f) => sum + (f.overall_rating || 0), 0) / data.length;
        const avgFood = data.reduce((sum, f) => sum + (f.food_rating || 0), 0) / data.length;
        const avgService = data.reduce((sum, f) => sum + (f.service_rating || 0), 0) / data.length;
        const avgAmbiance = data.reduce((sum, f) => sum + (f.ambiance_rating || 0), 0) / data.length;
        setFeedbackStats({
          avgOverall,
          avgFood,
          avgService,
          avgAmbiance,
          latest: data[0]?.comment ? { comment: data[0].comment, overall_rating: data[0].overall_rating, created_at: data[0].created_at } : null,
        });
      });
    // Fetch revenue by table
    (async () => {
      const { data: orders } = await supabase.from('orders').select('table_id, total_amount');
      const { data: tables } = await supabase.from('tables').select('id, table_number');
      if (!orders || !tables) return;
      const tableMap: Record<string, number> = {};
      tables.forEach(t => { tableMap[t.id] = t.table_number; });
      const revenueMap: Record<string, { table_number: number, revenue: number }> = {};
      orders.forEach((o: any) => {
        if (!o.table_id) return;
        if (!revenueMap[o.table_id]) revenueMap[o.table_id] = { table_number: tableMap[o.table_id] || 0, revenue: 0 };
        revenueMap[o.table_id].revenue += Number(o.total_amount);
      });
      setTableRevenue(Object.entries(revenueMap).map(([table_id, { table_number, revenue }]) => ({ table_id, table_number, revenue })));
    })();
  }, []);

  const handleLogout = () => {
    navigate('/admin/login');
  };

  const handleExportDropdown = async () => {
    if (exportType === 'revenueByTable') {
      // Export revenue by table
      const { data: orders } = await supabase.from('orders').select('table_id, total_amount');
      const { data: tables } = await supabase.from('tables').select('id, table_number');
      if (!orders || !tables) return;
      const tableMap: Record<string, number> = {};
      tables.forEach(t => { tableMap[t.id] = t.table_number; });
      const revenueMap: Record<string, { table_number: number, revenue: number }> = {};
      orders.forEach((o: any) => {
        if (!o.table_id) return;
        if (!revenueMap[o.table_id]) revenueMap[o.table_id] = { table_number: tableMap[o.table_id] || 0, revenue: 0 };
        revenueMap[o.table_id].revenue += Number(o.total_amount);
      });
      const rows = Object.entries(revenueMap).map(([table_id, { table_number, revenue }]) => ({ Table: table_number, Revenue: revenue }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'Revenue by Table');
      XLSX.writeFile(wb, 'dineplus-revenue-by-table.xlsx');
    } else if (exportType === 'orders') {
      // Export only order id, total_amount, and payment_method
      const { data: orders } = await supabase.from('orders').select('id, total_amount, payment_method');
      if (!orders) return;
      const rows = orders.map((o: any) => ({ 'Order ID': o.id, 'Revenue': o.total_amount, 'Payment Method': o.payment_method }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'Orders');
      XLSX.writeFile(wb, 'dineplus-orders.xlsx');
    } else if (exportType === 'feedback') {
      // Export feedback
      const { data: feedback } = await supabase.from('feedback').select('*');
      if (!feedback) return;
      const sheet = XLSX.utils.json_to_sheet(feedback);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'Feedback');
      XLSX.writeFile(wb, 'dineplus-feedback.xlsx');
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    change?: string;
  }> = ({ title, value, icon: Icon, color, change }) => (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="premium-header shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div>
              <h1 className="text-2xl premium-title">Admin Dashboard</h1>
              <p className="text-gray-100">Monitor your restaurant performance</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button onClick={() => setShowAnalysis(v => !v)} className="premium-btn w-full sm:w-auto">{showAnalysis ? 'Dashboard' : 'Analysis'}</button>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="input-field premium-btn w-full sm:w-auto">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button onClick={handleLogout} className="premium-btn flex items-center w-full sm:w-auto"><LogOut className="w-4 h-4 mr-2" /> Logout</button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      {showAnalysis ? <Analysis /> : (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center">
            <select value={exportType} onChange={e => setExportType(e.target.value)} className="input-field premium-btn w-full sm:w-auto">
              <option value="revenueByTable">Export Revenue by Table</option>
              <option value="orders">Export All Orders</option>
              <option value="feedback">Export Feedback</option>
            </select>
            <button onClick={handleExportDropdown} className="premium-btn flex items-center gap-2 w-full sm:w-auto"><Download className="w-5 h-5" /> Export</button>
          </div>
          {/* Small, collapsible Revenue by Table */}
          <div className="premium-card p-3 mb-6 max-w-full sm:max-w-md" style={{fontSize: '0.95rem'}}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base premium-title mb-0">Revenue by Table</h3>
              <button className="text-xs text-primary-400 underline hover:text-yellow-700" onClick={() => setShowAllTables(v => !v)}>{showAllTables ? 'Show Less' : 'Show All'}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left premium-table text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Table</th>
                    <th className="px-2 py-1">Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllTables ? tableRevenue : tableRevenue.slice(0, 5)).sort((a, b) => b.revenue - a.revenue).map(row => (
                    <tr key={row.table_id}>
                      <td className="px-2 py-1 font-semibold">{row.table_number}</td>
                      <td className="px-2 py-1">₹{row.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                  {tableRevenue.length === 0 && (
                    <tr><td colSpan={2} className="text-center py-2 text-gray-400">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Revenue"
              value={`₹${revenue.toLocaleString()}`}
              icon={DollarSign}
              color="premium-stat-icon"
              change="+12% from yesterday"
            />
            
            <StatCard
              title="Orders"
              value={orders}
              icon={Package}
              color="bg-blue-500"
              change="+8% from yesterday"
            />
            
            <StatCard
              title="Customers"
              value={customers}
              icon={Users}
              color="bg-purple-500"
              change="+15% from yesterday"
            />
            
            <StatCard
              title="Rating"
              value={`${rating.toFixed(1)}/5`}
              icon={Star}
              color="bg-yellow-500"
              change="Above average"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Recent Orders */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{order.order_number || order.id}</p>
                      <p className="text-sm text-gray-600">Table {order.table_id} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{order.total_amount}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Items */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Items</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-3">
                {topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.orders} orders</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">₹{item.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="premium-card p-4 mb-4 w-full overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              {revenueTrend.length > 0 ? (
                <Line
                  data={{
                    labels: revenueTrend.map(d => d.date),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: revenueTrend.map(d => d.total),
                        fill: false,
                        borderColor: '#6366f1',
                        backgroundColor: '#6366f1',
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true },
                    },
                    scales: {
                      x: { title: { display: true, text: 'Date' } },
                      y: { title: { display: true, text: 'Revenue (₹)' } },
                    },
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">No revenue data yet</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <button
              onClick={() => navigate('/kitchen')}
              className="card p-4 hover:shadow-card-hover transition-shadow text-left"
            >
              <Package className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-gray-900">Kitchen Dashboard</h4>
              <p className="text-sm text-gray-600">Monitor order preparation</p>
            </button>
            
            <button
              onClick={() => navigate('/tables')}
              className="card p-4 hover:shadow-card-hover transition-shadow text-left"
            >
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-gray-900">Customer View</h4>
              <p className="text-sm text-gray-600">See customer interface</p>
            </button>
            
            <div className="card p-4 text-left">
              <Star className="w-8 h-8 text-yellow-600 mb-2" />
              <h4 className="font-semibold text-gray-900 mb-2">Feedback Analysis</h4>
              <div className="mb-2">
                <span className="font-medium">Overall: </span>
                <span>{feedbackStats.avgOverall.toFixed(1)}/5</span>
              </div>
              <div className="mb-2 text-sm text-gray-700">
                <span>Food: {feedbackStats.avgFood.toFixed(1)} | </span>
                <span>Service: {feedbackStats.avgService.toFixed(1)} | </span>
                <span>Ambiance: {feedbackStats.avgAmbiance.toFixed(1)}</span>
              </div>
              {feedbackStats.latest && (
                <div className="mt-2 p-2 bg-yellow-50 rounded">
                  <div className="text-xs text-gray-500 mb-1">Latest:</div>
                  <div className="italic text-gray-800">"{feedbackStats.latest.comment}"</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(feedbackStats.latest.created_at).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 