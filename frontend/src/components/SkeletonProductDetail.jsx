export default function SkeletonProductDetail() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'start' }}
      className="pdp-grid">

      {/* Left: image */}
      <div className="skeleton skeleton-pdp-image" />

      {/* Right: info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
        <div className="skeleton skeleton-pdp-title" />
        <div className="skeleton" style={{ height: '14px', width: '45%', borderRadius: '999px' }} />
        <div className="skeleton skeleton-pdp-price" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {[100, 90, 80, 70, 60].map(w => (
            <div key={w} className="skeleton skeleton-pdp-desc" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
          <div className="skeleton" style={{ width: '110px', height: '46px', borderRadius: '999px' }} />
          <div className="skeleton" style={{ flex: 1, height: '46px', borderRadius: '999px' }} />
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
          {[70, 80, 65].map(w => (
            <div key={w} className="skeleton" style={{ height: '12px', width: `${w}px`, borderRadius: '999px' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
