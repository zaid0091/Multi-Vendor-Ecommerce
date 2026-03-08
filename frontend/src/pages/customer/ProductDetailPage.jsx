import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShoppingCart, Store, Package, Minus, Plus, Star,
  ChevronRight, Check, Shield, Truck, Trash2, PenLine, ChevronDown, ChevronUp
} from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import SkeletonProductDetail from '../../components/SkeletonProductDetail'
import SkeletonProductCard from '../../components/SkeletonProductCard'
import { productAPI, reviewAPI, faqAPI } from '../../api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={28}
          fill={(hover || value) >= n ? '#FFC633' : 'none'}
          stroke={(hover || value) >= n ? '#FFC633' : '#d4d4d4'}
          strokeWidth={1.5}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ transition: 'all 0.15s' }}
        />
      ))}
    </div>
  )
}

function StarDisplay({ rating, size = 16 }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size}
          fill={n <= full ? '#FFC633' : (n === full + 1 && half ? '#FFC633' : 'none')}
          stroke={n <= full || (n === full + 1 && half) ? '#FFC633' : '#d4d4d4'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

function ReviewsTab({ productId, user }) {
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [form, setForm] = useState({ rating: 0, title: '', body: '' })

  const canReview = user && user.role === 'customer'
  const myReview = reviews.find(r => r.user_id === user?.id)

  const fetchReviews = () => {
    setLoading(true)
    reviewAPI.list(productId)
      .then(({ data }) => {
        setReviews(data.reviews || [])
        setAvgRating(data.average_rating || 0)
        setCount(data.count || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchReviews() }, [productId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.rating) { setFormError('Please select a star rating.'); return }
    if (!form.body.trim()) { setFormError('Please write a review.'); return }
    setSubmitting(true)
    try {
      await reviewAPI.create(productId, form)
      setFormSuccess('Your review was submitted!')
      setShowForm(false)
      setForm({ rating: 0, title: '', body: '' })
      fetchReviews()
      setTimeout(() => setFormSuccess(''), 4000)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return
    try {
      await reviewAPI.delete(productId, reviewId)
      fetchReviews()
    } catch {}
  }

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    cnt: reviews.filter(r => r.rating === star).length,
    pct: count ? Math.round((reviews.filter(r => r.rating === star).length / count) * 100) : 0,
  }))

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>
          All Reviews <span style={{ color: '#999', fontWeight: 400, fontSize: '1rem' }}>({count})</span>
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {canReview && !myReview && !showForm && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '999px' }}>
              <PenLine size={15} /> Write a Review
            </button>
          )}
          {!user && (
            <Link to="/login" className="btn btn-primary" style={{ borderRadius: '999px' }}>Write a Review</Link>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {count > 0 && (
        <div style={{
          display: 'flex', gap: '2.5rem', alignItems: 'center',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
          padding: '1.5rem 2rem', marginBottom: '2rem', flexWrap: 'wrap',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
            <StarDisplay rating={avgRating} size={18} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {count} {count === 1 ? 'review' : 'reviews'}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            {dist.map(({ star, pct }) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', minWidth: '10px' }}>{star}</span>
                <Star size={13} fill="#FFC633" stroke="#FFC633" />
                <div style={{ flex: 1, height: '8px', background: '#e8e8e8', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#000', borderRadius: '99px', transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '28px' }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {formSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{formSuccess}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
          padding: '1.5rem', marginBottom: '2rem', background: '#fafafa',
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.05rem' }}>Your Review</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Rating <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Title</label>
            <input type="text" className="form-input" placeholder="Sum up your experience"
              maxLength={150} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Review <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea className="form-input" rows={4}
              placeholder="What did you like or dislike?"
              maxLength={2000} value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>
          {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ borderRadius: '999px' }}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ borderRadius: '999px' }}
              onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-center" style={{ minHeight: '120px' }}><div className="spinner" /></div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No reviews yet. Be the first to review this product!
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
          }} className="reviews-grid">
            {reviews.map(review => (
              <div key={review.id} style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <StarDisplay rating={review.rating} size={15} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Posted on {new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    {user && review.user_id === user.id && (
                      <button onClick={() => handleDelete(review.id)}
                        style={{ background: 'transparent', color: 'var(--danger)', padding: '2px' }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {review.title && (
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>{review.title}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{review.user_name}</strong>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#22c55e" />
                    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  &ldquo;{review.body}&rdquo;
                </p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-outline" style={{ borderRadius: '999px', padding: '0.75rem 2.5rem' }}>
              Load More Reviews
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FAQTab({ productId }) {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    setLoading(true)
    faqAPI.list(productId)
      .then(({ data }) => setFaqs(Array.isArray(data) ? data : []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return <div className="loading-center" style={{ minHeight: '100px' }}><div className="spinner" /></div>

  if (faqs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
      No FAQs available for this product yet.
    </div>
  )

  return (
    <div style={{ maxWidth: '760px', marginBottom: '3rem' }}>
      {faqs.map((faq) => {
        const isOpen = openId === faq.id
        return (
          <div key={faq.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              style={{
                width: '100%', background: 'transparent', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                padding: '1.1rem 0', textAlign: 'left', gap: '1rem',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{faq.question}</span>
              {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
            </button>
            {isOpen && (
              <div style={{ paddingBottom: '1.1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const startRef = useRef(Date.now())
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [selectedVariants, setSelectedVariants] = useState({})
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    startRef.current = Date.now()
    setLoading(true)
    setShowSkeleton(true)
    productAPI.detail(id)
      .then(({ data }) => {
        setProduct(data)
        setSelectedVariants({})
        setActiveImage(0)
        if (data.category) {
          productAPI.list({ category: data.category, page_size: 5 })
            .then(res => {
              const items = (res.data.results || res.data).filter(p => String(p.id) !== String(data.id))
              setRelated(items.slice(0, 4))
            }).catch(() => {})
        }
      })
      .catch(() => setProduct(null))
      .finally(() => {
        setLoading(false)
        const elapsed = Date.now() - startRef.current
        const wait = Math.max(0, 2000 - elapsed)
        setTimeout(() => setShowSkeleton(false), wait)
      })
  }, [id])

  const variantGroups = useMemo(() => {
    if (!product?.variants?.length) return {}
    return product.variants
      .filter(v => v.is_active)
      .reduce((acc, v) => {
        if (!acc[v.name]) acc[v.name] = []
        acc[v.name].push(v)
        return acc
      }, {})
  }, [product])

  const displayPrice = useMemo(() => {
    const base = product ? parseFloat(product.price) : 0
    const adjustment = Object.values(selectedVariants).reduce(
      (sum, v) => sum + parseFloat(v.price_adjustment || 0), 0
    )
    return base + adjustment
  }, [product, selectedVariants])

  const effectiveStock = useMemo(() => {
    const base = product?.stock ?? 0
    const variantStocks = Object.values(selectedVariants).map(v => v.stock)
    if (!variantStocks.length) return base
    return Math.min(base, ...variantStocks)
  }, [product, selectedVariants])

  const allVariantsSelected = Object.keys(variantGroups).every(name => selectedVariants[name])

  const handleAdd = async () => {
    if (!user || user.role !== 'customer') { window.location.href = '/login'; return }
    if (Object.keys(variantGroups).length > 0 && !allVariantsSelected) {
      setMessage({ type: 'error', text: 'Please select all options before adding to cart.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setAdding(true)
    try {
      await addToCart(product.id, qty)
      setMessage({ type: 'success', text: 'Added to cart!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add to cart' })
    } finally {
      setAdding(false)
    }
  }

  if (showSkeleton || loading) return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '1.5rem 1.5rem 0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[60, 50, 90].map(w => (
            <div key={w} className="skeleton" style={{ height: '12px', width: `${w}px`, borderRadius: '999px' }} />
          ))}
        </div>
        <SkeletonProductDetail />
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e5e5', marginBottom: '2rem' }}>
          {[120, 140, 80].map(w => (
            <div key={w} className="skeleton" style={{ height: '14px', width: `${w}px`, borderRadius: '999px', marginBottom: '1rem' }} />
          ))}
        </div>
        <div style={{ paddingBottom: '3rem' }}>
          <div className="skeleton" style={{ height: '28px', width: '260px', borderRadius: '999px', margin: '0 auto 2rem' }} />
          <div className="home-product-scroll">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="home-product-scroll-item"><SkeletonProductCard /></div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  if (!product) return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
        <Navbar />
        <div className="navbar-spacer" />
        <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Package size={56} color="#d4d4d4" style={{ marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Product not found.</p>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </div>
    </div>
  )

  const inStock = effectiveStock > 0
  const avgRating = product.avg_rating != null ? parseFloat(product.avg_rating) : null
  const fullStars = avgRating != null ? Math.floor(avgRating) : 0
  const hasHalf = avgRating != null ? avgRating - fullStars >= 0.5 : false

  const compareAt = product.compare_at_price ? parseFloat(product.compare_at_price) : null
  const hasDiscount = compareAt && compareAt > parseFloat(product.price)
  const discountPct = hasDiscount ? Math.round(((compareAt - parseFloat(product.price)) / compareAt) * 100) : 0

  // Build image list (main + extras if available)
  const images = product.image ? [product.image] : []

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '1.5rem 1.5rem 0' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#999', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: '#999' }}>Home</Link>
          <ChevronRight size={14} />
          <Link to="/products" style={{ color: '#999' }}>Shop</Link>
          <ChevronRight size={14} />
          {product.category_name && (
            <><Link to={`/products?category=${product.category}`} style={{ color: '#999' }}>{product.category_name}</Link><ChevronRight size={14} /></>
          )}
          <span style={{ color: '#000' }}>{product.name}</span>
        </div>

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'start' }} className="pdp-grid">

          {/* Left: thumbnails + main image */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Thumbnails column */}
            {images.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} style={{
                    width: '72px', height: '80px',
                    border: activeImage === i ? '2px solid #000' : '2px solid transparent',
                    borderRadius: '0.75rem', overflow: 'hidden', padding: 0,
                    background: '#f0f0f0', cursor: 'pointer', flexShrink: 0,
                  }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div style={{
              flex: 1, background: '#f0f0f0',
              borderRadius: '1.25rem', overflow: 'hidden',
              aspectRatio: '1 / 1', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Package size={96} color="#ccc" />
              )}
              {hasDiscount && (
                <span style={{
                  position: 'absolute', top: '14px', left: '14px',
                  background: '#ff3333', color: '#fff', fontWeight: 700,
                  fontSize: '0.8rem', padding: '4px 12px', borderRadius: '999px',
                }}>
                  -{discountPct}%
                </span>
              )}
            </div>
          </div>

          {/* Right: product info */}
          <div>
            <h1 style={{
              fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, lineHeight: 1.15,
              letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>
              {product.name}
            </h1>

            {/* Rating */}
            {avgRating != null && product.review_count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={17}
                      fill={i < fullStars ? '#FFC633' : (i === fullStars && hasHalf ? '#FFC633' : 'none')}
                      stroke={i < fullStars || (i === fullStars && hasHalf) ? '#FFC633' : '#d4d4d4'}
                      strokeWidth={1.5} />
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  {avgRating.toFixed(1)}<span style={{ color: '#999' }}>/5</span>
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>${displayPrice.toFixed(0)}</div>
              {hasDiscount && (
                <div style={{ fontSize: '1.2rem', color: '#bbb', textDecoration: 'line-through' }}>
                  ${compareAt.toFixed(0)}
                </div>
              )}
              {hasDiscount && (
                <div style={{
                  background: '#ff333322', color: '#ff3333',
                  borderRadius: '999px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  -{discountPct}%
                </div>
              )}
            </div>

            <p style={{ color: '#666', lineHeight: 1.75, fontSize: '0.9rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e5e5e5' }}>
              {product.description || 'A high-quality product crafted with care.'}
            </p>

            {/* Variants */}
            {Object.entries(variantGroups).map(([groupName, options]) => (
              <div key={groupName} style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.6rem' }}>
                  Select {groupName}:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {options.map(v => {
                    const isSelected = selectedVariants[groupName]?.id === v.id
                    const outOfStock = v.stock === 0
                    return (
                      <button
                        key={v.id}
                        disabled={outOfStock}
                        onClick={() => setSelectedVariants(prev => ({ ...prev, [groupName]: v }))}
                        style={{
                          padding: '0.45rem 1.1rem',
                          borderRadius: 'var(--radius-full)',
                          border: isSelected ? '2px solid #000' : '1.5px solid var(--border)',
                          background: isSelected ? '#000' : outOfStock ? '#f5f5f5' : '#fff',
                          color: isSelected ? '#fff' : outOfStock ? '#bbb' : '#000',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: outOfStock ? 'not-allowed' : 'pointer',
                          textDecoration: outOfStock ? 'line-through' : 'none',
                        }}
                      >
                        {v.value}
                        {parseFloat(v.price_adjustment) !== 0 && (
                          <span style={{ fontSize: '0.7rem', marginLeft: '3px', opacity: 0.8 }}>
                            ({parseFloat(v.price_adjustment) > 0 ? '+' : ''}{parseFloat(v.price_adjustment).toFixed(2)})
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Stock */}
            <div style={{ marginBottom: '1.25rem' }}>
              {inStock ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Check size={15} /> In Stock ({effectiveStock} available)
                </span>
              ) : (
                <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>Out of Stock</span>
              )}
            </div>

            {Object.keys(variantGroups).length > 0 && !allVariantsSelected && inStock && (
              <div style={{ fontSize: '0.82rem', color: '#d97706', marginBottom: '1rem', fontWeight: 500 }}>
                Please select {Object.keys(variantGroups).filter(n => !selectedVariants[n]).join(' and ')} to continue.
              </div>
            )}

            {inStock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1px solid #e5e5e5', borderRadius: '999px',
                  background: '#f5f5f5', overflow: 'hidden',
                }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ padding: '0.75rem 1.1rem', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                    <Minus size={16} />
                  </button>
                  <span style={{ padding: '0 0.85rem', fontWeight: 700, fontSize: '0.95rem', minWidth: '2rem', textAlign: 'center' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))}
                    style={{ padding: '0.75rem 1.1rem', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAdd}
                  disabled={adding || (Object.keys(variantGroups).length > 0 && !allVariantsSelected)}
                  style={{ flex: 1, justifyContent: 'center', padding: '0.85rem 1.5rem', borderRadius: '999px' }}
                >
                  <ShoppingCart size={18} /> {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            )}
            {!inStock && (
              <button className="btn btn-secondary btn-lg" disabled style={{ width: '100%', marginBottom: '1.25rem', borderRadius: '999px' }}>
                Out of Stock
              </button>
            )}
            {message && <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</div>}

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '1.25rem', borderTop: '1px solid #e5e5e5' }}>
              {[
                { icon: <Shield size={15} />, text: 'Secure Checkout' },
                { icon: <Truck size={15} />, text: 'Fast Delivery' },
                { icon: <Check size={15} />, text: 'Verified Seller' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#666' }}>
                  {icon} {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e5e5e5', display: 'flex', gap: '0', marginBottom: '2rem' }}>
          {[
            { key: 'details', label: 'Product Details' },
            { key: 'reviews', label: 'Rating & Reviews' },
            { key: 'faq', label: 'FAQs' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: 'transparent', padding: '0.85rem 2rem', fontSize: '0.9rem',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#000' : '#999',
              borderBottom: activeTab === tab.key ? '2px solid #000' : '2px solid transparent',
              marginBottom: '-1px',
            }}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'details' && (
          <div style={{ maxWidth: '800px', marginBottom: '3rem' }}>
            {product.description
              ? <p style={{ color: '#666', lineHeight: 1.8, fontSize: '0.9rem' }}>{product.description}</p>
              : <p style={{ color: '#999', fontSize: '0.9rem' }}>No details available.</p>}
          </div>
        )}

        {activeTab === 'reviews' && <ReviewsTab productId={id} user={user} />}
        {activeTab === 'faq' && <FAQTab productId={id} />}

        {related.length > 0 && (
          <section style={{ paddingBottom: '3rem' }}>
            <div style={{ borderTop: '1px solid #e5e5e5', marginBottom: '3rem' }} />
            <h2 style={{
              textAlign: 'center', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 900, textTransform: 'uppercase', marginBottom: '2rem',
              letterSpacing: '-0.02em',
            }}>
              YOU MIGHT ALSO LIKE
            </h2>
            <div className="home-product-scroll">
                {related.map(p => (
                  <div key={p.id} className="home-product-scroll-item">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
          </section>
        )}
      </div>
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .pdp-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .reviews-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
