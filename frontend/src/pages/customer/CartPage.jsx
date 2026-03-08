import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SkeletonCartItem from '../../components/SkeletonCartItem'
import { useCart } from '../../context/CartContext'

export default function CartPage() {
  const { cart, loading: cartLoading, updateItem, removeItem, clearCart } = useCart()
  const navigate = useNavigate()
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!cartLoading) {
      const elapsed = Date.now() - startRef.current
      const wait = Math.max(0, 2000 - elapsed)
      const t = setTimeout(() => setShowSkeleton(false), wait)
      return () => clearTimeout(t)
    }
  }, [cartLoading])

  const loading = showSkeleton || cartLoading

  if (loading) return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '1.5rem' }}>Cart</div>
        <div style={{ height: '36px', width: '180px', borderRadius: '999px', marginBottom: '1.75rem' }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }} className="cart-layout">
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '1.25rem', overflow: 'hidden' }}>
            {[1, 2, 3].map(i => <SkeletonCartItem key={i} />)}
          </div>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '22px', width: '60%', borderRadius: '999px' }} />
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '999px' }} />
                <div className="skeleton" style={{ height: '14px', width: '25%', borderRadius: '999px' }} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem' }}>
              <div className="skeleton" style={{ height: '48px', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  const items = cart?.items || []
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.product_price) * i.quantity, 0)
  const discount = promoApplied ? Math.round(subtotal * 0.2) : 0
  const delivery = 15
  const total = subtotal - discount + delivery

  if (items.length === 0) return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
        <Navbar /><div className="navbar-spacer" />
        <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <ShoppingBag size={64} color="#e2e8f0" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your cart is empty</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Browse our products and add items to your cart</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
      <Footer />
    </div>
  )

  return (
      <div style={{ background: '#fff', minHeight: '100vh' }}>
        <Navbar />
        <div className="navbar-spacer" />
        <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#999' }}>Home</Link>
          <span style={{ margin: '0 0.35rem' }}>&rsaquo;</span>
          <span style={{ color: '#000' }}>Cart</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '-0.02em',
          marginBottom: '1.75rem',
        }}>
          YOUR CART
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '1.5rem',
          alignItems: 'start',
        }} className="cart-layout">

          {/* Items */}
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '1.25rem', overflow: 'hidden' }}>
            {items.map((item, idx) => (
              <div key={item.id} style={{
                padding: '1.5rem',
                borderBottom: idx < items.length - 1 ? '1px solid #e5e5e5' : 'none',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
              }}>
                {/* Image */}
                <div style={{
                  width: '100px', height: '100px', flexShrink: 0,
                  background: '#f0f0f0', borderRadius: '0.75rem', overflow: 'hidden',
                }}>
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={28} color="#ccc" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3, marginRight: '0.5rem' }}>
                      {item.product_name}
                    </h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{ background: 'transparent', color: '#ff3333', flexShrink: 0, display: 'flex', padding: '2px' }}
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {item.variant_display && (
                    <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: '0.25rem' }}>
                      {item.variant_display}
                    </div>
                  )}

                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                    Size: <span style={{ color: '#000' }}>Large</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' }}>
                    Color: <span style={{ color: '#000' }}>White</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      ${parseFloat(item.product_price).toFixed(0)}
                    </span>

                    {/* Qty stepper */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0',
                      border: '1px solid #e5e5e5', borderRadius: '999px',
                      overflow: 'hidden', background: '#f5f5f5',
                    }}>
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                        style={{ padding: '0.45rem 0.9rem', background: 'transparent', color: '#000', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ padding: '0 0.5rem', fontWeight: 600, fontSize: '0.9rem', minWidth: '1.5rem', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        style={{ padding: '0.45rem 0.9rem', background: 'transparent', color: '#000', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{ border: '1px solid #e5e5e5', borderRadius: '1.25rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1.5rem' }}>Order Summary</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
              <SummaryRow label="Subtotal" value={`$${subtotal.toFixed(0)}`} />
              {discount > 0 && (
                <SummaryRow label="Discount (-20%)" value={`-$${discount.toFixed(0)}`} valueColor="#ff3333" />
              )}
              <SummaryRow label="Delivery Fee" value={`$${delivery}`} />
            </div>

            <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span>${total.toFixed(0)}</span>
              </div>
            </div>

            {/* Promo code */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Tag size={16} style={{
                  position: 'absolute', left: '0.85rem', top: '50%',
                  transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none',
                }} />
                <input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Add promo code"
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem 0.7rem 2.25rem',
                    border: '1px solid #e5e5e5', borderRadius: '999px',
                    fontSize: '0.875rem', background: '#f5f5f5', color: '#000',
                  }}
                />
              </div>
              <button
                onClick={() => { if (promoCode.trim()) setPromoApplied(true) }}
                style={{
                  padding: '0.7rem 1.25rem', background: '#000', color: '#fff',
                  borderRadius: '999px', fontWeight: 500, fontSize: '0.875rem',
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                }}
              >
                Apply
              </button>
            </div>
            {promoApplied && (
              <div style={{ fontSize: '0.8rem', color: '#22c55e', marginBottom: '0.75rem', fontWeight: 500 }}>
                Promo code applied! 20% discount added.
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 500, borderRadius: '999px' }}
              onClick={() => navigate('/checkout')}
            >
              Go to Checkout <ArrowRight size={18} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function SummaryRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontWeight: 600, color: valueColor || '#000' }}>{value}</span>
    </div>
  )
}
