import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  User,
  Edit2,
  Trash2,
  Bell,
  AlertCircle,
  Clock,
} from 'lucide-react'
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../services/announcements'
import { getErrorMessage } from '../services/api'
import { useToast } from '../components/ToastContext'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LoadingState, EmptyState } from '../components/States'
import { Badge } from '../components/Badge'
import type { Announcement } from '../types'

const PRIORITIES = ['All', 'high', 'medium', 'low'] as const

export const AnnouncementsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [priorityFilter, setPriorityFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form fields
  const [formData, setFormData] = useState<{
    title: string
    body: string
    date: string
    priority: Announcement['priority']
    posted_by: string
    expires: string
  }>({
    title: '',
    body: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    posted_by: 'CSE Department',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  // Query
  const { data: announcements = [], isLoading, isError, error: queryError } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => getAnnouncements(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Announcement>) => createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      success('Announcement posted successfully')
      closeForm()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) =>
      updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      success('Announcement updated successfully')
      closeForm()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      success('Announcement deleted')
      setDeletingId(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setDeletingId(null)
    },
  })

  const openCreate = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      body: '',
      date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      posted_by: 'CSE Department',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    setIsFormOpen(true)
  }

  const openEdit = (item: Announcement) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      body: item.body,
      date: item.date,
      priority: item.priority,
      posted_by: item.posted_by,
      expires: item.expires,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItem(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.body.trim()) {
      error('Please fill in title and body')
      return
    }

    const payload: Partial<Announcement> = {
      title: formData.title.trim(),
      body: formData.body.trim(),
      date: formData.date,
      priority: formData.priority,
      posted_by: formData.posted_by.trim(),
      expires: formData.expires,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const filtered = announcements.filter((item) => {
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q) ||
      item.posted_by.toLowerCase().includes(q)
    return matchesPriority && matchesSearch
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campus Announcements</h1>
          <p className="page-subtitle">Official circulars, rescheduled classes, syllabus notices, and deadlines</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          <span>New Notice</span>
        </button>
      </div>

      {/* Controls */}
      <div className="control-bar">
        <div className="filter-pill-group">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              className={`filter-pill ${priorityFilter === p ? 'active' : ''}`}
              onClick={() => setPriorityFilter(p)}
            >
              {p === 'All' ? 'All Notices' : p.charAt(0).toUpperCase() + p.slice(1) + ' Priority'}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search notices by keyword, course, author..."
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
        <LoadingState message="Loading official campus announcements..." />
      ) : isError ? (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load announcements.</strong> Make sure the backend server is running at{' '}
            <code>http://localhost:4000</code>.
            <div className="error-hint">{getErrorMessage(queryError)}</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="No notices found"
          description={
            searchTerm || priorityFilter !== 'All'
              ? 'Try modifying your search or priority filter.'
              : 'Post the first campus announcement.'
          }
          action={{ label: 'Post Notice', onClick: openCreate }}
        />
      ) : (
        <div className="announcements-grid">
          {filtered.map((item) => {
            const isHigh = item.priority === 'high'
            const isMedium = item.priority === 'medium'

            return (
              <div
                key={item.id}
                className={`announcement-card card ${isHigh ? 'priority-high-card' : ''}`}
              >
                <div className="announcement-header">
                  <div className="announcement-badges">
                    <Badge
                      variant={isHigh ? 'danger' : isMedium ? 'warning' : 'neutral'}
                      size="sm"
                      icon={isHigh ? <AlertTriangle size={12} /> : undefined}
                    >
                      {item.priority} priority
                    </Badge>
                    <span className="notice-id">{item.id}</span>
                  </div>

                  <div className="announcement-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit notice"
                      onClick={() => openEdit(item)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      title="Delete notice"
                      onClick={() => setDeletingId(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="announcement-title">{item.title}</h3>
                <p className="announcement-body">{item.body}</p>

                <div className="announcement-footer">
                  <div className="announcement-meta">
                    <span className="meta-item">
                      <User size={13} />
                      {item.posted_by}
                    </span>
                    <span className="meta-item">
                      <Calendar size={13} />
                      Posted {item.date}
                    </span>
                    {item.expires && (
                      <span className="meta-item expires-item">
                        <Clock size={13} />
                        Expires {item.expires}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingItem ? `Edit Notice (${editingItem.id})` : 'New Announcement'}
        subtitle="Broadcast notices to faculty, students, and university clubs"
      >
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label required">Announcement Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CSE 4113 Class Rescheduled — Sunday 7 Sep"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Notice Content / Body</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Detailed circular text, relocated room numbers, or guidelines..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Posted By</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Prof. Dr. Md. Shahriar Mahbub"
                value={formData.posted_by}
                onChange={(e) => setFormData({ ...formData, posted_by: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Priority Level</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as Announcement['priority'],
                  })
                }
                required
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Publish Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Expiry Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.expires}
                onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
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
                ? 'Posting...'
                : editingItem
                ? 'Save Changes'
                : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Announcement"
        message="Are you sure you want to permanently delete this announcement? This will immediately sync to the database."
        confirmText="Delete Notice"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
