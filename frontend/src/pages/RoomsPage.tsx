import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Users,
  Layers,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react'
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  bookRoom,
  cancelBooking,
  getAvailableRooms,
} from '../services/rooms'
import { DEFAULT_STUDENT_NAME, getErrorMessage } from '../services/api'
import { useToast } from '../components/ToastContext'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LoadingState, EmptyState } from '../components/States'
import { Badge } from '../components/Badge'
import type { Room } from '../types'

const ROOM_TYPES = ['All', 'classroom', 'lab', 'seminar'] as const

export const RoomsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  // Filter states
  const [selectedType, setSelectedType] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(new Set())

  // Availability quick finder state
  const [isFinderOpen, setIsFinderOpen] = useState(false)
  const [finderParams, setFinderParams] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '16:00',
    min_capacity: '',
    type: '',
    equipment: '',
  })
  const [availableRoomsList, setAvailableRoomsList] = useState<Room[] | null>(null)
  const [isSearchingAvailability, setIsSearchingAvailability] = useState(false)

  // Room CRUD modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null)

  // Booking modal state
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null)
  const [bookingForm, setBookingForm] = useState({
    booked_by: DEFAULT_STUDENT_NAME,
    date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '16:00',
    purpose: '',
  })

  // Cancel booking confirmation
  const [cancelingBooking, setCancelingBooking] = useState<{ roomId: string; bookingId: string } | null>(null)

  // Room form fields
  const [roomFormData, setRoomFormData] = useState<{
    room_number: string
    type: 'classroom' | 'lab' | 'seminar'
    capacity: number
    equipment: string
    floor: number
    status: 'available' | 'unavailable'
  }>({
    room_number: '',
    type: 'classroom',
    capacity: 40,
    equipment: 'whiteboard, projector, AC',
    floor: 7,
    status: 'available',
  })

  // Main Rooms Query
  const { data: rooms = [], isLoading, isError, error: queryError } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => getRooms(),
  })

  // Create Room Mutation
  const createRoomMutation = useMutation({
    mutationFn: (data: Partial<Room>) => createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      success('Room created successfully')
      closeRoomModal()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Update Room Mutation
  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) => updateRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      success('Room updated successfully')
      closeRoomModal()
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Delete Room Mutation
  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      success('Room deleted')
      setDeletingRoomId(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setDeletingRoomId(null)
    },
  })

  // Book Room Mutation
  const bookRoomMutation = useMutation({
    mutationFn: ({ roomId, form }: { roomId: string; form: typeof bookingForm }) =>
      bookRoom(roomId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      success('Room booked successfully!')
      setBookingRoom(null)
    },
    onError: (err) => error(getErrorMessage(err)),
  })

  // Cancel Booking Mutation
  const cancelBookingMutation = useMutation({
    mutationFn: ({ roomId, bookingId }: { roomId: string; bookingId: string }) =>
      cancelBooking(roomId, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      success('Booking cancelled successfully')
      setCancelingBooking(null)
    },
    onError: (err) => {
      error(getErrorMessage(err))
      setCancelingBooking(null)
    },
  })

  const toggleExpand = (roomId: string) => {
    setExpandedRoomIds((prev) => {
      const next = new Set(prev)
      if (next.has(roomId)) {
        next.delete(roomId)
      } else {
        next.add(roomId)
      }
      return next
    })
  }

  const openCreateRoom = () => {
    setEditingRoom(null)
    setRoomFormData({
      room_number: '',
      type: 'classroom',
      capacity: 40,
      equipment: 'whiteboard, projector, AC',
      floor: 7,
      status: 'available',
    })
    setIsRoomModalOpen(true)
  }

  const openEditRoom = (room: Room) => {
    setEditingRoom(room)
    setRoomFormData({
      room_number: room.room_number,
      type: room.type,
      capacity: room.capacity,
      equipment: room.equipment.join(', '),
      floor: room.floor,
      status: room.status,
    })
    setIsRoomModalOpen(true)
  }

  const closeRoomModal = () => {
    setIsRoomModalOpen(false)
    setEditingRoom(null)
  }

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const equipmentArray = roomFormData.equipment
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const payload: Partial<Room> = {
      room_number: roomFormData.room_number.trim(),
      type: roomFormData.type,
      capacity: Number(roomFormData.capacity),
      equipment: equipmentArray,
      floor: Number(roomFormData.floor),
      status: roomFormData.status,
    }

    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data: payload })
    } else {
      createRoomMutation.mutate(payload)
    }
  }

  const handleOpenBooking = (room: Room) => {
    setBookingRoom(room)
    setBookingForm({
      booked_by: DEFAULT_STUDENT_NAME,
      date: new Date().toISOString().split('T')[0],
      start_time: '14:00',
      end_time: '16:00',
      purpose: '',
    })
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingRoom) return
    if (!bookingForm.purpose.trim()) {
      error('Please specify a purpose for booking')
      return
    }
    bookRoomMutation.mutate({ roomId: bookingRoom.id, form: bookingForm })
  }

  const handleSearchAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearchingAvailability(true)
    try {
      const results = await getAvailableRooms({
        date: finderParams.date,
        start_time: finderParams.start_time,
        end_time: finderParams.end_time,
        min_capacity: finderParams.min_capacity ? Number(finderParams.min_capacity) : undefined,
        type: finderParams.type || undefined,
        equipment: finderParams.equipment || undefined,
      })
      setAvailableRoomsList(results)
    } catch (err) {
      error(getErrorMessage(err))
    } finally {
      setIsSearchingAvailability(false)
    }
  }

  // Filter display rooms
  const displayRooms = availableRoomsList ?? rooms
  const filteredRooms = displayRooms.filter((r) => {
    const matchesType = selectedType === 'All' || r.type === selectedType
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      r.room_number.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.equipment.some((eq) => eq.toLowerCase().includes(q))
    return matchesType && matchesSearch
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rooms & Facilities</h1>
          <p className="page-subtitle">Inspect capacity, check equipment, view bookings, and reserve spaces</p>
        </div>
        <div className="action-button-group">
          <button
            type="button"
            className={`btn ${isFinderOpen ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => {
              setIsFinderOpen(!isFinderOpen)
              if (availableRoomsList) setAvailableRoomsList(null)
            }}
          >
            <Sparkles size={16} />
            <span>{availableRoomsList ? 'Clear Availability Filter' : 'Find Available Rooms'}</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreateRoom}>
            <Plus size={16} />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Quick Availability Finder Accordion */}
      {isFinderOpen && (
        <div className="card finder-card">
          <div className="finder-header">
            <div>
              <h3 className="card-title">Check Real-Time Room Availability</h3>
              <p className="card-subtitle">Find conflict-free rooms matching date, time, and capacity criteria</p>
            </div>
            {availableRoomsList && (
              <Badge variant="success" size="sm">
                Showing {availableRoomsList.length} Available Rooms
              </Badge>
            )}
          </div>
          <form onSubmit={handleSearchAvailability} className="form-stack">
            <div className="form-row-4">
              <div className="form-group">
                <label className="form-label required">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={finderParams.date}
                  onChange={(e) => setFinderParams({ ...finderParams, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label required">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={finderParams.start_time}
                  onChange={(e) => setFinderParams({ ...finderParams, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label required">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={finderParams.end_time}
                  onChange={(e) => setFinderParams({ ...finderParams, end_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Min Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 30"
                  value={finderParams.min_capacity}
                  onChange={(e) => setFinderParams({ ...finderParams, min_capacity: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  className="form-select"
                  value={finderParams.type}
                  onChange={(e) => setFinderParams({ ...finderParams, type: e.target.value })}
                >
                  <option value="">Any Type</option>
                  <option value="classroom">Classroom</option>
                  <option value="lab">Computer Lab</option>
                  <option value="seminar">Seminar Hall</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipment (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. projector, AC"
                  value={finderParams.equipment}
                  onChange={(e) => setFinderParams({ ...finderParams, equipment: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSearchingAvailability}
                >
                  {isSearchingAvailability ? 'Querying...' : 'Search Availability'}
                </button>
                {availableRoomsList && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAvailableRoomsList(null)}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Control Bar: Type filter + search */}
      <div className="control-bar">
        <div className="filter-pill-group">
          {ROOM_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`filter-pill ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type === 'All' ? 'All Rooms' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by room # (e.g. 7A01), equipment..."
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
        <LoadingState message="Loading campus rooms and booking statuses..." />
      ) : isError ? (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load rooms.</strong> Make sure the backend server is running at{' '}
            <code>http://localhost:4000</code>.
            <div className="error-hint">{getErrorMessage(queryError)}</div>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          icon={<Layers size={48} />}
          title="No rooms match your filter"
          description={
            availableRoomsList
              ? 'No rooms are available for the selected time window and capacity requirements.'
              : 'Try selecting a different room type or clearing your search.'
          }
          action={
            availableRoomsList
              ? { label: 'Show All Rooms', onClick: () => setAvailableRoomsList(null) }
              : { label: 'Add Room', onClick: openCreateRoom }
          }
        />
      ) : (
        <div className="rooms-grid">
          {filteredRooms.map((room) => {
            const isExpanded = expandedRoomIds.has(room.id)
            const bookingCount = room.bookings?.length || 0

            return (
              <div key={room.id} className="room-card card">
                <div className="room-card-header">
                  <div className="room-title-row">
                    <h3 className="room-number">{room.room_number}</h3>
                    <div className="room-badges">
                      <Badge
                        variant={room.type === 'lab' ? 'primary' : room.type === 'seminar' ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {room.type}
                      </Badge>
                      <Badge
                        variant={room.status === 'available' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {room.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="room-stats-row">
                    <span className="room-stat">
                      <Users size={13} />
                      {room.capacity} seats
                    </span>
                    <span className="room-stat">
                      <Layers size={13} />
                      Floor {room.floor}
                    </span>
                    <span className="room-stat">
                      <CalendarCheck size={13} />
                      {bookingCount} {bookingCount === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                </div>

                {/* Equipment Tags */}
                <div className="room-equipment-list">
                  {room.equipment.map((eq, i) => (
                    <span key={i} className="equipment-tag">
                      {eq}
                    </span>
                  ))}
                </div>

                {/* Card Actions */}
                <div className="room-card-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleOpenBooking(room)}
                  >
                    <Calendar size={14} />
                    <span>Book Room</span>
                  </button>

                  <div className="room-btn-group">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit room specs"
                      onClick={() => openEditRoom(room)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-danger"
                      title="Delete room"
                      onClick={() => setDeletingRoomId(room.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${isExpanded ? 'btn-secondary' : 'btn-outline'}`}
                      onClick={() => toggleExpand(room.id)}
                      title="Toggle bookings list"
                    >
                      <span>Bookings ({bookingCount})</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Bookings Drawer */}
                {isExpanded && (
                  <div className="room-bookings-drawer">
                    <div className="drawer-header">
                      <span className="drawer-title">Active Reservations</span>
                    </div>
                    {bookingCount === 0 ? (
                      <div className="no-bookings-note">No active bookings for this room.</div>
                    ) : (
                      <div className="booking-list">
                        {room.bookings.map((booking) => (
                          <div key={booking.booking_id} className="booking-item">
                            <div className="booking-details">
                              <div className="booking-meta">
                                <span className="booking-date">
                                  <Calendar size={12} />
                                  {booking.date}
                                </span>
                                <span className="booking-time">
                                  <Clock size={12} />
                                  {booking.start_time} - {booking.end_time}
                                </span>
                              </div>
                              <div className="booking-purpose">{booking.purpose}</div>
                              <div className="booking-person">Booked by: {booking.booked_by}</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-xs btn-danger"
                              onClick={() =>
                                setCancelingBooking({
                                  roomId: room.id,
                                  bookingId: booking.booking_id,
                                })
                              }
                              title="Cancel booking"
                            >
                              <X size={12} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Book Room Modal */}
      <Modal
        isOpen={!!bookingRoom}
        onClose={() => setBookingRoom(null)}
        title={`Book Room ${bookingRoom?.room_number || ''}`}
        subtitle={`Capacity: ${bookingRoom?.capacity} | Type: ${bookingRoom?.type} | Floor: ${bookingRoom?.floor}`}
      >
        <form onSubmit={handleBookingSubmit} className="form-stack">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Date</label>
              <input
                type="date"
                className="form-input"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Booked By (Student / Club)</label>
              <input
                type="text"
                className="form-input"
                value={bookingForm.booked_by}
                onChange={(e) => setBookingForm({ ...bookingForm, booked_by: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Start Time (24h)</label>
              <input
                type="time"
                className="form-input"
                value={bookingForm.start_time}
                onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">End Time (24h)</label>
              <input
                type="time"
                className="form-input"
                value={bookingForm.end_time}
                onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Purpose of Booking</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Project meeting for CSE 4114 ML project group"
              value={bookingForm.purpose}
              onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setBookingRoom(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={bookRoomMutation.isPending}
            >
              {bookRoomMutation.isPending ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={closeRoomModal}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
        subtitle="Manage facility profile, capacity, and equipment specs"
      >
        <form onSubmit={handleRoomSubmit} className="form-stack">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Room Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 7A01"
                value={roomFormData.room_number}
                onChange={(e) => setRoomFormData({ ...roomFormData, room_number: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Type</label>
              <select
                className="form-select"
                value={roomFormData.type}
                onChange={(e) =>
                  setRoomFormData({
                    ...roomFormData,
                    type: e.target.value as Room['type'],
                  })
                }
                required
              >
                <option value="classroom">Classroom</option>
                <option value="lab">Computer Lab</option>
                <option value="seminar">Seminar Hall</option>
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label required">Capacity</label>
              <input
                type="number"
                className="form-input"
                min={1}
                value={roomFormData.capacity}
                onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Floor</label>
              <input
                type="number"
                className="form-input"
                value={roomFormData.floor}
                onChange={(e) => setRoomFormData({ ...roomFormData, floor: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Status</label>
              <select
                className="form-select"
                value={roomFormData.status}
                onChange={(e) =>
                  setRoomFormData({
                    ...roomFormData,
                    status: e.target.value as Room['status'],
                  })
                }
                required
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Equipment (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. whiteboard, projector, AC, smart board"
              value={roomFormData.equipment}
              onChange={(e) => setRoomFormData({ ...roomFormData, equipment: e.target.value })}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeRoomModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
            >
              {createRoomMutation.isPending || updateRoomMutation.isPending
                ? 'Saving...'
                : editingRoom
                ? 'Save Changes'
                : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Room Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingRoomId}
        onClose={() => setDeletingRoomId(null)}
        onConfirm={() => deletingRoomId && deleteRoomMutation.mutate(deletingRoomId)}
        title="Delete Room"
        message="Are you sure you want to delete this room and all associated reservations? This will persist to the database."
        confirmText="Delete Room"
        isLoading={deleteRoomMutation.isPending}
      />

      {/* Cancel Booking Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelingBooking}
        onClose={() => setCancelingBooking(null)}
        onConfirm={() =>
          cancelingBooking &&
          cancelBookingMutation.mutate({
            roomId: cancelingBooking.roomId,
            bookingId: cancelingBooking.bookingId,
          })
        }
        title="Cancel Room Booking"
        message="Are you sure you want to cancel this booking reservation? The room time slot will be reopened."
        confirmText="Cancel Reservation"
        isLoading={cancelBookingMutation.isPending}
      />
    </div>
  )
}
