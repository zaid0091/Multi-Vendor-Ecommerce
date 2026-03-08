import React, { useState, useEffect, useCallback } from 'react'
import { Tag, SlidersHorizontal, X, ChevronDown, Flame } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import { productAPI } from '../../api'

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
]

export default function SalePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [sort, setSort] = useState('-created_at')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchSaleProducts = useCallback(() => {
    setLoading(true)
    const params = {
      on_sale: true,
      ordering: sort,
      page_size: 48,
    }
    if (category) params.category = category
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice

    productAPI.list(params)
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : data.results || []
        setProducts(items)
        setTotal(typeof data.count === 'number' ? data.count : items.length)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [sort, category, minPrice, maxPrice])

  useEffect(() => { fetchSaleProducts() }, [fetchSaleProducts])

  useEffect(() => {
    productAPI.categories()
      .then(({ data }) => setCategories(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
  }, [])

  const clearFilters = () => {
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSort('-created_at')
  }

  const hasActiveFilters = category || minPrice || maxPrice || sort !== '-created_at'

  return (
      <div style={{ background: '#fff', minHeight: '100vh' }}>
        <Navbar />
        <div className="navbar-spacer" />

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #000 0%, #1a1a2e 60%, #16213e 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(220,38,38,0.18)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(220,38,38,0.12)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(220,38,38,0.18)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '999px', padding: '0.3rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fca5a5' }}>
            <Flame size={14} /> LIMITED TIME DEALS
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.75rem' }}>
            SALE
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', color: 'rgba(255,255,255,0.65)', maxWidth: '480px', margin: '0 auto 0.5rem' }}>
            Exclusive discounts across all categories. Don't miss out.
          </p>
          {!loading && (
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>
              {total} item{total !== 1 ? 's' : ''} on sale right now
            </p>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1rem', borderRadius: 'var(--radius-full)',
                border: showFilters ? '1.5px solid #000' : '1.5px solid var(--border)',
                background: showFilters ? '#000' : '#fff',
                color: showFilters ? '#fff' : '#000',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}>
              <SlidersHorizontal size={15} /> Filters
              {hasActiveFilters && <span style={{ background: '#dc2626', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</span>}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <X size={13} /> Clear filters
              </button>
            )}
          </div>

          {/* Sort */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ appearance: 'none', padding: '0.45rem 2.2rem 0.45rem 1rem', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border)', fontSize: '0.85rem', fontWeight: 500, background: '#fff', cursor: 'pointer', outline: 'none' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none', color: '#888' }} />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.85rem', background: '#fff', minWidth: '160px' }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Min Price ($)</label>
              <input
                type="number" min="0" step="0.01" value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="0.00"
                style={{ padding: '0.4rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.85rem', width: '110px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max Price ($)</label>
              <input
                type="number" min="0" step="0.01" value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="999.00"
                style={{ padding: '0.4rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.85rem', width: '110px' }} />
            </div>
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="loading-center" style={{ minHeight: '320px' }}>
            <div className="spinner" />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
            <Tag size={56} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#000' }}>No sale items found</h3>
            <p style={{ fontSize: '0.9rem' }}>
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Check back soon for deals!'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
