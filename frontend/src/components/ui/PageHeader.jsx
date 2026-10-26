import './PageHeader.css'

export function PageHeader({
  title,
  description,
  badge = null,
  actions = null,
  className = '',
}) {
  return (
    <div className={`ui-page-header ${className}`}>
      <div className="ui-page-header-main">
        {badge && <div className="ui-page-header-badge">{badge}</div>}
        <h1 className="ui-page-header-title">{title}</h1>
        {description && <p className="ui-page-header-desc">{description}</p>}
      </div>
      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </div>
  )
}
