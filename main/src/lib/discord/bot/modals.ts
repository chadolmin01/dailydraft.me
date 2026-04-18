/**
 * Discord Modal + Launcher 빌더
 *
 * Discord Interaction Response Types:
 *   4 = CHANNEL_MESSAGE_WITH_SOURCE (일반 응답)
 *   5 = DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE (Deferred)
 *   6 = DEFERRED_UPDATE_MESSAGE
 *   7 = UPDATE_MESSAGE
 *   9 = MODAL
 *
 * Component Types:
 *   1 = ACTION_ROW
 *   2 = BUTTON
 *   3 = STRING_SELECT
 *   4 = TEXT_INPUT (Modal 전용)
 *   5 = USER_SELECT
 *   6 = ROLE_SELECT
 *   7 = MENTIONABLE_SELECT
 *   8 = CHANNEL_SELECT
 *
 * TEXT_INPUT styles: 1 = SHORT (한 줄), 2 = PARAGRAPH (여러 줄)
 *
 * Modal 제약:
 *   - 한 Modal에 최대 5개의 TEXT_INPUT (각각 단독 ACTION_ROW)
 *   - Modal에는 SELECT/BUTTON 넣을 수 없음 → 투두 담당자 선택은 2단계 플로우
 */

/** @Draft 멘션 → 공개 채널 메시지로 전송될 런처 메뉴 */
export function buildLauncherMenu(requesterId: string): {
  content: string;
  components: unknown[];
} {
  return {
    content: `<@${requesterId}> 무엇을 도와드릴까요?\n-# 60초 후 자동으로 사라집니다.`,
    components: [
      {
        type: 1, // ACTION_ROW
        components: [
          { type: 2, style: 1, label: '투두', custom_id: 'launcher_todo' },
          { type: 2, style: 1, label: '투표', custom_id: 'launcher_vote' },
          { type: 2, style: 1, label: '한줄', custom_id: 'launcher_oneline' },
          { type: 2, style: 2, label: '일정', custom_id: 'launcher_schedule' },
          { type: 2, style: 2, label: '회의시작', custom_id: 'launcher_meeting' },
        ],
      },
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: '마무리', custom_id: 'launcher_summary' },
          { type: 2, style: 3, label: '개발현황', custom_id: 'launcher_devstatus' },
          { type: 2, style: 2, label: '설정', custom_id: 'launcher_settings' },
        ],
      },
    ],
  };
}

/** 투두 등록 Modal (내용 + 마감일) — 제출 후 담당자 Select 2단계 */
export function buildTodoModal(): { type: number; data: unknown } {
  return {
    type: 9, // MODAL
    data: {
      custom_id: 'modal_todo_submit',
      title: '할 일 등록',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4, // TEXT_INPUT
              custom_id: 'content',
              label: '내용',
              style: 2, // PARAGRAPH
              required: true,
              max_length: 500,
              placeholder: '예: 디자인 시안 v2 완성',
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'deadline',
              label: '마감일 (선택)',
              style: 1, // SHORT
              required: false,
              max_length: 80,
              placeholder: '예: 내일 오후 6시, 금요일까지, 4/25',
            },
          ],
        },
      ],
    },
  };
}

/** 투두 Modal 제출 후 담당자 선택 메시지 (USER_SELECT) */
export function buildTodoAssigneeSelect(stateKey: string): {
  content: string;
  components: unknown[];
} {
  return {
    content: '담당자를 선택해주세요. (선택 안 하면 담당자 미정으로 등록됩니다)',
    components: [
      {
        type: 1,
        components: [
          {
            type: 5, // USER_SELECT
            custom_id: `todo_assignee:${stateKey}`,
            placeholder: '담당자 선택',
            min_values: 0,
            max_values: 1,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2, // BUTTON
            style: 2, // Secondary
            label: '담당자 없이 등록',
            custom_id: `todo_no_assignee:${stateKey}`,
          },
        ],
      },
    ],
  };
}

/** 투표 Modal (주제 + 옵션 2~4) — 옵션 3,4는 선택 */
export function buildVoteModal(): { type: number; data: unknown } {
  return {
    type: 9,
    data: {
      custom_id: 'modal_vote_submit',
      title: '투표 만들기',
      components: [
        row(textInput('topic', '주제', 1, true, 200, '예: 회식 메뉴')),
        row(textInput('opt1', '옵션 1', 1, true, 100, '예: 피자')),
        row(textInput('opt2', '옵션 2', 1, true, 100, '예: 치킨')),
        row(textInput('opt3', '옵션 3 (선택)', 1, false, 100)),
        row(textInput('opt4', '옵션 4 (선택)', 1, false, 100)),
      ],
    },
  };
}

/** 한줄 체크인 Modal */
export function buildOneLineModal(): { type: number; data: unknown } {
  return {
    type: 9,
    data: {
      custom_id: 'modal_oneline_submit',
      title: '한줄 체크인',
      components: [
        row(
          textInput(
            'content',
            '오늘 뭐 했는지 / 뭐 할 건지',
            2,
            true,
            500,
            '예: 오전에 유저 인터뷰 2건, 오후엔 디자인 시안 작업 예정',
          ),
        ),
      ],
    },
  };
}

/** 일정 조율 Modal (목적 — 제출 후 요일 투표 자동 생성) */
export function buildScheduleModal(): { type: number; data: unknown } {
  return {
    type: 9,
    data: {
      custom_id: 'modal_schedule_submit',
      title: '일정 조율',
      components: [
        row(
          textInput(
            'purpose',
            '모임 목적 (선택)',
            1,
            false,
            100,
            '예: 중간발표 준비 회의',
          ),
        ),
      ],
    },
  };
}

/** 회의시작 Modal (안건) */
export function buildMeetingStartModal(): { type: number; data: unknown } {
  return {
    type: 9,
    data: {
      custom_id: 'modal_meeting_submit',
      title: '회의 시작',
      components: [
        row(
          textInput(
            'agenda',
            '오늘 안건 (선택)',
            2,
            false,
            500,
            '예: 1. 스프린트 회고  2. 다음 주 계획',
          ),
        ),
      ],
    },
  };
}

// ── 내부 헬퍼 ──

function row(component: unknown) {
  return { type: 1, components: [component] };
}

function textInput(
  custom_id: string,
  label: string,
  style: 1 | 2,
  required: boolean,
  max_length: number,
  placeholder?: string,
) {
  const input: Record<string, unknown> = {
    type: 4,
    custom_id,
    label,
    style,
    required,
    max_length,
  };
  if (placeholder) input.placeholder = placeholder;
  return input;
}
