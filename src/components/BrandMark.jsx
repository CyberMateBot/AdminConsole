export default function BrandMark({ className = '', size }) {
  const style = size ? { width: size, height: size } : undefined

  return (
    <div className={`brand-mark${className ? ` ${className}` : ''}`} style={style}>
      <img src="/brand-logo.png" alt="" draggable="false" />
    </div>
  )
}
