import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { Chart, BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, RadialLinearScale } from 'chart.js';
Chart.register(BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, RadialLinearScale);

const Analysis: React.FC = () => {
  // Data states for each chart
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [topItemsData, setTopItemsData] = useState<any>(null);

  useEffect(() => {
    // Feedback Chart (Radar)
    supabase
      .from('feedback')
      .select('created_at, overall_rating, food_rating, service_rating, ambiance_rating')
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        // Average ratings
        const avg = (arr: any[], key: string) => arr.reduce((sum, f) => sum + (f[key] || 0), 0) / arr.length;
        setFeedbackData({
          labels: ['Overall', 'Food', 'Service', 'Ambiance'],
          datasets: [
            {
              label: 'Average Rating',
              data: [
                avg(data, 'overall_rating'),
                avg(data, 'food_rating'),
                avg(data, 'service_rating'),
                avg(data, 'ambiance_rating'),
              ],
              backgroundColor: 'rgba(255, 215, 0, 0.3)',
              borderColor: '#FFD700',
              borderWidth: 2,
              pointBackgroundColor: '#FFD700',
            },
          ],
        });
      });
    // Revenue Chart (Line)
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
        const labels = Object.keys(trend).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        setRevenueData({
          labels,
          datasets: [
            {
              label: 'Revenue',
              data: labels.map(l => trend[l]),
              fill: true,
              borderColor: '#FFD700',
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              tension: 0.3,
            },
          ],
        });
      });
    // Orders Chart (Bar)
    supabase
      .from('orders')
      .select('id, created_at')
      .then(({ data }) => {
        if (!data) return;
        const trend: Record<string, number> = {};
        data.forEach((o: any) => {
          const date = new Date(o.created_at).toLocaleDateString();
          trend[date] = (trend[date] || 0) + 1;
        });
        const labels = Object.keys(trend).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        setOrdersData({
          labels,
          datasets: [
            {
              label: 'Orders',
              data: labels.map(l => trend[l]),
              backgroundColor: 'rgba(58, 44, 96, 0.7)',
              borderColor: '#3a2c60',
              borderWidth: 2,
            },
          ],
        });
      });
    // Top Selling Items Chart (Bar)
    supabase
      .from('order_items')
      .select('menu_item_id, quantity, menu_items(name)')
      .then(({ data }) => {
        if (!data) return;
        const itemMap: Record<string, { name: string; quantity: number }> = {};
        data.forEach((item: any) => {
          const id = item.menu_item_id;
          const name = item.menu_items?.name || 'Unknown';
          if (!itemMap[id]) itemMap[id] = { name, quantity: 0 };
          itemMap[id].quantity += item.quantity;
        });
        const sorted = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 7);
        setTopItemsData({
          labels: sorted.map(i => i.name),
          datasets: [
            {
              label: 'Quantity Sold',
              data: sorted.map(i => i.quantity),
              backgroundColor: 'rgba(255, 215, 0, 0.7)',
              borderColor: '#FFD700',
              borderWidth: 2,
            },
          ],
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-background-light px-2 sm:px-4 py-6 max-w-7xl mx-auto">
      <h1 className="premium-title text-2xl sm:text-3xl mb-6 sm:mb-8">Analytics & Insights</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <div className="premium-card p-3 sm:p-6">
          <h2 className="premium-title text-lg sm:text-xl mb-3 sm:mb-4">Feedback Analysis</h2>
          <div className="overflow-x-auto" style={{height: 240, minHeight: 180}}>
            {feedbackData ? <Radar data={feedbackData} options={{scales:{r:{min:0,max:5,ticks:{stepSize:1}}}}} /> : <div className="text-gray-400 text-center pt-10">No data</div>}
          </div>
        </div>
        <div className="premium-card p-3 sm:p-6">
          <h2 className="premium-title text-lg sm:text-xl mb-3 sm:mb-4">Revenue Trend</h2>
          <div className="overflow-x-auto" style={{height: 240, minHeight: 180}}>
            {revenueData ? <Line data={revenueData} options={{scales:{y:{beginAtZero:true}}}} /> : <div className="text-gray-400 text-center pt-10">No data</div>}
          </div>
        </div>
        <div className="premium-card p-3 sm:p-6">
          <h2 className="premium-title text-lg sm:text-xl mb-3 sm:mb-4">Orders Over Time</h2>
          <div className="overflow-x-auto" style={{height: 240, minHeight: 180}}>
            {ordersData ? <Bar data={ordersData} options={{scales:{y:{beginAtZero:true}}}} /> : <div className="text-gray-400 text-center pt-10">No data</div>}
          </div>
        </div>
        <div className="premium-card p-3 sm:p-6">
          <h2 className="premium-title text-lg sm:text-xl mb-3 sm:mb-4">Top Selling Items</h2>
          <div className="overflow-x-auto" style={{height: 240, minHeight: 180}}>
            {topItemsData ? <Bar data={topItemsData} options={{indexAxis:'y',scales:{x:{beginAtZero:true}}}} /> : <div className="text-gray-400 text-center pt-10">No data</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis; 