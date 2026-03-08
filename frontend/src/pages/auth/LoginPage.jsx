import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'seller') navigate('/seller')
      else navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data?.non_field_errors) setError(data.non_field_errors[0])
      else if (data?.detail) setError(data.detail)
      else setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Store size={28} color="#6366f1" />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>MultiVend</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="form-input"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: '0.75rem', top: '2.1rem',
              background: 'none', color: '#64748b'
            }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.83rem', color: '#6366f1', fontWeight: 500 }}>
              Forgot your password?
            </Link>
          </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#6366f1', fontWeight: 600 }}>Sign up</Link>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
          <strong>Demo accounts:</strong><br />
          Admin: admin@test.com / admin123<br />
          Seller: seller@test.com / test123<br />
          Customer: customer@test.com / test123
        </div>
      </div>
    </div>
  )
}
