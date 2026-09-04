import { apiClient, DEFAULT_STUDENT_ID, DEFAULT_STUDENT_NAME } from './api'
import type { Event } from '../types'

export async function getEvents(params?: { date?: string; name_contains?: string }): Promise<Event[]> {
  const res = await apiClient.get<Event[]>('/events', { params })
  return res.data
}

export async function getEventById(id: string): Promise<Event> {
  const res = await apiClient.get<Event>(`/events/${id}`)
  return res.data
}

export async function createEvent(data: Partial<Event>): Promise<Event> {
  const res = await apiClient.post<Event>('/events', data)
  return res.data
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  const res = await apiClient.put<Event>(`/events/${id}`, data)
  return res.data
}

export async function deleteEvent(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete<{ success: boolean; message?: string }>(`/events/${id}`)
  return res.data
}

export async function registerForEvent(
  eventId: string,
  student?: { student_id?: string; name?: string }
): Promise<{ success?: boolean; message?: string; event?: Event }> {
  const payload = {
    student_id: student?.student_id || DEFAULT_STUDENT_ID,
    name: student?.name || DEFAULT_STUDENT_NAME,
  }
  const res = await apiClient.post<{ success?: boolean; message?: string; event?: Event }>(
    `/events/${eventId}/register`,
    payload
  )
  return res.data
}

export async function cancelEventRegistration(
  eventId: string,
  studentId?: string
): Promise<{ success?: boolean; message?: string; event?: Event }> {
  const payload = {
    student_id: studentId || DEFAULT_STUDENT_ID,
  }
  const res = await apiClient.post<{ success?: boolean; message?: string; event?: Event }>(
    `/events/${eventId}/cancel`,
    payload
  )
  return res.data
}
