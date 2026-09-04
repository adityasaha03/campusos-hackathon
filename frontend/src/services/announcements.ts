import { apiClient } from './api'
import type { Announcement } from '../types'

export async function getAnnouncements(params?: { priority?: string; since?: string }): Promise<Announcement[]> {
  const res = await apiClient.get<Announcement[]>('/announcements', { params })
  return res.data
}

export async function getAnnouncementById(id: string): Promise<Announcement> {
  const res = await apiClient.get<Announcement>(`/announcements/${id}`)
  return res.data
}

export async function createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
  const res = await apiClient.post<Announcement>('/announcements', data)
  return res.data
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement> {
  const res = await apiClient.put<Announcement>(`/announcements/${id}`, data)
  return res.data
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete<{ success: boolean; message?: string }>(`/announcements/${id}`)
  return res.data
}
