import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';

// Pages
import TableSelectionPage from './pages/TableSelectionPage';
import MenuPage from './pages/MenuPage';
import StagedMenuPage from './pages/StagedMenuPage';
import CartPage from './pages/CartPage';
import OrderStatusPage from './pages/OrderStatusPage';
import PaymentPage from './pages/PaymentPage';
import FeedbackPage from './pages/FeedbackPage';
import ThankYouPage from './pages/ThankYouPage';

// Admin & Kitchen
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { loading, error } = useStore();

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background-light">
          {loading && <LoadingSpinner />}
          
          {error && (
            <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
              <div className="flex">
                <div className="py-1">
                  <svg className="fill-current h-4 w-4 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <Routes>
            {/* Customer Flow */}
            <Route path="/" element={<Navigate to="/tables" replace />} />
            <Route path="/tables" element={<TableSelectionPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/staged-menu" element={<StagedMenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment/:orderId" element={<PaymentPage />} />
            <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
            <Route path="/feedback/:orderId" element={<FeedbackPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            
            {/* Admin Flow */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Kitchen Flow */}
            <Route path="/kitchen" element={<KitchenDashboard />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/tables" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;