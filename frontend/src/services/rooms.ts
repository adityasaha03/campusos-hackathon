import { apiClient } from './api'
import type { Room, Booking } from '../types'

export async function getRooms(params?: { type?: string; min_capacity?: number; equipment?: string }): Promise<Room[]> {
  const res = await apiClient.get<Room[]>('/rooms', { params })
  return res.data
}

export async function getRoomById(id: string): Promise<Room> {
  const res = await apiClient.get<Room>(`/rooms/${id}`)
  return res.data
}

export async function createRoom(data: Partial<Room>): Promise<Room> {
  const res = await apiClient.post<Room>('/rooms', data)
  return res.data
}

export async function updateRoom(id: string, data: Partial<Room>): Promise<Room> {
  const res = await apiClient.put<Room>(`/rooms/${id}`, data)
  return res.data
}

export async function deleteRoom(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete<{ success: boolean; message?: string }>(`/rooms/${id}`)
  return res.data
}

export async function getAvailableRooms(params: {
  date: string
  start_time: string
  end_time: string
  min_capacity?: number
  type?: string
  equipment?: string
}): Promise<Room[]> {
  const res = await apiClient.get<Room[]>('/rooms/available', { params })
  return res.data
}

export async function bookRoom(
  roomId: string,
  bookingData: {
    booked_by: string
    date: string
    start_time: string
    end_time: string
    purpose: string
  }
): Promise<{ success?: boolean; booking?: Booking; message?: string }> {
  const res = await apiClient.post<{ success?: boolean; booking?: Booking; message?: string }>(
    `/rooms/${roomId}/book`,
    bookingData
  )
  return res.data
}

export async function cancelBooking(
  roomId: string,
  bookingId: string
): Promise<{ success?: boolean; message?: string }> {
  const res = await apiClient.delete<{ success?: boolean; message?: string }>(
    `/rooms/${roomId}/bookings/${bookingId}`
  )
  return res.data
}
