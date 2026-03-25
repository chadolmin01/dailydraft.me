# Idea Snap

모바일 최적화 웹앱으로, 일상에서 사진과 메모를 독립적인 "인사이트 파편"으로 저장합니다.

## 핵심 철학

- **사진**: 현장의 불편한 상황/문제를 캡처
- **메모**: 머릿속의 파편화된 기술/해결책 기록
- 둘은 **독립적인 파편**으로 저장되며, 억지로 연결하지 않음

## 기술 스택

- **Frontend**: Next.js 15 + Tailwind CSS
- **Backend/DB**: Supabase (Draft main과 동일 프로젝트 공유)
- **Mobile**: PWA + Appintous 웹뷰 패키징

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일이 이미 Draft main과 동일한 Supabase 키로 설정되어 있습니다.

### 3. 데이터베이스 마이그레이션

Supabase SQL Editor에서 다음 파일들을 순서대로 실행:

1. `supabase/migrations/001_create_fragments.sql` - fragments 테이블 생성
2. `supabase/migrations/002_create_fragments_storage.sql` - Storage 버킷 생성

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3001 에서 앱에 접속합니다.

## 프로젝트 구조

```
idea-snap/
├── app/
│   ├── (auth)/           # 인증 관련 페이지
│   │   ├── login/        # 로그인 페이지
│   │   └── callback/     # OAuth 콜백
│   ├── (main)/           # 메인 앱 페이지
│   │   ├── page.tsx      # 홈/캡처 화면
│   │   └── inbox/        # 파편 목록
│   └── api/fragments/    # API 엔드포인트
├── components/
│   ├── capture/          # 캡처 컴포넌트
│   ├── fragments/        # 파편 관련 컴포넌트
│   └── ui/               # UI 컴포넌트
├── lib/
│   ├── supabase/         # Supabase 클라이언트
│   └── hooks/            # Custom hooks
├── context/              # React Context
├── types/                # TypeScript 타입
└── supabase/migrations/  # DB 마이그레이션
```

## MVP 기능

- [x] Google/GitHub OAuth 로그인
- [x] 카메라로 사진 캡처
- [x] 메모 텍스트 입력
- [x] 위치 정보 첨부
- [x] 파편 목록 조회 (인박스)
- [x] 파편 삭제/보관
- [x] PWA 매니페스트

## Draft Main 연동

동일한 Supabase 프로젝트를 사용하여 Draft main 계정으로 로그인 가능합니다.

## 모바일 최적화

- PWA 지원 (홈 화면에 설치 가능)
- Safe area 처리 (노치/홈 인디케이터)
- 최소 탭 영역 44x44px
- 터치 최적화

## 향후 계획

- [ ] 챌린지 기능
- [ ] 피드 기능
- [ ] Draft로 전송 (AI 인사이트 생성)
- [ ] 태그 자동 추천
