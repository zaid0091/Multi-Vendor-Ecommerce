export default function SkeletonCartItem() {
  return (
    <div style={{
      padding: '1.5rem',
      borderBottom: '1px solid #e5e5e5',
      display: 'flex',
      gap: '1.25rem',
      alignItems: 'flex-start',
    }}>
      <div className="skeleton skeleton-cart-img" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.25rem' }}>
        <div className="skeleton skeleton-line-md" />
        <div className="skeleton skeleton-line-sm" />
        <div className="skeleton skeleton-line-xs" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
          <div className="skeleton skeleton-line-price" />
          <div className="skeleton" style={{ width: '90px', height: '32px', borderRadius: '999px' }} />
        </div>
      </div>
    </div>
  )
}
