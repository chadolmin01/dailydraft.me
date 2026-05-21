/**
 * Discord 서버 표준 템플릿
 *
 * 새 클럽이 봇을 설치하면 이 템플릿대로 채널 구조가 자동 생성됨.
 * 기존 채널이 있으면 생성하지 않고, 없는 것만 추가.
 *
 * 구조:
 *   📁 운영 (관리자 전용)
 *     ├─ #공지사항        (운영진만 쓰기)
 *     ├─ #일정            (운영진만 쓰기)
 *     ├─ #운영진-전용     (운영진만 보기)
 *     ├─ #결정-로그       (봇 전용)
 *     └─ #운영-대시보드   (봇 전용)
 *
 *   📁 프로젝트 (부원 전체)
 *     ├─ #주간-체크인     (포럼)
 *     ├─ #디자인-리뷰     (포럼, FileTrail)
 *     ├─ #기획-리뷰       (포럼, FileTrail)
 *     ├─ #주간-업데이트   (봇 전용)
 *     └─ #개발-피드       (봇 전용)
 *
 *   📁 자유 (부원 전체)
 *     ├─ #자기소개
 *     ├─ #잡담
 *     └─ #질문-답변
 *
 *   📁 음성
 *     └─ 🔊 회의실
 *
 * 팀별 채널 (프로젝트 생성 시 provision.ts가 별도 생성):
 *   📁 🏷️ {팀이름}
 *     ├─ #일반            (FileTrail)
 *     └─ #자료공유        (FileTrail)
 */

// Discord 채널 타입
const CHANNEL_TYPE = {
  TEXT: 0,
  VOICE: 2,
  CATEGORY: 4,
  FORUM: 15,
} as const;

// 채널 접근 권한 프리셋
export type ChannelAccess =
  | 'everyone'       // 모든 부원 읽기/쓰기
  | 'everyone_read'  // 모든 부원 읽기, 운영진만 쓰기
  | 'admin_only'     // 운영진만 보기
  | 'bot_only';      // 봇만 쓰기, 부원 읽기

export interface ChannelTemplate {
  name: string;
  type: number;
  topic?: string;
  access: ChannelAccess;
  fileTracking: boolean;  // FileTrail 활성화 여부
  // 포럼 채널 전용: 기본 태그 목록
  forumTags?: string[];
}

export interface CategoryTemplate {
  name: string;
  emoji: string;           // 카테고리 앞에 붙는 이모지
  channels: ChannelTemplate[];
}

/**
 * 클럽 Discord 서버 표준 템플릿
 * 새 클럽이 봇을 설치하면 이 구조대로 채널이 생성됨
 */
export const GUILD_TEMPLATE: CategoryTemplate[] = [
  {
    name: '운영',
    emoji: '📋',
    channels: [
      {
        name: '공지사항',
        type: CHANNEL_TYPE.TEXT,
        topic: '동아리 공지사항. 운영진만 작성 가능합니다.',
        access: 'everyone_read',
        fileTracking: false,
      },
      {
        name: '일정',
        type: CHANNEL_TYPE.TEXT,
        topic: '미팅/발표/제출 일정. 중요 일정은 핀 해주세요.',
        access: 'everyone_read',
        fileTracking: false,
      },
      {
        name: '운영진-전용',
        type: CHANNEL_TYPE.TEXT,
        access: 'admin_only',
        fileTracking: false,
      },
      {
        name: '결정-로그',
        type: CHANNEL_TYPE.TEXT,
        topic: '중요 결정사항 아카이브. 봇이 자동 수집합니다.',
        access: 'bot_only',
        fileTracking: false,
      },
      {
        name: '운영-대시보드',
        type: CHANNEL_TYPE.TEXT,
        topic: '매주 AI가 자동 게시하는 전체 팀 현황 요약. 봇 전용 채널입니다.',
        access: 'bot_only',
        fileTracking: false,
      },
    ],
  },
  {
    name: '프로젝트',
    emoji: '🚀',
    channels: [
      {
        name: '주간-체크인',
        type: CHANNEL_TYPE.FORUM,
        topic: '매주 월요일 자동 생성. 양식에 맞춰 이번 주 계획/완료/블로커를 남겨주세요.',
        access: 'everyone',
        fileTracking: false,
        forumTags: ['계획', '완료', '블로커', '질문'],
      },
      {
        name: '디자인-리뷰',
        type: CHANNEL_TYPE.FORUM,
        topic: '디자인 작업물 공유 & 피드백. Figma 링크/스크린샷과 함께 포스트를 올려주세요.',
        access: 'everyone',
        fileTracking: true,
        forumTags: ['UI/UX', '로고', '일러스트', '피드백요청', '확정'],
      },
      {
        name: '기획-리뷰',
        type: CHANNEL_TYPE.FORUM,
        topic: '기획/비즈니스 산출물 공유 & 피드백. 시장조사, 사업계획서, 인터뷰 정리 등을 올려주세요.',
        access: 'everyone',
        fileTracking: true,
        forumTags: ['사업계획서', '시장조사', '인터뷰', '피드백요청', '확정'],
      },
      {
        name: '주간-업데이트',
        type: CHANNEL_TYPE.TEXT,
        topic: 'AI가 생성한 주간 업데이트가 게시됩니다. Draft 봇이 자동 관리합니다.',
        access: 'bot_only',
        fileTracking: false,
      },
      {
        name: '개발-피드',
        type: CHANNEL_TYPE.TEXT,
        topic: 'GitHub push/PR/issue 알림이 자동으로 올라옵니다.',
        access: 'bot_only',
        fileTracking: false,
      },
    ],
  },
  {
    name: '자유',
    emoji: '💬',
    channels: [
      {
        name: '자기소개',
        type: CHANNEL_TYPE.TEXT,
        topic: '새로 오신 분은 여기에 자기소개를 남겨주세요! 이름, 학년, 관심 분야, 한 줄 각오.',
        access: 'everyone',
        fileTracking: false,
      },
      {
        name: '잡담',
        type: CHANNEL_TYPE.TEXT,
        topic: '자유 대화. 프로젝트 무관한 이야기도 OK.',
        access: 'everyone',
        fileTracking: false,
      },
      {
        name: '질문-답변',
        type: CHANNEL_TYPE.TEXT,
        topic: '기술/기획/디자인 질문. 스레드로 답변해주세요.',
        access: 'everyone',
        fileTracking: false,
      },
    ],
  },
  {
    name: '음성',
    emoji: '🔊',
    channels: [
      {
        name: '회의실',
        type: CHANNEL_TYPE.VOICE,
        access: 'everyone',
        fileTracking: false,
      },
    ],
  },
];

/**
 * 팀 프로비저닝 시 생성되는 채널 템플릿
 * provision.ts에서 팀 생성 시 이 템플릿을 참조
 */
export const TEAM_CHANNEL_TEMPLATE: ChannelTemplate[] = [
  {
    name: '일반',
    type: CHANNEL_TYPE.TEXT,
    topic: '{teamName} 팀 대화 채널',
    access: 'everyone',
    fileTracking: true,
  },
  {
    name: '자료공유',
    type: CHANNEL_TYPE.TEXT,
    topic: '{teamName} 팀 자료 공유',
    access: 'everyone',
    fileTracking: true,
  },
];
