import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { sendChatMessage } from '@/src/lib/ai/chat-manager'
import type { ChatMessage } from '@/src/types/profile'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const { message, conversationHistory } = await request.json()

    if (!message || !conversationHistory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send message to Gemini
    const aiResponse = await sendChatMessage(conversationHistory as ChatMessage[], message)

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      message: aiMessage,
    })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
