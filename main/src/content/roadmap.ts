/**
 * 공개 로드맵 데이터.
 *
 * 의미: 유저·파트너·투자자에게 "앞으로 어디로 가는가" 선언.
 * 과도한 약속 지양 — 분기 내 반영 가능한 범위만 올리고, 상태 변화 충실히 갱신.
 *
 * 상태 enum:
 *   planned     — 설계 완료·착수 전 (분기 초 선언)
 *   in-progress — 실제 구현 중
 *   shipped     — 배포됨 (/changelog 로도 함께 기록)
 *   deferred    — 의도적으로 분기 이관
 */

export type RoadmapStatus = 'planned' | 'in-progress' | 'shipped' | 'deferred'

export interface RoadmapItem {
  title: string
  status: RoadmapStatus
  note?: string
}

export interface RoadmapQuarter {
  quarter: string     // 'Q2 2026'
  window: string      // '2026-04 ~ 2026-06' — 투명성
  theme: string       // 분기 메인 주제
  items: RoadmapItem[]
}

export const ROADMAP: RoadmapQuarter[] = [
  {
    quarter: 'Q2 2026',
    window: '2026-04 ~ 2026-06',
    theme: '첫 대학 파일럿과 Meta Threads API 공식 승인',
    items: [
      { title: 'Meta Threads API Review 승인', status: 'in-progress', note: '제출 패키지 7 문서 + 콜백 2개 + 법적 페이지 3개 완료. 데모 영상 촬영 후 제출.' },
      { title: '경희대 FLIP 시범 운영', status: 'in-progress', note: 'FLIP 10-1 기에서 5~6월 실운영. 주간 업데이트·Discord 통합·페르소나 발행 실데이터 확보.' },
      { title: '경희대 창업교육센터 파트너십 인터뷰', status: 'planned', note: '별첨 자료 전달 후 담당자 30분 인터뷰.' },
      { title: 'LinkedIn 사진 업로드 + Vision 캡션', status: 'planned', note: '유저가 올린 사진을 Claude Vision 이 분석해 캡션 초안 작성. Assets API 업로드 포함.' },
      { title: '이메일 도메인 기반 재학생 인증 UX', status: 'planned', note: '@ac.kr 자동 매핑 로직은 이미 있음. 온보딩 플로우 UI 강화.' },
      { title: 'CommandPalette (Cmd+K) 전역 검색', status: 'planned', note: '프로젝트·사람·클럽 3 카테고리 통합 검색.' },
    ],
  },
  {
    quarter: 'Q3 2026',
    window: '2026-07 ~ 2026-09',
    theme: '다중 기관·Pro 요금제·dual-key 토큰 로테이션',
    items: [
      { title: '다중 기관 지원 + 기관 커스터마이즈', status: 'planned', note: '로고·테마·도메인 화이트리스트. 경희대 외 2 대학 실시범.' },
      { title: 'Pro/Enterprise 요금제 런칭', status: 'planned', note: 'Toss Payments 기반 체크아웃. Free 티어는 개별 학생·운영진 대상 영구 유지.' },
      { title: 'TOKEN_ENCRYPTION_KEY dual-key 로테이션', status: 'planned', note: 'primary/secondary 두 키 동시 지원 → 연 1회 무중단 로테이션.' },
      { title: '외부 펜테스트', status: 'planned', note: '프로덕트 pre-scale-up 단계 침입 시험 외부 engagement.' },
      { title: 'Redis 기반 분산 Rate Limit', status: 'planned', note: '현재 in-process 한도를 Upstash Redis 로 이전. 멀티 인스턴스 정합.' },
    ],
  },
  {
    quarter: 'Q4 2026',
    window: '2026-10 ~ 2026-12',
    theme: '인프라 성숙과 성장 루프',
    items: [
      { title: 'Referral 프로그램', status: 'planned', note: '클럽 간 초대·학생 간 소개 루프 + 트래킹.' },
      { title: 'Instagram Graph API 통합', status: 'planned', note: 'Threads 승인 이후 Instagram 으로 확장. 이미지·릴스 발행.' },
      { title: 'AI 이미지 생성 (선택)', status: 'planned', note: 'DALL-E 3 또는 Gemini Imagen. 유저 승인 게이트 필수.' },
      { title: 'Storybook + 디자인 시스템 공개', status: 'planned', note: 'Draft UI 컴포넌트를 외부에서 확인 가능하도록.' },
    ],
  },
]
