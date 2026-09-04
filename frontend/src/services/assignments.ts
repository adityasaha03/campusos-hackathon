import { apiClient } from './api'
import type { Assignment } from '../types'

export async function getAssignments(params?: { course?: string; status?: string; deadline_before?: string }): Promise<Assignment[]> {
  const res = await apiClient.get<Assignment[]>('/assignments', { params })
  return res.data
}

export async function getAssignmentById(id: string): Promise<Assignment> {
  const res = await apiClient.get<Assignment>(`/assignments/${id}`)
  return res.data
}

export async function createAssignment(data: Partial<Assignment>): Promise<Assignment> {
  const res = await apiClient.post<Assignment>('/assignments', data)
  return res.data
}

export async function updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment> {
  const res = await apiClient.put<Assignment>(`/assignments/${id}`, data)
  return res.data
}

export async function deleteAssignment(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.delete<{ success: boolean; message?: string }>(`/assignments/${id}`)
  return res.data
}
