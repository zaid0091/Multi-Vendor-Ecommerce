import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, LogOut, Menu, X, CircleUserRound, Heart, ChevronDown, ShoppingBag, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const { wishlistIds } = useWishlist()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [shopOpen, setShopOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const shopRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (shopRef.current && !shopRef.current.contains(e.target)) setShopOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    setDrawerOpen(false)
    setUserOpen(false)
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  // Avatar initials
  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || user.email?.[0]?.toUpperCase()
    : ''

  return (
    <>
      {/* Announcement bar */}
      <div className="announcement-bar">
        <span>Sign up and get 20% off to your first order.</span>
        {!user && <Link to="/register" style={{ color: '#fff', fontWeight: 700, marginLeft: '6px', textDecoration: 'underline' }}>Sign Up Now</Link>}
        <button
          onClick={() => {}}
          style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#fff', display: 'flex', padding: '2px' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="main-nav">
        {/* Mobile hamburger */}
        <button className="nav-mobile-btn" onClick={() => setDrawerOpen(o => !o)}>
          {drawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <Link to="/" className="nav-logo">SHOP.CO</Link>

        {/* Desktop links */}
        <div className="nav-links-desktop nav-center-links">
          {/* Shop dropdown */}
          <div ref={shopRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShopOpen(o => !o)}
              style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.9rem', color: '#000', fontWeight: 400 }}
            >
              Shop <ChevronDown size={15} />
            </button>
            {shopOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '0.5rem',
                minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 300,
              }}>
                <DropLink to="/products" onClick={() => setShopOpen(false)}>All Products</DropLink>
                <DropLink to="/products?ordering=-created_at" onClick={() => setShopOpen(false)}>New Arrivals</DropLink>
                <DropLink to="/sale" onClick={() => setShopOpen(false)} color="#dc2626">On Sale</DropLink>
              </div>
            )}
          </div>

          <Link to="/sale" style={{ color: '#000', fontWeight: 400, fontSize: '0.9rem' }}>On Sale</Link>
          <Link to="/products?ordering=-created_at" style={{ color: '#000', fontWeight: 400, fontSize: '0.9rem' }}>New Arrivals</Link>
          <Link to="/products" style={{ color: '#000', fontWeight: 400, fontSize: '0.9rem' }}>Brands</Link>

          {user?.role === 'customer' && (
            <Link to="/become-seller" style={{ color: '#000', fontWeight: 400, fontSize: '0.9rem' }}>Start Selling</Link>
          )}
          {user?.role === 'seller' && (
            <Link to="/seller" style={{ color: '#000', fontWeight: 400, fontSize: '0.9rem' }}>Dashboard</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ color: '#000', fontWeight: 400, fontSize: '0.9rem' }}>Admin</Link>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="nav-search-desktop" style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search for products..."
            style={{
              width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
              borderRadius: 'var(--radius-full)', border: 'none',
              background: 'var(--bg-secondary)', fontSize: '0.875rem', color: 'var(--text)',
            }}
          />
        </form>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {user?.role === 'customer' && (
            <>
              <Link to="/wishlist" style={{ position: 'relative', color: '#000', display: 'flex' }} title="Wishlist">
                <Heart size={22} fill={wishlistIds.size > 0 ? '#ef4444' : 'none'} stroke={wishlistIds.size > 0 ? '#ef4444' : '#000'} />
                {wishlistIds.size > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-8px',
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    width: '17px', height: '17px', fontSize: '0.65rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>{wishlistIds.size}</span>
                )}
              </Link>
              <Link to="/cart" style={{ position: 'relative', color: '#000', display: 'flex' }}>
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-8px',
                    background: '#000', color: '#fff', borderRadius: '50%',
                    width: '17px', height: '17px', fontSize: '0.65rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>{itemCount}</span>
                )}
              </Link>
            </>
          )}

          {user ? (
            <div ref={userRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'transparent', cursor: 'pointer', padding: '2px',
                }}
              >
                {/* Avatar circle with initials */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {initials || <User size={15} color="#fff" />}
                </div>
                <span className="nav-links-desktop" style={{ display: 'inline', fontSize: '0.85rem', color: '#000', fontWeight: 500 }}>
                  {user.first_name}
                </span>
                <ChevronDown size={14} color="#666" className="nav-links-desktop" style={{ display: 'inline' }} />
              </button>

              {userOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: '#fff', border: '1px solid var(--border)',
                  borderRadius: '0.75rem', padding: '0.5rem',
                  minWidth: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 300,
                }}>
                  {/* User info header */}
                  <div style={{ padding: '0.6rem 0.75rem 0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{user.email}</div>
                  </div>

                  {user.role === 'customer' && (
                    <>
                      <DropLink to="/profile" onClick={() => setUserOpen(false)} icon={<User size={14} />}>My Profile</DropLink>
                      <DropLink to="/orders" onClick={() => setUserOpen(false)} icon={<ShoppingBag size={14} />}>My Orders</DropLink>
                    </>
                  )}
                  {user.role === 'seller' && (
                    <DropLink to="/seller" onClick={() => setUserOpen(false)} icon={<ShoppingBag size={14} />}>Seller Dashboard</DropLink>
                  )}
                  {user.role === 'admin' && (
                    <DropLink to="/admin" onClick={() => setUserOpen(false)} icon={<ShoppingBag size={14} />}>Admin Panel</DropLink>
                  )}

                  <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.5rem 0.75rem', borderRadius: '6px',
                        background: 'transparent', color: '#ef4444',
                        fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-links-desktop" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link to="/login" style={{ fontSize: '0.875rem', color: '#000' }}>Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 198 }} />
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px',
            background: '#fff', zIndex: 199, padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
            boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-0.03em' }}>SHOP.CO</span>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'transparent', padding: '0.25rem' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={(e) => { handleSearch(e); setDrawerOpen(false) }} style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  borderRadius: 'var(--radius-full)', border: 'none',
                  background: 'var(--bg-secondary)', fontSize: '0.85rem',
                }}
              />
            </form>

            <MobileLink to="/products" onClick={() => setDrawerOpen(false)}>Shop</MobileLink>
            <MobileLink to="/sale" onClick={() => setDrawerOpen(false)} color="#dc2626">On Sale</MobileLink>
            <MobileLink to="/products?ordering=-created_at" onClick={() => setDrawerOpen(false)}>New Arrivals</MobileLink>
            <MobileLink to="/products" onClick={() => setDrawerOpen(false)}>Brands</MobileLink>
            {user?.role === 'customer' && (
              <>
                <MobileLink to="/profile" onClick={() => setDrawerOpen(false)}>My Profile</MobileLink>
                <MobileLink to="/orders" onClick={() => setDrawerOpen(false)}>My Orders</MobileLink>
                <MobileLink to="/cart" onClick={() => setDrawerOpen(false)}>Cart {itemCount > 0 && `(${itemCount})`}</MobileLink>
                <MobileLink to="/wishlist" onClick={() => setDrawerOpen(false)}>Wishlist {wishlistIds.size > 0 && `(${wishlistIds.size})`}</MobileLink>
                <MobileLink to="/become-seller" onClick={() => setDrawerOpen(false)}>Start Selling</MobileLink>
              </>
            )}
            {user?.role === 'seller' && <MobileLink to="/seller" onClick={() => setDrawerOpen(false)}>Dashboard</MobileLink>}
            {user?.role === 'admin' && <MobileLink to="/admin" onClick={() => setDrawerOpen(false)}>Admin</MobileLink>}

            <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

            {user ? (
              <>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  Signed in as <strong style={{ color: '#000' }}>{user.first_name}</strong>
                </div>
                <button onClick={handleLogout} style={{
                  background: 'transparent', color: '#ef4444',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.9rem', padding: '0.5rem 0',
                }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Link to="/login" onClick={() => setDrawerOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Sign In</Link>
                <Link to="/register" onClick={() => setDrawerOpen(false)} className="btn btn-primary" style={{ flex: 1 }}>Sign Up</Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

function DropLink({ to, onClick, children, color, icon }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', borderRadius: '6px', color: color || '#1e293b', fontWeight: 500, textDecoration: 'none', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon && <span style={{ color: '#6366f1', display: 'flex' }}>{icon}</span>}
      {children}
    </Link>
  )
}

function MobileLink({ to, onClick, children, color }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'block', padding: '0.6rem 0', fontSize: '0.95rem',
      fontWeight: color ? 700 : 500, color: color || '#000', borderBottom: '1px solid var(--border-light)',
    }}>
      {children}
    </Link>
  )
}
