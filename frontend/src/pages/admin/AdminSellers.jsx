import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { adminAPI } from '../../api'

const statusColors = {
  approved: 'badge-success',
  pending: 'badge-warning',
  suspended: 'badge-danger',
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)

  const fetchSellers = () => {
    setLoading(true)
    adminAPI.getSellers(filter || null)
      .then(({ data }) => setSellers(Array.isArray(data) ? data : data.results || []))
      .catch(() => setSellers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSellers() }, [filter])

  const handleApprove = async (id) => {
    setActing(id + '-approve')
    try {
      await adminAPI.approveSeller(id)
      fetchSellers()
    } catch { alert('Failed') } finally { setActing(null) }
  }

  const handleSuspend = async (id) => {
    if (!confirm('Suspend this seller?')) return
    setActing(id + '-suspend')
    try {
      await adminAPI.suspendSeller(id)
      fetchSellers()
    } catch { alert('Failed') } finally { setActing(null) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Seller Management</h1>
        <p>Approve, review and manage seller accounts</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { value: '', label: 'All', icon: Users },
          { value: 'pending', label: 'Pending', icon: Clock },
          { value: 'approved', label: 'Approved', icon: CheckCircle },
          { value: 'suspended', label: 'Suspended', icon: XCircle },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={`btn btn-sm ${filter === value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(value)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"></div></div>
      ) : sellers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <p>No sellers found</p>
        </div>
      ) : (
          <div className="table-scroll-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Owner</th>
                <th>Products</th>
                <th>Total Sales</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(seller => (
                <tr key={seller.id}>
                  <td style={{ minWidth: '130px' }}>
                    <div style={{ fontWeight: 600 }}>{seller.store_name}</div>
                    {seller.description && (
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                        {seller.description.slice(0, 40)}{seller.description.length > 40 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ minWidth: '150px' }}>
                    <div style={{ fontSize: '0.875rem' }}>{seller.user?.first_name} {seller.user?.last_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{seller.user?.email}</div>
                  </td>
                  <td style={{ minWidth: '80px' }}>{seller.total_products}</td>
                  <td style={{ minWidth: '100px' }}><strong>${parseFloat(seller.total_sales || 0).toFixed(2)}</strong></td>
                  <td style={{ minWidth: '100px' }}>
                    <span className={`badge ${statusColors[seller.status] || 'badge-gray'}`}>
                      {seller.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b', minWidth: '100px' }}>
                    {new Date(seller.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ minWidth: '120px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {seller.status !== 'approved' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(seller.id)}
                          disabled={acting === seller.id + '-approve'}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                      )}
                      {seller.status !== 'suspended' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleSuspend(seller.id)}
                          disabled={acting === seller.id + '-suspend'}
                        >
                          <XCircle size={13} /> Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
