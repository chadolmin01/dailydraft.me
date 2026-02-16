# Event Crawler

웹/SNS 크롤링 기반 창업 행사 수집 시스템

## 수집 대상

### 1차: 웹 크롤링 (구현 완료)

| 소스 | 콘텐츠 | 상태 |
|------|--------|------|
| 콘테스트코리아 | 공모전/창업대회 | ✅ |
| 링커리어 | 대외활동/공모전 | ✅ |
| 온오프믹스 | 네트워킹/세미나 | ✅ |
| DevPost | 해커톤 | ✅ |

### 2차: SNS 크롤링 (Placeholder)

| 플랫폼 | 타겟 | 상태 |
|--------|------|------|
| 인스타그램 | #창업대회 #해커톤 | 🔜 |
| 페이스북 | 스타트업 이벤트 | 🔜 |
| 트위터/X | 해커톤 모집 키워드 | 🔜 |

## 설치

```bash
cd event-crawler
npm install
```

## 환경 변수

`.env.example`을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정합니다:

```bash
cp .env.example .env
```

### Direct DB 모드 (권장)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### API 모드 (대안)
```env
BACKEND_API_URL=http://localhost:3000
CRON_SECRET=your_cron_secret
```

## 사용법

### 기본 크롤링

```bash
# 모든 소스 크롤링
npm run crawl:all

# 특정 소스만 크롤링
npm run crawl:contestkorea
npm run crawl:linkareer
npm run crawl:onoffmix
npm run crawl:devpost
```

### 옵션

```bash
# 테스트 (DB 저장 안함)
npm run crawl -- --source=contestkorea --dry-run

# 페이지 수 제한
npm run crawl -- --source=linkareer --max-pages=3

# 상세 로그
npm run crawl -- --source=all --verbose

# 특정 카테고리만
npm run crawl -- --source=contestkorea --categories=startup,contest
```

## 크롤링 규칙

- robots.txt 존중
- 요청 간격: 3초 이상
- User-Agent 명시
- 공개 정보만 수집

## 프로젝트 구조

```
event-crawler/
├── src/
│   ├── crawlers/           # 웹 크롤러
│   │   ├── base-crawler.ts
│   │   ├── contestkorea.ts
│   │   ├── linkareer.ts
│   │   ├── onoffmix.ts
│   │   └── devpost.ts
│   │
│   ├── social/             # SNS 크롤러 (2차)
│   │   ├── instagram.ts
│   │   ├── facebook.ts
│   │   └── twitter.ts
│   │
│   ├── transformers/       # 데이터 변환
│   │   └── [source]-transformer.ts
│   │
│   ├── utils/              # 유틸리티
│   │   ├── browser.ts
│   │   ├── rate-limiter.ts
│   │   └── logger.ts
│   │
│   └── sync/               # DB 동기화
│       └── sync-manager.ts
│
└── scripts/
    └── run-crawler.ts
```

## Backend 연동

크롤링된 이벤트는 다음 두 가지 방식으로 backend와 연동됩니다:

### 1. Direct DB (기본)
- Supabase 직접 연결
- AI 태깅/임베딩은 backend에서 별도 처리

### 2. API 모드
- `POST /api/cron/ingest-crawled-events` 호출
- Backend에서 AI 처리 수행

## 데이터 플로우

```
크롤러 (Puppeteer + Cheerio)
    ↓
Raw Events (소스별 형식)
    ↓
Transformer (정규화)
    ↓
TransformedEvent (통일된 형식)
    ↓
SyncManager (DB 저장)
    ↓
Backend AI Pipeline (태깅 + 임베딩)
    ↓
startup_events 테이블
```

## 검증

```bash
# 타입 체크
npm run typecheck

# 드라이런으로 수집 테스트
npm run crawl -- --source=contestkorea --dry-run --max-pages=1 --verbose
```
