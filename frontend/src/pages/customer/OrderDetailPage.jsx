import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, Store, Clock, XCircle, Tag } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { orderAPI } from '../../api'

const statusColors = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-purple',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
}

const paymentColors = {
  pending: 'badge-warning',
  paid: 'badge-success',
  failed: 'badge-danger',
  refunded: 'badge-gray',
}

function isCancellable(order) {
  if (!order?.seller_orders?.length) return false
  return order.seller_orders.every(so => so.status === 'pending' || so.status === 'processing')
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    orderAPI.detail(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return
    setCancelling(true)
    setCancelError('')
    try {
      const { data } = await orderAPI.cancel(id)
      setOrder(data)
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Failed to cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return (
    <div><Navbar /><div className="navbar-spacer" /><div className="loading-center"><div className="spinner"></div></div></div>
  )

  if (!order) return (
    <div>
        <Navbar />
        <div className="navbar-spacer" />
        <div className="container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <Package size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
        <p>Order not found.</p>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Orders</Link>
      </div>
    </div>
  )

  const cancellable = isCancellable(order)

  return (
    <div>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {/* Order header */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Order #{order.id}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                <Clock size={14} />
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${paymentColors[order.payment_status] || 'badge-gray'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                Payment: {order.payment_status}
              </span>
              <div style={{ fontWeight: 700, fontSize: '1.4rem', marginTop: '0.5rem' }}>
                ${parseFloat(order.total_amount).toFixed(2)}
              </div>
              {parseFloat(order.discount_amount) > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <Tag size={12} />
                  Coupon <strong>{order.coupon_code}</strong>: −${parseFloat(order.discount_amount).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {order.shipping_address && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#475569', fontSize: '0.875rem' }}>
              <MapPin size={16} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{order.shipping_address}</span>
            </div>
          )}

          {/* Cancel button */}
          {cancellable && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
              {cancelError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.6rem 1rem', color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {cancelError}
                </div>
              )}
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={cancelling}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <XCircle size={16} />
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                You can cancel while the order is pending or processing. Stock will be restored and your payment refunded.
              </p>
            </div>
          )}
        </div>

        {/* Seller Orders */}
        {order.seller_orders?.map(so => (
          <div key={so.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={18} color="#6366f1" />
                <span style={{ fontWeight: 600 }}>{so.seller_name}</span>
              </div>
              <span className={`badge ${statusColors[so.status] || 'badge-gray'}`}>
                {so.status}
              </span>
            </div>

            {so.items?.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} color="#cbd5e1" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>${parseFloat(item.subtotal).toFixed(2)}</div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Seller subtotal: <strong style={{ color: '#1e293b' }}>${parseFloat(so.subtotal).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
