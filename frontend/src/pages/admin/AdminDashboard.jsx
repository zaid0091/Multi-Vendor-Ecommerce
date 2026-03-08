import React, { useState, useEffect } from 'react'
import { Users, ShoppingBag, DollarSign, Package, TrendingUp, BarChart2 } from 'lucide-react'
import { adminAPI } from '../../api'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6']

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getPlatformStats()
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  const sellerPieData = stats ? [
    { name: 'Approved', value: stats.approved_sellers },
    { name: 'Pending', value: stats.pending_sellers },
    { name: 'Other', value: Math.max(0, stats.total_sellers - stats.approved_sellers - stats.pending_sellers) },
  ].filter(d => d.value > 0) : []

  return (
    <div>
      <div className="page-header">
        <h1>Platform Dashboard</h1>
        <p>Overview of the entire marketplace</p>
      </div>

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Customers', value: stats?.total_users || 0, icon: Users, color: '#6366f1', bg: '#ede9fe' },
          { label: 'Total Sellers', value: stats?.total_sellers || 0, icon: BarChart2, color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Total Products', value: stats?.total_products || 0, icon: Package, color: '#f59e0b', bg: '#fef9c3' },
          { label: 'Total Orders', value: stats?.total_orders || 0, icon: ShoppingBag, color: '#22c55e', bg: '#dcfce7' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={22} color={color} />
            </div>
            <div className="stat-info">
              <h3>{value}</h3>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Revenue card */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} color="#6366f1" /> Revenue Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: 'Gross Revenue', value: `$${(stats?.total_revenue || 0).toFixed(2)}`, color: '#1e293b' },
              { label: 'Platform Commission (10%)', value: `$${(stats?.total_commission || 0).toFixed(2)}`, color: '#6366f1' },
              { label: 'Paid Orders', value: stats?.paid_orders || 0, color: '#22c55e' },
              { label: 'Pending Sellers', value: stats?.pending_sellers || 0, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seller status pie chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Seller Status Distribution</h3>
          {sellerPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sellerPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {sellerPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No seller data yet</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/admin/sellers" className="btn btn-primary">
            <Users size={16} /> Review Sellers
          </a>
          <a href="/admin/orders" className="btn btn-secondary">
            <ShoppingBag size={16} /> View All Orders
          </a>
          <a href="/admin/commission" className="btn btn-secondary">
            <TrendingUp size={16} /> Commission Report
          </a>
        </div>
      </div>
    </div>
  )
}
