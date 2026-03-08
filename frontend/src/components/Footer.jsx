import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Twitter, Facebook, Instagram, Github } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'already' | 'error'
  const [message, setMessage] = useState('')

  async function handleSubscribe(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.status === 201) {
        setStatus('success')
        setMessage(data.message)
        setEmail('')
      } else if (res.status === 200) {
        setStatus('already')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <footer>
      {/* Newsletter */}
      <div className="footer-newsletter">
        <h2 className="footer-newsletter-title">
          STAY UPTO DATE ABOUT OUR LATEST OFFERS
        </h2>
        <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
            <input
              type="email"
              placeholder="Enter your email address"
              className="footer-email-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={status === 'loading' || status === 'success'}
              required
            />
          </div>
          <button
            className="footer-subscribe-btn"
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            style={{ opacity: status === 'loading' ? 0.7 : 1 }}
          >
            {status === 'loading' ? 'Subscribing…' : status === 'success' ? 'Subscribed!' : 'Subscribe to Newsletter'}
          </button>
        </form>
        {message && (
          <p style={{
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            color: status === 'success' ? '#22c55e' : status === 'already' ? '#f59e0b' : '#ef4444',
            textAlign: 'center',
          }}>
            {message}
          </p>
        )}
      </div>

      {/* Main footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Brand col */}
            <div className="footer-brand">
              <h3 className="footer-logo">SHOP.CO</h3>
              <p className="footer-tagline">
                We have clothes that suits your style and which you're proud to wear. From women to men.
              </p>
              <div className="footer-socials">
                {[
                  { icon: <Twitter size={15} />, href: '#' },
                  { icon: <Facebook size={15} />, href: '#' },
                  { icon: <Instagram size={15} />, href: '#' },
                  { icon: <Github size={15} />, href: '#' },
                ].map((s, i) => (
                  <a key={i} href={s.href} className="footer-social-icon">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <FooterCol title="COMPANY" links={[
              { label: 'About', to: '/' },
              { label: 'Features', to: '/' },
              { label: 'Works', to: '/' },
              { label: 'Career', to: '/' },
            ]} />

            <FooterCol title="HELP" links={[
              { label: 'Customer Support', to: '/' },
              { label: 'Delivery Details', to: '/' },
              { label: 'Terms & Conditions', to: '/' },
              { label: 'Privacy Policy', to: '/' },
            ]} />

            <FooterCol title="FAQ" links={[
              { label: 'Account', to: '/' },
              { label: 'Manage Deliveries', to: '/' },
              { label: 'Orders', to: '/orders' },
              { label: 'Payments', to: '/' },
            ]} />

            <FooterCol title="RESOURCES" links={[
              { label: 'Free eBook', to: '/' },
              { label: 'Development Tutorial', to: '/' },
              { label: 'How to - Blog', to: '/' },
              { label: 'Youtube Playlist', to: '/' },
            ]} />
          </div>

          {/* Bottom */}
          <div className="footer-bottom">
            <p className="footer-copy">
              Shop.co &copy; 2000-2023. All Rights Reserved
            </p>
            <div className="footer-payments">
              {[
                { label: 'VISA', bg: '#1a1f71', color: '#fff' },
                { label: 'MC', bg: '#fff', color: '#eb001b', border: true },
                { label: 'PayPal', bg: '#003087', color: '#fff' },
                { label: 'Apple', bg: '#000', color: '#fff' },
                { label: 'G Pay', bg: '#fff', color: '#000', border: true },
              ].map(p => (
                <div key={p.label} className="footer-payment-badge" style={{
                  background: p.bg, color: p.color,
                  border: p.border ? '1px solid #e5e5e5' : 'none',
                }}>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div className="footer-col">
      <h4 className="footer-col-title">{title}</h4>
      <div className="footer-col-links">
        {links.map(({ label, to }) => (
          <Link key={label} to={to} className="footer-link">
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
