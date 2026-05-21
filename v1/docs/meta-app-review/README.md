# Meta App Review 제출 가이드 (Threads · Instagram)

이 폴더는 Meta for Developers 앱 리뷰 제출에 필요한 자료를 모아둔 곳입니다.
LinkedIn은 이미 연동 완료. Threads·Instagram은 Meta 앱 리뷰 승인이 있어야 실제 발행이 가능합니다.

## 제출 우선순위

| 채널 | 우선순위 | 이유 |
|------|---------|------|
| Threads | 1순위 | 개인 계정 그대로 OAuth 가능, 텍스트만으로 발행 가능 |
| Instagram | 2순위 | 고객이 비즈니스 전환 + FB 페이지 연결 필요, 이미지 필수 |

## 체크리스트

### 단계 0 — 사전 준비
- [ ] Meta Business 계정 생성 (https://business.facebook.com)
- [ ] 사업자등록증 업로드 → 비즈니스 인증 신청 (1~3일)
- [ ] Meta for Developers 앱 생성 (https://developers.facebook.com/apps) — 유형: Business
- [ ] 앱 아이콘 1024×1024 PNG 업로드
- [ ] 앱 카테고리: "비즈니스 및 페이지"

### 단계 1 — Threads 제품 추가
- [ ] 앱 대시보드 → "제품 추가" → "Threads API"
- [ ] OAuth Redirect URIs 등록:
  - `https://draft.co.kr/api/oauth/threads/callback` (프로덕션)
  - `http://localhost:3000/api/oauth/threads/callback` (개발, 테스트 유저만)
- [ ] App Secret, App ID를 Vercel 환경변수에 등록:
  - `THREADS_CLIENT_ID`
  - `THREADS_CLIENT_SECRET`
- [ ] Threads 테스트 유저 등록 (본인 계정) → 리뷰 전에도 스모크 테스트 가능

### 단계 2 — 리뷰 제출 자료
- [ ] `use-case.md` — 유스케이스 설명 (권한별)
- [ ] `demo-video-script.md` — 데모 영상 시나리오
- [ ] `privacy-policy-checklist.md` — 개인정보처리방침 필수 항목
- [ ] 데모 영상 녹화 (3~5분, MP4, <100MB)

### 단계 3 — 제출 & 대응
- [ ] App Review → Permissions → `threads_content_publish` 신청
- [ ] 첨부: 데모 영상, 유스케이스 텍스트, 테스트 계정 로그인 정보
- [ ] 심사 기간: 평균 3~10일
- [ ] 반려 시: 사유 해석 → 데모 영상 재촬영 or 유스케이스 보강 → 재제출

## 참고 링크

- Threads API 공식 문서: https://developers.facebook.com/docs/threads
- Instagram Graph API: https://developers.facebook.com/docs/instagram-api/
- App Review 정책: https://developers.facebook.com/docs/app-review/
- Threads 권한 리스트: https://developers.facebook.com/docs/threads/overview
