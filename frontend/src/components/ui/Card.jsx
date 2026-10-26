import { forwardRef } from 'react'
import './Card.css'

export const Card = forwardRef(function Card(
  {
    children,
    className = '',
    variant = 'default', // 'default' | 'raised' | 'inset' | 'interactive'
    padding = 'md',     // 'none' | 'sm' | 'md' | 'lg'
    as: Component = 'div',
    ...props
  },
  ref
) {
  const classes = [
    'ui-card',
    `ui-card-${variant}`,
    `ui-card-p-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component ref={ref} className={classes} {...props}>
      {children}
    </Component>
  )
})

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`ui-card-header ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component className={`ui-card-title ${className}`} {...props}>
      {children}
    </Component>
  )
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`ui-card-description ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`ui-card-content ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`ui-card-footer ${className}`} {...props}>
      {children}
    </div>
  )
}
