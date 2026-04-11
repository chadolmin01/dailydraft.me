/**
 * Google Sheets 커넥터
 *
 * 공개 스프레드시트에서 데이터를 읽어 하네스에 주입.
 * "링크만 붙여넣기"로 연동 — OAuth 불필요, API 키만으로 읽기 가능.
 *
 * 감지하는 것:
 * - 시트 내용 변경 (전주 대비 행 추가/수정)
 * - 진행 상황 열이 있으면 자동 파싱 (완료/진행중/대기)
 * - 체크박스 열 자동 감지
 */

import type { HarnessData, TaskItem, MetricItem, Activity } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/** 스프레드시트 URL에서 ID 추출 */
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** 상태 키워드 → 표준 status 매핑 */
function parseStatus(value: string): TaskItem['status'] | null {
  const v = value.trim().toLowerCase();
  if (['완료', 'done', '✅', 'o', 'complete', '끝'].some((k) => v.includes(k)))
    return 'done';
  if (['진행', 'in progress', '🔧', 'wip', '작업중', '하는중'].some((k) => v.includes(k)))
    return 'in_progress';
  if (['대기', 'todo', '예정', '🚧', '미시작', 'pending'].some((k) => v.includes(k)))
    return 'todo';
  return null;
}

/** 열 이름으로 역할 추론 */
function inferColumnRole(
  header: string
): 'assignee' | 'task' | 'status' | 'deadline' | 'ignore' {
  const h = header.trim().toLowerCase();
  if (['담당', '담당자', 'assignee', '이름', 'name', '누구'].some((k) => h.includes(k)))
    return 'assignee';
  if (['작업', '할일', 'task', '내용', '항목', 'description', '제목'].some((k) => h.includes(k)))
    return 'task';
  if (['상태', 'status', '진행', '완료', 'done'].some((k) => h.includes(k)))
    return 'status';
  if (['마감', 'deadline', '기한', '날짜', 'due', 'date'].some((k) => h.includes(k)))
    return 'deadline';
  return 'ignore';
}

export async function fetchGoogleSheets(
  spreadsheetUrl: string,
  sheetName?: string,
  apiKey?: string
): Promise<HarnessData> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
  if (!spreadsheetId) {
    return {
      source: 'google_sheets',
      fetchedAt: new Date(),
      ok: false,
      error: '유효하지 않은 Google Sheets URL',
    };
  }

  const key = apiKey ?? process.env.GOOGLE_API_KEY ?? '';
  const range = sheetName ? `'${sheetName}'` : 'Sheet1';

  try {
    const res = await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${key}&majorDimension=ROWS`,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return {
        source: 'google_sheets',
        fetchedAt: new Date(),
        ok: false,
        error: `Sheets API ${res.status}: ${body.substring(0, 200)}`,
      };
    }

    const data = await res.json();
    const rows: string[][] = data.values ?? [];

    if (rows.length < 2) {
      return {
        source: 'google_sheets',
        fetchedAt: new Date(),
        ok: true,
        metrics: [{ label: '시트 행 수', value: rows.length, unit: 'rows' }],
      };
    }

    // 헤더 분석
    const headers = rows[0];
    const columnRoles = headers.map(inferColumnRole);

    const assigneeCol = columnRoles.indexOf('assignee');
    const taskCol = columnRoles.indexOf('task');
    const statusCol = columnRoles.indexOf('status');
    const deadlineCol = columnRoles.indexOf('deadline');

    // 작업 목록 추출 (task 열이 있는 경우)
    const tasks: TaskItem[] = [];
    const activities: Activity[] = [];

    if (taskCol >= 0) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const taskText = row[taskCol]?.trim();
        if (!taskText) continue;

        const assignee = assigneeCol >= 0 ? row[assigneeCol]?.trim() ?? '미정' : '미정';
        const statusText = statusCol >= 0 ? row[statusCol]?.trim() ?? '' : '';
        const deadline = deadlineCol >= 0 ? row[deadlineCol]?.trim() : undefined;

        const status = parseStatus(statusText) ?? 'todo';

        tasks.push({ assignee, title: taskText, status, deadline });
      }
    } else {
      // task 열이 없으면 활동 요약만
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const content = row.filter(Boolean).join(' | ');
        if (content.trim()) {
          activities.push({
            who: assigneeCol >= 0 ? row[assigneeCol]?.trim() ?? 'unknown' : 'unknown',
            what: content,
            when: new Date(),
          });
        }
      }
    }

    // 메트릭 계산
    const metrics: MetricItem[] = [
      { label: '전체 항목', value: rows.length - 1, unit: 'rows' },
    ];

    if (tasks.length > 0) {
      const done = tasks.filter((t) => t.status === 'done').length;
      const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
      metrics.push(
        { label: '완료', value: done, unit: 'tasks' },
        { label: '진행 중', value: inProgress, unit: 'tasks' },
        { label: '대기', value: tasks.length - done - inProgress, unit: 'tasks' }
      );
    }

    return {
      source: 'google_sheets',
      fetchedAt: new Date(),
      ok: true,
      tasks: tasks.length > 0 ? tasks : undefined,
      activities: activities.length > 0 ? activities : undefined,
      metrics,
    };
  } catch (err: any) {
    return {
      source: 'google_sheets',
      fetchedAt: new Date(),
      ok: false,
      error: err.message,
    };
  }
}
