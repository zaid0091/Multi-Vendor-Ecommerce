import React, { useState, useEffect } from 'react'
import { BarChart2 } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { sellerAPI } from '../../api'

export default function SellerAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sellerAPI.getAnalytics()
      .then(({ data }) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  if (!analytics) return (
    <div>
      <div className="page-header"><h1>Analytics</h1></div>
      <div className="alert alert-info">Analytics data unavailable. Make sure your store is set up.</div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Sales performance and revenue insights</p>
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Sales', value: `$${analytics.total_sales?.toFixed(2)}`, color: '#6366f1', bg: '#ede9fe' },
          { label: 'Net Earnings', value: `$${analytics.net_earnings?.toFixed(2)}`, color: '#22c55e', bg: '#dcfce7' },
          { label: 'Platform Fee', value: `$${analytics.commission?.toFixed(2)}`, color: '#ef4444', bg: '#fee2e2' },
          { label: 'Total Orders', value: analytics.total_orders, color: '#3b82f6', bg: '#dbeafe' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={18} color="#6366f1" /> Monthly Revenue (Last 6 Months)
        </h3>
        {analytics.monthly_revenue?.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No revenue data yet</div>
        )}
      </div>

      {/* Best selling products */}
      {analytics.best_selling_products?.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Best Selling Products</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.best_selling_products} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="product__name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total_sold" fill="#6366f1" name="Units Sold" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Order status distribution */}
      {analytics.order_status_distribution?.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Order Status Breakdown</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {analytics.order_status_distribution.map(({ status, count }) => (
              <div key={status} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>{count}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize', marginTop: '0.25rem' }}>{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
