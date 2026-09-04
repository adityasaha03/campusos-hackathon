import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading data...' }) => {
  return (
    <div className="state-container">
      <Loader2 className="spinner" size={32} />
      <p className="state-message">{message}</p>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="state-container empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h4 className="empty-state-title">{title}</h4>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <button className="btn btn-primary" onClick={action.onClick} style={{ marginTop: '1rem' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
