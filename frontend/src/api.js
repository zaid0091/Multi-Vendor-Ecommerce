/**
 * api.js — Centralised Axios instance for the multi-vendor ecommerce frontend.
 *
 * Security notes (OWASP):
 *
 * A02 — Cryptographic Failures:
 *   Tokens are stored in localStorage.  For higher-security deployments,
 *   move to HttpOnly cookies (requires backend set-cookie support).
 *
 * A05 — Security Misconfiguration:
 *   The backend base URL is read from the Vite environment variable
 *   VITE_API_BASE_URL.  It defaults to '/api' (proxied by Vite in dev) and
 *   should be set explicitly in .env.production.  Hard-coded origins are
 *   never acceptable.
 *
 * A07 — Identification & Authentication Failures:
 *   Expired access tokens trigger a single silent refresh attempt.  If the
 *   refresh also fails the user is logged out immediately and redirected to
 *   /login so stale credentials cannot persist.
 */

import axios from 'axios'

// Read the API base URL from the build-time environment.
// In development Vite proxies '/api' → 'http://localhost:8001/api'.
// In production set VITE_API_BASE_URL=https://api.yourdomain.com/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  // 10-second timeout prevents hung requests from blocking the UI
  timeout: 10_000,
})

// ---------------------------------------------------------------------------
// Request interceptor — attach the JWT access token to every request.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — silently refresh the access token on 401 responses.
// Only one retry is attempted per original request (_retry flag).
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token available')

        // Use a plain axios call (not the api instance) to avoid an
        // infinite retry loop if the refresh endpoint itself returns 401.
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        // Refresh failed — clear credentials and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(err)
  }
)

export default api

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  becomeSeller: () => api.post('/auth/become-seller/'),
  requestPasswordReset: (email) => api.post('/auth/password-reset/', { email }),
  confirmPasswordReset: (token, new_password) => api.post('/auth/password-reset/confirm/', { token, new_password }),
}

// ---------------------------------------------------------------------------
// Products (public)
// ---------------------------------------------------------------------------
export const productAPI = {
  list: (params) => api.get('/products/', { params }),
  detail: (id) => api.get(`/products/${id}/`),
  categories: () => api.get('/products/categories/'),
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
export const cartAPI = {
  get: () => api.get('/cart/'),
  add: (product_id, quantity) => api.post('/cart/', { product_id, quantity }),
  update: (item_id, quantity) => api.patch(`/cart/items/${item_id}/`, { quantity }),
  remove: (item_id) => api.delete(`/cart/items/${item_id}/`),
  clear: () => api.delete('/cart/'),
}

// ---------------------------------------------------------------------------
// Orders (customer)
// ---------------------------------------------------------------------------
export const orderAPI = {
  checkout: (data) => api.post('/orders/checkout/', data),
  createPaymentIntent: (data) => api.post('/orders/create-payment-intent/', data),
  confirmOrder: (data) => api.post('/orders/confirm/', data),
  list: () => api.get('/orders/'),
  detail: (id) => api.get(`/orders/${id}/`),
  cancel: (id) => api.post(`/orders/${id}/cancel/`),
}

// ---------------------------------------------------------------------------
// Seller
// ---------------------------------------------------------------------------
export const sellerAPI = {
  getStore: () => api.get('/seller/store/'),
  createStore: (data) => api.post('/seller/store/', data),
  updateStore: (data) => api.patch('/seller/store/', data),
  getProducts: (params) => api.get('/products/seller/', { params }),
  createProduct: (data) => api.post('/products/seller/', data, {
    headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' },
  }),
  updateProduct: (id, data) => api.patch(`/products/seller/${id}/`, data, {
    headers: { 'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json' },
  }),
  deleteProduct: (id) => api.delete(`/products/seller/${id}/`),
  getOrders: () => api.get('/orders/seller/'),
  updateOrderStatus: (id, newStatus) => api.patch(`/orders/seller/${id}/status/`, { status: newStatus }),
  getAnalytics: () => api.get('/seller/analytics/'),
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const reviewAPI = {
  list: (productId) => api.get(`/products/${productId}/reviews/`),
  recent: (limit = 6) => api.get('/products/reviews/recent/', { params: { limit } }),
  create: (productId, data) => api.post(`/products/${productId}/reviews/`, data),
  delete: (productId, reviewId) => api.delete(`/products/${productId}/reviews/${reviewId}/`),
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------
export const faqAPI = {
  list: (productId) => api.get(`/products/${productId}/faqs/`),
  create: (productId, data) => api.post(`/products/${productId}/faqs/`, data),
  update: (productId, faqId, data) => api.patch(`/products/${productId}/faqs/${faqId}/`, data),
  delete: (productId, faqId) => api.delete(`/products/${productId}/faqs/${faqId}/`),
}

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------
export const variantAPI = {
  list: (productId) => api.get(`/products/${productId}/variants/`),
  create: (productId, data) => api.post(`/products/${productId}/variants/`, data),
  update: (productId, variantId, data) => api.patch(`/products/${productId}/variants/${variantId}/`, data),
  delete: (productId, variantId) => api.delete(`/products/${productId}/variants/${variantId}/`),
}

// ---------------------------------------------------------------------------
// Product Images
// ---------------------------------------------------------------------------
export const imageAPI = {
  list: (productId) => api.get(`/products/${productId}/images/`),
  add: (productId, formData) => api.post(`/products/${productId}/images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (productId, imageId) => api.delete(`/products/${productId}/images/${imageId}/`),
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
export const wishlistAPI = {
  list: () => api.get('/wishlist/'),
  add: (product_id) => api.post('/wishlist/', { product_id }),
  remove: (product_id) => api.delete(`/wishlist/${product_id}/`),
  status: (ids) => api.get('/wishlist/status/', { params: { ids: ids.join(',') } }),
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const couponAPI = {
  // Seller management
  list: () => api.get('/coupons/'),
  create: (data) => api.post('/coupons/', data),
  update: (id, data) => api.patch(`/coupons/${id}/`, data),
  remove: (id) => api.delete(`/coupons/${id}/`),
  // Customer / checkout — no auth required
  apply: (code, order_total) => api.post('/coupons/apply/', { code, order_total }),
}

// ---------------------------------------------------------------------------
// Public Stores
// ---------------------------------------------------------------------------
export const storeAPI = {
  list: () => api.get('/seller/stores/'),
  detail: (id) => api.get(`/seller/stores/${id}/`),
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const adminAPI = {
  getSellers: (statusFilter) =>
    api.get('/admin-panel/sellers/', { params: statusFilter ? { status: statusFilter } : {} }),
  approveSeller: (id) => api.post(`/admin-panel/sellers/${id}/approve/`),
  suspendSeller: (id) => api.post(`/admin-panel/sellers/${id}/suspend/`),
  getPlatformStats: () => api.get('/admin-panel/stats/'),
  getOrders: () => api.get('/admin-panel/orders/'),
  getCommission: () => api.get('/admin-panel/commission/'),
  createCategory: (data) => api.post('/products/categories/create/', data),
}
