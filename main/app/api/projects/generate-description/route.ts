import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { chatModel } from '@/src/lib/ai/gemini-client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, type, painPoint } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: '프로젝트 이름을 입력해주세요' }, { status: 400 })
    }

    const typeLabel: Record<string, string> = {
      side_project: '사이드 프로젝트',
      startup: '스타트업',
      study: '스터디',
    }

    const prompt = `당신은 대학생 스타트업/프로젝트 플랫폼 "Draft"의 AI 어시스턴트입니다.
아래 정보를 바탕으로 팀원 모집용 프로젝트 설명을 작성해주세요.

## 프로젝트 정보
- 이름: ${title.trim()}
- 유형: ${typeLabel[type] || type || '사이드 프로젝트'}
${painPoint ? `- 해결하려는 문제: ${painPoint.trim()}` : ''}

## 규칙
- 3~5문단, 총 200~400자
- 첫 문단: 프로젝트가 무엇인지 한 줄 요약
- 중간: 어떤 문제를 해결하는지, 주요 기능/방향성
- 마지막: 현재 단계와 함께할 팀원에게 바라는 점
- 대학생 톤, 자연스럽고 열정적이지만 과하지 않게
- 마크다운 없이 순수 텍스트만
- 설명만 출력하세요. 다른 텍스트는 포함하지 마세요.`

    const result = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 800,
      },
    })

    const description = result.response.text().trim()

    return NextResponse.json({ description })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
