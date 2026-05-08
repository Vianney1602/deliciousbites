import React, { useEffect, useState, useCallback } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import PageLoader from './components/PageLoader';
import Navbar from './components/Navbar';
import MenuPage from './pages/MenuPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import TrackOrderPage from './pages/TrackOrderPage';
import UserOrdersPage from './pages/UserOrdersPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminAddProductPage from './pages/AdminAddProductPage';
import AdminEditProductPage from './pages/AdminEditProductPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminWelcomePage from './pages/AdminWelcomePage';
import AdminSetupPage from './pages/AdminSetupPage';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { UIProvider } from './contexts/UIContext';
import CartDrawer from './components/CartDrawer';
import AdminLayout, { AdminDashboard } from './components/AdminLayout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Footer from './components/Footer';
import { connectRealtimeSocket, disconnectRealtimeSocket } from './lib/liveEvents';
import { initializeAnime } from './lib/animeInit';

const AppRoutes = () => {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(true);
  const [pageReady, setPageReady] = useState(false);

  const hideLayout = ['/', '/login', '/register', '/auth/callback', '/admin/login', '/admin/setup', '/payment-success'].includes(location.pathname) || location.pathname.startsWith('/admin/');

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
    setPageReady(true);
  }, []);

  useEffect(() => {
    const cleanup = connectRealtimeSocket(token);
    return () => {
      cleanup();
      disconnectRealtimeSocket();
    };
  }, [token]);

  useEffect(() => {
    if (pageReady) {
      initializeAnime();
    }
  }, [location.pathname, pageReady]);

  if (loading) return null;

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {showLoader && <PageLoader onComplete={handleLoaderComplete} />}
      {!hideLayout && <Navbar />}
      {!hideLayout && <CartDrawer />}
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/admin" element={<AdminWelcomePage />} />
        <Route path="/admin/setup" element={<AdminSetupPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
        <Route path="/orders" element={<UserGuard element={<UserOrdersPage />} />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="add-product" element={<AdminAddProductPage />} />
          <Route path="edit-product/:id" element={<AdminEditProductPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  );
};

const UserGuard = ({ element }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'user') return <Navigate to="/home" replace />;
  return element;
};

const App = () => (
  <AuthProvider>
    <CartProvider>
      <UIProvider>
        <AppRoutes />
      </UIProvider>
    </CartProvider>
  </AuthProvider>
);

export default App;

