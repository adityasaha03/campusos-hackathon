import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  Building2,
  PartyPopper,
  Bell,
  BookOpen,
  Bot,
  User,
  Activity,
} from 'lucide-react'
import { DEFAULT_STUDENT_ID, DEFAULT_STUDENT_NAME, API_BASE_URL } from '../services/api'
import { getSchedules } from '../services/schedules'
import { getRooms } from '../services/rooms'
import { getEvents } from '../services/events'
import { getAnnouncements } from '../services/announcements'
import { getAssignments } from '../services/assignments'

export type TabType = 'schedules' | 'rooms' | 'events' | 'announcements' | 'assignments' | 'chat'

interface NavbarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  // Shared query cache for live tab counts
  const { data: schedules } = useQuery({ queryKey: ['schedules'], queryFn: () => getSchedules() })
  const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: () => getRooms() })
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: () => getEvents() })
  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: () => getAnnouncements() })
  const { data: assignments } = useQuery({ queryKey: ['assignments'], queryFn: () => getAssignments() })

  const highPriorityCount = announcements?.filter((a) => a.priority === 'high').length
  const pendingAssignmentsCount = assignments?.filter((a) => a.status === 'pending').length
  const availableRoomsCount = rooms?.filter((r) => r.status === 'available').length

  const navItems: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: string | number }> = [
    {
      id: 'schedules',
      label: 'Schedules',
      icon: <Calendar size={18} />,
      badge: schedules?.length ? schedules.length : undefined,
    },
    {
      id: 'rooms',
      label: 'Rooms & Booking',
      icon: <Building2 size={18} />,
      badge: availableRoomsCount ? `${availableRoomsCount} free` : undefined,
    },
    {
      id: 'events',
      label: 'Events',
      icon: <PartyPopper size={18} />,
      badge: events?.length ? events.length : undefined,
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: <Bell size={18} />,
      badge: highPriorityCount ? `${highPriorityCount} high` : undefined,
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: <BookOpen size={18} />,
      badge: pendingAssignmentsCount ? `${pendingAssignmentsCount} due` : undefined,
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      icon: <Bot size={18} />,
      badge: 'Gemini',
    },
  ]

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand */}
        <div className="brand-container" onClick={() => onTabChange('schedules')} role="button" tabIndex={0}>
          <div className="brand-logo-icon">
            <span className="brand-letter">C</span>
            <div className="brand-pulse" />
          </div>
          <div>
            <div className="brand-title">
              Campus<span>OS</span>
            </div>
            <div className="brand-subtitle">Unified Student Operations</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-tab-btn ${isActive ? 'nav-tab-active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <span className="nav-tab-icon">{item.icon}</span>
                <span className="nav-tab-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="nav-tab-badge">{item.badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Profile & Connection Info */}
        <div className="navbar-right">
          <div className="api-status-pill" title={`API target: ${API_BASE_URL}`}>
            <Activity size={12} className="api-pulse-dot" />
            <span className="api-status-text">API :4000</span>
          </div>
          <div className="user-profile-badge">
            <div className="user-avatar">
              <User size={14} />
            </div>
            <div className="user-info">
              <span className="user-name">{DEFAULT_STUDENT_NAME}</span>
              <span className="user-id">{DEFAULT_STUDENT_ID}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
