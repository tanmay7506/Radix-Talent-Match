import { Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import './Callout.css'

export function Callout({
  children,
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  title = null,
  icon = null,
  className = '',
  role = 'note',
}) {
  const defaultIcons = {
    info: <Info size={16} strokeWidth={2} />,
    success: <CheckCircle2 size={16} strokeWidth={2} />,
    warning: <AlertTriangle size={16} strokeWidth={2} />,
    error: <AlertCircle size={16} strokeWidth={2} />,
  }

  const renderedIcon = icon || defaultIcons[type]

  return (
    <div className={`ui-callout ui-callout-${type} ${className}`} role={role}>
      {renderedIcon && (
        <span className="ui-callout-icon" aria-hidden="true">
          {renderedIcon}
        </span>
      )}
      <div className="ui-callout-content">
        {title && <strong className="ui-callout-title">{title}</strong>}
        <span className="ui-callout-body">{children}</span>
      </div>
    </div>
  )
}
