import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Clock,
  MapPin,
  User,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../services/schedules'
import { getErrorMessage } from '../services/api'
import { useToast } from '../components/ToastContext'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LoadingState, EmptyState } from '../components/States'
import { Badge } from '../components/Badge'
import type { Schedule } from '../types'

const DAYS = ['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] as const

export const SchedulesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [selectedDay, setSelectedDay] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form fields (exact snake_case names)
  const [formData, setFormData] = useState<Omit<Schedule, 'id'> & { id?: string }>({
    course: '',
    title: '',
    day: 'Sunday',
    start_time: '09:00',
    end_time: '10:00',
    room: '',
    instructor: '',
    section: 'A',
  })

  // Query
  const { data: schedules = [], isLoading, isError, error: queryError } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => getSchedules(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newSchedule: Partial<Schedule>) => createSchedule(newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      success('Schedule entry created successfully')
      closeForm()
    },
    onError: (err) => {
      error(getErrorMessage(err))
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Schedule> }) => updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      success('Schedule entry updated successfully')
      closeForm()
    },
    onError: (err) => {
      error(getErrorMessage(err))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      success('Schedule entry deleted')
      setDeletingId(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setDeletingId(null)
    },
  })

  const openCreate = () => {
    setEditingSchedule(null)
    setFormData({
      course: '',
      title: '',
      day: 'Sunday',
      start_time: '09:00',
      end_time: '10:00',
      room: '',
      instructor: '',
      section: 'A',
    })
    setIsFormOpen(true)
  }

  const openEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      id: schedule.id,
      course: schedule.course,
      title: schedule.title,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room,
      instructor: schedule.instructor,
      section: schedule.section,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingSchedule(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.course.trim() || !formData.title.trim() || !formData.room.trim()) {
      error('Please complete all required fields')
      return
    }

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  // Filtering
  const filteredSchedules = schedules.filter((s) => {
    const matchesDay = selectedDay === 'All' || s.day === selectedDay
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      s.course.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.room.toLowerCase().includes(q) ||
      s.instructor.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)
    return matchesDay && matchesSearch
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Schedules</h1>
          <p className="page-subtitle">View, search, and manage weekly academic class timetables</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Control Bar: Day Filter + Search */}
      <div className="control-bar">
        <div className="filter-pill-group">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className={`filter-pill ${selectedDay === day ? 'active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by course, room, instructor..."
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
        <LoadingState message="Loading class schedules..." />
      ) : isError ? (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load schedules.</strong> Make sure the backend server is running at{' '}
            <code>https://campusos-hackathon-1.onrender.com</code>.
            <div className="error-hint">{getErrorMessage(queryError)}</div>
          </div>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <EmptyState
          icon={<Calendar size={48} />}
          title="No schedules found"
          description={
            searchTerm || selectedDay !== 'All'
              ? 'Try adjusting your filters or search query.'
              : 'Add your first class schedule using the button above.'
          }
          action={{ label: 'Add Class Schedule', onClick: openCreate }}
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Title</th>
                <th>Day & Time</th>
                <th>Room</th>
                <th>Instructor</th>
                <th>Section</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>
                    <span className="code-pill">{schedule.course}</span>
                  </td>
                  <td className="table-cell-title">{schedule.title}</td>
                  <td>
                    <div className="table-time-cell">
                      <span className="day-name">{schedule.day}</span>
                      <span className="time-range">
                        <Clock size={12} />
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="table-room-cell">
                      <MapPin size={13} />
                      {schedule.room}
                    </span>
                  </td>
                  <td>
                    <span className="table-instructor-cell">
                      <User size={13} />
                      {schedule.instructor}
                    </span>
                  </td>
                  <td>
                    <Badge variant="primary" size="sm">
                      Sec {schedule.section}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Edit schedule"
                        onClick={() => openEdit(schedule)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        title="Delete schedule"
                        onClick={() => setDeletingId(schedule.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingSchedule ? `Edit Schedule (${editingSchedule.id})` : 'New Schedule Entry'}
        subtitle="Specify course, timing, room, and instructor information"
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Course Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CSE 4113"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Section</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. B or A1/A2"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Course Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Pattern Recognition and Machine Learning"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label required">Day</label>
              <select
                className="form-select"
                value={formData.day}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    day: e.target.value as Schedule['day'],
                  })
                }
                required
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
              </select>
            </div>
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
              <label className="form-label required">Room Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 7A03"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Instructor</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Prof. Dr. Md. Shahriar Mahbub"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                required
              />
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
                : editingSchedule
                ? 'Save Changes'
                : 'Create Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Schedule Entry"
        message="Are you sure you want to permanently delete this schedule item? This action will persist to the database."
        confirmText="Delete Schedule"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
