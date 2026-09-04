import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
} from '../services/events'
import { DEFAULT_STUDENT_ID, DEFAULT_STUDENT_NAME, getErrorMessage } from '../services/api'
import { useToast } from '../components/ToastContext'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LoadingState, EmptyState } from '../components/States'
import { Badge } from '../components/Badge'
import type { Event } from '../types'

const STATUS_FILTERS = ['All', 'upcoming', 'ongoing', 'completed', 'cancelled', 'full'] as const

export const EventsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Registration modal / confirm state
  const [registeringEvent, setRegisteringEvent] = useState<Event | null>(null)
  const [cancelingEvent, setCancelingEvent] = useState<Event | null>(null)

  // Form fields matching schema exactly
  const [formData, setFormData] = useState<{
    name: string
    description: string
    date: string
    start_time: string
    end_time: string
    end_date: string
    venue: string
    organizer: string
    capacity: number
    status: Event['status']
  }>({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '12:00',
    end_date: new Date().toISOString().split('T')[0],
    venue: '7C01',
    organizer: 'CSE Department',
    capacity: 50,
    status: 'upcoming',
  })

  // Events query
  const { data: events = [], isLoading, isError, error: queryError } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Event>) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      success('Event created successfully')
      closeForm()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) => updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      success('Event updated successfully')
      closeForm()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      success('Event deleted')
      setDeletingId(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setDeletingId(null)
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (eventId: string) => registerForEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      success(`Registered ${DEFAULT_STUDENT_NAME} (${DEFAULT_STUDENT_ID}) for event!`)
      setRegisteringEvent(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setRegisteringEvent(null)
    },
  })

  // Cancel registration mutation
  const cancelRegMutation = useMutation({
    mutationFn: (eventId: string) => cancelEventRegistration(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      success('Registration cancelled')
      setCancelingEvent(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setCancelingEvent(null)
    },
  })

  const openCreate = () => {
    setEditingEvent(null)
    setFormData({
      name: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '12:00',
      end_date: new Date().toISOString().split('T')[0],
      venue: '7C01',
      organizer: 'CSE Department',
      capacity: 50,
      status: 'upcoming',
    })
    setIsFormOpen(true)
  }

  const openEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      name: event.name,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      end_date: event.end_date,
      venue: event.venue,
      organizer: event.organizer,
      capacity: event.capacity,
      status: event.status,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingEvent(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.venue.trim()) {
      error('Please complete all required fields')
      return
    }

    const payload: Partial<Event> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      end_date: formData.end_date || formData.date,
      venue: formData.venue.trim(),
      organizer: formData.organizer.trim(),
      capacity: Number(formData.capacity),
      status: formData.status,
    }

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const filteredEvents = events.filter((ev) => {
    const matchesStatus = statusFilter === 'All' || ev.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      ev.name.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q) ||
      ev.organizer.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campus Events & Workshops</h1>
          <p className="page-subtitle">Seminars, hackathons, lectures, and academic review sessions</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          <span>Add Event</span>
        </button>
      </div>

      {/* Controls */}
      <div className="control-bar">
        <div className="filter-pill-group">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'All' ? 'All Events' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by event name, venue, organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading campus events and attendee counts..." />
      ) : isError ? (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load events.</strong> Make sure the backend server is running at{' '}
            <code>https://campusos-hackathon-1.onrender.com</code>.
            <div className="error-hint">{getErrorMessage(queryError)}</div>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={48} />}
          title="No events found"
          description={
            searchTerm || statusFilter !== 'All'
              ? 'Try modifying your search or changing the status filter.'
              : 'Create the first campus event using the button above.'
          }
          action={{ label: 'Add Event', onClick: openCreate }}
        />
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => {
            const isRegistered = event.registrations?.some(
              (r) => r.student_id === DEFAULT_STUDENT_ID
            )
            const isFull = event.status === 'full' || event.registered >= event.capacity
            const percentFilled = Math.min(
              100,
              Math.round((event.registered / Math.max(1, event.capacity)) * 100)
            )

            let statusVariant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral'
            if (event.status === 'upcoming') statusVariant = 'primary'
            else if (event.status === 'ongoing') statusVariant = 'success'
            else if (event.status === 'full') statusVariant = 'danger'
            else if (event.status === 'cancelled') statusVariant = 'danger'
            else if (event.status === 'completed') statusVariant = 'neutral'

            return (
              <div key={event.id} className="event-card card">
                <div className="event-card-top">
                  <div className="event-status-row">
                    <Badge variant={statusVariant} size="sm">
                      {event.status}
                    </Badge>
                    {isRegistered && (
                      <Badge variant="success" size="sm" icon={<CheckCircle2 size={12} />}>
                        You are registered
                      </Badge>
                    )}
                  </div>
                  <h3 className="event-title">{event.name}</h3>
                  <p className="event-description">{event.description}</p>
                </div>

                {/* Event Metadata */}
                <div className="event-meta-grid">
                  <div className="event-meta-item">
                    <Calendar size={14} className="meta-icon" />
                    <span>
                      {event.date}
                      {event.end_date && event.end_date !== event.date ? ` to ${event.end_date}` : ''}
                    </span>
                  </div>
                  <div className="event-meta-item">
                    <Clock size={14} className="meta-icon" />
                    <span>
                      {event.start_time} - {event.end_time}
                    </span>
                  </div>
                  <div className="event-meta-item">
                    <MapPin size={14} className="meta-icon" />
                    <span>Venue: {event.venue}</span>
                  </div>
                  <div className="event-meta-item">
                    <Users size={14} className="meta-icon" />
                    <span>Organizer: {event.organizer}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="capacity-section">
                  <div className="capacity-header">
                    <span className="capacity-label">Attendance Capacity</span>
                    <span className="capacity-values">
                      <strong>{event.registered}</strong> / {event.capacity} seats ({percentFilled}%)
                    </span>
                  </div>
                  <div className="capacity-bar-track">
                    <div
                      className={`capacity-bar-fill ${
                        percentFilled >= 100
                          ? 'fill-danger'
                          : percentFilled >= 80
                          ? 'fill-warning'
                          : 'fill-primary'
                      }`}
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="event-card-actions">
                  {isRegistered ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setCancelingEvent(event)}
                      disabled={cancelRegMutation.isPending}
                    >
                      <XCircle size={14} />
                      <span>Cancel Registration</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setRegisteringEvent(event)}
                      disabled={isFull || registerMutation.isPending}
                      title={isFull ? 'Event has reached full capacity' : 'Register now'}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isFull ? 'Full Capacity' : 'Register Me'}</span>
                    </button>
                  )}

                  <div className="event-btn-group">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit event details"
                      onClick={() => openEdit(event)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      title="Delete event"
                      onClick={() => setDeletingId(event.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingEvent ? `Edit Event (${editingEvent.id})` : 'New Event'}
        subtitle="Configure title, schedule, venue, and registration capacity"
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label required">Event Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. AUSTPIC AI Build Hackathon"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe event agenda, speakers, and topics..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date (optional)</label>
              <input
                type="date"
                className="form-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Start Time (24h)</label>
              <input
                type="time"
                className="form-input"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">End Time (24h)</label>
              <input
                type="time"
                className="form-input"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Venue (Room #)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 7C01"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Organizer</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AUSTPIC or CSE Dept"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Capacity</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Event['status'],
                  })
                }
                required
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="full">Full</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeForm}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingEvent
                ? 'Save Changes'
                : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Event Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Campus Event"
        message="Are you sure you want to delete this event? This will also remove all student registration records."
        confirmText="Delete Event"
        isLoading={deleteMutation.isPending}
      />

      {/* Confirm Registration */}
      <ConfirmDialog
        isOpen={!!registeringEvent}
        onClose={() => setRegisteringEvent(null)}
        onConfirm={() => registeringEvent && registerMutation.mutate(registeringEvent.id)}
        title="Confirm Event Registration"
        message={`Register ${DEFAULT_STUDENT_NAME} (${DEFAULT_STUDENT_ID}) for "${registeringEvent?.name}" at venue ${registeringEvent?.venue}?`}
        confirmText="Register Now"
        isDestructive={false}
        isLoading={registerMutation.isPending}
      />

      {/* Confirm Registration Cancellation */}
      <ConfirmDialog
        isOpen={!!cancelingEvent}
        onClose={() => setCancelingEvent(null)}
        onConfirm={() => cancelingEvent && cancelRegMutation.mutate(cancelingEvent.id)}
        title="Cancel Registration"
        message={`Are you sure you want to cancel your registration for "${cancelingEvent?.name}"? Your seat will be freed for others.`}
        confirmText="Cancel My Seat"
        isLoading={cancelRegMutation.isPending}
      />
    </div>
  )
}
