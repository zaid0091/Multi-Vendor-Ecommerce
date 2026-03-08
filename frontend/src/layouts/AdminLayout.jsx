import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ShoppingBag, DollarSign, Shield, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/sellers', icon: Users, label: 'Sellers' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'All Orders' },
  { to: '/admin/commission', icon: DollarSign, label: 'Commission' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!sidebarOpen) return
    const handleClick = (e) => {
      if (e.target.closest('.sidebar') || e.target.closest('.hamburger-btn')) return
      setSidebarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sidebarOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <Shield size={22} color="#6366f1" />
          <span>Admin Panel</span>
          {/* Close button inside sidebar (mobile) */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#cbd5e1' }}>{user?.first_name} {user?.last_name}</div>
            <div>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#94a3b8', fontSize: '0.85rem', width: '100%' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Hamburger button (visible on tablet/mobile) */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <Outlet />
      </main>
    </div>
  )
}
