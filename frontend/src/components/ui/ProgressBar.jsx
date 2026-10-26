import './ProgressBar.css'

export function ProgressBar({
  value = 0,
  max = 10,
  label = null,
  valueLabel = null,
  size = 'md', // 'sm' | 'md'
  variant = 'default', // 'default' | 'accent' | 'success'
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`ui-progress ${className}`}>
      {(label || valueLabel) && (
        <div className="ui-progress-header">
          {label && <span className="ui-progress-label">{label}</span>}
          <span className="ui-progress-value">{valueLabel || `${value}/${max}`}</span>
        </div>
      )}
      <div className={`ui-progress-track ui-progress-${size}`}>
        <div
          className={`ui-progress-fill ui-progress-fill-${variant}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
