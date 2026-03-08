import React from 'react'
import { Link } from 'react-router-dom'
import { Star, Heart } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

function StarRating({ rating, count }) {
  if (!rating) return null
  const full = Math.floor(rating)
  const half = rating - full >= 0.4
  const empty = 5 - full - (half ? 1 : 0)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '0.4rem' }}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={14} fill="#FFC633" color="#FFC633" />
      ))}
      {half && (
        <span style={{ position: 'relative', display: 'inline-block', width: 14, height: 14 }}>
          <Star size={14} color="#e2e8f0" fill="#e2e8f0" />
          <span style={{ position: 'absolute', left: 0, top: 0, width: '50%', overflow: 'hidden', display: 'inline-block', lineHeight: 1 }}>
            <Star size={14} fill="#FFC633" color="#FFC633" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={14} fill="#e2e8f0" color="#e2e8f0" />
      ))}
      <span style={{ fontSize: '0.78rem', color: '#999', marginLeft: '3px' }}>
        {rating.toFixed(1)}/5
        {count != null && <span style={{ color: '#bbb' }}> ({count})</span>}
      </span>
    </div>
  )
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { toggle: toggleWishlist, isWishlisted } = useWishlist()
  const inWishlist = isWishlisted(product.id)

  const handleCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product.id, 1)
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  const hasDiscount = product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compare_at_price)) * 100)
    : 0

  return (
    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="product-card">
        {/* Image */}
        <div style={{
          position: 'relative',
          background: '#f0f0f0',
          borderRadius: '1rem',
          overflow: 'hidden',
          aspectRatio: '3 / 4',
          marginBottom: '0.85rem',
        }}>
          {product.image ? (
            <img src={product.image} alt={product.name} style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#bbb', fontSize: '0.8rem',
            }}>
              No image
            </div>
          )}

          {/* Sale badge */}
          {hasDiscount && (
            <div style={{
              position: 'absolute', top: '0.6rem', left: '0.6rem',
              background: '#ff3333', color: '#fff',
              fontSize: '0.7rem', fontWeight: 600,
              borderRadius: '999px', padding: '3px 8px',
            }}>
              -{discountPct}%
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            style={{
              position: 'absolute', top: '0.6rem', right: '0.6rem',
              background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: '50%',
              width: '30px', height: '30px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={14} fill={inWishlist ? '#ef4444' : 'none'} color={inWishlist ? '#ef4444' : '#666'} />
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '0 0.25rem' }}>
            <h3 style={{
              fontSize: 'clamp(0.78rem, 2.5vw, 0.95rem)', fontWeight: 700, lineHeight: 1.3,
              marginBottom: '0.3rem', color: '#000',
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {product.name}
            </h3>

            <StarRating rating={product.avg_rating} count={product.review_count} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(0.88rem, 2.5vw, 1.1rem)', fontWeight: 700, color: '#000' }}>
                ${parseFloat(product.price).toFixed(0)}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: 'clamp(0.78rem, 2vw, 0.95rem)', color: '#bbb', textDecoration: 'line-through', fontWeight: 400 }}>
                  ${parseFloat(product.compare_at_price).toFixed(0)}
                </span>
              )}
            </div>
        </div>
      </div>
    </Link>
  )
}
