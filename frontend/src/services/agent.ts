import { apiClient } from './api'
import type { ChatTurn, ChatResponse } from '../types'

export async function sendChatMessage(message: string, history?: ChatTurn[]): Promise<string> {
  const res = await apiClient.post<ChatResponse>('/agent/chat', {
    message,
    history,
  })
  return res.data.reply
}
