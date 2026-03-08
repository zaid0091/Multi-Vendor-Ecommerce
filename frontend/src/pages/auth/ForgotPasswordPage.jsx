import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Mail, ArrowLeft, Check } from 'lucide-react'
import { authAPI } from '../../api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devToken, setDevToken] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.requestPasswordReset(email)
      setSent(true)
      // In dev mode the backend returns the token directly
      if (data.dev_token) setDevToken(data.dev_token)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: '1rem', padding: '2.5rem',
        width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Store size={28} color="#6366f1" />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>MultiVend</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Reset your password</p>
        </div>

        {!sent ? (
          <>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Enter your account email and we'll send you a reset link.
            </p>

            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email" className="form-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={loading}>
                {loading ? 'Sending...' : (
                  <><Mail size={16} /> Send Reset Link</>
                )}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#dcfce7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1rem',
            }}>
              <Check size={28} color="#16a34a" />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Check your email</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>

            {/* Dev mode helper — shows token inline so you can test without email */}
            {devToken && (
              <div style={{
                background: '#fef9c3', border: '1px solid #fde047',
                borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem',
                textAlign: 'left',
              }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#854d0e', marginBottom: '0.35rem' }}>
                  Dev Mode — Reset Token:
                </p>
                <code style={{ fontSize: '0.72rem', wordBreak: 'break-all', color: '#78350f' }}>
                  {devToken}
                </code>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.82rem', color: '#6366f1', fontWeight: 600 }}>
                  → Use this token to reset password
                </Link>
              </div>
            )}

            <Link to="/login" style={{ fontSize: '0.88rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        )}

        {!sent && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" style={{ fontSize: '0.88rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
