import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { chatModel } from '../_shared/gemini.ts'

const SYSTEM_PROMPT = `당신은 Draft의 AI 온보딩 어시스턴트입니다. 사용자의 비전과 목표를 탐색하여 최적의 팀 매칭을 위한 프로필을 구축하는 것이 목표입니다.

대화 스타일:
- 친근하지만 전문적인 톤
- 한 번에 하나의 질문만
- 5-10개의 질문으로 대화 완료
- 사용자의 답변에 공감하고 후속 질문 연결

탐색할 영역:
1. 현재 상황과 배경
2. 창업/프로젝트 아이디어
3. 팀에서 원하는 역할
4. 이상적인 팀원 특성
5. 장기적인 비전과 목표

첫 번째 메시지로 자기소개를 하고 대화를 시작하세요.`

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

    // Get user profile for personalization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nickname, current_situation')
      .eq('user_id', user.id)
      .single()

    const userName = profile?.nickname || '사용자'

    // Generate session ID
    const sessionId = crypto.randomUUID()

    // Generate initial message
    const chat = chatModel.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System: ${SYSTEM_PROMPT}\n\n사용자 이름: ${userName}` }],
        },
      ],
    })

    const result = await chat.sendMessage('대화를 시작해주세요.')
    const message = result.response.text()

    return new Response(
      JSON.stringify({ sessionId, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-chat-start:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
