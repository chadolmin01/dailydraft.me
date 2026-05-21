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
    version: 'v0.22',
    items: [
      { type: 'feature', title: '엔터프라이즈 도입 페이지 /enterprise', note: '8개 기능 카드 + 4단계 도입 절차 + 가격 협의 + FAQ 4개.' },
      { type: 'feature', title: '법적 고지 모음 /legal 인덱스 + 3종 신규 페이지', note: '/legal/subprocessors (수탁업체 12곳) · /legal/retention (보관·파기 12유형) · /legal/cookies (쿠키 전수). PIPA·DPA 대응.' },
      { type: 'feature', title: '/security · /accessibility · /contact · /about · /press · /brand · /stats · /maintenance', note: '외부 공개 라우트 8종 신설. 엔터프라이즈 실사·언론·파트너십 진입점.' },
      { type: 'feature', title: '/admin/metrics + /admin/health 내부 대시보드', note: 'KPI 30일 trend SVG 스파크라인 + 10초 폴링 p50/p95/p99 레이턴시.' },
      { type: 'feature', title: '/status/feed.xml Atom 인시던트 피드', note: '엔터프라이즈 모니터링 도구가 Draft 인시던트 자동 구독 가능.' },
      { type: 'feature', title: '/api/admin/audit/export CSV + 역감사', note: '감사 로그 반출 자체도 audit_logs 에 기록. 10,000 rows 한도.' },
      { type: 'security', title: 'CSP report-uri + /api/csp-report', note: 'CSP 위반이 PostHog 로 자동 수집. 보안 이벤트 관측 체계.' },
      { type: 'security', title: 'AI 크롤러 전면 차단 (robots.ts)', note: 'GPTBot·ChatGPT-User·CCBot·anthropic-ai·Claude-Web·Google-Extended·PerplexityBot·Bytespider.' },
      { type: 'improvement', title: 'Footer 5컬럼 재구성', note: '법적 컬럼 독립 · 연락 컬럼 신설 · 신규 정책 페이지 전수 노출.' },
      { type: 'improvement', title: '404·error 페이지 폴리시', note: '빠른 진입 4개 + /status 전역 장애 링크 + [Bug] mailto.' },
      { type: 'improvement', title: 'PWA manifest + JSON-LD ContactPoint', note: 'shortcuts 4종 · orientation · customer/technical/security 연락처 선언.' },
      { type: 'docs', title: 'humans.txt · ads.txt · opensearch.xml', note: '브랜드 신뢰 신호 + 브라우저 주소창 검색엔진 등록.' },
    ],
  },
  {
    date: '2026-04-22',
    version: 'v0.21',
    items: [
      { type: 'feature', title: '전역 Cmd+K 커맨드 팔레트', note: '어디서든 프로젝트·사람·클럽 통합 검색. cmdk 기반, 300ms 디바운스·Promise.allSettled 병렬 조회.' },
      { type: 'feature', title: '공개 신뢰 센터 /trust', note: '엔터프라이즈 실사 단일 출발점. SLO·개인정보·보안·약관·릴리스·Meta 심사·실사자료 요청 7섹션 통합.' },
      { type: 'feature', title: '공개 로드맵 /roadmap + Atom 피드', note: '분기별 theme·items + /roadmap/feed.xml RSS 구독. Changelog 와 대칭.' },
      { type: 'feature', title: '공개 인시던트 이력 /status', note: 'status_incidents 테이블 + API. SEV-0/1 등급 장애가 발생하면 자동 노출. append-only.' },
      { type: 'feature', title: '공개 지표 API + 랜딩 LiveMetrics', note: '/api/metrics/public 5 지표 + baseline 가드 있는 Hero 아래 노출. daily_metrics_snapshots cron.' },
      { type: 'feature', title: 'Core Web Vitals 자체 계측', note: 'web-vitals 5.2 + PostHog 이벤트. LCP/INP/CLS/FCP/TTFB 대시보드 축적.' },
      { type: 'feature', title: '가입 직후 Welcome 이메일', note: 'Resend 템플릿 + 중복 방지 로직. 재학생 인증 자동 감지 시 안내 카드 포함.' },
      { type: 'feature', title: '기관 리포트 PDF 인쇄·저장', note: '학기말 실적 보고 직결.' },
      { type: 'feature', title: '공개 프로필 QR 명함 + 클럽 초대 QR 자체 호스팅', note: '/api/qr SVG 고품질, 외부 qrserver 의존성 제거.' },
      { type: 'feature', title: '공개 FAQ /help + Atom 피드', note: '5 카테고리 17 질문. HelpWidget 에 전체 보기 링크 연결.' },
      { type: 'security', title: 'RLS H4 — platform_admins 테이블', note: 'JWT app_metadata.is_admin 의존 제거 1단계. is_platform_admin() RPC + 기존 admin 자동 마이그레이션.' },
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
