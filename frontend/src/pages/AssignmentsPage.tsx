import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Clock,
  ExternalLink,
  Award,
  Edit2,
  Trash2,
  BookOpen,
  AlertCircle,
} from 'lucide-react'
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../services/assignments'
import { getErrorMessage } from '../services/api'
import { useToast } from '../components/ToastContext'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LoadingState, EmptyState } from '../components/States'
import { Badge } from '../components/Badge'
import type { Assignment } from '../types'

const STATUS_TABS = ['All', 'pending', 'submitted', 'graded', 'late'] as const

export const AssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form fields
  const [formData, setFormData] = useState<{
    course: string
    course_title: string
    title: string
    description: string
    assigned_date: string
    deadline: string
    submission_platform: string
    status: Assignment['status']
    marks: number
  }>({
    course: 'CSE 4113',
    course_title: 'Pattern Recognition and Machine Learning',
    title: '',
    description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    submission_platform: 'Google Classroom',
    status: 'pending',
    marks: 10,
  })

  // Query
  const { data: assignments = [], isLoading, isError, error: queryError } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => getAssignments(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Assignment>) => createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      success('Assignment created successfully')
      closeForm()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assignment> }) =>
      updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      success('Assignment updated successfully')
      closeForm()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      success('Assignment removed')
      setDeletingId(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setDeletingId(null)
    },
  })

  const openCreate = () => {
    setEditingAssignment(null)
    setFormData({
      course: 'CSE 4113',
      course_title: 'Pattern Recognition and Machine Learning',
      title: '',
      description: '',
      assigned_date: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      submission_platform: 'Google Classroom',
      status: 'pending',
      marks: 10,
    })
    setIsFormOpen(true)
  }

  const openEdit = (asgn: Assignment) => {
    setEditingAssignment(asgn)
    setFormData({
      course: asgn.course,
      course_title: asgn.course_title,
      title: asgn.title,
      description: asgn.description,
      assigned_date: asgn.assigned_date,
      deadline: asgn.deadline,
      submission_platform: asgn.submission_platform,
      status: asgn.status,
      marks: asgn.marks,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingAssignment(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.course.trim()) {
      error('Please fill in course and assignment title')
      return
    }

    const payload: Partial<Assignment> = {
      course: formData.course.trim(),
      course_title: formData.course_title.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      assigned_date: formData.assigned_date,
      deadline: formData.deadline,
      submission_platform: formData.submission_platform.trim(),
      status: formData.status,
      marks: Number(formData.marks),
    }

    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  // Quick toggle status helper
  const handleQuickStatusChange = (assignment: Assignment, newStatus: Assignment['status']) => {
    updateMutation.mutate({
      id: assignment.id,
      data: { status: newStatus },
    })
  }

  const filtered = assignments.filter((asgn) => {
    const matchesStatus = statusFilter === 'All' || asgn.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      asgn.course.toLowerCase().includes(q) ||
      asgn.title.toLowerCase().includes(q) ||
      asgn.course_title.toLowerCase().includes(q) ||
      asgn.description.toLowerCase().includes(q) ||
      asgn.submission_platform.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Coursework & Assignments</h1>
          <p className="page-subtitle">Track project deadlines, term papers, lab reports, and grade weights</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Controls */}
      <div className="control-bar">
        <div className="filter-pill-group">
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'All' ? 'All Assignments' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by course code, title, platform..."
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
        <LoadingState message="Loading coursework and submission deadlines..." />
      ) : isError ? (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load assignments.</strong> Make sure the backend server is running at{' '}
            <code>https://campusos-hackathon-1.onrender.com</code>.
            <div className="error-hint">{getErrorMessage(queryError)}</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="No assignments found"
          description={
            searchTerm || statusFilter !== 'All'
              ? 'Try modifying your search or changing the status filter.'
              : 'Add your first course assignment using the button above.'
          }
          action={{ label: 'Add Assignment', onClick: openCreate }}
        />
      ) : (
        <div className="assignments-grid">
          {filtered.map((asgn) => {
            let badgeVariant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral'
            if (asgn.status === 'pending') badgeVariant = 'warning'
            else if (asgn.status === 'submitted') badgeVariant = 'info'
            else if (asgn.status === 'graded') badgeVariant = 'success'
            else if (asgn.status === 'late') badgeVariant = 'danger'

            return (
              <div key={asgn.id} className="assignment-card card">
                <div className="assignment-card-header">
                  <div className="assignment-course-row">
                    <span className="code-pill">{asgn.course}</span>
                    <span className="assignment-course-title">{asgn.course_title}</span>
                  </div>

                  <div className="assignment-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit assignment"
                      onClick={() => openEdit(asgn)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      title="Delete assignment"
                      onClick={() => setDeletingId(asgn.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="assignment-title">{asgn.title}</h3>
                <p className="assignment-description">{asgn.description}</p>

                <div className="assignment-meta-box">
                  <div className="meta-pair">
                    <span className="meta-label">Assigned:</span>
                    <span className="meta-val">{asgn.assigned_date}</span>
                  </div>
                  <div className="meta-pair">
                    <span className="meta-label">Deadline:</span>
                    <span className="meta-val highlight-deadline">
                      <Clock size={12} />
                      {asgn.deadline}
                    </span>
                  </div>
                  <div className="meta-pair">
                    <span className="meta-label">Platform:</span>
                    <span className="meta-val">
                      <ExternalLink size={12} />
                      {asgn.submission_platform}
                    </span>
                  </div>
                  <div className="meta-pair">
                    <span className="meta-label">Marks:</span>
                    <span className="meta-val marks-val">
                      <Award size={12} />
                      {asgn.marks} pts
                    </span>
                  </div>
                </div>

                <div className="assignment-card-footer">
                  <div className="status-badge-container">
                    <Badge variant={badgeVariant} size="sm">
                      {asgn.status}
                    </Badge>
                  </div>

                  <div className="status-selector-group">
                    <label className="status-quick-label">Status:</label>
                    <select
                      className="form-select status-select-sm"
                      value={asgn.status}
                      onChange={(e) =>
                        handleQuickStatusChange(
                          asgn,
                          e.target.value as Assignment['status']
                        )
                      }
                      disabled={updateMutation.isPending}
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="graded">Graded</option>
                      <option value="late">Late</option>
                    </select>
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
        title={editingAssignment ? `Edit Assignment (${editingAssignment.id})` : 'New Assignment'}
        subtitle="Specify submission rules, deadlines, and grade weight"
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
              <label className="form-label required">Course Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pattern Recognition and Machine Learning"
                value={formData.course_title}
                onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Assignment Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Assignment 1: Bayes Classifier Implementation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Task Description & Requirements</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide exact deliverables, formats, rules..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Assigned Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Deadline</label>
              <input
                type="date"
                className="form-input"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label required">Platform</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Google Classroom"
                value={formData.submission_platform}
                onChange={(e) => setFormData({ ...formData, submission_platform: e.target.value })}
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
                    status: e.target.value as Assignment['status'],
                  })
                }
                required
              >
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="late">Late</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Marks</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
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
                : editingAssignment
                ? 'Save Changes'
                : 'Create Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This will permanently update the database."
        confirmText="Delete Assignment"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
