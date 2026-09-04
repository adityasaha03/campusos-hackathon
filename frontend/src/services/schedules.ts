import { apiClient } from './api'
import type { Schedule } from '../types'

export async function getSchedules(params?: { day?: string; course?: string; instructor?: string }): Promise<Schedule[]> {
  const res = await apiClient.get<Schedule[]>('/schedules', { params })
  return res.data
}

export async function getScheduleById(id: string): Promise<Schedule> {
  const res = await apiClient.get<Schedule>(`/schedules/${id}`)
  return res.data
}

export async function createSchedule(data: Partial<Schedule>): Promise<Schedule> {
  const res = await apiClient.post<Schedule>('/schedules', data)
  return res.data
}

export async function updateSchedule(id: string, data: Partial<Schedule>): Promise<Schedule> {
  const res = await apiClient.put<Schedule>(`/schedules/${id}`, data)
  return res.data
}

export async function deleteSchedule(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete<{ success: boolean; message?: string }>(`/schedules/${id}`)
  return res.data
}
