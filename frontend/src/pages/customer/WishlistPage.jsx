import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ProductCard from '../../components/ProductCard'
import SkeletonProductCard from '../../components/SkeletonProductCard'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { wishlistAPI } from '../../api'
import { useState, useEffect, useRef } from 'react'

export default function WishlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const startRef = useRef(Date.now())
  const { fetchWishlist } = useWishlist()

  const fetch = () => {
    startRef.current = Date.now()
    setLoading(true)
    setShowSkeleton(true)
    wishlistAPI.list()
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => {
        setLoading(false)
        const elapsed = Date.now() - startRef.current
        setTimeout(() => setShowSkeleton(false), Math.max(0, 2000 - elapsed))
      })
  }

  useEffect(() => { fetch() }, [])

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Navbar />
      <div className="navbar-spacer" />
      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Heart size={26} fill="#ef4444" stroke="#ef4444" />
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
            My Wishlist
          </h1>
          {!showSkeleton && items.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>

        {showSkeleton ? (
          <div className="product-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonProductCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <Heart size={64} color="#d4d4d4" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.75rem' }}>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Browse products and tap the heart icon to save your favourites.
            </p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map(item => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
