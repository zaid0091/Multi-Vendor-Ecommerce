import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Lock, ShoppingBag, Heart, ChevronRight, Check, AlertCircle, Calendar, Mail, Shield } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { authAPI, orderAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function ProfilePage() {
  const { user, setUser } = useAuth()

  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const [recentOrders, setRecentOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (user) setProfileForm({ first_name: user.first_name || '', last_name: user.last_name || '' })
  }, [user])

  useEffect(() => {
    orderAPI.list()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results || []
        setRecentOrders(list.slice(0, 5))
      })
      .catch(() => setRecentOrders([]))
      .finally(() => setOrdersLoading(false))
  }, [])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const { data } = await authAPI.updateProfile(profileForm)
      setUser(data)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      const d = err.response?.data
      const msg = d ? Object.values(d).flat().join(' ') : 'Failed to update profile.'
      setProfileMsg({ type: 'error', text: msg })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (pwForm.new_password.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    setPwSaving(true)
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      setPwMsg({ type: 'success', text: 'Password changed successfully.' })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      const d = err.response?.data
      const msg = d?.error || (d ? Object.values(d).flat().join(' ') : 'Failed to change password.')
      setPwMsg({ type: 'error', text: msg })
    } finally {
      setPwSaving(false)
    }
  }

  const STATUS_COLORS = {
    pending:    { bg: '#fef9c3', color: '#854d0e' },
    processing: { bg: '#dbeafe', color: '#1e40af' },
    shipped:    { bg: '#e0f2fe', color: '#0369a1' },
    delivered:  { bg: '#dcfce7', color: '#15803d' },
    cancelled:  { bg: '#fee2e2', color: '#b91c1c' },
  }

  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase()
    : ''

  const memberSince = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const TABS = [
    { id: 'profile', label: 'Profile', icon: <User size={15} /> },
    { id: 'password', label: 'Password', icon: <Lock size={15} /> },
    { id: 'orders',  label: 'Orders',   icon: <ShoppingBag size={15} /> },
  ]

  return (
    <>
      <Navbar />
      <div className="navbar-spacer" />

      <div style={{ minHeight: '80vh', background: '#f8fafc', paddingBottom: '5rem' }}>

        {/* Hero banner */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '2.5rem 1rem 4rem',
        }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1rem' }}>

          {/* Profile card pulled up over the banner */}
          <div style={{
            background: '#fff', borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            padding: '1.75rem 2rem',
            marginTop: '-3rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', gap: '1.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
          }}>
            {/* Big avatar */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.75rem', fontWeight: 800,
              flexShrink: 0, border: '4px solid #fff',
              boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
            }}>
              {initials || <User size={32} color="#fff" />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#1e293b' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name}` : 'My Account'}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#64748b' }}>
                  <Mail size={13} /> {user?.email}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                  background: '#ede9fe', color: '#6d28d9',
                  padding: '2px 10px', borderRadius: '999px',
                }}>
                  <Shield size={11} /> {user?.role}
                </span>
                {memberSince && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <Calendar size={13} /> Member since {memberSince}
                  </span>
                )}
              </div>
            </div>

            {/* Quick action links */}
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <Link to="/orders" style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.6rem',
                background: '#f1f5f9', color: '#1e293b',
                fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
              }}>
                <ShoppingBag size={15} /> Orders
              </Link>
              <Link to="/wishlist" style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.6rem',
                background: '#fff1f2', color: '#e11d48',
                fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
              }}>
                <Heart size={15} /> Wishlist
              </Link>
            </div>
          </div>

          {/* Tab card */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem', display: 'flex', gap: '0' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '1rem 1.1rem',
                    fontWeight: 600, fontSize: '0.875rem',
                    background: 'transparent', cursor: 'pointer',
                    borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                    color: tab === t.id ? '#6366f1' : '#64748b',
                    marginBottom: '-1px',
                    transition: 'color 0.15s',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '2rem' }}>

              {/* ── Profile Tab ── */}
              {tab === 'profile' && (
                <form onSubmit={handleProfileSave} style={{ maxWidth: '480px' }}>
                  <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.5rem', color: '#1e293b' }}>
                    Personal Information
                  </h2>

                  {profileMsg && (
                    <Alert type={profileMsg.type} text={profileMsg.text} />
                  )}

                  <div className="form-group">
                    <label className="form-label">Email address</label>
                    <input className="form-input" value={user?.email || ''} disabled
                      style={{ background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Email cannot be changed.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" value={profileForm.first_name}
                        onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))}
                        placeholder="First name" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" value={profileForm.last_name}
                        onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))}
                        placeholder="Last name" required />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={profileSaving} style={{ marginTop: '0.75rem' }}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}

              {/* ── Password Tab ── */}
              {tab === 'password' && (
                <form onSubmit={handlePasswordSave} style={{ maxWidth: '420px' }}>
                  <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.5rem', color: '#1e293b' }}>
                    Change Password
                  </h2>

                  {pwMsg && <Alert type={pwMsg.type} text={pwMsg.text} />}

                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input className="form-input" type="password" value={pwForm.current_password}
                      onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                      required autoComplete="current-password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input className="form-input" type="password" value={pwForm.new_password}
                      onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                      required autoComplete="new-password" minLength={8} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-input" type="password" value={pwForm.confirm_password}
                      onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                      required autoComplete="new-password" minLength={8} />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={pwSaving} style={{ marginTop: '0.75rem' }}>
                    {pwSaving ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              )}

              {/* ── Recent Orders Tab ── */}
              {tab === 'orders' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0, color: '#1e293b' }}>Recent Orders</h2>
                    <Link to="/orders" style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                      View All →
                    </Link>
                  </div>

                    {ordersLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} className="skeleton skeleton-order-card" />
                        ))}
                      </div>
                  ) : recentOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      <ShoppingBag size={48} color="#e2e8f0" style={{ margin: '0 auto 1rem', display: 'block' }} />
                      <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#64748b' }}>No orders yet</p>
                      <Link to="/products" style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.9rem' }}>Start Shopping →</Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {recentOrders.map(order => {
                        const status = order.payment_status || 'pending'
                        const sc = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#475569' }
                        const itemCount = order.seller_orders?.reduce((s, so) => s + (so.items?.length || 0), 0) || 0
                        return (
                          <Link key={order.id} to={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                              border: '1px solid #e2e8f0', borderRadius: '0.75rem',
                              padding: '1rem 1.25rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              transition: 'box-shadow 0.15s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Order #{order.id}</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                                  {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  {' · '}{itemCount} item{itemCount !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                                  ${parseFloat(order.total_amount).toFixed(2)}
                                </span>
                                <span style={{
                                  background: sc.bg, color: sc.color,
                                  padding: '3px 10px', borderRadius: '999px',
                                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                                }}>
                                  {status}
                                </span>
                                <ChevronRight size={16} color="#94a3b8" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

function Alert({ type, text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem',
      background: type === 'success' ? '#dcfce7' : '#fee2e2',
      color: type === 'success' ? '#15803d' : '#b91c1c',
      fontSize: '0.875rem', fontWeight: 500,
    }}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      {text}
    </div>
  )
}
