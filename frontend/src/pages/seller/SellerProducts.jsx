import React, { useState, useEffect, useRef } from 'react'
import {
  Plus, Edit2, Trash2, Package, ToggleLeft, ToggleRight,
  ImagePlus, X, HelpCircle, Layers, Images,
} from 'lucide-react'
import { sellerAPI, productAPI, faqAPI, variantAPI, imageAPI } from '../../api'

export default function SellerProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_at_price: '',
    stock: '', category: '', is_active: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [storeStatus, setStoreStatus] = useState('approved')
  const fileInputRef = useRef(null)

  // ── FAQ state ──────────────────────────────────────────────────────────────
  const [faqProduct, setFaqProduct] = useState(null)
  const [faqs, setFaqs] = useState([])
  const [faqLoading, setFaqLoading] = useState(false)
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', order: 0 })
  const [editFaq, setEditFaq] = useState(null)
  const [faqError, setFaqError] = useState('')
  const [faqSaving, setFaqSaving] = useState(false)

  // ── Variant state ──────────────────────────────────────────────────────────
  const [variantProduct, setVariantProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [variantLoading, setVariantLoading] = useState(false)
  const [variantForm, setVariantForm] = useState({
    name: '', value: '', price_adjustment: '0', stock: '', sku: '', order: 0,
  })
  const [editVariant, setEditVariant] = useState(null)
  const [variantError, setVariantError] = useState('')
  const [variantSaving, setVariantSaving] = useState(false)

  // ── Gallery state ──────────────────────────────────────────────────────────
  const [galleryProduct, setGalleryProduct] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryError, setGalleryError] = useState('')
  const galleryInputRef = useRef(null)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchProducts = () => {
    sellerAPI.getProducts()
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data.results || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProducts()
    productAPI.categories().then(({ data }) => setCategories(Array.isArray(data) ? data : data.results || []))
    sellerAPI.getStore().then(({ data }) => setStoreStatus(data.status)).catch(() => {})
  }, [])

  // ── Product form ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditProduct(null)
    setForm({ name: '', description: '', price: '', compare_at_price: '', stock: '', category: '', is_active: true })
    setImageFile(null)
    setImagePreview(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      compare_at_price: p.compare_at_price || '',
      stock: p.stock,
      category: p.category || '',
      is_active: p.is_active,
    })
    setImageFile(null)
    setImagePreview(p.image || null)
    setError('')
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', parseFloat(form.price))
      formData.append('stock', parseInt(form.stock))
      formData.append('is_active', form.is_active)
      if (form.category) formData.append('category', form.category)
      if (form.compare_at_price) formData.append('compare_at_price', parseFloat(form.compare_at_price))
      if (imageFile) formData.append('image', imageFile)

      if (editProduct) {
        await sellerAPI.updateProduct(editProduct.id, formData)
      } else {
        await sellerAPI.createProduct(formData)
      }
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      const data = err.response?.data
        if (data) {
          let msg = ''
          if (Array.isArray(data)) {
            // DRF non-field error list: [{field: msg}, ...] or ['msg', ...]
            const first = data[0]
            if (first && typeof first === 'object') {
              const [k, v] = Object.entries(first)[0] || []
              msg = k && k !== 'non_field_errors' ? `${k}: ${Array.isArray(v) ? v[0] : v}` : (Array.isArray(v) ? v[0] : v)
            } else {
              msg = String(first)
            }
          } else if (typeof data === 'object') {
            const entries = Object.entries(data)
            const [k, v] = entries[0] || []
            if (k === 'non_field_errors') {
              msg = Array.isArray(v) ? v[0] : String(v)
            } else if (k) {
              msg = `${k}: ${Array.isArray(v) ? v[0] : v}`
            }
          } else {
            msg = String(data)
          }
          setError(msg || 'Failed to save product')
        } else {
          setError('Failed to save product')
        }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await sellerAPI.deleteProduct(id)
      fetchProducts()
    } catch {
      alert('Failed to delete product')
    }
  }

  const toggleActive = async (p) => {
    try {
      await sellerAPI.updateProduct(p.id, { is_active: !p.is_active })
      fetchProducts()
    } catch {
      alert('Failed to update product')
    }
  }

  // ── FAQ handlers ───────────────────────────────────────────────────────────
  const openFaqs = (product) => {
    setFaqProduct(product)
    setFaqs([])
    setFaqForm({ question: '', answer: '', order: 0 })
    setEditFaq(null)
    setFaqError('')
    setFaqLoading(true)
    faqAPI.list(product.id)
      .then(({ data }) => setFaqs(Array.isArray(data) ? data : []))
      .catch(() => setFaqs([]))
      .finally(() => setFaqLoading(false))
  }

  const startEditFaq = (faq) => {
    setEditFaq(faq)
    setFaqForm({ question: faq.question, answer: faq.answer, order: faq.order })
    setFaqError('')
  }

  const cancelFaqEdit = () => {
    setEditFaq(null)
    setFaqForm({ question: '', answer: '', order: 0 })
    setFaqError('')
  }

  const handleFaqSave = async (e) => {
    e.preventDefault()
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      setFaqError('Question and answer are required.')
      return
    }
    setFaqSaving(true)
    setFaqError('')
    try {
      if (editFaq) {
        const { data } = await faqAPI.update(faqProduct.id, editFaq.id, faqForm)
        setFaqs(prev => prev.map(f => f.id === editFaq.id ? data : f))
      } else {
        const { data } = await faqAPI.create(faqProduct.id, faqForm)
        setFaqs(prev => [...prev, data])
      }
      cancelFaqEdit()
    } catch (err) {
      setFaqError(err.response?.data?.question?.[0] || err.response?.data?.answer?.[0] || 'Failed to save FAQ.')
    } finally {
      setFaqSaving(false)
    }
  }

  const handleFaqDelete = async (faqId) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      await faqAPI.delete(faqProduct.id, faqId)
      setFaqs(prev => prev.filter(f => f.id !== faqId))
    } catch {
      alert('Failed to delete FAQ.')
    }
  }

  // ── Variant handlers ───────────────────────────────────────────────────────
  const openVariants = (product) => {
    setVariantProduct(product)
    setVariants([])
    resetVariantForm()
    setVariantLoading(true)
    variantAPI.list(product.id)
      .then(({ data }) => setVariants(Array.isArray(data) ? data : []))
      .catch(() => setVariants([]))
      .finally(() => setVariantLoading(false))
  }

  const resetVariantForm = () => {
    setEditVariant(null)
    setVariantForm({ name: '', value: '', price_adjustment: '0', stock: '', sku: '', order: 0 })
    setVariantError('')
  }

  const startEditVariant = (v) => {
    setEditVariant(v)
    setVariantForm({
      name: v.name,
      value: v.value,
      price_adjustment: v.price_adjustment,
      stock: v.stock,
      sku: v.sku || '',
      order: v.order,
    })
    setVariantError('')
  }

  const handleVariantSave = async (e) => {
    e.preventDefault()
    if (!variantForm.name.trim() || !variantForm.value.trim()) {
      setVariantError('Option name and value are required.')
      return
    }
    if (variantForm.stock === '' || isNaN(parseInt(variantForm.stock))) {
      setVariantError('Stock must be a number.')
      return
    }
    setVariantSaving(true)
    setVariantError('')
    try {
      const payload = {
        name: variantForm.name.trim(),
        value: variantForm.value.trim(),
        price_adjustment: parseFloat(variantForm.price_adjustment) || 0,
        stock: parseInt(variantForm.stock),
        sku: variantForm.sku.trim(),
        order: parseInt(variantForm.order) || 0,
      }
      if (editVariant) {
        const { data } = await variantAPI.update(variantProduct.id, editVariant.id, payload)
        setVariants(prev => prev.map(v => v.id === editVariant.id ? data : v))
      } else {
        const { data } = await variantAPI.create(variantProduct.id, payload)
        setVariants(prev => [...prev, data])
      }
      resetVariantForm()
    } catch (err) {
      const d = err.response?.data
      if (d) {
        const msg = Object.values(d).flat().join(' ')
        setVariantError(msg || 'Failed to save variant.')
      } else {
        setVariantError('Failed to save variant.')
      }
    } finally {
      setVariantSaving(false)
    }
  }

  const handleVariantDelete = async (variantId) => {
    if (!confirm('Delete this variant?')) return
    try {
      await variantAPI.delete(variantProduct.id, variantId)
      setVariants(prev => prev.filter(v => v.id !== variantId))
    } catch {
      alert('Failed to delete variant.')
    }
  }

  const toggleVariantActive = async (v) => {
    try {
      const { data } = await variantAPI.update(variantProduct.id, v.id, { is_active: !v.is_active })
      setVariants(prev => prev.map(x => x.id === v.id ? data : x))
    } catch {
      alert('Failed to update variant.')
    }
  }

  // ── Gallery handlers ───────────────────────────────────────────────────────
  const openGallery = (product) => {
    setGalleryProduct(product)
    setGalleryImages([])
    setGalleryError('')
    setGalleryLoading(true)
    imageAPI.list(product.id)
      .then(({ data }) => setGalleryImages(Array.isArray(data) ? data : []))
      .catch(() => setGalleryImages([]))
      .finally(() => setGalleryLoading(false))
  }

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setGalleryError('')
    setGalleryUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('image', file)
        const { data } = await imageAPI.add(galleryProduct.id, fd)
        setGalleryImages(prev => [...prev, data])
      }
    } catch (err) {
      setGalleryError(err.response?.data?.error || 'Failed to upload image.')
    } finally {
      setGalleryUploading(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const handleGalleryDelete = async (imgId) => {
    if (!confirm('Remove this image?')) return
    try {
      await imageAPI.remove(galleryProduct.id, imgId)
      setGalleryImages(prev => prev.filter(i => i.id !== imgId))
    } catch {
      alert('Failed to delete image.')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Products</h1>
          <p>Manage your product listings</p>
        </div>
        {storeStatus === 'approved' && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {storeStatus !== 'approved' && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          Your store must be approved before you can add products.
        </div>
      )}

      {/* ── Product Form Modal ─────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required placeholder="e.g. Wireless Headphones" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required placeholder="Describe your product..." style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price ($) *</label>
                  <input className="form-input" type="number" step="0.01" min="0"
                    value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    required placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Compare-At Price ($)
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>(optional sale)</span>
                  </label>
                  <input className="form-input" type="number" step="0.01" min="0"
                    value={form.compare_at_price}
                    onChange={e => setForm({ ...form, compare_at_price: e.target.value })}
                    placeholder="0.00" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input className="form-input" type="number" min="0"
                    value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    required placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">Product Image</label>
                {imagePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                    <img src={imagePreview} alt="Preview"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
                    <button type="button" onClick={removeImage} style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                      width: '26px', height: '26px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} style={{
                    border: '2px dashed #cbd5e1', borderRadius: '0.5rem', padding: '2rem',
                    textAlign: 'center', cursor: 'pointer', color: '#94a3b8', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}>
                    <ImagePlus size={32} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Click to upload image</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>PNG, JPG, WEBP up to 5MB</div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={handleImageChange} style={{ display: 'none' }} />
                {imagePreview && !imageFile && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Change image
                  </button>
                )}
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px' }} />
                <label htmlFor="is_active" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
                  Active (visible to customers)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FAQ Management Modal ───────────────────────────────────────────── */}
      {faqProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>FAQs — {faqProduct.name}</h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Add or edit frequently asked questions for this product.</p>
              </div>
              <button onClick={() => setFaqProduct(null)} style={{ background: 'none', padding: '4px' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleFaqSave} style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>{editFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
              {faqError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{faqError}</div>}
              <div className="form-group">
                <label className="form-label">Question *</label>
                <input className="form-input" value={faqForm.question} maxLength={500}
                  onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="e.g. What is the return policy?" />
              </div>
              <div className="form-group">
                <label className="form-label">Answer *</label>
                <textarea className="form-input" rows={3} value={faqForm.answer} maxLength={3000}
                  onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))}
                  placeholder="Write the answer here..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ maxWidth: '140px' }}>
                <label className="form-label">Display Order</label>
                <input className="form-input" type="number" min={0} value={faqForm.order}
                  onChange={e => setFaqForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={faqSaving}>
                  {faqSaving ? 'Saving...' : editFaq ? 'Save Changes' : 'Add FAQ'}
                </button>
                {editFaq && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={cancelFaqEdit}>Cancel</button>
                )}
              </div>
            </form>

            {faqLoading ? (
              <div className="loading-center" style={{ minHeight: '80px' }}><div className="spinner" /></div>
            ) : faqs.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>No FAQs yet. Add your first one above.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {faqs.map((faq, idx) => (
                  <div key={faq.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: '#94a3b8', marginRight: '0.4rem' }}>#{idx + 1}</span>
                          {faq.question}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>{faq.answer}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => startEditFaq(faq)}><Edit2 size={12} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleFaqDelete(faq.id)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Variant Management Modal ───────────────────────────────────────── */}
      {variantProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>Variants — {variantProduct.name}</h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Add sizes, colours, or any other options. Each variant has its own stock.
                </p>
              </div>
              <button onClick={() => setVariantProduct(null)} style={{ background: 'none', padding: '4px' }}><X size={20} /></button>
            </div>

            {/* Variant form */}
            <form onSubmit={handleVariantSave} style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
                {editVariant ? 'Edit Variant' : 'Add New Variant'}
              </h3>
              {variantError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{variantError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Option Name *
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>e.g. Size, Color</span>
                  </label>
                  <input className="form-input" value={variantForm.name} maxLength={100}
                    onChange={e => setVariantForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Size" />
                </div>
                <div className="form-group">
                  <label className="form-label">Option Value *
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>e.g. XL, Red</span>
                  </label>
                  <input className="form-input" value={variantForm.value} maxLength={100}
                    onChange={e => setVariantForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="XL" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price Adjustment ($)
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>+/−</span>
                  </label>
                  <input className="form-input" type="number" step="0.01"
                    value={variantForm.price_adjustment}
                    onChange={e => setVariantForm(f => ({ ...f, price_adjustment: e.target.value }))}
                    placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input className="form-input" type="number" min="0"
                    value={variantForm.stock}
                    onChange={e => setVariantForm(f => ({ ...f, stock: e.target.value }))}
                    placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>(optional)</span>
                  </label>
                  <input className="form-input" value={variantForm.sku} maxLength={100}
                    onChange={e => setVariantForm(f => ({ ...f, sku: e.target.value }))}
                    placeholder="SKU-001" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={variantSaving}>
                  {variantSaving ? 'Saving...' : editVariant ? 'Save Changes' : 'Add Variant'}
                </button>
                {editVariant && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={resetVariantForm}>Cancel</button>
                )}
              </div>
            </form>

            {/* Variant list */}
            {variantLoading ? (
              <div className="loading-center" style={{ minHeight: '80px' }}><div className="spinner" /></div>
            ) : variants.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
                No variants yet. Add your first one above.
              </p>
            ) : (
              <div>
                {/* Group variants by name */}
                {Object.entries(
                  variants.reduce((acc, v) => {
                    if (!acc[v.name]) acc[v.name] = []
                    acc[v.name].push(v)
                    return acc
                  }, {})
                ).map(([groupName, groupVariants]) => (
                  <div key={groupName} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      {groupName}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {groupVariants.map(v => (
                        <div key={v.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          border: '1px solid #e2e8f0', borderRadius: '0.6rem', padding: '0.75rem 1rem',
                          background: v.is_active ? '#fff' : '#f8fafc',
                          opacity: v.is_active ? 1 : 0.65,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                            <span style={{
                              fontWeight: 700, fontSize: '0.88rem',
                              background: '#000', color: '#fff',
                              borderRadius: '4px', padding: '2px 10px',
                              minWidth: '40px', textAlign: 'center',
                            }}>{v.value}</span>
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              ${parseFloat(v.final_price).toFixed(2)}
                              {parseFloat(v.price_adjustment) !== 0 && (
                                <span style={{ color: parseFloat(v.price_adjustment) > 0 ? '#16a34a' : '#dc2626', marginLeft: '4px' }}>
                                  ({parseFloat(v.price_adjustment) > 0 ? '+' : ''}{parseFloat(v.price_adjustment).toFixed(2)})
                                </span>
                              )}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: v.stock === 0 ? '#dc2626' : v.stock < 5 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                              {v.stock} in stock
                            </span>
                            {v.sku && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SKU: {v.sku}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggleVariantActive(v)}
                              title={v.is_active ? 'Deactivate' : 'Activate'}
                              style={{ fontSize: '0.72rem' }}>
                              {v.is_active ? 'Active' : 'Off'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => startEditVariant(v)}><Edit2 size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleVariantDelete(v.id)}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Gallery Management Modal ───────────────────────────────────────── */}
      {galleryProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>Gallery — {galleryProduct.name}</h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Upload extra images. PNG, JPG, WEBP up to 5 MB each. Select multiple at once.</p>
              </div>
              <button onClick={() => setGalleryProduct(null)} style={{ background: 'none', padding: '4px' }}><X size={20} /></button>
            </div>

            {galleryError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{galleryError}</div>}

            {/* Upload area */}
            <div
              onClick={() => galleryInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1', borderRadius: '0.75rem', padding: '2rem',
                textAlign: 'center', cursor: 'pointer', color: '#94a3b8',
                marginBottom: '1.5rem', transition: 'border-color 0.2s',
                background: galleryUploading ? '#f8fafc' : '#fff',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <Images size={32} style={{ margin: '0 auto 0.5rem', display: 'block', color: '#cbd5e1' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {galleryUploading ? 'Uploading…' : 'Click to upload images'}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Select multiple files at once</div>
            </div>
            <input
              ref={galleryInputRef}
              type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={handleGalleryUpload}
            />

            {/* Image grid */}
            {galleryLoading ? (
              <div className="loading-center" style={{ minHeight: '80px' }}><div className="spinner" /></div>
            ) : galleryImages.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem', padding: '1rem 0' }}>
                No gallery images yet.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {galleryImages.map(img => (
                  <div key={img.id} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', aspectRatio: '1/1' }}>
                    <img src={img.image} alt={img.alt_text || 'Gallery'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => handleGalleryDelete(img.id)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                        width: '24px', height: '24px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                      }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Products Table ─────────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <Package size={64} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No products yet</h3>
          {storeStatus === 'approved' && (
            <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', background: '#f1f5f9', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={20} color="#cbd5e1" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '2px' }}>
                          {p.variants?.length > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#6366f1', background: '#ede9fe', borderRadius: '999px', padding: '1px 7px', fontWeight: 600 }}>
                              {p.variants.length} variant{p.variants.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {p.is_on_sale && (
                            <span style={{ fontSize: '0.7rem', color: '#dc2626', background: '#fee2e2', borderRadius: '999px', padding: '1px 7px', fontWeight: 600 }}>
                              SALE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{p.category_name || 'None'}</span></td>
                  <td>
                    <strong>${parseFloat(p.price).toFixed(2)}</strong>
                    {p.compare_at_price && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ${parseFloat(p.compare_at_price).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ color: p.stock === 0 ? '#ef4444' : p.stock < 5 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleActive(p)} style={{ background: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: p.is_active ? '#22c55e' : '#94a3b8' }}>
                      {p.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openVariants(p)} title="Manage Variants">
                          <Layers size={13} /> Variants
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openFaqs(p)} title="Manage FAQs">
                          <HelpCircle size={13} /> FAQs
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openGallery(p)} title="Manage Gallery">
                          <Images size={13} /> Gallery
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
