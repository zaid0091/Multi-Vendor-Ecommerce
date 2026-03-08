import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Store, Package, Star, ShoppingBag, ArrowLeft, Search } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import { storeAPI, productAPI } from '../../api'

export default function StorePage() {
  const { id } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingStore, setLoadingStore] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('-created_at')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    storeAPI.detail(id)
      .then(({ data }) => setStore(data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoadingStore(false))
  }, [id])

  useEffect(() => {
    setLoadingProducts(true)
    productAPI.list({ seller: id, ordering: sort, search, page_size: 50 })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results || []
        setProducts(list)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [id, sort, search])

  if (loadingStore) return (
    <>
        <Navbar />
        <div className="navbar-spacer" />
        <div className="loading-center"><div className="spinner"></div></div>
      </>
    )

    if (notFound) return (
      <>
        <Navbar />
        <div className="navbar-spacer" />
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <Store size={64} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Store not found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>This store may no longer be active.</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
      <Footer />
    </>
  )

  return (
    <>
        <Navbar />
        <div className="navbar-spacer" />

        {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#fff', padding: '3rem 1rem' }}>
        <div className="container">
          <Link
            to="/products"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} /> Back to Products
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Logo / Avatar */}
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: store?.logo ? 'transparent' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border: '3px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {store?.logo ? (
                <img src={store.logo} alt={store.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Store size={36} color="#fff" />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 800, marginBottom: '0.4rem' }}>
                {store?.store_name}
              </h1>
              {store?.description && (
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.6 }}>
                  {store.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Package size={14} />
                  <span><strong style={{ color: '#fff' }}>{store?.total_products ?? '—'}</strong> Products</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <ShoppingBag size={14} />
                  <span><strong style={{ color: '#fff' }}>${(store?.total_sales ?? 0).toFixed(2)}</strong> Total Sales</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Star size={14} />
                  <span>Member since <strong style={{ color: '#fff' }}>{store?.created_at ? new Date(store.created_at).getFullYear() : '—'}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container" style={{ padding: '2rem 1rem' }}>
        {/* Filters bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '2.2rem' }}
              placeholder="Search in this store…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="-created_at">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {loadingProducts ? (
          <div className="loading-center" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <ShoppingBag size={56} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No products found</h3>
            <p style={{ fontSize: '0.9rem' }}>
              {search ? `No results for "${search}"` : 'This store has no products yet.'}
            </p>
            {search && (
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setSearch('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  )
}
