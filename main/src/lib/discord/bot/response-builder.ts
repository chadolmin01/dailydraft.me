/**
 * 패턴 감지 결과 → Discord 메시지 생성
 * 각 패턴별 응답 템플릿
 */

import type {
  PatternDetection,
  BotResponse,
  MeetingSummary,
  DecisionData,
  TaskData,
  ScheduleData,
  ResourceData,
  BlockerData,
  ScopeData,
  RetroData,
  UnownedTaskData,
  UnansweredData,
} from './types';

/**
 * prefilter 결과만으로 빠른 제안 메시지 생성 (AI 호출 없음)
 * 대화 중 즉각 반응 — 단순한 넛지만 보냄
 */
export function buildQuickSuggestion(
  type: PatternDetection['type'],
  channelId: string
): BotResponse | null {
  // Discord Button: type=2, style: 1=Primary(파랑) 2=Secondary(회색) 3=Success(초록) 4=Danger(빨강)
  const YES_NO_BUTTONS = (yesId: string, noId: string) => [
    {
      type: 1, // ACTION_ROW
      components: [
        { type: 2, style: 3, label: '네', custom_id: yesId },
        { type: 2, style: 4, label: '아니요', custom_id: noId },
      ],
    },
  ];

  switch (type) {
    case 'schedule-coordination':
      return {
        content: '📅 일정을 잡으시겠습니까?',
        channelId,
        components: YES_NO_BUTTONS('quick_schedule_yes', 'quick_dismiss'),
      };
    case 'decision-deadlock':
      return {
        content: '📊 투표로 결정하시겠습니까?',
        channelId,
        components: YES_NO_BUTTONS('quick_vote_yes', 'quick_dismiss'),
      };
    case 'blocker-frustration':
      return {
        content: '🔧 막히는 부분이 있으신 것 같습니다. 팀원에게 도움을 요청하시겠습니까?',
        channelId,
        components: YES_NO_BUTTONS('quick_help_yes', 'quick_dismiss'),
      };
    case 'unanswered-question':
      return {
        content: '❓ 답변이 아직 없는 질문이 있는 것 같습니다. 리마인드를 보내시겠습니까?',
        channelId,
        components: YES_NO_BUTTONS('quick_remind_yes', 'quick_dismiss'),
      };
    default:
      return null;
  }
}

/**
 * 단일 패턴 → 즉시 반응 메시지 생성 (AI 분류 후 호출, 현재 미사용)
 */
export function buildInstantResponse(
  detection: PatternDetection
): BotResponse | null {
  const d = detection.data;

  switch (d.type) {
    case 'decision-deadlock':
      return buildDecisionResponse(d, detection);

    case 'schedule-coordination':
      return buildScheduleResponse(d, detection);

    case 'blocker-frustration':
      return buildBlockerResponse(d, detection);

    case 'unanswered-question':
      return buildUnansweredResponse(d, detection);

    default:
      return null;
  }
}

function buildDecisionResponse(
  d: DecisionData,
  det: PatternDetection
): BotResponse {
  const optionLines = d.options
    .map((opt, i) => `${numberEmoji(i + 1)} ${opt}`)
    .join('\n');

  return {
    content: `📊 **${d.topic}** 투표를 만들어볼까요?\n\n${optionLines}\n\n⏰ 내일 오후 6시에 결과를 정리해드리겠습니다.\n❌ 필요 없으면 이 이모지를 눌러주세요.`,
    channelId: det.sourceMessages[0].channelId,
    reactions: [
      ...d.options.map((_, i) => numberEmoji(i + 1)),
      '❌',
    ],
  };
}

function buildScheduleResponse(
  d: ScheduleData,
  det: PatternDetection
): BotResponse {
  // 후보가 4개 이상이면 When2Meet 추천
  if (d.isComplex || d.candidates.length >= 4) {
    return {
      content: `📅 일정 조율이 복잡한 것 같습니다!\n\nWhen2Meet에서 시간 맞춰보시겠습니까?\n🔗 https://when2meet.com (이벤트 생성 후 링크를 공유해주세요)\n\n또는 여기서 바로 투표:\n${d.candidates.map((c, i) => `${numberEmoji(i + 1)} ${c}`).join('\n')}\n\n❌ 필요 없으면 이 이모지를 눌러주세요.`,
      channelId: det.sourceMessages[0].channelId,
      reactions: [...d.candidates.map((_, i) => numberEmoji(i + 1)), '❌'],
    };
  }

  return {
    content: `📅 ${d.purpose ? d.purpose + ' ' : ''}시간 투표입니다! 가능한 시간에 모두 반응해주세요.\n\n${d.candidates.map((c, i) => `${numberEmoji(i + 1)} ${c}`).join('\n')}\n\n✅ = 가능 | ⚠️ = 늦게 도착 가능\n❌ 필요 없으면 이 이모지를 눌러주세요.`,
    channelId: det.sourceMessages[0].channelId,
    reactions: [...d.candidates.map((_, i) => numberEmoji(i + 1)), '❌'],
  };
}

function buildBlockerResponse(
  d: BlockerData,
  det: PatternDetection
): BotResponse {
  return {
    content: `🔧 ${d.who}님 혹시 도움이 필요하신가요?\n\n> ${d.issue}${d.duration ? ` (${d.duration})` : ''}\n\n🆘 = 팀원에게 알림 보내기\n🙅 = 괜찮아요, 혼자 해볼게요`,
    channelId: det.sourceMessages[0].channelId,
    reactions: ['🆘', '🙅'],
  };
}

function buildUnansweredResponse(
  d: UnansweredData,
  det: PatternDetection
): BotResponse {
  const questions = d.questions.map((q) => `> ${q}`).join('\n');
  return {
    content: `❓ ${d.questioner}님의 질문이 아직 답변되지 않은 것 같습니다.\n\n${questions}\n\n팀원 분들 답변 부탁드립니다! 🙏`,
    channelId: det.sourceMessages[0].channelId,
    replyToMessageId: det.sourceMessages[det.sourceMessages.length - 1].id,
  };
}

// ── 마무리 요약 ──

/**
 * 마무리 요약 메시지 생성
 * 대화 종결 감지 또는 /마무리 커맨드에서 호출
 */
export function buildSummaryResponse(
  summary: MeetingSummary,
  channelId: string
): BotResponse {
  const sections: string[] = ['📝 **오늘 나온 내용 정리했습니다!**\n'];

  // 할 일
  if (summary.tasks.length > 0) {
    sections.push('**✅ 할 일**');
    summary.tasks.forEach((t) => {
      const deadline = t.deadline ? ` (${t.deadline})` : '';
      sections.push(`• ${t.assignee} — ${t.task}${deadline}`);
    });
    sections.push('');
  }

  // 결정사항
  if (summary.decisions.length > 0) {
    sections.push('**📌 결정사항**');
    summary.decisions.forEach((d) => {
      sections.push(`• ${d.topic}: ${d.result}`);
    });
    sections.push('');
  }

  // 공유된 자료
  if (summary.resources.length > 0) {
    sections.push('**🔗 공유된 자료**');
    summary.resources.forEach((r) => {
      sections.push(`• ${r.label} (${r.sharedBy}) — ${r.url}`);
    });
    sections.push('');
  }

  // 회고
  if (summary.retrospectives.length > 0) {
    sections.push('**💭 회고**');
    summary.retrospectives.forEach((l) => {
      sections.push(`• ${l}`);
    });
    sections.push('');
  }

  // 다음 모임
  if (summary.nextMeeting) {
    sections.push(`**📅 다음 모임:** ${summary.nextMeeting}`);
    sections.push('');
  }

  sections.push('맞나요? ✅ = 확인 | ✏️ = 수정 필요');

  return {
    content: sections.join('\n'),
    channelId,
    reactions: ['✅', '✏️'],
  };
}

/**
 * 감지된 패턴들을 MeetingSummary로 합침
 */
export function aggregateToSummary(
  detections: PatternDetection[]
): MeetingSummary {
  const summary: MeetingSummary = {
    tasks: [],
    decisions: [],
    resources: [],
    retrospectives: [],
  };

  for (const det of detections) {
    const d = det.data;
    switch (d.type) {
      case 'task-assignment':
        summary.tasks.push(...d.tasks);
        break;
      case 'decision-deadlock':
        // 결정이 교착 중이면 아직 미결정
        summary.decisions.push({
          topic: d.topic,
          result: `${d.options.join(' vs ')} (미결정)`,
        });
        break;
      case 'resource-shared':
        summary.resources.push(...d.resources);
        break;
      case 'retrospective':
        summary.retrospectives.push(...d.learnings);
        break;
      case 'unowned-task':
        summary.tasks.push({
          assignee: '미정',
          task: d.task,
          deadline: d.deadline,
        });
        break;
      case 'schedule-coordination':
        if (d.candidates.length > 0) {
          summary.nextMeeting = d.candidates[0] + ' (미확정)';
        }
        break;
    }
  }

  return summary;
}

// ── 유틸 ──

function numberEmoji(n: number): string {
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  return emojis[n - 1] ?? `${n}`;
}
