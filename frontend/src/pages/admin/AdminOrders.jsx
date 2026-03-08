import React, { useState, useEffect } from 'react'
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import { adminAPI } from '../../api'

const paymentColors = {
  pending: 'badge-warning',
  paid: 'badge-success',
  failed: 'badge-danger',
  refunded: 'badge-gray',
}

const sellerStatusColors = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-purple',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    adminAPI.getOrders()
      .then(({ data }) => setOrders(Array.isArray(data) ? data : data.results || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <h1>All Orders</h1>
        <p>Platform-wide order overview</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <ShoppingBag size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <p>No orders yet</p>
        </div>
      ) : (
          <div className="table-scroll-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Sellers</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td><strong>#{order.id}</strong></td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{order.customer_email}</div>
                    </td>
                    <td>{order.seller_orders?.length || 0} seller(s)</td>
                    <td><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                    <td>
                      <span className={`badge ${paymentColors[order.payment_status] || 'badge-gray'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        {expanded === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Details
                      </button>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                          {order.seller_orders?.map(so => (
                            <div key={so.id} style={{ marginBottom: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{so.seller_name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <span className={`badge ${sellerStatusColors[so.status] || 'badge-gray'}`}>{so.status}</span>
                                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>${parseFloat(so.subtotal).toFixed(2)}</span>
                                </div>
                              </div>
                              {so.items?.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', padding: '0.25rem 0.5rem' }}>
                                  <span>{item.product_name} × {item.quantity}</span>
                                  <span>${parseFloat(item.subtotal).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                          {order.shipping_address && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                              <strong>Shipping:</strong> {order.shipping_address}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
