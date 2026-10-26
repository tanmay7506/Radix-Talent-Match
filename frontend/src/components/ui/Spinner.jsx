import './Spinner.css'

export function Spinner({
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  label = 'Loading…',
}) {
  const pixelMap = { sm: 16, md: 24, lg: 36 }
  const px = pixelMap[size] || 24

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={`ui-spinner ui-spinner-${size} ${className}`}
      role="status"
      aria-label={label}
    >
      <circle cx="12" cy="12" r="9" stroke="var(--border)" strokeWidth="3" />
      <path
        d="M12 3 A9 9 0 0 1 21 12"
        stroke="var(--color-secondary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LoadingOverlay({ message = 'Loading…', className = '' }) {
  return (
    <div className={`ui-loading-overlay ${className}`} role="status" aria-live="polite">
      <Spinner size="lg" />
      <span className="ui-loading-message">{message}</span>
    </div>
  )
}
