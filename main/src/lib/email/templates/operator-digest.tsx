import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { emailTokens, emailStyles } from './_layout'

const t = emailTokens

interface DigestTeam {
  title: string
  status: 'missing' | 'overdue'
  days_since: number | null
}

interface DigestDecision {
  topic: string
  decided_at: string | null
}

export interface OperatorDigestProps {
  clubName: string
  operatorName: string
  weekRange: string
  submissionRate: number
  totalTeams: number
  pendingTeams: DigestTeam[]
  recentDecisions: DigestDecision[]
  topContributor: { nickname: string; updates: number } | null
  dashboardUrl: string
}

function DigestEmail({
  clubName,
  operatorName,
  weekRange,
  submissionRate,
  totalTeams,
  pendingTeams,
  recentDecisions,
  topContributor,
  dashboardUrl,
}: OperatorDigestProps) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <title>{clubName} 주간 운영 다이제스트</title>
      </head>
      <body style={emailStyles.outer}>
        <div style={emailStyles.container}>
          {/* Header */}
          <div style={{ padding: '32px 32px 20px', borderBottom: `1px solid ${t.border}` }}>
            <p style={{ margin: 0, fontSize: 12, color: t.textMuted, fontWeight: 600 }}>
              {clubName} · 운영 다이제스트
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 22, color: t.primary, fontWeight: 800 }}>
              {operatorName}님, 지난주 요약입니다
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: t.textMuted }}>{weekRange}</p>
          </div>

          {/* 핵심 지표 */}
          <div style={{ padding: '24px 32px', display: 'block' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
              <div style={{ flex: 1, minWidth: 140, padding: 16, backgroundColor: t.bgSoft, borderRadius: 12, border: `1px solid ${t.border}` }}>
                <p style={{ margin: 0, fontSize: 11, color: t.textMuted }}>이번 주 제출률</p>
                <p style={{
                  margin: '4px 0 0',
                  fontSize: 28,
                  fontWeight: 800,
                  color: submissionRate >= 70 ? '#16a34a' : submissionRate >= 40 ? t.primary : t.danger,
                }}>
                  {submissionRate}%
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: t.textMuted }}>
                  {totalTeams}팀 중
                </p>
              </div>
              <div style={{ flex: 1, minWidth: 140, padding: 16, backgroundColor: t.bgSoft, borderRadius: 12, border: `1px solid ${t.border}` }}>
                <p style={{ margin: 0, fontSize: 11, color: t.textMuted }}>미제출</p>
                <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: pendingTeams.length > 0 ? t.danger : '#16a34a' }}>
                  {pendingTeams.length}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: t.textMuted }}>팀</p>
              </div>
            </div>

            {/* 미제출 팀 리스트 */}
            {pendingTeams.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.primary }}>
                  리마인드가 필요한 팀
                </p>
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' as const }}>
                  {pendingTeams.map((team, i) => (
                    <li key={i} style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      color: t.textBody,
                      backgroundColor: t.bgSoft,
                      borderRadius: 8,
                      marginBottom: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <span>{team.title}</span>
                      <span style={{ color: team.status === 'overdue' ? t.danger : t.textMuted, fontSize: 11 }}>
                        {team.days_since !== null ? `${team.days_since}일 경과` : '아직 업데이트 없음'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 최근 의사결정 */}
            {recentDecisions.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.primary }}>
                  기록된 의사결정
                </p>
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' as const }}>
                  {recentDecisions.slice(0, 5).map((d, i) => (
                    <li key={i} style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      color: t.textBody,
                      backgroundColor: t.bgSoft,
                      borderRadius: 8,
                      marginBottom: 4,
                    }}>
                      {d.topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 이번 주 MVP */}
            {topContributor && (
              <div style={{ marginTop: 24, padding: 16, backgroundColor: '#eff6ff', borderRadius: 12, border: `1px solid #bfdbfe` }}>
                <p style={{ margin: 0, fontSize: 12, color: t.accent, fontWeight: 700 }}>이번 주 MVP</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: t.primary }}>
                  <strong>{topContributor.nickname}</strong>님이 업데이트 {topContributor.updates}건 작성
                </p>
              </div>
            )}

            {/* CTA */}
            <div style={{ marginTop: 32, textAlign: 'center' as const }}>
              <a
                href={dashboardUrl}
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  backgroundColor: t.primary,
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                운영 대시보드 열기
              </a>
            </div>
          </div>

          <div style={{ padding: '20px 32px', textAlign: 'center' as const, borderTop: `1px solid ${t.border}`, backgroundColor: t.bgSoft }}>
            <p style={{ margin: 0, fontSize: 11, color: t.textMuted }}>
              이 메일은 Draft 운영진에게 매주 월요일 발송됩니다
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

export function renderOperatorDigestEmail(props: OperatorDigestProps): string {
  return '<!DOCTYPE html>' + renderToStaticMarkup(<DigestEmail {...props} />)
}
