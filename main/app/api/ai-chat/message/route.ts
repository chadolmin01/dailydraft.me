import { createClient } from '@/src/lib/supabase/server'
import { sendChatMessage } from '@/src/lib/ai/chat-manager'
import type { ChatMessage } from '@/src/types/profile'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const { message, conversationHistory } = await request.json()

    if (!message || !conversationHistory) {
      return ApiResponse.badRequest('Missing required fields')
    }

    // Send message to Gemini
    const aiResponse = await sendChatMessage(conversationHistory as ChatMessage[], message)

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    }

    return ApiResponse.ok({
      message: aiMessage,
    })
  } catch (error) {
    console.error('AI chat message error:', error)
    return ApiResponse.internalError()
  }
}
