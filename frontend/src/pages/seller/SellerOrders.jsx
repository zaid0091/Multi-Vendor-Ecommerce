import React, { useState, useEffect } from 'react'
import { ShoppingBag, Clock } from 'lucide-react'
import { sellerAPI } from '../../api'

const statusColors = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-purple',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
}

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const fetchOrders = () => {
    sellerAPI.getOrders()
      .then(({ data }) => setOrders(Array.isArray(data) ? data : data.results || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await sellerAPI.updateOrderStatus(orderId, newStatus)
      fetchOrders()
    } catch {
      alert('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <p>Manage and fulfill your customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <ShoppingBag size={64} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <h3>No orders yet</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Orders will appear here once customers purchase your products</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden' }}>
              {/* Order header */}
              <div
                  style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expanded === order.id ? '1px solid #e2e8f0' : 'none', flexWrap: 'wrap', gap: '0.75rem' }}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Seller Order #{order.id}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                      <Clock size={12} />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Global Order</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>#{order.order}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>${parseFloat(order.subtotal).toFixed(2)}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{order.items?.length || 0} items</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${statusColors[order.status] || 'badge-gray'}`}>{order.status}</span>
                  <select
                    className="form-input"
                    style={{ width: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    value={order.status}
                    onChange={e => { e.stopPropagation(); handleStatusChange(order.id, e.target.value) }}
                    disabled={updating === order.id}
                    onClick={e => e.stopPropagation()}
                  >
                    {VALID_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Expanded items */}
              {expanded === order.id && (
                  <div style={{ padding: '1rem 1.5rem' }}>
                    <div className="table-wrapper">
                      <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map(item => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>${parseFloat(item.price).toFixed(2)}</td>
                          <td><strong>${parseFloat(item.subtotal).toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>
          ))}
        </div>
      )}
    </div>
  )
}
