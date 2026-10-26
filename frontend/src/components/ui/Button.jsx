import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import './Button.css'

/**
 * Reusable Button component matching the Obsidian & Refined Slate design system.
 *
 * Props:
 *  - variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 *  - size: 'sm' | 'md' | 'lg'
 *  - isLoading: boolean (replaces icon/text with spinner)
 *  - icon: ReactNode (rendered on the left)
 *  - iconRight: ReactNode (rendered on the right)
 *  - fullWidth: boolean
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    disabled = false,
    icon = null,
    iconRight = null,
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const classes = [
    'ui-btn',
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    fullWidth ? 'ui-btn-full' : '',
    isLoading ? 'ui-btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ui-btn-spinner" aria-hidden="true">
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="ui-spin" />
        </span>
      ) : icon ? (
        <span className="ui-btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      <span className="ui-btn-label">{children}</span>

      {!isLoading && iconRight && (
        <span className="ui-btn-icon ui-btn-icon-right" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  )
})
