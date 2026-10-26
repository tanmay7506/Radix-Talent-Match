import './EmptyState.css'

export function EmptyState({
  icon,
  title,
  description,
  action = null,
  className = '',
}) {
  return (
    <div className={`ui-empty-state ${className}`}>
      {icon && (
        <div className="ui-empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="ui-empty-state-title">{title}</h3>
      {description && <p className="ui-empty-state-desc">{description}</p>}
      {action && <div className="ui-empty-state-action">{action}</div>}
    </div>
  )
}
