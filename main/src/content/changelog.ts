/**
 * 공개 릴리스 노트 데이터.
 *
 * 추가 시 구조: 최신이 위에. date(ISO) + version(옵션) + items 배열.
 * type: 'feature' | 'improvement' | 'fix' | 'security' | 'docs'
 *
 * 이 파일이 /changelog 페이지의 단일 진실 소스. 배포 때 새 항목 한두 줄씩 올리면 됨.
 */

export type ChangelogEntryType = 'feature' | 'improvement' | 'fix' | 'security' | 'docs'

export interface ChangelogItem {
  type: ChangelogEntryType
  title: string
  note?: string
}

export interface ChangelogEntry {
  date: string // YYYY-MM-DD
  version?: string
  items: ChangelogItem[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-04-22',
    version: 'v0.20',
    items: [
      { type: 'feature', title: '공개 프로필 QR 명함', note: '학생이 자기 프로필 URL 을 명함·이력서에 QR 로 붙일 수 있도록 /u/[id] 에서 바로 생성·인쇄.' },
      { type: 'feature', title: '클럽 초대 QR 자체 호스팅', note: '외부 서비스 의존성 제거. SVG 고해상도로 오프라인 인쇄 품질 향상.' },
      { type: 'feature', title: '기관 리포트 PDF 인쇄·저장', note: '담당자가 학기말 실적 보고에 바로 쓸 수 있는 print-ready 레이아웃.' },
      { type: 'feature', title: '공개 FAQ 페이지 /help', note: '시작하기·운영·데이터·보안·학교 도입·플랜 5개 카테고리 17개 질문.' },
      { type: 'security', title: 'RLS H4 — platform_admins 테이블 도입', note: 'JWT app_metadata.is_admin 의존 제거 1단계. DB 진실 소스로 전환 개시.' },
    ],
  },
  {
    date: '2026-04-21',
    version: 'v0.19',
    items: [
      { type: 'feature', title: '전역 로딩 시스템', note: '36 routes 에 loading.tsx, AsyncBoundary, Skeleton 11종 도입.' },
      { type: 'improvement', title: '탭/필터 전환 smooth', note: 'placeholderData 전역 설정 + useIsFetching 통합 progress bar.' },
      { type: 'feature', title: 'Meta 리뷰 대비 deauth·data-deletion 콜백', note: 'signed_request HMAC-SHA256 검증 + 상태 조회 GET.' },
      { type: 'feature', title: 'Meta App Review 제출 패키지', note: '8개 문서(use-case·demo-video·compliance-attestation 등) + PDF 번들.' },
      { type: 'feature', title: '법적 페이지 /legal/{privacy,terms,data-deletion}', note: 'PIPA/GDPR/CCPA 매핑, Meta 특례 섹션 포함.' },
      { type: 'security', title: 'HSTS 헤더 + Dependabot + OAuth rate limit + secret-scan CI', note: '엔터프라이즈 실사 대비 하드닝 다섯 종.' },
      { type: 'security', title: 'RLS H7 하드닝', note: 'persona_fields 등 학습 artifact 를 편집자 전용으로 축소.' },
      { type: 'improvement', title: '랜딩 엔터프라이즈 신호', note: '학교·기관 CTA 섹션, PIPA 마이크로카피, 신뢰 3요소.' },
      { type: 'feature', title: 'E2E 스모크 테스트 스캐폴드', note: 'Playwright 10 테스트, GitHub Actions 시간별 실행.' },
      { type: 'feature', title: '감사 로그 CSV 내보내기', note: '관리자 /admin/audit 에서 필터 기반 CSV export (최대 5,000행).' },
      { type: 'feature', title: 'Schema.org 구조화 데이터', note: 'Organization·WebSite·SoftwareApplication·FAQPage JSON-LD.' },
      { type: 'feature', title: 'SLO 공개 /status', note: '가용성·P95·RTO·RPO·보안 응답 목표 공개.' },
    ],
  },
  {
    date: '2026-04-20',
    version: 'v0.18',
    items: [
      { type: 'feature', title: '페르소나 엔진 라이프사이클', note: '클럽·프로젝트·개인 3계층 페르소나 + 50% 상속 모델.' },
      { type: 'feature', title: '운영자 대시보드 /clubs/[slug]/operator', note: '팀 현황 보드 + 멤버 오버뷰 + pending draft 카드.' },
      { type: 'improvement', title: 'IA 재정비 74 라우트', note: 'Electric Indigo 브랜드 적용, Container 1400px 통일, navbar 정비.' },
      { type: 'security', title: 'RLS CRITICAL 7건 하드닝', note: 'profiles·error_logs·direct_messages·pending_discord_setups·member_activity_stats 등.' },
    ],
  },
  {
    date: '2026-04-19',
    version: 'v0.17',
    items: [
      { type: 'feature', title: '공지사항 시스템', note: '클럽 단위 공지 발행 + 읽음 처리 + 알림 연동.' },
      { type: 'feature', title: '팀 하네스 엔지니어링', note: 'Discord 메시지·GitHub 커밋·회의록을 주간 업데이트 데이터로 자동 수집.' },
      { type: 'security', title: 'H1 WITH CHECK 하드닝', note: '23개 UPDATE 정책에 WITH CHECK 추가 — cross-tenant 데이터 오염 방지.' },
    ],
  },
  {
    date: '2026-04-18',
    version: 'v0.16',
    items: [
      { type: 'feature', title: 'RLS 보안 감사', note: '63 migration 전수 검토. CRITICAL 7·HIGH 7·MEDIUM 4 발견.' },
      { type: 'feature', title: '페르소나 엔진 설계', note: 'mirra.my 스타일 템플릿, Discord corpus 자동 학습, 외부 SNS 발행 구조.' },
    ],
  },
  {
    date: '2026-04-15',
    version: 'v0.15',
    items: [
      { type: 'feature', title: 'GitHub DevSync', note: 'GitHub ↔ Discord ↔ Ghostwriter 개발 활동 자동 연동.' },
    ],
  },
]
