import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Store } from 'lucide-react'
import { adminAPI } from '../../api'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function AdminCommission() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getCommission()
      .then(({ data }) => setData(Array.isArray(data) ? data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const totalCommission = data.reduce((sum, s) => sum + (s.commission || 0), 0)
  const totalSales = data.reduce((sum, s) => sum + (s.total_sales || 0), 0)
  const totalNet = data.reduce((sum, s) => sum + (s.net_earnings || 0), 0)

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <h1>Commission Overview</h1>
        <p>Platform earnings and seller payouts</p>
      </div>

      {/* Summary cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe' }}>
            <DollarSign size={22} color="#6366f1" />
          </div>
          <div className="stat-info">
            <h3>${totalSales.toFixed(2)}</h3>
            <p>Total Platform Sales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <TrendingUp size={22} color="#22c55e" />
          </div>
          <div className="stat-info">
            <h3>${totalCommission.toFixed(2)}</h3>
            <p>Total Commission (10%)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Store size={22} color="#3b82f6" />
          </div>
          <div className="stat-info">
            <h3>{data.length}</h3>
            <p>Active Sellers</p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      {data.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Sales vs Commission by Seller</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="store_name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v, n) => [`$${parseFloat(v).toFixed(2)}`, n]} />
              <Legend />
              <Bar dataKey="total_sales" fill="#6366f1" name="Gross Sales" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" fill="#ef4444" name="Commission" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net_earnings" fill="#22c55e" name="Net Earnings" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <DollarSign size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <p>No commission data yet. Sales will appear here once orders are placed.</p>
        </div>
      ) : (
          <div className="table-scroll-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Gross Sales</th>
                <th>Commission (10%)</th>
                <th>Net Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data.map(seller => (
                <tr key={seller.seller_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', background: '#ede9fe', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Store size={16} color="#6366f1" />
                      </div>
                      <strong>{seller.store_name}</strong>
                    </div>
                  </td>
                  <td>${parseFloat(seller.total_sales || 0).toFixed(2)}</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>${parseFloat(seller.commission || 0).toFixed(2)}</td>
                  <td style={{ color: '#22c55e', fontWeight: 700 }}>${parseFloat(seller.net_earnings || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>
                <td>TOTAL</td>
                <td>${totalSales.toFixed(2)}</td>
                <td style={{ color: '#ef4444' }}>${totalCommission.toFixed(2)}</td>
                <td style={{ color: '#22c55e' }}>${totalNet.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
