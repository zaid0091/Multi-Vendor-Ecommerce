import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Customer
import HomePage from './pages/customer/HomePage'
import ProductListPage from './pages/customer/ProductListPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import WishlistPage from './pages/customer/WishlistPage'
import SalePage from './pages/customer/SalePage'
import StorePage from './pages/customer/StorePage'
import ProfilePage from './pages/customer/ProfilePage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Seller
import BecomeSeller from './pages/seller/BecomeSeller'
import SellerLayout from './layouts/SellerLayout'
import SellerDashboard from './pages/seller/SellerDashboard'
import SellerProducts from './pages/seller/SellerProducts'
import SellerOrders from './pages/seller/SellerOrders'
import SellerAnalytics from './pages/seller/SellerAnalytics'
import SellerSettings from './pages/seller/SellerSettings'
import SellerCoupons from './pages/seller/SellerCoupons'

// Admin
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSellers from './pages/admin/AdminSellers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCommission from './pages/admin/AdminCommission'

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'seller') return <Navigate to="/seller" replace />
    return <Navigate to="/" replace />
  }
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'seller') return <Navigate to="/seller" replace />
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Customer pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/store/:id" element={<StorePage />} />
        <Route path="/cart" element={<PrivateRoute role="customer"><CartPage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute role="customer"><CheckoutPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute role="customer"><OrdersPage /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute role="customer"><OrderDetailPage /></PrivateRoute>} />
          <Route path="/wishlist" element={<PrivateRoute role="customer"><WishlistPage /></PrivateRoute>} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/profile" element={<PrivateRoute role="customer"><ProfilePage /></PrivateRoute>} />
        <Route path="/become-seller" element={<PrivateRoute role="customer"><BecomeSeller /></PrivateRoute>} />

      {/* Seller dashboard */}
      <Route path="/seller" element={<PrivateRoute role="seller"><SellerLayout /></PrivateRoute>}>
        <Route index element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="analytics" element={<SellerAnalytics />} />
        <Route path="settings" element={<SellerSettings />} />
        <Route path="coupons" element={<SellerCoupons />} />
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="sellers" element={<AdminSellers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="commission" element={<AdminCommission />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
