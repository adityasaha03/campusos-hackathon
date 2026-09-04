import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.BACKEND_API_URL ||
  'https://campusos-hackathon-1.onrender.com/api'
export const DEFAULT_STUDENT_ID = import.meta.env.VITE_DEFAULT_STUDENT_ID || '20-40532'
export const DEFAULT_STUDENT_NAME = import.meta.env.VITE_DEFAULT_STUDENT_NAME || 'Sakibul Hassan'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Helper to extract clean error message from API response
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error
    }
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
  }
  return 'An unexpected error occurred. Please try again.'
}
