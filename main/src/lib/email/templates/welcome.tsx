import * as React from 'react'
import { EmailLayout, emailStyles, renderEmail } from './_layout'

/**
 * Welcome email — 가입 직후 또는 온보딩 완료 직후 1회.
 *
 * 목적:
 *   - 첫 3단계 안내 (프로필·클럽·Discord)
 *   - 도움 채널 선제적 공유 (team@dailydraft.me, /help)
 *   - 학교 이메일로 가입한 경우 재학생 인증 자동 부여 안내
 *
 * 이 템플릿은 일회성이므로 수신 거부 옵션 없음 (트랜잭셔널). 이후 발송되는
 * 주간 다이제스트엔 unsubscribe 링크 포함.
 */

interface WelcomeEmailProps {
  recipientName: string
  appUrl: string
  isVerifiedStudent?: boolean
  /** 가입 시 학교 도메인 인식되면 표시 */
  universityName?: string | null
}

export function WelcomeEmail({
  recipientName,
  appUrl,
  isVerifiedStudent,
  universityName,
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      eyebrow="환영 메시지"
      footerNote="이 메일은 가입 안내 목적의 트랜잭셔널 메일입니다. 주간 다이제스트는 별도로 수신 설정이 가능합니다."
    >
      <h1 style={emailStyles.heading}>
        {recipientName}님, Draft 에 오신 걸 환영합니다.
      </h1>

      <p style={emailStyles.text}>
        지금까지 단체 카톡방·Notion·Discord 여기저기 흩어져 있던 동아리 운영 기록을 한 곳에 모아두는 자리입니다. 복잡한 셋업 없이 바로 쓸 수 있게 만들어두었습니다.
      </p>

      {isVerifiedStudent && universityName && (
        <div style={emailStyles.card}>
          <p style={emailStyles.cardLabel}>재학생 인증 완료</p>
          <p style={{ ...emailStyles.text, margin: 0, fontSize: '14px' }}>
            {universityName} 도메인 이메일로 가입하셨기에 재학생 배지가 자동 부여되었습니다. 소속 학교 기반 탐색·추천이 바로 활성화됩니다.
          </p>
        </div>
      )}

      <p style={{ ...emailStyles.text, fontWeight: 600, color: '#111827' }}>
        처음이시면 다음 세 가지만 해두시면 됩니다.
      </p>

      <div style={emailStyles.card}>
        <p style={emailStyles.cardLabel}>1 · 프로필 채우기</p>
        <p style={{ ...emailStyles.text, margin: 0, fontSize: '14px' }}>
          소속·역할·관심 분야 간단히. 매칭·추천 품질이 바로 올라갑니다.
        </p>
      </div>

      <div style={emailStyles.card}>
        <p style={emailStyles.cardLabel}>2 · 동아리 만들기 또는 초대 코드 입력</p>
        <p style={{ ...emailStyles.text, margin: 0, fontSize: '14px' }}>
          회장·운영진이시면 새 클럽을 만드시면 되고, 이미 있는 동아리의 초대 코드를 받으셨다면 그걸로 바로 합류됩니다.
        </p>
      </div>

      <div style={emailStyles.card}>
        <p style={emailStyles.cardLabel}>3 · Discord 연결 (선택)</p>
        <p style={{ ...emailStyles.text, margin: 0, fontSize: '14px' }}>
          동아리 Discord 서버를 연결해두시면 다음 주부터 AI 가 주간 업데이트 초안을 자동으로 만들어드립니다. Discord 를 안 쓰셔도 주요 기능은 그대로 쓰실 수 있습니다.
        </p>
      </div>

      <div style={emailStyles.ctaWrap}>
        <a href={appUrl} style={emailStyles.cta}>지금 시작하기</a>
      </div>

      <p style={{ ...emailStyles.text, fontSize: '13px', color: '#6b7280' }}>
        혹시 막히시는 부분 있으시면 <a href={`${appUrl}/help`} style={{ color: '#2563eb' }}>자주 묻는 질문</a> 에서 먼저 확인하실 수 있고, 직접 연락 주시면 보통 72시간 이내에 답변드립니다.
      </p>

      <p style={{ ...emailStyles.text, fontSize: '13px', color: '#6b7280', margin: 0 }}>
        문의: <a href="mailto:team@dailydraft.me?subject=Onboarding" style={{ color: '#2563eb' }}>team@dailydraft.me</a>
      </p>
    </EmailLayout>
  )
}

export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  return renderEmail(<WelcomeEmail {...props} />)
}
