import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Store, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { authAPI } from '../../api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [token, setToken] = useState('')
  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = searchParams.get('token') || ''
    setToken(t)
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!token.trim()) {
      setError('Reset token is missing. Please use the link from the reset email.')
      return
    }

    setLoading(true)
    try {
      await authAPI.confirmPasswordReset(token, form.new_password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const d = err.response?.data
      setError(d?.error || 'Failed to reset password. The token may have expired.')
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
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Set a new password</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#dcfce7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1rem',
            }}>
              <Check size={28} color="#16a34a" />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Password Reset!</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Your password has been changed. Redirecting you to sign in…
            </p>
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.9rem' }}>
              Sign In now →
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                background: '#fee2e2', color: '#b91c1c',
                padding: '0.75rem 1rem', borderRadius: '0.5rem',
                fontSize: '0.88rem', marginBottom: '1.25rem',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                {error}
              </div>
            )}

            {/* Token input (if not pre-filled from URL) */}
            {!searchParams.get('token') && (
              <div className="form-group">
                <label className="form-label">Reset Token</label>
                <input className="form-input" value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Paste your reset token here"
                  autoFocus />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Copy the token from the reset email or the Forgot Password page.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">New Password</label>
                <input
                  type={showPw ? 'text' : 'password'} className="form-input"
                  value={form.new_password}
                  onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                  placeholder="Min 8 characters" required minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: '0.75rem', top: '2.1rem',
                  background: 'none', color: '#64748b',
                }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type={showPw ? 'text' : 'password'} className="form-input"
                  value={form.confirm_password}
                  onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                  placeholder="Re-enter password" required minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={loading}>
                {loading ? 'Resetting...' : 'Set New Password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/forgot-password"
                style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                ← Request a new reset link
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
