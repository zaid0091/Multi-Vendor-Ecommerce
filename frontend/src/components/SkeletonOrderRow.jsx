export default function SkeletonOrderRow() {
  return (
    <tr>
      {[40, 70, 45, 55, 60, 80].map((w, i) => (
        <td key={i} style={{ padding: '1rem 0.75rem' }}>
          <div className="skeleton skeleton-order-row" style={{ width: `${w}px` }} />
        </td>
      ))}
    </tr>
  )
}
