import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { chatModel } from '../_shared/gemini.ts'
import { generateEmbedding } from '../_shared/embeddings.ts'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  sessionId: string
  history: ChatMessage[]
}

const SUMMARY_PROMPT = `다음 대화 내용을 바탕으로 사용자의 비전과 목표를 2-3문장으로 요약해주세요.
팀 매칭에 도움이 될 수 있는 핵심 키워드(관심사, 역할, 목표)를 포함해주세요.
요약은 제3자가 이 사람을 이해할 수 있도록 작성해주세요.

예시: "김철수님은 AI 기반 헬스케어 스타트업을 창업하고자 하는 개발자입니다. 특히 수면 데이터 분석에 관심이 있으며, 마케팅과 비즈니스 역량을 갖춘 공동창업자를 찾고 있습니다."

대화 내용:
`

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    const { sessionId, history }: RequestBody = await req.json()

    if (!sessionId || !history || history.length === 0) {
      return new Response(
        JSON.stringify({ error: 'sessionId and history are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format conversation for summary
    const conversationText = history
      .map((msg) => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
      .join('\n\n')

    // Generate vision summary
    const summaryResult = await chatModel.generateContent(SUMMARY_PROMPT + conversationText)
    const visionSummary = summaryResult.response.text()

    // Generate embedding for the summary
    const embedding = await generateEmbedding(visionSummary)

    // Update profile with summary and embedding
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        vision_summary: visionSummary,
        vision_embedding: `[${embedding.join(',')}]`,
        ai_chat_completed: true,
        ai_chat_transcript: history,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error('Failed to update profile')
    }

    // Update onboarding status
    await supabaseAdmin
      .from('onboarding_status')
      .upsert({
        user_id: user.id,
        ai_chat_completed: true,
        completed_at: new Date().toISOString(),
      })

    return new Response(
      JSON.stringify({ visionSummary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-chat-complete:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
