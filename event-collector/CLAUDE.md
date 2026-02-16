# Event Collector Module

스타트업 행사(해커톤, 창업대회, 네트워킹 등)를 외부 소스에서 수집하는 독립 모듈입니다.

## 구조

```
event-collector/
├── src/
│   ├── index.ts              # 메인 진입점
│   ├── types/                # 타입 정의
│   ├── sources/              # 소스별 수집기
│   │   ├── base-collector.ts # 추상 베이스 클래스
│   │   ├── devpost/          # Devpost 해커톤
│   │   └── meetup/           # Meetup 이벤트
│   ├── ai/                   # AI 태그 분류 및 임베딩
│   ├── database/             # Supabase 클라이언트
│   ├── sync/                 # 동기화 오케스트레이터
│   └── utils/                # 유틸리티 함수
└── scripts/                  # 실행 스크립트
```

## 주요 명령어

```bash
# 개발 모드
npm run dev

# 전체 동기화 실행
npm run sync

# 개별 소스 테스트
npm run test:devpost
npm run test:meetup

# 타입 체크
npm run typecheck
```

## 환경 변수

`.env.example` 파일을 `.env`로 복사하고 값을 설정하세요.

## 데이터 흐름

1. 각 소스(Devpost, Meetup)에서 이벤트 수집
2. 공통 `TransformedEvent` 형식으로 변환
3. AI로 태그 분류 및 임베딩 생성
4. `startup_events` 테이블에 저장

## 참조 코드

이 모듈은 `backend/src/lib/events/` 및 `backend/src/lib/ai/`의 패턴을 재사용합니다.
