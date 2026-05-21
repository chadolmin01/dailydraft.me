/**
 * 새 멤버 가입 시 Discord DM 온보딩 안내
 *
 * 초대코드 클레임 성공 후 호출.
 * 역할(개발/디자인/기획)에 따라 맞춤 안내를 보낸다.
 */

import { sendDirectMessage } from './client'

type MemberRole = 'developer' | 'designer' | 'planner' | string

const ROLE_GUIDES: Record<string, string> = {
  developer: `💻 **개발자 가이드**
• **#주간-체크인** — 매주 월요일 자동 스레드에 이번 주 계획 작성
• **#질문-답변** — 기술 질문은 여기에 (스레드로 답변)
• **#디자인-리뷰** — 구현한 화면 피드백 요청할 때 활용
• 리액션: ✅완료 👀리뷰중 🚀배포`,

  designer: `🎨 **디자이너 가이드**
• **#디자인-리뷰** — Figma 링크 + 스크린샷과 함께 포스트 올리기
• **#주간-체크인** — 이번 주 디자인 작업 상황 공유
• 피드백은 Discord에서 논의 → Figma 코멘트로 상세 전달
• 리액션: 🎨시안 👀리뷰요청 ✅확정 🔄수정필요`,

  planner: `📊 **기획/비즈니스 가이드**
• **#기획-비즈니스** — 시장조사, 사업계획, 인터뷰 정리 공유
• **#주간-체크인** — 이번 주 기획 업무 상황 공유
• 노션/드라이브 링크를 Discord에 공유하면 AI가 맥락을 파악합니다
• "블로커" = 혼자서 해결 안 되는 막힌 것, "핸드오프" = 다음 사람에게 넘기기`,
}

/**
 * 새 멤버에게 온보딩 DM을 발송한다.
 * Discord user ID가 없으면 스킵 (Draft 앱 내 알림으로 대체).
 */
export async function sendOnboardingDM(
  discordUserId: string,
  memberName: string,
  clubName: string,
  role?: MemberRole
): Promise<void> {
  const roleGuide = ROLE_GUIDES[role || ''] || ROLE_GUIDES.developer

  const message = [
    `**${clubName}에 오신 것을 환영합니다!** 🎉`,
    '',
    `안녕하세요, ${memberName}님!`,
    '',
    '**📌 먼저 해야 할 것**',
    '1. **#시작하기** 채널을 읽어주세요 (전체 가이드)',
    '2. **#자기소개**에 간단한 자기소개를 남겨주세요',
    '3. 매주 월요일 **#주간-체크인**에 이번 주 계획을 공유해주세요',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    roleGuide,
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '**🤖 Draft 봇이 하는 일**',
    '• 매주 일요일: 팀 대화를 AI가 요약 → 팀장에게 초안 승인 요청',
    '• 매주 금요일: 체크인 미작성 시 리마인더 DM',
    '• 여러분은 평소처럼 Discord에서 대화하면 됩니다!',
    '',
    '> 궁금한 점은 **#질문-답변** 채널에 자유롭게 올려주세요.',
  ].join('\n')

  try {
    await sendDirectMessage(discordUserId, message)
  } catch (error) {
    console.error('[onboarding] DM 발송 실패', { discordUserId, error })
  }
}
