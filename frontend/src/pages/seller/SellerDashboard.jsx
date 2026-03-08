import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, DollarSign, TrendingUp, Plus, AlertCircle } from 'lucide-react'
import { sellerAPI } from '../../api'

export default function SellerDashboard() {
  const [store, setStore] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noStore, setNoStore] = useState(false)

  useEffect(() => {
    Promise.all([
      sellerAPI.getStore().catch(err => {
        if (err.response?.status === 404) setNoStore(true)
        return null
      }),
      sellerAPI.getAnalytics().catch(() => null),
    ]).then(([storeRes, analyticsRes]) => {
      if (storeRes) setStore(storeRes.data)
      if (analyticsRes) setAnalytics(analyticsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  if (noStore) return (
    <div>
      <div className="page-header">
        <h1>Welcome to Seller Panel</h1>
        <p>Set up your store to start selling</p>
      </div>
      <div className="card" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f59e0b', marginBottom: '1rem' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 600 }}>No store configured</span>
        </div>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          You haven't set up your store yet. Create one to start listing products and receiving orders.
        </p>
        <Link to="/seller/settings" className="btn btn-primary">
          <Plus size={16} /> Create My Store
        </Link>
      </div>
    </div>
  )

  const statusBadge = {
    approved: <span className="badge badge-success">Approved</span>,
    pending: <span className="badge badge-warning">Pending Approval</span>,
    suspended: <span className="badge badge-danger">Suspended</span>,
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1>{store?.store_name || 'My Store'}</h1>
            <p>Seller Dashboard Overview</p>
          </div>
          {store && statusBadge[store.status]}
        </div>
      </div>

      {store?.status === 'pending' && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          Your store is pending admin approval. You can add products once approved.
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe' }}>
            <DollarSign size={22} color="#6366f1" />
          </div>
          <div className="stat-info">
            <h3>${analytics?.total_sales?.toFixed(2) || '0.00'}</h3>
            <p>Total Sales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <TrendingUp size={22} color="#22c55e" />
          </div>
          <div className="stat-info">
            <h3>${analytics?.net_earnings?.toFixed(2) || '0.00'}</h3>
            <p>Net Earnings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <ShoppingBag size={22} color="#3b82f6" />
          </div>
          <div className="stat-info">
            <h3>{analytics?.total_orders || 0}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef9c3' }}>
            <Package size={22} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <h3>{store?.total_products || 0}</h3>
            <p>Products Listed</p>
          </div>
        </div>
      </div>

      {/* Commission info */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Commission Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Gross Sales', value: `$${analytics?.total_sales?.toFixed(2) || '0.00'}`, color: '#1e293b' },
              { label: 'Platform Commission (10%)', value: `-$${analytics?.commission?.toFixed(2) || '0.00'}`, color: '#ef4444' },
              { label: 'Net Earnings', value: `$${analytics?.net_earnings?.toFixed(2) || '0.00'}`, color: '#22c55e' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/seller/products" className="btn btn-primary">
              <Plus size={16} /> Add New Product
            </Link>
            <Link to="/seller/orders" className="btn btn-secondary">
              <ShoppingBag size={16} /> View Orders
            </Link>
            <Link to="/seller/analytics" className="btn btn-secondary">
              <TrendingUp size={16} /> View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Best sellers preview */}
      {analytics?.best_selling_products?.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Top Selling Products</h3>
          <div className="table-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.best_selling_products.map(p => (
                <tr key={p.product__id}>
                  <td>{p.product__name}</td>
                  <td>{p.total_sold}</td>
                  <td>${parseFloat(p.total_revenue || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
