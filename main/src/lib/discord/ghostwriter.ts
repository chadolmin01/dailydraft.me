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
 *
 * 2026-04-25: Vercel AI SDK 로 이관.
 * - generateObject + Zod schema 로 JSON 파싱·검증 로직 제거
 * - 멀티모달도 동일 인터페이스(messages content parts)로 통일
 * - 텍스트/이미지 분기 로직이 단일 호출로 축소됨
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { DiscordMessage } from './client'

/** 이미지 첨부파일의 최대 처리 개수 — 비용/속도 트레이드오프 */
const MAX_IMAGE_ATTACHMENTS = 10
/** 이미지 다운로드 타임아웃 (ms) */
const IMAGE_FETCH_TIMEOUT = 5_000
/** 허용할 이미지 MIME 타입 */
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

// 기존 GEMINI_API_KEY 환경변수 재사용. AI SDK 의 google provider 가 이 키로 인증.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// generateObject 가 강제할 출력 스키마.
// 기존 수동 JSON 파싱 + 타입 단언 + 검증 코드를 한 번에 대체.
const GhostwriterDraftSchema = z.object({
  title: z.string().describe('이번 주 가장 중요한 성과 한 줄 (30자 이내)'),
  updateType: z.enum(['ideation', 'design', 'development', 'launch', 'general']),
  summary: z.string().describe('이번 주 활동 요약 (3~4문장)'),
  tasks: z.array(z.object({
    text: z.string(),
    done: z.boolean(),
    member: z.string().optional(),
  })).describe('완료/진행 중 작업 목록'),
  nextPlan: z.string().describe('다음 주 계획 (2~3문장)'),
  teamStatus: z.enum(['good', 'normal', 'hard']),
  teamStatusReason: z.string().describe('팀 상태 판단 근거 (1문장)'),
  confidence: z.object({
    summary: z.enum(['high', 'mid', 'low']),
    tasks: z.enum(['high', 'mid', 'low']),
    nextPlan: z.enum(['high', 'mid', 'low']),
    teamStatus: z.enum(['high', 'mid', 'low']),
  }),
})

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
  /** 이전 주 초안에 대한 피드백 — AI 품질 개선 루프 */
  previousFeedback?: {
    weekNumber: number
    score: number  // 1~5
    note: string   // "작업 추출이 부정확함" 등
  }[]
  /** /마무리 회의록 — tasks, decisions, resources (최우선 소스) */
  meetingRecords?: {
    tasks: { assignee_name: string; task_description: string; deadline: string | null; status: string }[]
    decisions: { topic: string; result: string }[]
    resources: { url: string; label: string; shared_by_name: string }[]
  }
  /** 클럽 Ghostwriter 설정 (동아리장 커스텀) */
  settings?: {
    ai_tone?: 'formal' | 'casual' | 'english'
    min_messages?: number
    custom_prompt_hint?: string | null
  }
  /** GitHub 활동 데이터 (github_events 테이블에서 수집) */
  githubActivity?: {
    /** webhook으로 저장된 커밋 활동 목록 */
    activities: { who: string; what: string; when: Date }[]
    /** AI가 생성한 push별 요약 (있는 경우만) */
    summaries: string[]
    /** 이번 주 총 커밋 수 */
    commitCount: number
  }
}

/**
 * Discord 메시지 목록을 전처리한다.
 * - 봇 메시지 제거
 * - 텍스트 또는 첨부파일이 있는 메시지만 포함 (이미지만 올린 디자이너 메시지도 포함)
 * - 시간순 정렬
 * - 대화 형태로 포맷
 */
function preprocessMessages(messages: DiscordMessage[]): {
  formatted: string
  count: number
  members: string[]
} {
  const humanMessages = messages
    // 봇 제외, 텍스트 또는 첨부파일 중 하나라도 있으면 포함
    .filter((m) => !m.author.bot && (m.content.trim().length > 0 || m.attachments.length > 0))
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

      // 첨부파일 정보를 AI가 이해할 수 있는 형태로 포맷
      const attachmentNote =
        m.attachments.length > 0
          ? ` [첨부: ${m.attachments.map((a) => describeAttachment(a.filename)).join(', ')}]`
          : ''

      // 텍스트 없이 첨부만 있는 경우 (디자이너가 스크린샷만 올린 경우)
      const content = m.content.trim() || '(첨부파일 공유)'

      return `[${date}] ${name}: ${content}${attachmentNote}`
    })
    .join('\n')

  return { formatted, count: humanMessages.length, members: [...memberSet] }
}

/**
 * Discord 메시지에서 이미지 첨부파일을 수집한다.
 * 디자이너 시안, 스크린샷 등을 AI에게 시각적으로 전달하기 위함.
 * 비용 제어를 위해 최대 MAX_IMAGE_ATTACHMENTS개까지만 처리.
 */
function collectImageAttachments(
  messages: DiscordMessage[]
): { url: string; filename: string; mimeType: string; author: string }[] {
  const images: { url: string; filename: string; mimeType: string; author: string }[] = []

  for (const m of messages) {
    if (images.length >= MAX_IMAGE_ATTACHMENTS) break
    for (const att of m.attachments) {
      if (images.length >= MAX_IMAGE_ATTACHMENTS) break

      // content_type이 있으면 그걸 사용, 없으면 확장자로 추론
      const ext = att.filename.split('.').pop()?.toLowerCase() || ''
      const mimeFromExt: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        webp: 'image/webp', gif: 'image/gif',
      }
      const mimeType = att.content_type || mimeFromExt[ext] || ''

      if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
        images.push({
          url: att.url,
          filename: att.filename,
          mimeType,
          author: m.author.global_name || m.author.username,
        })
      }
    }
  }

  return images
}

/**
 * Discord CDN에서 이미지를 다운로드하여 base64로 변환한다.
 * 실패 시 null 반환 — 개별 이미지 실패가 전체 초안 생성을 막지 않도록.
 */
async function downloadImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT),
    })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || 'image/png'
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return { base64, mimeType: contentType.split(';')[0] }
  } catch {
    return null
  }
}

/** 파일 확장자로 첨부파일 유형을 추론하여 AI에게 맥락 제공 */
function describeAttachment(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
  const docExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx']
  const designExts = ['fig', 'sketch', 'xd', 'ai', 'psd']

  if (imageExts.includes(ext)) return `${filename} (이미지/스크린샷)`
  if (designExts.includes(ext)) return `${filename} (디자인 파일)`
  if (docExts.includes(ext)) return `${filename} (문서)`
  return filename
}

/**
 * 주간-체크인 포럼 메시지에서 구조화된 체크인 항목을 추출한다.
 * ✅/🔧/🚧 이모지 태그로 시작하는 줄을 파싱하여 AI가 더 정확하게 작업을 추출할 수 있게 함.
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

    const todoMatch = m.content.match(/✅\s*(?:이번\s*주\s*할\s*일\s*[:：]?\s*)([\s\S]*?)(?=🔧|🚧|$)/i)
    const wipMatch = m.content.match(/🔧\s*(?:진행\s*중\s*[:：]?\s*)([\s\S]*?)(?=✅|🚧|$)/i)
    const blockerMatch = m.content.match(/🚧\s*(?:블로커\s*[:：]?\s*)([\s\S]*?)(?=✅|🔧|$)/i)

    if (todoMatch || wipMatch || blockerMatch) {
      lines.push(`[${date}] ${name}:`)
      if (todoMatch) lines.push(`  할 일: ${todoMatch[1].trim()}`)
      if (wipMatch) lines.push(`  진행 중: ${wipMatch[1].trim()}`)
      if (blockerMatch) lines.push(`  블로커: ${blockerMatch[1].trim()}`)
    } else {
      lines.push(`[${date}] ${name}: ${m.content.trim()}`)
    }
  }

  return lines.join('\n')
}

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

/** AI 톤별 프롬프트 규칙 */
const TONE_RULES: Record<string, string> = {
  formal: '6. **톤**: 합쇼체("-습니다/-입니다") 사용',
  casual: '6. **톤**: 반말 금지. 부드러운 합쇼체("-습니다/-입니다") 사용. 친근하지만 전문적으로',
  english: '6. **Tone**: Write in English. Professional but approachable',
}

function buildSystemPrompt(aiTone: string = 'formal', customHint?: string | null): string {
  const tone = TONE_RULES[aiTone] || TONE_RULES.formal

  const customLine = customHint
    ? `\n14. **동아리장 추가 지시**: ${customHint}`
    : ''

  return `당신은 대학 창업동아리 팀의 주간 업데이트를 작성하는 AI 도우미입니다.
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
${tone}
7. **잡담/사적 대화는 무시**: 프로젝트 관련 내용만 추출
8. **과장 금지**: 대화에 없는 내용을 지어내지 말 것. 불확실하면 confidence를 low로 설정
9. **회의록 최우선**: "회의록 (/마무리)" 섹션이 있으면 tasks/decisions 추출의 최우선 소스로 사용. 회의록의 할 일은 그대로 tasks에 반영하고, 결정사항은 summary에 반드시 포함. 회의록과 대화 내용이 충돌하면 회의록을 우선
9-b. **구조화된 체크인**: "주간 체크인" 섹션이 있으면 회의록 다음 우선순위. ✅=할 일, 🔧=진행 중(done=false), 🚧=블로커(done=false, 별도 표기)
10. **핀 메시지(결정사항)**: "주요 결정사항" 섹션이 있으면 summary에 반드시 반영하고 confidence를 high로 설정
11. **이전 피드백 반영**: "이전 초안 피드백" 섹션이 있으면 해당 피드백을 반드시 반영하여 같은 실수를 반복하지 않을 것
12. **디자인 작업 인식**: 이미지/스크린샷 첨부, Figma 링크(figma.com), 디자인 파일(.fig, .sketch, .psd) 공유는 디자인 작업의 증거임. "(첨부파일 공유)"로 표시된 메시지도 무시하지 말 것. 파일명에서 작업 내용을 추론할 것 (예: "main-page-v2.png" → 메인 페이지 시안 v2 작업)
13. **이미지 분석**: 첨부된 이미지가 있으면 시각적 내용을 분석하여 tasks에 반영할 것. 예: UI 시안 이미지 → "메인 페이지 카드 레이아웃 시안 작업", 와이어프레임 → "온보딩 플로우 와이어프레임 작성". 이미지 내용에서 파악 가능한 구체적 디자인 요소(색상, 레이아웃, 컴포넌트 등)를 summary에 언급할 것
14. **GitHub 활동 반영**: "GitHub 활동" 섹션이 있으면 커밋 메시지와 AI 요약을 분석하여 tasks(done=true)와 summary에 반영할 것. 커밋 메시지에서 구체적인 기능/수정 내용을 추출하고, Discord 대화와 교차 검증하여 정확도를 높일 것. GitHub 데이터는 confidence를 high로 설정${customLine}

출력은 schema 에 맞는 JSON 객체로만. 다른 텍스트 없이.`
}

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
  const mr = harness?.meetingRecords
  const hasMeetingRecords = mr && (mr.tasks.length > 0 || mr.decisions.length > 0 || mr.resources.length > 0)
  const hasGitHubActivity = (harness?.githubActivity?.commitCount ?? 0) > 0
  const totalSignals = count + (checkinText ? 1 : 0) + (pinnedText ? 1 : 0) + (hasMeetingRecords ? 3 : 0) + (hasGitHubActivity ? 2 : 0)

  const minRequired = Math.max(harness?.settings?.min_messages ?? 3, 1)
  if (totalSignals < minRequired) return null

  // 하네스 컨텍스트로 풍부한 프롬프트 구성
  const sections: string[] = [
    `## 프로젝트: ${projectTitle}`,
    ...(harness?.channelName ? [`## Discord 채널: #${harness.channelName}`] : []),
    `## 참여 멤버: ${members.join(', ')}`,
  ]

  if (hasMeetingRecords) {
    const mrLines: string[] = []
    if (mr.tasks.length > 0) {
      mrLines.push('**할 일:**')
      mr.tasks.forEach(t => {
        const deadline = t.deadline ? ` (마감: ${t.deadline})` : ''
        const status = t.status === 'done' ? '✅' : '⬜'
        mrLines.push(`${status} ${t.assignee_name} — ${t.task_description}${deadline}`)
      })
    }
    if (mr.decisions.length > 0) {
      mrLines.push('\n**결정사항:**')
      mr.decisions.forEach(d => mrLines.push(`• ${d.topic}: ${d.result}`))
    }
    if (mr.resources.length > 0) {
      mrLines.push('\n**공유 자료:**')
      mr.resources.forEach(r => mrLines.push(`• ${r.label} (${r.shared_by_name}) — ${r.url}`))
    }
    sections.push(`## 회의록 (/마무리 — 최우선 소스, 이 내용을 tasks/decisions 추출의 기준으로 사용)\n\n${mrLines.join('\n')}`)
  }

  if (checkinText) {
    sections.push(`## 주간 체크인 (구조화된 입력 — 회의록 다음 우선순위)\n\n${checkinText}`)
  }

  if (pinnedText) {
    sections.push(`## 주요 결정사항 (📌 핀 메시지)\n\n${pinnedText}`)
  }

  if (harness?.previousFeedback && harness.previousFeedback.length > 0) {
    const fbLines = harness.previousFeedback.map((fb) =>
      `- ${fb.weekNumber}주차 (${fb.score}/5): ${fb.note}`
    )
    sections.push(
      `## 이전 초안 피드백 (이 점을 개선해주세요)\n\n${fbLines.join('\n')}`
    )
  }

  const gh = harness?.githubActivity
  if (gh && (gh.commitCount > 0 || gh.summaries.length > 0)) {
    const ghLines: string[] = []

    if (gh.commitCount > 0) {
      ghLines.push(`이번 주 총 ${gh.commitCount}건의 커밋이 push되었습니다.`)
    }

    if (gh.summaries.length > 0) {
      ghLines.push('')
      ghLines.push('**브랜치별 변경사항 요약:**')
      gh.summaries.forEach(s => ghLines.push(`- ${s}`))
    }

    if (gh.activities.length > 0) {
      ghLines.push('')
      ghLines.push('**주요 커밋:**')
      gh.activities.slice(0, 15).forEach(a => {
        const date = a.when.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
        ghLines.push(`- [${date}] ${a.who}: ${a.what}`)
      })
      if (gh.activities.length > 15) {
        ghLines.push(`- ... 외 ${gh.activities.length - 15}건`)
      }
    }

    sections.push(`## GitHub 활동 (webhook 데이터)\n\n${ghLines.join('\n')}`)
  }

  sections.push(`## 이번 주 Discord 대화 (${count}개 메시지)\n\n${formatted}`)
  sections.push('위 정보를 바탕으로 주간 업데이트를 작성해주세요.')

  const prompt = sections.join('\n\n')

  const systemPrompt = buildSystemPrompt(
    harness?.settings?.ai_tone,
    harness?.settings?.custom_prompt_hint
  )

  // 이미지 첨부파일 수집 — 디자이너 시안/스크린샷을 AI 에게 시각적으로 전달
  const imageAttachments = collectImageAttachments(messages)

  // AI SDK content parts 로 멀티모달 메시지 구성.
  // 텍스트 + 이미지를 한 번의 호출로 처리 — 기존 분기 로직 (텍스트 전용 / 멀티모달 / 이미지 다운 실패)
  // 이 단일 path 로 통합됨.
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: string }
  > = [{ type: 'text', text: prompt }]

  if (imageAttachments.length > 0) {
    const downloadResults = await Promise.allSettled(
      imageAttachments.map((img) => downloadImageAsBase64(img.url))
    )

    const imageDescriptions: string[] = []
    for (let i = 0; i < downloadResults.length; i++) {
      const result = downloadResults[i]
      const meta = imageAttachments[i]
      if (result.status === 'fulfilled' && result.value) {
        const dataUrl = `data:${result.value.mimeType};base64,${result.value.base64}`
        userContent.push({ type: 'image', image: dataUrl })
        imageDescriptions.push(`${meta.filename} (by ${meta.author})`)
      }
    }

    if (imageDescriptions.length > 0) {
      userContent.push({
        type: 'text',
        text: `\n\n## 첨부 이미지 (${imageDescriptions.length}개)\n아래 이미지는 팀원들이 Discord에 공유한 디자인 시안/스크린샷입니다.\n각 이미지의 내용을 분석하여 tasks와 summary에 반영해주세요.\n파일: ${imageDescriptions.join(', ')}`,
      })
    }
  }

  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-flash-lite'),
      schema: GhostwriterDraftSchema,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    // content는 DraftReviewClient의 ParsedContent 형식 JSON으로 저장
    const structuredContent = JSON.stringify({
      summary: object.summary,
      tasks: object.tasks,
      nextPlan: object.nextPlan,
      teamStatus: object.teamStatus,
      teamStatusReason: object.teamStatusReason,
      confidence: object.confidence,
    })

    return {
      title: object.title || `${projectTitle} 주간 업데이트`,
      content: structuredContent,
      updateType: object.updateType,
      sourceMessageCount: count,
    }
  } catch (error) {
    console.error('[ghostwriter] AI 응답 생성 실패', { error })
    return null
  }
}
