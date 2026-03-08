import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowLeft, ArrowRight } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import SkeletonProductCard from '../../components/SkeletonProductCard'
import { productAPI, reviewAPI } from '../../api'

const PLACEHOLDER_REVIEWS = [
  { id: 'p1', user_name: 'Sarah M.', rating: 5, body: "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations." },
  { id: 'p2', user_name: 'Alex K.', rating: 5, body: 'Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions.' },
  { id: 'p3', user_name: 'James L.', rating: 5, body: "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of items is not only diverse but also on-point with the latest trends." },
  { id: 'p4', user_name: 'Moana K.', rating: 5, body: "I'm not just wearing clothes, I'm wearing confidence. Shop.co has completely transformed my wardrobe and how I feel about myself." },
]

const DRESS_STYLES = [
  { name: 'Casual', bg: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' },
  { name: 'Formal', bg: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4e07?w=600&q=80' },
  { name: 'Party', bg: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80' },
  { name: 'Gym', bg: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80' },
]

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewSlide, setReviewSlide] = useState(0)

  useEffect(() => {
    const start = Date.now()
    Promise.all([
      productAPI.list({ page_size: 8 }),
      productAPI.categories(),
      reviewAPI.recent(6),
    ]).then(([pRes, cRes, rRes]) => {
      setProducts(pRes.data.results || pRes.data)
      setCategories(cRes.data.results || cRes.data)
      setReviews(rRes.data || [])
    }).catch(() => {}).finally(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 2000 - elapsed)
      setTimeout(() => setLoading(false), remaining)
    })
  }, [])

  const newArrivals = products.slice(0, 4)
  const topSelling = products.slice(4, 8).length > 0 ? products.slice(4, 8) : products.slice(0, 4)
  const displayedReviews = reviews.length > 0 ? reviews : PLACEHOLDER_REVIEWS

  // Responsive: on mobile show 1, on tablet show 2, on desktop show 3
  const [cols, setCols] = useState(3)
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 600) setCols(1)
      else if (window.innerWidth < 960) setCols(2)
      else setCols(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const maxSlide = Math.max(0, displayedReviews.length - cols)
  const prevReview = () => setReviewSlide(s => Math.max(0, s - 1))
  const nextReview = () => setReviewSlide(s => Math.min(maxSlide, s + 1))

    if (loading) return (
      <div style={{ background: '#fff', overflowX: 'hidden' }}>
        <Navbar />
        <div className="navbar-spacer" />

        {/* ── NEW ARRIVALS SKELETON ── */}
        <section className="section-container">
          <div className="skeleton skeleton-line-lg" style={{ height: 28, width: 200, borderRadius: 999, marginBottom: '2rem', marginLeft: 'auto', marginRight: 'auto' }} />
          <div className="home-product-scroll">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="home-product-scroll-item"><SkeletonProductCard /></div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <div className="skeleton" style={{ height: 46, width: 130, borderRadius: 999, display: 'inline-block' }} />
          </div>
          <div className="section-divider" />
        </section>

        {/* ── TOP SELLING SKELETON ── */}
        <section className="section-container" style={{ paddingTop: '2.5rem' }}>
          <div className="skeleton skeleton-line-lg" style={{ height: 28, width: 200, borderRadius: 999, marginBottom: '2rem', marginLeft: 'auto', marginRight: 'auto' }} />
          <div className="home-product-scroll">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="home-product-scroll-item"><SkeletonProductCard /></div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <div className="skeleton" style={{ height: 46, width: 130, borderRadius: 999, display: 'inline-block' }} />
          </div>
        </section>

        <Footer />
      </div>
    )

    return (
      <div style={{ background: '#fff', overflowX: 'hidden' }}>
          <Navbar />
          <div className="navbar-spacer" />

          {/* ── HERO ── */}
        <div style={{ background: '#f2f0f1', overflow: 'hidden' }}>
          <div className="hero-inner">
            {/* Left text */}
            <div className="hero-text">
              <h1 className="hero-heading">
                FIND CLOTHES<br />THAT MATCHES<br />YOUR STYLE
              </h1>
              <p className="hero-subtext">
                Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.
              </p>
              <Link to="/products" className="hero-btn">Shop Now</Link>

              {/* Stats */}
              <div className="hero-stats">
                <StatItem number="200+" label="International Brands" />
                <div className="stats-divider" />
                <StatItem number="2,000+" label="High-Quality Products" />
                <div className="stats-divider" />
                <StatItem number="30,000+" label="Happy Customers" />
              </div>
            </div>

            {/* Right image */}
            <div className="hero-image-wrap">
              <div className="hero-star hero-star-left"><StarShape size={52} /></div>
              <div className="hero-star hero-star-right"><StarShape size={34} /></div>
                <div className="hero-img-container">
                  <img
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"
                    alt="fashion"
                    className="hero-img"
                  />
                </div>
            </div>
          </div>
        </div>

        {/* ── BRANDS BAR ── */}
        <div style={{ background: '#000', padding: '1.5rem 0' }}>
          <div className="brands-bar">
            {[
              { name: 'VERSACE', cls: 'brand-versace' },
              { name: 'ZARA', cls: 'brand-zara' },
              { name: 'GUCCI', cls: 'brand-gucci' },
              { name: 'PRADA', cls: 'brand-prada' },
              { name: 'Calvin Klein', cls: 'brand-ck' },
            ].map(b => (
              <span key={b.name} className={`brand-name ${b.cls}`}>{b.name}</span>
            ))}
          </div>
        </div>

        {/* ── NEW ARRIVALS ── */}
        <section className="section-container">
          <h2 className="section-title">NEW ARRIVALS</h2>

          {newArrivals.length > 0 ? (
              <div className="home-product-scroll">
                {newArrivals.map(p => <div key={p.id} className="home-product-scroll-item"><ProductCard product={p} /></div>)}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No products yet.</p>
            )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/products" className="view-all-btn">View All</Link>
          </div>
          <div className="section-divider" />
        </section>

        {/* ── TOP SELLING ── */}
        <section className="section-container" style={{ paddingTop: '2.5rem' }}>
          <h2 className="section-title">TOP SELLING</h2>

          {topSelling.length > 0 && (
              <div className="home-product-scroll">
                {topSelling.map(p => <div key={'top-' + p.id} className="home-product-scroll-item"><ProductCard product={p} /></div>)}
              </div>
            )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/products" className="view-all-btn">View All</Link>
          </div>
        </section>

        {/* ── BROWSE BY DRESS STYLE ── */}
        <section className="section-container">
          <div className="dress-style-box">
            <h2 className="section-title" style={{ marginBottom: '1.75rem' }}>BROWSE BY DRESS STYLE</h2>
            <div className="style-grid">
              {DRESS_STYLES.map((style, i) => {
                const cat = categories.find(c => c.name.toLowerCase().includes(style.name.toLowerCase()))
                const to = cat ? `/products?category=${cat.id}` : `/products`
                return (
                  <Link
                    key={style.name}
                    to={to}
                    className={`style-card ${i === 0 ? 'style-card-wide' : i === 3 ? 'style-card-wide' : ''}`}
                  >
                    <img
                      src={style.bg}
                      alt={style.name}
                      className="style-card-img"
                      onError={e => e.target.style.display = 'none'}
                    />
                    <div className="style-card-overlay" />
                    <span className="style-card-label">{style.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── OUR HAPPY CUSTOMERS ── */}
        <section className="section-container" style={{ paddingBottom: '4rem' }}>
          <div className="reviews-header">
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>OUR HAPPY CUSTOMERS</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={prevReview} disabled={reviewSlide === 0} className="review-nav-btn" style={{ opacity: reviewSlide === 0 ? 0.35 : 1 }}>
                <ArrowLeft size={16} />
              </button>
              <button onClick={nextReview} disabled={reviewSlide >= maxSlide} className="review-nav-btn" style={{ opacity: reviewSlide >= maxSlide ? 0.35 : 1 }}>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ overflow: 'hidden' }}>
            <div
              className="reviews-track"
              style={{ transform: `translateX(calc(-${reviewSlide * (100 / cols)}% - ${reviewSlide * 20 / cols}px))` }}
            >
              {displayedReviews.map((r) => (
                <div key={r.id} className={`review-slide review-slide-${cols}`}>
                  <ReviewCard review={r} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    )
}

function ReviewCard({ review }) {
  const stars = review.rating || 5
  const text = review.body || review.text || ''
  const name = review.user_name || review.name || 'Customer'

  return (
    <div className="review-card">
      <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem' }}>
        {[...Array(5)].map((_, j) => (
          <Star key={j} size={17}
            fill={j < stars ? '#FFC633' : 'none'}
            stroke={j < stars ? '#FFC633' : '#ddd'}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
        <strong style={{ fontSize: '0.95rem', fontWeight: 700 }}>{name}</strong>
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="9" fill="#22c55e" />
          <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
        &ldquo;{text}&rdquo;
      </p>
    </div>
  )
}

function StatItem({ number, label }) {
  return (
    <div className="stat-item">
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function StarShape({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <path d="M25 0 L26.5 23.5 L50 25 L26.5 26.5 L25 50 L23.5 26.5 L0 25 L23.5 23.5 Z" fill="#000" />
    </svg>
  )
}
