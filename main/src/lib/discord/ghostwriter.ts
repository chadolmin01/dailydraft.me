/**
 * Weekly Update Ghostwriter
 *
 * Discord 메시지 묶음 → AI 요약 → 주간 업데이트 초안 생성
 *
 * 핵심 원칙:
 * - 학생의 작업 부하 → 0: AI가 초안을 만들고 학생은 30초 검토만
 * - 운영진 통제력 극대화: 모든 초안은 Draft에 구조화되어 저장
 * - 투명성: 원본 메시지 수, 요약 근거를 함께 저장
 *
 * content 필드는 DraftReviewClient가 기대하는 ParsedContent JSON 형식으로 저장됨:
 * {summary, tasks[], nextPlan, teamStatus, teamStatusReason, confidence{}}
 */

import { chatModel } from '@/src/lib/ai/gemini-client'
import type { DiscordMessage } from './client'

export interface GhostwriterResult {
  title: string
  /** JSON string — DraftReviewClient의 ParsedContent 형식 */
  content: string
  updateType: 'ideation' | 'design' | 'development' | 'launch' | 'general'
  sourceMessageCount: number
}

/**
 * generateWeeklyDraft에 전달할 부가 데이터.
 * 하네스 엔지니어링으로 수집한 구조화된 정보를 AI 컨텍스트에 포함시킨다.
 */
export interface HarnessContext {
  /** 📌 핀 메시지 — 중요 결정사항 */
  pinnedMessages?: DiscordMessage[]
  /** 포럼 #주간-체크인 스레드에서 수집한 구조화된 체크인 */
  checkinMessages?: DiscordMessage[]
  /** 채널 이름 (AI가 맥락 파악에 활용) */
  channelName?: string
}

/**
 * Discord 메시지 목록을 전처리한다.
 * - 봇 메시지 제거
 * - 빈 메시지(임베드/첨부만 있는 것) 제거
 * - 시간순 정렬
 * - 대화 형태로 포맷
 */
function preprocessMessages(messages: DiscordMessage[]): {
  formatted: string
  count: number
  members: string[]
} {
  const humanMessages = messages
    // TODO: 테스트 후 봇 필터 복원 → !m.author.bot &&
    .filter((m) => m.content.trim().length > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  if (humanMessages.length === 0) {
    return { formatted: '', count: 0, members: [] }
  }

  // 참여 멤버 목록 추출 (중복 제거)
  const memberSet = new Set<string>()
  const formatted = humanMessages
    .map((m) => {
      const date = new Date(m.timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      })
      const name = m.author.global_name || m.author.username
      memberSet.add(name)
      const attachmentNote =
        m.attachments.length > 0
          ? ` [첨부파일: ${m.attachments.map((a) => a.filename).join(', ')}]`
          : ''
      return `[${date}] ${name}: ${m.content}${attachmentNote}`
    })
    .join('\n')

  return { formatted, count: humanMessages.length, members: [...memberSet] }
}

/**
 * 주간-체크인 포럼 메시지에서 구조화된 체크인 항목을 추출한다.
 * ✅/🔧/🚧 이모지 태그로 시작하는 줄을 파싱하여 AI가 더 정확하게 작업을 추출할 수 있게 함.
 *
 * 예시 입력:
 *   ✅ 이번 주 할 일: API 연동
 *   🔧 진행 중: 디자인 시안
 *   🚧 블로커: 백엔드 API 미완성
 */
function parseCheckins(messages: DiscordMessage[]): string {
  if (!messages || messages.length === 0) return ''

  const lines: string[] = []
  for (const m of messages) {
    if (!m.content.trim()) continue
    const name = m.author.global_name || m.author.username
    const date = new Date(m.timestamp).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })

    // 이모지 태그별 파싱
    const todoMatch = m.content.match(/✅\s*(?:이번\s*주\s*할\s*일\s*[:：]?\s*)([\s\S]*?)(?=🔧|🚧|$)/i)
    const wipMatch = m.content.match(/🔧\s*(?:진행\s*중\s*[:：]?\s*)([\s\S]*?)(?=✅|🚧|$)/i)
    const blockerMatch = m.content.match(/🚧\s*(?:블로커\s*[:：]?\s*)([\s\S]*?)(?=✅|🔧|$)/i)

    if (todoMatch || wipMatch || blockerMatch) {
      // 구조화된 체크인
      lines.push(`[${date}] ${name}:`)
      if (todoMatch) lines.push(`  할 일: ${todoMatch[1].trim()}`)
      if (wipMatch) lines.push(`  진행 중: ${wipMatch[1].trim()}`)
      if (blockerMatch) lines.push(`  블로커: ${blockerMatch[1].trim()}`)
    } else {
      // 양식 없이 자유롭게 작성된 체크인
      lines.push(`[${date}] ${name}: ${m.content.trim()}`)
    }
  }

  return lines.join('\n')
}

/**
 * 핀 메시지를 AI 컨텍스트용 텍스트로 변환한다.
 * 📌 핀 = 팀에서 "중요 결정"으로 표시한 메시지.
 */
function formatPinnedMessages(messages: DiscordMessage[]): string {
  if (!messages || messages.length === 0) return ''

  return messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => {
      const name = m.author.global_name || m.author.username
      const date = new Date(m.timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })
      return `[${date}] ${name}: ${m.content.trim()}`
    })
    .join('\n')
}

/**
 * DraftReviewClient가 기대하는 구조화된 JSON을 AI에게 직접 요청한다.
 * summary/tasks/nextPlan/teamStatus/confidence 5개 섹션으로 분리.
 */
const SYSTEM_PROMPT = `당신은 대학 창업동아리 팀의 주간 업데이트를 작성하는 AI 도우미입니다.
팀원들이 Discord에서 나눈 대화를 분석하여 구조화된 주간 업데이트를 만듭니다.

## 규칙

1. **summary** (이번 주 요약): 3~4문장으로 핵심 활동을 요약합니다.
2. **tasks** (완료/진행 중 작업): 대화에서 언급된 작업을 항목별로 추출합니다.
   - done=true: 완료된 작업, done=false: 진행 중인 작업
   - member: 해당 작업을 언급한 팀원 이름 (대화에서 특정 가능할 때만)
3. **nextPlan** (다음 주 계획): 대화에서 다음에 할 일로 언급된 내용을 정리합니다.
4. **teamStatus**: 대화 톤과 진행 상황으로 팀 상태를 판단합니다.
   - good: 순조로움 (작업 진행이 원활하고 블로커 없음)
   - normal: 보통 (일부 지연이나 논의 필요한 사항 있음)
   - hard: 어려움 (명확한 블로커, 갈등, 일정 지연 언급)
5. **confidence**: 각 섹션의 AI 추출 신뢰도를 판단합니다.
   - high: 대화에서 직접 언급된 내용 (거의 확실)
   - mid: 맥락에서 추론한 내용 (합리적 추론)
   - low: 정보가 부족하여 추측에 가까운 내용
6. **톤**: 합쇼체("-습니다/-입니다") 사용
7. **잡담/사적 대화는 무시**: 프로젝트 관련 내용만 추출
8. **과장 금지**: 대화에 없는 내용을 지어내지 말 것. 불확실하면 confidence를 low로 설정
9. **구조화된 체크인 우선**: "주간 체크인" 섹션이 있으면 tasks 추출의 1순위 소스로 사용. ✅=할 일, 🔧=진행 중(done=false), 🚧=블로커(done=false, 별도 표기)
10. **핀 메시지(결정사항)**: "주요 결정사항" 섹션이 있으면 summary에 반드시 반영하고 confidence를 high로 설정

## 출력 형식 (JSON)

\`\`\`json
{
  "title": "이번 주 가장 중요한 성과 한 줄 (30자 이내)",
  "updateType": "ideation|design|development|launch|general",
  "summary": "이번 주 활동 요약 (3~4문장, 합쇼체)",
  "tasks": [
    {"text": "작업 내용", "done": true, "member": "팀원명"},
    {"text": "진행 중인 작업", "done": false, "member": "팀원명"}
  ],
  "nextPlan": "다음 주 계획 (2~3문장, 합쇼체)",
  "teamStatus": "good|normal|hard",
  "teamStatusReason": "팀 상태 판단 근거 (1문장)",
  "confidence": {
    "summary": "high|mid|low",
    "tasks": "high|mid|low",
    "nextPlan": "high|mid|low",
    "teamStatus": "high|mid|low"
  }
}
\`\`\`

JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`

/**
 * Discord 메시지로부터 주간 업데이트 초안을 생성한다.
 *
 * 메시지가 3개 미만이면 의미 있는 요약이 어려우므로 null을 반환.
 * (활동이 거의 없는 팀 → 리마인드 대상)
 */
export async function generateWeeklyDraft(
  messages: DiscordMessage[],
  projectTitle: string,
  harness?: HarnessContext
): Promise<GhostwriterResult | null> {
  const { formatted, count, members } = preprocessMessages(messages)

  // 체크인/핀 메시지도 카운트에 포함하여 최소 기준 판단
  const checkinText = parseCheckins(harness?.checkinMessages ?? [])
  const pinnedText = formatPinnedMessages(harness?.pinnedMessages ?? [])
  const totalSignals = count + (checkinText ? 1 : 0) + (pinnedText ? 1 : 0)

  // 메시지가 너무 적으면 요약 불가
  if (totalSignals < 3) return null

  // 하네스 컨텍스트로 풍부한 프롬프트 구성
  const sections: string[] = [
    `## 프로젝트: ${projectTitle}`,
    `## 참여 멤버: ${members.join(', ')}`,
  ]

  if (checkinText) {
    sections.push(`## 주간 체크인 (구조화된 입력 — tasks 추출 1순위)\n\n${checkinText}`)
  }

  if (pinnedText) {
    sections.push(`## 주요 결정사항 (📌 핀 메시지)\n\n${pinnedText}`)
  }

  sections.push(`## 이번 주 Discord 대화 (${count}개 메시지)\n\n${formatted}`)
  sections.push('위 정보를 바탕으로 주간 업데이트를 작성해주세요.')

  const prompt = sections.join('\n\n')

  const result = await chatModel.generateContent({
    contents: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: '네, 구조화된 주간 업데이트를 JSON으로 작성하겠습니다.' }] },
      { role: 'user', parts: [{ text: prompt }] },
    ],
  })

  const text = result.response.text()

  try {
    // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) throw new Error('JSON 파싱 실패')

    const parsed = JSON.parse(jsonMatch[1]) as {
      title: string
      updateType: string
      summary: string
      tasks: { text: string; done: boolean; member?: string }[]
      nextPlan: string
      teamStatus: string
      teamStatusReason: string
      confidence: Record<string, string>
    }

    const validTypes = ['ideation', 'design', 'development', 'launch', 'general'] as const
    const updateType = validTypes.includes(parsed.updateType as (typeof validTypes)[number])
      ? (parsed.updateType as (typeof validTypes)[number])
      : 'general'

    // content는 DraftReviewClient의 ParsedContent 형식 JSON으로 저장
    const structuredContent = JSON.stringify({
      summary: parsed.summary || '',
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      nextPlan: parsed.nextPlan || '',
      teamStatus: parsed.teamStatus || 'good',
      teamStatusReason: parsed.teamStatusReason || '',
      confidence: parsed.confidence || {
        summary: 'mid',
        tasks: 'mid',
        nextPlan: 'mid',
        teamStatus: 'mid',
      },
    })

    return {
      title: parsed.title || `${projectTitle} 주간 업데이트`,
      content: structuredContent,
      updateType,
      sourceMessageCount: count,
    }
  } catch (error) {
    console.error('[ghostwriter] AI 응답 파싱 실패', { text, error })
    return null
  }
}
