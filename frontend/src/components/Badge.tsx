import React from 'react'

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  children: React.ReactNode
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  icon,
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
