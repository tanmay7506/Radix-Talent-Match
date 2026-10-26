import './Badge.css'

export function Badge({
  children,
  variant = 'default', // 'default' | 'accent' | 'success' | 'warning' | 'error' | 'subtle'
  size = 'md',        // 'sm' | 'md'
  icon = null,
  className = '',
  ...props
}) {
  return (
    <span
      className={`ui-badge ui-badge-${variant} ui-badge-${size} ${className}`}
      {...props}
    >
      {icon && <span className="ui-badge-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}

export function Tag({
  children,
  active = false,
  onClick,
  className = '',
  ...props
}) {
  const Component = onClick ? 'button' : 'span'
  return (
    <Component
      type={onClick ? 'button' : undefined}
      className={`ui-tag ${active ? 'ui-tag-active' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  )
}
