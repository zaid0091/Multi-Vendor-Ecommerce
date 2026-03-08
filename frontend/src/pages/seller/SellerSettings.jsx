import React, { useState, useEffect } from 'react'
import { Store, Save, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sellerAPI } from '../../api'

export default function SellerSettings() {
  const [store, setStore] = useState(null)
  const [form, setForm] = useState({ store_name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [noStore, setNoStore] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    sellerAPI.getStore()
      .then(({ data }) => {
        setStore(data)
        setForm({ store_name: data.store_name, description: data.description || '' })
      })
      .catch(err => {
        if (err.response?.status === 404) setNoStore(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
        if (noStore) {
          const { data } = await sellerAPI.createStore(form)
          setStore(data)
          setNoStore(false)
          setMessage({ type: 'success', text: 'Store created! Pending admin approval. Redirecting...' })
          setTimeout(() => navigate('/seller'), 1500)
        } else {
        const { data } = await sellerAPI.updateStore(form)
        setStore(data)
        setMessage({ type: 'success', text: 'Store settings updated successfully.' })
      }
    } catch (err) {
      const data = err.response?.data
      const msgs = data ? Object.values(data).flat() : ['Failed to save']
      setMessage({ type: 'error', text: msgs[0] })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  const statusInfo = {
    pending: { className: 'alert-info', text: 'Your store is pending admin approval. You will be able to add products once approved.' },
    approved: { className: 'alert-success', text: 'Your store is approved and active. Customers can see your products.' },
    suspended: { className: 'alert-error', text: 'Your store has been suspended. Contact support for assistance.' },
  }

  return (
    <div>
      <div className="page-header">
        <h1>Store Settings</h1>
        <p>Manage your store profile</p>
      </div>

      {store && statusInfo[store.status] && (
        <div className={`alert ${statusInfo[store.status].className}`} style={{ marginBottom: '1.5rem' }}>
          {statusInfo[store.status].text}
        </div>
      )}

      {noStore && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>You don't have a store yet. Fill out the form below to create one.</span>
        </div>
      )}

      <div style={{ maxWidth: '600px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '44px', height: '44px', background: '#ede9fe', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={22} color="#6366f1" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{noStore ? 'Create Store' : 'Store Profile'}</h2>
              {store && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Store ID: #{store.id}</div>}
            </div>
          </div>

          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1.25rem' }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Store Name *</label>
              <input
                className="form-input"
                value={form.store_name}
                onChange={e => setForm({ ...form, store_name: e.target.value })}
                required
                placeholder="e.g. TechGadgets Store"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Store Description</label>
              <textarea
                className="form-input"
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Tell customers about your store..."
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />
              {saving ? 'Saving...' : noStore ? 'Create Store' : 'Save Changes'}
            </button>
          </form>
        </div>

        {store && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Store Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Products</span>
                <strong>{store.total_products}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Sales</span>
                <strong>${parseFloat(store.total_sales || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Member Since</span>
                <strong>{new Date(store.created_at).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
