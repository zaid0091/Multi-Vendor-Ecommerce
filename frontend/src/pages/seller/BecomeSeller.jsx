import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Package, DollarSign, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'
import { authAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'

const perks = [
  { icon: Package, title: 'List Unlimited Products', desc: 'Upload products with images, descriptions and pricing' },
  { icon: DollarSign, title: 'Earn Real Money', desc: 'Keep 90% of every sale — we only take a 10% platform fee' },
  { icon: TrendingUp, title: 'Track Your Growth', desc: 'Analytics dashboard to monitor sales and revenue' },
  { icon: Store, title: 'Your Own Storefront', desc: 'A branded store page customers can browse and follow' },
]

export default function BecomeSeller() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBecomeSeller = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await authAPI.becomeSeller()
      // Update tokens and user state
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setUser(data.user)
      navigate('/seller')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: 'clamp(3rem, 8vw, 5rem) 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '2rem', padding: '0.4rem 1rem', marginBottom: '1.5rem',
            fontSize: '0.85rem', color: '#a5b4fc',
          }}>
            <Store size={14} /> Seller Programme
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
            Start Selling on <span style={{ color: '#6366f1' }}>MultiVend</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', marginBottom: '2rem' }}>
            Reach thousands of customers. Set up your store in minutes and start earning today.
          </p>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5',
              marginBottom: '1.5rem', fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}
          <button
            onClick={handleBecomeSeller}
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ fontSize: '1rem', padding: '0.85rem 2.5rem', gap: '0.6rem' }}
          >
            {loading ? 'Setting up...' : <>Become a Seller <ArrowRight size={18} /></>}
          </button>
          <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '1rem' }}>
            Free to join · No monthly fees · Only pay when you sell
          </p>
        </div>
      </div>

      {/* Perks */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', marginBottom: '2.5rem', color: '#1e293b' }}>
          Everything you need to succeed
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
        }}>
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: 'white', borderRadius: '1rem', padding: '1.75rem 1.5rem',
              border: '1px solid #e2e8f0', textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: '52px', height: '52px', background: '#ede9fe', borderRadius: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              }}>
                <Icon size={24} color="#6366f1" />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{
          background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0',
          padding: '2rem', marginTop: '2.5rem',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', color: '#1e293b' }}>How it works</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { step: '1', text: 'Click "Become a Seller" — your account is instantly upgraded' },
              { step: '2', text: 'Create your store profile with a name and description' },
              { step: '3', text: 'Wait for admin approval (usually within 24 hours)' },
              { step: '4', text: 'Start listing products and earning money!' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '32px', height: '32px', minWidth: '32px', background: '#6366f1',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '0.85rem',
                }}>
                  {step}
                </div>
                <span style={{ color: '#475569', fontSize: '0.9rem' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <button
            onClick={handleBecomeSeller}
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ fontSize: '1rem', padding: '0.85rem 2.5rem', gap: '0.6rem' }}
          >
            {loading ? 'Setting up...' : <>Get Started Now <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
