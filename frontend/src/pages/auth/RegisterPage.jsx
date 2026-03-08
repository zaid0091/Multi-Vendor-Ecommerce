import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, Eye, EyeOff, User, Briefcase } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'customer'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      if (user.role === 'seller') navigate('/seller')
      else navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.values(data).flat()
        setError(msgs[0] || 'Registration failed')
      } else {
        setError('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Store size={28} color="#6366f1" />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>MultiVend</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Create your account</p>
        </div>

        {/* Role selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { value: 'customer', label: 'I\'m a Buyer', icon: User, desc: 'Shop for products' },
            { value: 'seller', label: 'I\'m a Seller', icon: Briefcase, desc: 'Sell my products' }
          ].map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm({ ...form, role: value })}
              style={{
                padding: '1rem', border: `2px solid ${form.role === value ? '#6366f1' : '#e2e8f0'}`,
                borderRadius: '0.75rem', background: form.role === value ? '#ede9fe' : 'white',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s'
              }}
            >
              <Icon size={20} color={form.role === value ? '#6366f1' : '#94a3b8'} style={{ margin: '0 auto 0.25rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: form.role === value ? '#6366f1' : '#1e293b' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{desc}</div>
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                placeholder="John" required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                placeholder="Doe" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" required />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password</label>
            <input type={showPass ? 'text' : 'password'} className="form-input" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters" required minLength={8} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: '0.75rem', top: '2.1rem',
              background: 'none', color: '#64748b'
            }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
