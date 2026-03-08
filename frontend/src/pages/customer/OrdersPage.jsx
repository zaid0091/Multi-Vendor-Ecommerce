import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Package, Eye, XCircle } from 'lucide-react'
import Navbar from '../../components/Navbar'
import SkeletonOrderRow from '../../components/SkeletonOrderRow'
import { orderAPI } from '../../api'

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

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const startRef = useRef(Date.now())
  const [cancelling, setCancelling] = useState(null)

  const fetchOrders = () => {
    startRef.current = Date.now()
    setLoading(true)
    orderAPI.list()
      .then(({ data }) => setOrders(Array.isArray(data) ? data : data.results || []))
      .catch(() => setOrders([]))
      .finally(() => {
        setLoading(false)
        const elapsed = Date.now() - startRef.current
        setTimeout(() => setShowSkeleton(false), Math.max(0, 2000 - elapsed))
      })
  }

  useEffect(() => { fetchOrders() }, [])

  if (showSkeleton || loading) return (
    <div>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div className="skeleton" style={{ height: '28px', width: '140px', borderRadius: '999px', marginBottom: '1.5rem' }} />
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th><th>Date</th><th>Items</th>
                <th>Total</th><th>Payment</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => <SkeletonOrderRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Orders</h1>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <Package size={64} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No orders yet</h2>
            <p style={{ marginBottom: '1.5rem' }}>Your order history will appear here</p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      {order.seller_orders?.reduce((sum, so) => sum + (so.items?.length || 0), 0) || 0} item(s)
                    </td>
                    <td><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                    <td>
                      <span className={`badge ${paymentColors[order.payment_status] || 'badge-gray'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Link
                          to={`/orders/${order.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Eye size={14} /> View
                        </Link>
                        {isCancellable(order) && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            disabled={cancelling === order.id}
                            onClick={() => handleCancel(order.id)}
                          >
                            <XCircle size={14} />
                            {cancelling === order.id ? '…' : 'Cancel'}
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
    </div>
  )
}
