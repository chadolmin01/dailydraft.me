/**
 * 클럽 보고서 내보내기 API
 *
 * GET /api/clubs/[slug]/reports/export?format=csv&week=15
 * GET /api/clubs/[slug]/reports/export?format=pdf&week=15
 *
 * 주간 업데이트 데이터를 CSV 또는 PDF로 내보낸다.
 * 운영진(admin/owner)만 호출 가능.
 *
 * Query params:
 *   format: 'csv' | 'pdf' (필수)
 *   week: 특정 주차 (선택, 없으면 최근 4주)
 *   cohort: 기수 필터 (선택)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { getISOWeekNumber } from '@/src/lib/ghostwriter/week-utils'

export const runtime = 'nodejs'
export const maxDuration = 30

export const GET = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const format = searchParams.get('format')
    const weekParam = searchParams.get('week')
    const cohort = searchParams.get('cohort')

    if (!format || !['csv', 'pdf'].includes(format)) {
      return ApiResponse.badRequest('format 파라미터가 필요합니다 (csv 또는 pdf)')
    }

    // 1. 인증 + 권한 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data: club } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .maybeSingle()

    const role = (membership as { role?: string } | null)?.role
    if (!role || !['admin', 'owner'].includes(role)) {
      return ApiResponse.forbidden('운영진만 보고서를 내보낼 수 있습니다')
    }

    // 2. 클럽 소속 프로젝트 조회
    const admin = createAdminClient()

    let oppQuery = admin
      .from('opportunities')
      .select('id, title, status, cohort, creator_id')
      .eq('club_id', club.id)

    if (cohort) {
      oppQuery = oppQuery.eq('cohort', cohort)
    }

    const { data: opportunities } = await oppQuery
    if (!opportunities || opportunities.length === 0) {
      return ApiResponse.ok({ message: '내보낼 프로젝트가 없습니다' })
    }

    const oppIds = opportunities.map(o => o.id)
    const oppMap = new Map(opportunities.map(o => [o.id, o]))

    // 3. 주간 업데이트 조회
    let updateQuery = admin
      .from('project_updates')
      .select('id, opportunity_id, author_id, week_number, title, content, update_type, created_at')
      .in('opportunity_id', oppIds)
      .order('week_number', { ascending: false })
      .order('created_at', { ascending: false })

    if (weekParam) {
      updateQuery = updateQuery.eq('week_number', parseInt(weekParam))
    } else {
      // 최근 4주차
      const currentWeek = getISOWeekNumber(new Date())
      updateQuery = updateQuery.gte('week_number', currentWeek - 3)
    }

    const { data: updates } = await updateQuery

    // 4. 작성자 프로필 조회
    const authorIds = [...new Set((updates || []).map(u => u.author_id).filter(Boolean))]
    const profileMap = new Map<string, string>()
    if (authorIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('user_id, nickname')
        .in('user_id', authorIds)

      for (const p of profiles || []) {
        profileMap.set(p.user_id, (p as { nickname?: string }).nickname || '알 수 없음')
      }
    }

    // 5. 활동 통계 조회 (있으면)
    const currentWeek = getISOWeekNumber(new Date())
    const year = new Date().getFullYear()
    const { data: activityStats } = await admin
      .from('member_activity_stats')
      .select('club_id, week_number, message_count, channels_active, discord_username')
      .eq('club_id', club.id)
      .eq('year', year)
      .gte('week_number', weekParam ? parseInt(weekParam) : currentWeek - 3)

    // 6. 포맷별 생성
    const reportData = buildReportData(
      opportunities as { id: string; title: string; status: string | null; cohort: string | null }[],
      updates || [],
      profileMap,
      activityStats || [],
      oppMap
    )

    if (format === 'csv') {
      return generateCsvResponse(reportData, club.name, weekParam)
    }

    return generatePdfResponse(reportData, club.name, weekParam)
  }
)

interface ReportRow {
  weekNumber: number
  projectTitle: string
  cohort: string
  status: string
  updateTitle: string
  content: string
  author: string
  createdAt: string
  updateType: string
  messageCount: number
  channelsActive: number
}

function buildReportData(
  opportunities: { id: string; title: string; status: string | null; cohort: string | null }[],
  updates: { opportunity_id: string; author_id: string; week_number: number; title: string; content: string; update_type: string; created_at: string | null }[],
  profileMap: Map<string, string>,
  activityStats: { club_id: string; week_number: number; message_count: number; channels_active: number; discord_username: string | null }[],
  oppMap: Map<string, { id: string; title: string; status: string | null; cohort: string | null }>
): ReportRow[] {
  // 프로젝트별 활동 통계 합산 (주차별)
  const activityByWeek = new Map<string, { messageCount: number; channelsActive: number }>()
  for (const stat of activityStats) {
    const key = `${stat.week_number}`
    const existing = activityByWeek.get(key) || { messageCount: 0, channelsActive: 0 }
    existing.messageCount += stat.message_count
    existing.channelsActive = Math.max(existing.channelsActive, stat.channels_active)
    activityByWeek.set(key, existing)
  }

  const rows: ReportRow[] = []

  for (const update of updates) {
    const opp = oppMap.get(update.opportunity_id)
    if (!opp) continue

    const activity = activityByWeek.get(`${update.week_number}`) || { messageCount: 0, channelsActive: 0 }

    rows.push({
      weekNumber: update.week_number,
      projectTitle: opp.title,
      cohort: opp.cohort || '-',
      status: opp.status || '-',
      updateTitle: update.title,
      content: update.content,
      author: profileMap.get(update.author_id) || '알 수 없음',
      createdAt: update.created_at
        ? new Date(update.created_at).toLocaleDateString('ko-KR')
        : '-',
      updateType: update.update_type,
      messageCount: activity.messageCount,
      channelsActive: activity.channelsActive,
    })
  }

  // 업데이트가 없는 프로젝트도 포함 (미제출 표시)
  const updatedOppIds = new Set(updates.map(u => u.opportunity_id))
  for (const opp of opportunities) {
    if (!updatedOppIds.has(opp.id)) {
      rows.push({
        weekNumber: 0,
        projectTitle: opp.title,
        cohort: opp.cohort || '-',
        status: opp.status || '-',
        updateTitle: '(미제출)',
        content: '',
        author: '-',
        createdAt: '-',
        updateType: '-',
        messageCount: 0,
        channelsActive: 0,
      })
    }
  }

  return rows
}

function generateCsvResponse(rows: ReportRow[], clubName: string, weekParam: string | null): NextResponse {
  const headers = ['주차', '프로젝트', '기수', '상태', '제목', '내용', '작성자', '작성일', '유형', 'Discord 메시지수', '활동 채널수']

  const csvLines = [
    // BOM for Excel UTF-8 compatibility
    headers.join(','),
    ...rows.map(r => [
      r.weekNumber || '-',
      escapeCsvField(r.projectTitle),
      r.cohort,
      r.status,
      escapeCsvField(r.updateTitle),
      escapeCsvField(r.content),
      escapeCsvField(r.author),
      r.createdAt,
      r.updateType,
      r.messageCount,
      r.channelsActive,
    ].join(','))
  ]

  const csvContent = '\uFEFF' + csvLines.join('\n')
  const weekSuffix = weekParam ? `_${weekParam}주차` : '_최근4주'
  const fileName = `${clubName}_주간보고서${weekSuffix}.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}

function generatePdfResponse(rows: ReportRow[], clubName: string, weekParam: string | null): NextResponse {
  // PDF 생성은 Puppeteer 의존 — Vercel 서버리스에서는 제한적
  // 클라이언트에서 window.print()로 대체하거나, 별도 PDF 서비스 필요
  // 여기서는 HTML을 반환하여 브라우저에서 인쇄할 수 있도록 함
  const weekLabel = weekParam ? `${weekParam}주차` : '최근 4주'
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  // 주차별 그룹핑
  const byWeek = new Map<number, ReportRow[]>()
  for (const row of rows) {
    const list = byWeek.get(row.weekNumber) || []
    list.push(row)
    byWeek.set(row.weekNumber, list)
  }

  const sortedWeeks = [...byWeek.keys()].sort((a, b) => b - a)

  const weekSections = sortedWeeks.map(week => {
    const weekRows = byWeek.get(week)!
    const tableRows = weekRows.map(r => `
      <tr>
        <td>${escapeHtml(r.projectTitle)}</td>
        <td>${escapeHtml(r.updateTitle)}</td>
        <td class="content-cell">${escapeHtml(r.content).slice(0, 200)}${r.content.length > 200 ? '...' : ''}</td>
        <td>${escapeHtml(r.author)}</td>
        <td>${r.createdAt}</td>
        <td class="num">${r.messageCount}</td>
      </tr>
    `).join('')

    return `
      <div class="week-section">
        <h2>${week > 0 ? `${week}주차` : '미제출'}</h2>
        <table>
          <thead>
            <tr>
              <th>프로젝트</th>
              <th>제목</th>
              <th>내용</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>메시지수</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${clubName} 주간 보고서 — ${weekLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 15mm; }
    body { font-family: 'Noto Sans KR', sans-serif; font-size: 9pt; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 10mm; padding-bottom: 5mm; border-bottom: 2px solid #1a1a1a; }
    .header h1 { font-size: 16pt; margin-bottom: 2mm; }
    .header .meta { font-size: 10pt; color: #666; }
    .week-section { margin-bottom: 8mm; page-break-inside: avoid; }
    .week-section h2 { font-size: 12pt; background: #f5f5f5; padding: 3mm 4mm; margin-bottom: 3mm; border-left: 3px solid #0052CC; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    th, td { border: 1px solid #ddd; padding: 2.5mm 3mm; text-align: left; vertical-align: top; }
    th { background: #f9f9f9; font-weight: 600; white-space: nowrap; }
    .content-cell { max-width: 80mm; word-break: break-all; }
    .num { text-align: center; }
    .summary { margin-top: 8mm; padding: 4mm; background: #f0f7ff; border: 1px solid #cce0ff; font-size: 9pt; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(clubName)} — 주간 보고서</h1>
    <div class="meta">${weekLabel} | 생성일: ${today}</div>
  </div>
  ${weekSections}
  <div class="summary">
    전체 프로젝트: ${rows.length}건 | 제출: ${rows.filter(r => r.weekNumber > 0).length}건 | 미제출: ${rows.filter(r => r.weekNumber === 0).length}건
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const weekSuffix = weekParam ? `_${weekParam}주차` : '_최근4주'
  const fileName = `${clubName}_주간보고서${weekSuffix}.html`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}

function escapeCsvField(value: string): string {
  if (!value) return ''
  // CSV: 쉼표/줄바꿈/큰따옴표 포함 시 큰따옴표로 감싸기
  const escaped = value.replace(/"/g, '""')
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`
  }
  return escaped
}

function escapeHtml(text: string): string {
  if (!text) return ''
  const escapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return text.replace(/[&<>"']/g, c => escapes[c] || c)
}

// getISOWeekNumber은 @/src/lib/ghostwriter/week-utils에서 import
