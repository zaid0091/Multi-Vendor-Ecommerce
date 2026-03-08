import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { CreditCard, MapPin, CheckCircle, Lock, Tag, X } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useCart } from '../../context/CartContext'
import { orderAPI, couponAPI } from '../../api'

// Initialise Stripe outside component to avoid re-creating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ---------------------------------------------------------------------------
// Inner payment form — rendered inside <Elements> provider
// ---------------------------------------------------------------------------
function PaymentForm({ clientSecret, shippingAddress, couponId, finalTotal, onSuccess, onBack }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setError('')
    setLoading(true)

    try {
      // 1. Confirm the payment with Stripe (collects card details from PaymentElement)
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.')
        setLoading(false)
        return
      }

      if (paymentIntent.status !== 'succeeded') {
        setError(`Payment status: ${paymentIntent.status}. Please try again.`)
        setLoading(false)
        return
      }

      // 2. Tell the backend to create the order (server verifies PaymentIntent)
      const payload = {
        payment_intent_id: paymentIntent.id,
        shipping_address: shippingAddress,
      }
      if (couponId) payload.coupon_id = couponId

      const { data: order } = await orderAPI.confirmOrder(payload)
      onSuccess(order)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1.5rem' }}>
        <PaymentElement />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={loading}>
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : `Pay $${finalTotal.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main CheckoutPage
// ---------------------------------------------------------------------------
export default function CheckoutPage() {
  const { cart, loading: cartLoading, fetchCart } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [address, setAddress] = useState({
    full_name: '', street: '', city: '', state: '', zip: '', country: 'US',
  })
  const [order, setOrder] = useState(null)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  // Stripe PaymentIntent state
  const [clientSecret, setClientSecret] = useState(null)
  const [intentError, setIntentError] = useState('')
  const [intentLoading, setIntentLoading] = useState(false)

  const items = cart?.items || []
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.product_price) * i.quantity, 0)
  const discountAmount = appliedCoupon ? parseFloat(appliedCoupon.discount_amount) : 0
  const finalTotal = appliedCoupon ? parseFloat(appliedCoupon.new_total) : subtotal

  const shippingAddress = `${address.full_name}, ${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`

  // Redirect to cart if cart is empty (only after cart has finished loading)
  if (!cartLoading && step !== 3 && items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  // ---------------------------------------------------------------------------
  // Coupon handlers
  // ---------------------------------------------------------------------------
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponError('')
    setCouponLoading(true)
    try {
      const { data } = await couponAPI.apply(couponCode.trim(), subtotal)
      setAppliedCoupon(data)
      setCouponCode('')
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code.')
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  // ---------------------------------------------------------------------------
  // Proceed from step 1 → 2: create PaymentIntent on the backend
  // ---------------------------------------------------------------------------
  const handleContinueToPayment = async () => {
    setIntentError('')
    setIntentLoading(true)
    try {
      const payload = { shipping_address: shippingAddress }
      if (appliedCoupon) payload.coupon_id = appliedCoupon.coupon_id
      const { data } = await orderAPI.createPaymentIntent(payload)
      setClientSecret(data.client_secret)
      setStep(2)
    } catch (err) {
      setIntentError(err.response?.data?.error || 'Failed to initialise payment. Please try again.')
    } finally {
      setIntentLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Called by PaymentForm after Stripe + backend confirm order
  // ---------------------------------------------------------------------------
  const handlePaymentSuccess = async (confirmedOrder) => {
    setOrder(confirmedOrder)
    await fetchCart()
    setStep(3)
  }

  // ---------------------------------------------------------------------------
  // Step 3: success screen
  // ---------------------------------------------------------------------------
  if (cartLoading) {
    return (
      <div>
        <Navbar />
        <div className="navbar-spacer" />
        <div className="loading-center"><div className="spinner"></div></div>
      </div>
    )
  }

  if (step === 3 && order) {
    return (
      <div>
        <Navbar />
        <div className="navbar-spacer" />
        <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 700, marginBottom: '0.75rem' }}>
            Order Placed!
          </h1>
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
            Your order #{order.id} has been confirmed.
          </p>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Total paid: <strong>${parseFloat(order.total_amount).toFixed(2)}</strong>
          </p>
          {order.coupon_code && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <Tag size={14} /> Coupon <strong>{order.coupon_code}</strong> applied — saved ${parseFloat(order.discount_amount || 0).toFixed(2)}
            </div>
          )}
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            Payment processed successfully via Stripe.
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>View Orders</button>
            <button className="btn btn-secondary" onClick={() => navigate('/products')}>Continue Shopping</button>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Steps 1 + 2
  // ---------------------------------------------------------------------------
  return (
    <div>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px' }}>
        <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', fontWeight: 700, marginBottom: '1.5rem' }}>Checkout</h1>

        {/* Steps indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[{ num: 1, label: 'Shipping' }, { num: 2, label: 'Payment' }].map(({ num, label }) => (
            <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: step >= num ? '#6366f1' : '#e2e8f0',
                color: step >= num ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
              }}>{num}</div>
              <span style={{ marginLeft: '0.5rem', fontWeight: step === num ? 600 : 400, color: step === num ? '#1e293b' : '#94a3b8', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{label}</span>
              {num < 2 && <div style={{ width: '40px', height: '2px', background: step > num ? '#6366f1' : '#e2e8f0', margin: '0 0.6rem' }}></div>}
            </div>
          ))}
        </div>

        <div className="two-col-layout">
          {/* Left: form */}
          <div>
            {/* Step 1 — Shipping */}
            {step === 1 && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={20} color="#6366f1" /> Shipping Address
                </h2>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={address.full_name}
                    onChange={e => setAddress({ ...address, full_name: e.target.value })}
                    placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input className="form-input" value={address.street}
                    onChange={e => setAddress({ ...address, street: e.target.value })}
                    placeholder="123 Main St" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                      placeholder="New York" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" value={address.state}
                      onChange={e => setAddress({ ...address, state: e.target.value })}
                      placeholder="NY" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">ZIP Code</label>
                    <input className="form-input" value={address.zip}
                      onChange={e => setAddress({ ...address, zip: e.target.value })}
                      placeholder="10001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input className="form-input" value={address.country}
                      onChange={e => setAddress({ ...address, country: e.target.value })}
                      placeholder="US" />
                  </div>
                </div>

                {intentError && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{intentError}</div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleContinueToPayment}
                  disabled={!address.full_name || !address.street || !address.city || intentLoading}
                >
                  {intentLoading ? 'Preparing payment...' : 'Continue to Payment'}
                </button>
              </div>
            )}

            {/* Step 2 — Real Stripe Elements */}
            {step === 2 && clientSecret && (
              <div className="card">
                <h2 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={20} color="#6366f1" /> Payment
                </h2>

                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#15803d' }}>
                  <Lock size={14} /> Secured by Stripe — test card: <strong>4242 4242 4242 4242</strong>, any future expiry &amp; CVC
                </div>

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: { colorPrimary: '#6366f1', borderRadius: '8px' },
                    },
                  }}
                >
                  <PaymentForm
                    clientSecret={clientSecret}
                    shippingAddress={shippingAddress}
                    couponId={appliedCoupon?.coupon_id ?? null}
                    finalTotal={finalTotal}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep(1)}
                  />
                </Elements>
              </div>
            )}
          </div>

          {/* Right: order summary */}
          <div>
            <div className="card order-summary-sticky" style={{ position: 'sticky', top: '80px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h3>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#64748b' }}>{item.product_name} × {item.quantity}</span>
                  <span>${(parseFloat(item.product_price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              {/* Coupon — only editable on step 1 */}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '1rem' }}>
                {appliedCoupon ? (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Tag size={13} />
                      <strong>{appliedCoupon.code}</strong> applied!
                    </span>
                    {step === 1 && (
                      <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : step === 1 ? (
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <input
                        className="form-input"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        style={{ flex: 1, fontSize: '0.85rem', padding: '0.45rem 0.75rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap' }}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p style={{ fontSize: '0.78rem', color: '#dc2626', margin: '0 0 0.5rem' }}>{couponError}</p>}
                  </div>
                ) : null}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.4rem' }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#15803d', marginBottom: '0.4rem' }}>
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>−${parseFloat(appliedCoupon.discount_amount).toFixed(2)}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem' }}>
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
