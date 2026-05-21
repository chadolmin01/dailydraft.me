# Spec

## V1 Goal

FLIP 1기 8팀 운영(2026-06-26 데모데이)에 Lee 본인이 직접 투입해서 가설 검증.

## Users

- **Manager** (Draft 사용자): Lee, 창업기관 매니저
- **Member** (비사용자): 8팀 멤버, Drive 업로드 + Gmail 응답만 함

## Features (V1)

### F1. Workspace
- 1 manager = 1 workspace (V1)
- 워크스페이스 이름, 소유자

### F2. Folders
- 도메인 단위 폴더 (예: FLIP, KVP, 창업보육센터)
- 각 폴더에 Google Drive 폴더 ID + Sheets ID 연결

### F3. Chatbot (Left Panel)
- Claude API + tool use
- Tools: list_drive_files, read_sheet, write_sheet, compose_email
- 대화 기록 저장

### F4. Progress Matrix (Right Panel)
- 팀 × 주차 매트릭스
- Cell state: done / pending / late / empty
- 데이터 소스: Drive 파일명 파싱 × Sheets 명단
- 실시간 계산 (DB 캐싱 X)

### F5. Filename Convention
- 형식: `[{program}_{N}주차]_{팀명}_{과제명}.{ext}`
- 예: `[FLIP1기_3주차]_3팀_MVP기획서.pdf`
- 파싱 실패 파일은 별도 표시

### F6. Email Draft (No Auto-Send)
- 챗봇이 본문 생성
- `mailto:` 링크로 Gmail 새 창 띄움
- 자동 발송 X (Google 검증 회피)

## Out of Scope (V1)

- 멀티 매니저 워크스페이스 → V2
- hwp 자동 처리 → V2
- 카카오 알림톡 → V2
- Gmail 자동 발송 → V2
- 결제/구독 → V2
- 모바일 반응형 → V2
- 멤버용 UI → 영구 안 만듦

## Success Criteria (V1)

1. Lee가 매주 일요일 밤 Draft로 FLIP 1기 진척 확인
2. 운영 시간 주 5시간 → 주 30분 단축
3. 6/26 데모데이에서 "이 행사가 Draft로 운영되었다" 시연 가능

## Validation Targets

- 기술: Drive + Sheets + Gmail 한 화면 제어 가능?
- UX: 챗봇 + 폴더 구조가 매니저 멘탈모델에 맞나?
- 가치: 운영 시간 단축이 측정 가능한 수준인가?
