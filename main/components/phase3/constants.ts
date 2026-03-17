import { PRDData, Task } from '@/types';

export const MOCK_PRD: PRDData = {
  title: "Phase 3: AI 작업 분해 모듈",
  summary: "확정된 제품 요구사항 문서(PRD)를 AI를 활용해 실행 가능한 칸반 티켓으로 자동 변환하는 기능입니다. 초기 스타트업의 기획과 실행 사이의 간극을 줄이는 것을 목표로 합니다.",
  features: [
    "JSON PRD를 원클릭으로 칸반 보드로 변환",
    "작업 자동 분류 (FE/BE/Design)",
    "작업별 소요 시간 추정",
    "드래그 앤 드롭 작업 관리 인터페이스",
    "Jira/Linear 내보내기 연동 (시뮬레이션)"
  ],
  techStack: ["React", "TypeScript", "Tailwind CSS", "Gemini API", "Supabase"]
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TASK-000',
    title: '유저 플로우 기획 및 상세 정의',
    description: '로그인부터 결과 생성까지의 전체 사용자 경험(UX) 흐름도 작성.',
    status: 'DONE',
    type: 'PLANNING',
    assignee: 'LS',
    estimate: '4h',
    priority: 'HIGH',
    comments: [],
    synced: false
  },
  {
    id: 'TASK-001',
    title: '프로젝트 저장소 설정',
    description: 'TypeScript 및 Tailwind 설정으로 Git 저장소 초기화.',
    status: 'DONE',
    type: 'DEVOPS',
    assignee: 'DK',
    estimate: '2h',
    priority: 'HIGH',
    comments: [
      {
        id: 'c1',
        userId: 'u2',
        userName: 'David Kim',
        userInitials: 'DK',
        content: '저장소 초기화 완료했습니다. 다음은 CI/CD 파이프라인 구축입니다.',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    synced: true,
    externalTicketId: 'LIN-101'
  }
];

export const CURRENT_USER = {
  id: 'u1',
  name: '이상',
  initials: 'LS'
};
