import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, Tag, ToggleLeft, ToggleRight, X, Check } from 'lucide-react'
import { couponAPI } from '../../api'

const EMPTY_FORM = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  max_uses: '',
  expires_at: '',
  is_active: true,
}

function Badge({ children, color }) {
  const colors = {
    green:  { background: '#dcfce7', color: '#15803d' },
    red:    { background: '#fee2e2', color: '#b91c1c' },
    yellow: { background: '#fef9c3', color: '#a16207' },
    gray:   { background: '#f1f5f9', color: '#475569' },
    indigo: { background: '#ede9fe', color: '#5b21b6' },
  }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '9999px',
      fontSize: '0.72rem', fontWeight: 600, ...colors[color],
    }}>
      {children}
    </span>
  )
}

export default function SellerCoupons() {
  const [coupons, setCoupons]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [deleteId, setDeleteId]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await couponAPI.list()
      setCoupons(data)
    } catch {
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : '',
      max_uses: c.max_uses != null ? String(c.max_uses) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
      is_active: c.is_active,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setError('')
    if (!form.code.trim()) { setError('Coupon code is required.'); return }
    if (!form.discount_value || isNaN(form.discount_value)) { setError('Enter a valid discount value.'); return }

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    }

    setSaving(true)
    try {
      if (editing) {
        await couponAPI.update(editing, payload)
      } else {
        await couponAPI.create(payload)
      }
      setShowModal(false)
      await load()
    } catch (err) {
      const d = err.response?.data
      if (d?.error) setError(d.error)
      else if (d?.code) setError(d.code[0])
      else if (d?.discount_value) setError(d.discount_value[0])
      else setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await couponAPI.remove(id)
      setCoupons(prev => prev.filter(c => c.id !== id))
    } catch {
      // silent
    } finally {
      setDeleteId(null)
    }
  }

  const toggleActive = async (c) => {
    try {
      const { data } = await couponAPI.update(c.id, { is_active: !c.is_active })
      setCoupons(prev => prev.map(x => x.id === c.id ? data : x))
    } catch { /* silent */ }
  }

  const statusBadge = (c) => {
    if (!c.is_active)               return <Badge color="gray">Inactive</Badge>
    if (c.is_expired)               return <Badge color="red">Expired</Badge>
    if (c.uses_remaining === 0)     return <Badge color="red">Exhausted</Badge>
    return <Badge color="green">Active</Badge>
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Coupon Codes</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Create discount codes your customers can apply at checkout.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading…</div>
      ) : coupons.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Tag size={40} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>No coupons yet. Create one to offer discounts to your customers.</p>
          <button className="btn btn-primary" onClick={openCreate}>Create First Coupon</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  {['Code', 'Discount', 'Min. Order', 'Uses', 'Expires', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                      <Badge color={c.discount_type === 'percentage' ? 'indigo' : 'yellow'}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>
                      {parseFloat(c.min_order_amount) > 0 ? `$${parseFloat(c.min_order_amount).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>
                      {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ' / ∞'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>{statusBadge(c)}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button title={c.is_active ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(c)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.is_active ? '#22c55e' : '#94a3b8', padding: '4px' }}>
                          {c.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button title="Edit" onClick={() => openEdit(c)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '4px' }}>
                          <Edit2 size={15} />
                        </button>
                        {deleteId === c.id ? (
                          <span style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleDelete(c.id)} title="Confirm"
                              style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: '3px 6px', color: '#b91c1c' }}>
                              <Check size={13} />
                            </button>
                            <button onClick={() => setDeleteId(null)} title="Cancel"
                              style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: '3px 6px', color: '#64748b' }}>
                              <X size={13} />
                            </button>
                          </span>
                        ) : (
                          <button title="Delete" onClick={() => setDeleteId(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{ background: '#fff', borderRadius: '0.75rem', width: '100%', maxWidth: '480px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                {editing ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">Coupon Code *</label>
              <input className="form-input" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                style={{ fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Discount Type *</label>
                <select className="form-input" value={form.discount_type}
                  onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {form.discount_type === 'percentage' ? 'Discount (%)' : 'Discount ($)'} *
                </label>
                <input className="form-input" type="number" min="0.01" step="0.01"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'percentage' ? '10' : '5.00'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Min. Order ($)</label>
                <input className="form-input" type="number" min="0" step="0.01"
                  value={form.min_order_amount}
                  onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                  placeholder="0 (no minimum)" />
              </div>
              <div className="form-group">
                <label className="form-label">Max Uses</label>
                <input className="form-input" type="number" min="1" step="1"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Leave blank = unlimited" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expires At</label>
              <input className="form-input" type="datetime-local"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: form.is_active ? '#22c55e' : '#94a3b8' }}>
                {form.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                {form.is_active ? 'Active — customers can use this coupon' : 'Inactive — coupon is disabled'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
