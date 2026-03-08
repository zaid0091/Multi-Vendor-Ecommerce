import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import SkeletonProductCard from '../../components/SkeletonProductCard'
import { productAPI } from '../../api'

const COLORS = ['#00C12B', '#F50606', '#F5DD06', '#F57906', '#06CAF5', '#063AF5', '#7D06F5', '#F506A4', '#FFFFFF', '#000000']
const SIZES = ['XX-Small', 'X-Small', 'Small', 'Medium', 'Large', 'X-Large', 'XX-Large', '3X-Large', '4X-Large']

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem', marginTop: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: open ? '1rem' : 0, fontWeight: 700, fontSize: '0.95rem',
        }}
      >
        {title}
        {open ? <ChevronUp size={16} color="#666" /> : <ChevronDown size={16} color="#666" />}
      </button>
      {open && children}
    </div>
  )
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSizes, setSelectedSizes] = useState([])

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const ordering = searchParams.get('ordering') || ''
  const [searchInput, setSearchInput] = useState(search)

  const fetchProducts = async () => {
    setLoading(true)
    const start = Date.now()
    try {
      const params = { page }
      if (search) params.search = search
      if (category) params.category = category
      if (ordering) params.ordering = ordering
      const { data } = await productAPI.list(params)
      setProducts(data.results || data)
      setTotalPages(Math.ceil((data.count || data.length) / 12))
    } catch {
      setProducts([])
    } finally {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 2000 - elapsed)
      setTimeout(() => setLoading(false), remaining)
    }
  }

  useEffect(() => {
    productAPI.categories().then(({ data }) => setCategories(data.results || data)).catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [search, category, ordering])
  useEffect(() => { fetchProducts() }, [search, category, ordering, page])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParam('search', searchInput)
  }

  const activeCat = categories.find(c => String(c.id) === category)
  const totalCount = products.length

  const toggleSize = (s) => setSelectedSizes(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
  )

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '1.5rem 1.5rem 4rem' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#999', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: '#999' }}>Home</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#000' }}>{activeCat ? activeCat.name : 'All Products'}</span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Filters Sidebar */}
          <aside style={{
            width: '260px', flexShrink: 0,
            border: '1px solid #e5e5e5',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            position: 'sticky', top: '80px',
          }} className="filters-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Filters</h3>
              <SlidersHorizontal size={18} color="#666" />
            </div>

            {/* Categories */}
            <FilterSection title="Type">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button onClick={() => updateParam('category', '')} style={{
                  background: 'transparent', color: !category ? '#000' : '#666',
                  fontSize: '0.875rem', fontWeight: !category ? 600 : 400,
                  textAlign: 'left', padding: '0.3rem 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  All Products <ChevronRight size={14} />
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => updateParam('category', c.id)} style={{
                    background: 'transparent',
                    color: String(c.id) === category ? '#000' : '#666',
                    fontSize: '0.875rem', fontWeight: String(c.id) === category ? 600 : 400,
                    textAlign: 'left', padding: '0.3rem 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {c.name} <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Price range */}
            <FilterSection title="Price">
              <div>
                <input type="range" min={0} max={500} defaultValue={200}
                  style={{ width: '100%', accentColor: '#000' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666', marginTop: '0.35rem' }}>
                  <span>$50</span><span>$200</span>
                </div>
              </div>
            </FilterSection>

            {/* Colors */}
            <FilterSection title="Colors">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: color,
                      border: selectedColor === color ? '3px solid #000' : '2px solid #e5e5e5',
                      cursor: 'pointer', padding: 0, flexShrink: 0,
                      boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px #e5e5e5' : 'none',
                    }}
                    title={color}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Size */}
            <FilterSection title="Size">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      border: '1px solid #e5e5e5',
                      background: selectedSizes.includes(s) ? '#000' : '#f5f5f5',
                      color: selectedSizes.includes(s) ? '#fff' : '#666',
                      fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Dress Style */}
            <FilterSection title="Dress Style">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {['Casual', 'Formal', 'Party', 'Gym'].map(s => {
                  const cat = categories.find(c => c.name.toLowerCase().includes(s.toLowerCase()))
                  return (
                    <button key={s} onClick={() => cat && updateParam('category', cat.id)} style={{
                      background: 'transparent', color: '#666',
                      fontSize: '0.875rem', textAlign: 'left',
                      padding: '0.3rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      {s} <ChevronRight size={14} />
                    </button>
                  )
                })}
              </div>
            </FilterSection>

            {/* Sort */}
            <FilterSection title="Sort By">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: 'Most Popular', value: '' },
                  { label: 'Price: Low to High', value: 'price' },
                  { label: 'Price: High to Low', value: '-price' },
                  { label: 'Newest First', value: '-created_at' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => updateParam('ordering', opt.value)} style={{
                    background: 'transparent', color: ordering === opt.value ? '#000' : '#666',
                    fontSize: '0.875rem', fontWeight: ordering === opt.value ? 700 : 400,
                    textAlign: 'left', padding: '0.3rem 0',
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </FilterSection>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', borderRadius: '999px' }}
              onClick={() => {}}
            >
              Apply Filter
            </button>
          </aside>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.15rem' }}>
                  {activeCat ? activeCat.name : 'All Products'}
                </h1>
                {totalCount > 0 && (
                  <p style={{ fontSize: '0.82rem', color: '#999' }}>
                    Showing {Math.min((page - 1) * 12 + 1, totalCount)}-{Math.min(page * 12, totalCount)} of {totalCount} Products
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  className="btn btn-outline btn-sm mobile-filter-btn"
                  onClick={() => {}}
                  style={{ display: 'none' }}
                >
                  <SlidersHorizontal size={14} /> Filters
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#666' }}>
                  Sort by:
                  <select
                    value={ordering}
                    onChange={e => updateParam('ordering', e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', fontWeight: 600,
                      color: '#000', fontSize: '0.875rem', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="">Most Popular</option>
                    <option value="-created_at">Newest</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', borderRadius: '999px' }}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '999px' }}>Search</button>
            </form>

            {/* Active filters */}
            {(search || category) && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {search && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    background: '#f5f5f5', borderRadius: '999px', padding: '0.35rem 0.75rem', fontSize: '0.8rem',
                  }}>
                    "{search}"
                    <button onClick={() => { updateParam('search', ''); setSearchInput('') }} style={{ background: 'transparent', display: 'flex', padding: 0 }}>
                      <X size={13} />
                    </button>
                  </span>
                )}
                {activeCat && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    background: '#f5f5f5', borderRadius: '999px', padding: '0.35rem 0.75rem', fontSize: '0.8rem',
                  }}>
                    {activeCat.name}
                    <button onClick={() => updateParam('category', '')} style={{ background: 'transparent', display: 'flex', padding: 0 }}>
                      <X size={13} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Products */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="list-product-grid">
                {[...Array(9)].map((_, i) => <SkeletonProductCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#999' }}>
                <Search size={48} color="#e5e5e5" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 500, color: '#000', marginBottom: '0.5rem' }}>No products found</p>
                <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="list-product-grid">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
                    <button
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 1}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.65rem 1.25rem', borderRadius: '999px',
                        border: '1px solid #e5e5e5', background: '#fff',
                        fontSize: '0.875rem', cursor: page === 1 ? 'not-allowed' : 'pointer',
                        opacity: page === 1 ? 0.4 : 1,
                      }}
                    >
                      ← Previous
                    </button>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {[...Array(Math.min(totalPages, 10))].map((_, i) => {
                        const p = i + 1
                        if (totalPages > 7 && p > 3 && p < totalPages - 1 && Math.abs(p - page) > 1) {
                          if (p === 4) return <span key={p} style={{ padding: '0 0.25rem', color: '#999' }}>...</span>
                          return null
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                              width: '36px', height: '36px', borderRadius: '999px',
                              border: '1px solid #e5e5e5',
                              background: page === p ? '#000' : '#fff',
                              color: page === p ? '#fff' : '#000',
                              fontSize: '0.875rem', fontWeight: page === p ? 700 : 400,
                              cursor: 'pointer',
                            }}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page === totalPages}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.65rem 1.25rem', borderRadius: '999px',
                        border: '1px solid #e5e5e5', background: '#fff',
                        fontSize: '0.875rem', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                        opacity: page === totalPages ? 0.4 : 1,
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .filters-sidebar { display: none !important; }
          .mobile-filter-btn { display: inline-flex !important; }
          .list-product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .list-product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
