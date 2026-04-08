import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ProductProvider } from './context/ProductContext';
import Layout from './components/Layout';
import Storefront from './components/Storefront';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import Account from './components/Account';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import Login from './components/Login';
import ComingSoon from './components/ComingSoon';
import Orders from './components/Orders';
import Search from './components/Search';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, isAdmin, loading } = useApp();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Storefront />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="account" element={<Account />} />
        <Route path="orders" element={<Orders />} />
        <Route path="search" element={<Search />} />
        <Route path="wishlist" element={<ComingSoon title="My Wishlist" />} />
        <Route path="style" element={<ComingSoon title="Style Profile" />} />
        <Route path="settings" element={<ComingSoon title="Account Settings" />} />
        <Route path="admin" element={
          <ProtectedRoute adminOnly>
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
    </Routes>
  );
}

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AppProvider>
      <ProductProvider>
        <Router>
          <Toaster position="top-center" reverseOrder={false} />
          <AppRoutes />
        </Router>
      </ProductProvider>
    </AppProvider>
  );
}
