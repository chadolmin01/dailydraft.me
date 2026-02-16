import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First AI message
    const firstMessage = {
      role: 'assistant' as const,
      content:
        '안녕하세요! 저는 팀 빌딩을 도와드릴 AI 어드바이저예요. 몇 가지 질문을 통해 당신을 더 잘 이해하고 싶어요. 먼저, 어떤 아이디어나 프로젝트를 가지고 계신가요?',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      message: firstMessage,
      conversationId: `chat_${user.id}_${Date.now()}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
