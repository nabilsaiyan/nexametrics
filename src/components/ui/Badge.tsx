import type { ReactNode } from 'react'
import './Badge.scss'

type BadgeVariant = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'muted' | 'blue'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  pulse?: boolean
  className?: string
}

export function Badge({ children, variant = 'cyan', pulse = false, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${pulse ? 'badge--pulse' : ''} ${className}`}>
      {children}
    </span>
  )
}
