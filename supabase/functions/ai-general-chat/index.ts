import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { chatModel } from '../_shared/gemini.ts'

interface RequestBody {
  message: string
  context?: {
    type: 'business_plan' | 'market_research' | 'email' | 'general'
    additionalContext?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user with Supabase
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

    // Parse request body
    const { message, context }: RequestBody = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build system prompt based on context type
    let systemPrompt = `당신은 Draft AI 코파운더입니다. 스타트업 창업자와 팀 빌더를 돕는 전문 AI 어시스턴트입니다.
한국어로 친근하지만 전문적으로 대화하세요. 답변은 간결하고 실용적이어야 합니다.`

    if (context?.type === 'business_plan') {
      systemPrompt += `\n\n현재 사용자가 사업계획서 작성을 요청했습니다. PSST (Problem, Solution, Scalability, Team) 프레임워크를 기반으로 도움을 주세요.`
    } else if (context?.type === 'market_research') {
      systemPrompt += `\n\n현재 사용자가 시장 조사를 요청했습니다. TAM/SAM/SOM 분석, 경쟁사 분석, 시장 트렌드 등을 포함해서 답변하세요.`
    } else if (context?.type === 'email') {
      systemPrompt += `\n\n현재 사용자가 이메일 작성을 요청했습니다. 전문적이면서도 개인적인 톤으로 효과적인 이메일을 작성해주세요.`
    }

    if (context?.additionalContext) {
      systemPrompt += `\n\n추가 컨텍스트: ${context.additionalContext}`
    }

    // Generate response with Gemini
    const chat = chatModel.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'System: ' + systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: '네, 이해했습니다. Draft AI 코파운더로서 도움을 드리겠습니다.' }],
        },
      ],
    })

    const result = await chat.sendMessage(message)
    const response = result.response.text()

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-general-chat:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
