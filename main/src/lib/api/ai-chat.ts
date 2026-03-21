'use client'

import { supabase } from '../supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'

const EDGE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface StartChatResponse {
  sessionId: string
  message: string
}

interface SendMessageResponse {
  message: string
  isComplete?: boolean
}

interface CompleteChatResponse {
  visionSummary: string
  embedding?: number[]
}

// Get the current session token for authenticated requests
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Start a new AI chat session (for onboarding deep dive)
 */
export async function startAiChat(): Promise<StartChatResponse> {
  const headers = await getAuthHeader()

  const response = await fetch(`${EDGE_FUNCTIONS_URL}/ai-chat-start`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to start chat' }))
    throw new Error(error.message || 'Failed to start chat')
  }

  return response.json()
}

/**
 * Send a message in an existing chat session
 */
export async function sendAiChatMessage(
  sessionId: string,
  message: string,
  history: ChatMessage[]
): Promise<SendMessageResponse> {
  const headers = await getAuthHeader()

  const response = await fetch(`${EDGE_FUNCTIONS_URL}/ai-chat-message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionId,
      message,
      history,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to send message' }))
    throw new Error(error.message || 'Failed to send message')
  }

  return response.json()
}

/**
 * Complete a chat session and generate vision summary + embedding
 */
export async function completeAiChat(
  sessionId: string,
  history: ChatMessage[]
): Promise<CompleteChatResponse> {
  const headers = await getAuthHeader()

  const response = await fetch(`${EDGE_FUNCTIONS_URL}/ai-chat-complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionId,
      history,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to complete chat' }))
    throw new Error(error.message || 'Failed to complete chat')
  }

  return response.json()
}

/**
 * Get AI recommendations for opportunities based on user profile
 */
export async function getAiRecommendations(limit = 10): Promise<{
  opportunities: Array<{
    id: string
    title: string
    matchScore: number
    matchReason: string
  }>
}> {
  const headers = await getAuthHeader()

  const response = await fetch(`${EDGE_FUNCTIONS_URL}/opportunities-recommend`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ limit }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get recommendations' }))
    throw new Error(error.message || 'Failed to get recommendations')
  }

  return response.json()
}

/**
 * General purpose AI chat (for co-founder assistant)
 */
export async function sendGeneralAiMessage(
  message: string,
  context?: {
    type: 'business_plan' | 'market_research' | 'email' | 'general'
    additionalContext?: string
  }
): Promise<{ response: string }> {
  const headers = await getAuthHeader()

  const response = await fetch(`${EDGE_FUNCTIONS_URL}/ai-general-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      context,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get AI response' }))
    throw new Error(error.message || 'Failed to get AI response')
  }

  return response.json()
}

// React Query hooks for AI chat
export function useStartAiChat() {
  return useMutation({
    mutationFn: startAiChat,
  })
}

export function useSendAiMessage() {
  return useMutation({
    mutationFn: ({ sessionId, message, history }: {
      sessionId: string
      message: string
      history: ChatMessage[]
    }) => sendAiChatMessage(sessionId, message, history),
  })
}

export function useCompleteAiChat() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ sessionId, history }: {
      sessionId: string
      history: ChatMessage[]
    }) => completeAiChat(sessionId, history),
    onSuccess: () => {
      // Invalidate profile to refresh with new vision summary
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['profiles', user.id] })
      }
    },
  })
}

export function useSendGeneralAiMessage() {
  return useMutation({
    mutationFn: ({ message, context }: {
      message: string
      context?: {
        type: 'business_plan' | 'market_research' | 'email' | 'general'
        additionalContext?: string
      }
    }) => sendGeneralAiMessage(message, context),
  })
}
