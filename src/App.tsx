import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSEO } from './hooks/useSEO';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import TrackOrderPage from './pages/TrackOrderPage';
import OrdersHistoryPage from './pages/OrdersHistoryPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ShopPage from './pages/ShopPage';
import AccountPage from './pages/AccountPage';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminReviews from './pages/admin/AdminReviews';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';
import AdminBanners from './pages/admin/AdminBanners';
import AdminInventory from './pages/admin/AdminInventory';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminActivity from './pages/admin/AdminActivity';
import AdminSystemHealth from './pages/admin/AdminSystemHealth';
import AdminPrinting from './pages/admin/AdminPrinting';
import AdminStore from './pages/admin/AdminStore';
import AdminMaintenance from './pages/admin/AdminMaintenance';
import AdminOperations from './pages/admin/AdminOperations';
import AdminCRM from './pages/admin/AdminCRM';
import AdminContent from './pages/admin/AdminContent';
import AdminSEO from './pages/admin/AdminSEO';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminData from './pages/admin/AdminData';
import AdminVIPOrderCreate from './pages/admin/AdminVIPOrderCreate';

function StoreApp() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Activate dynamic database-backed SEO for all routes
  const { settings } = useSEO();

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setMaintenanceMode(settings['maintenance_mode'] === 'true');
      setLoading(false);
    } else {
      fetch('/api/store/settings-map', { cache: 'no-store' })
        .then(r => r.json())
        .then(map => {
          if (map) {
            setMaintenanceMode(map['maintenance_mode'] === 'true');
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [location.pathname, settings]);

  if (maintenanceMode && !isAdminRoute && !loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20 font-bold text-2xl">
            ⚡
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">We&apos;ll Be Back Soon!</h1>
          <p className="text-sm text-slate-400">
            Our store is currently undergoing scheduled maintenance &amp; upgrades. Please check back shortly.
          </p>
          <div className="pt-4 text-xs text-slate-500">
            For urgent inquiries, contact support@hyperdrive.bd
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {!isAdminRoute && <Header />}
      <main className="flex-grow">
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<ShopPage />} />
          <Route path="/category/:slug" element={<ShopPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersHistoryPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/track/:orderNumber" element={<TrackOrderPage />} />
          <Route path="/products/:slug" element={<ProductDetailsPage />} />
          <Route path="/product/:slug" element={<ProductDetailsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/create" element={<AdminVIPOrderCreate />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="deliveries" element={<AdminDeliveries />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="promo-codes" element={<AdminPromoCodes />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="printing" element={<AdminPrinting />} />
            <Route path="store" element={<AdminStore />} />
            <Route path="maintenance" element={<AdminMaintenance />} />
            <Route path="operations" element={<AdminOperations />} />
            <Route path="crm" element={<AdminCRM />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="seo" element={<AdminSEO />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="data" element={<AdminData />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="system-health" element={<AdminSystemHealth />} />
          </Route>
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <Router>
            <StoreApp />
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

