import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { chatModel } from '../_shared/gemini.ts'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  sessionId: string
  message: string
  history: ChatMessage[]
}

const SYSTEM_PROMPT = `당신은 Draft의 AI 온보딩 어시스턴트입니다. 사용자의 비전과 목표를 탐색하여 최적의 팀 매칭을 위한 프로필을 구축하는 것이 목표입니다.

대화 스타일:
- 친근하지만 전문적인 톤
- 한 번에 하나의 질문만
- 5-10개의 질문으로 대화 완료
- 사용자의 답변에 공감하고 후속 질문 연결

대화가 충분히 진행되었다면 (5개 이상의 질문에 대한 답변을 받았다면), 마지막에 "대화를 완료하시겠습니까?"라고 물어보세요.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { sessionId, message, history }: RequestBody = await req.json()

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'sessionId and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert history to Gemini format
    const geminiHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    // Start chat with history
    const chat = chatModel.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System: ${SYSTEM_PROMPT}` }],
        },
        {
          role: 'model',
          parts: [{ text: '네, 이해했습니다.' }],
        },
        ...geminiHistory,
      ],
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    // Check if conversation should be complete
    const isComplete = history.length >= 10 || responseText.includes('대화를 완료하시겠습니까')

    return new Response(
      JSON.stringify({ message: responseText, isComplete }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-chat-message:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
