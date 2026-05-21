// Discord Interactions 공용 상수 — route.ts 와 핸들러 파일 전체에서 공유.
// 숫자 값은 Discord 공식 문서 Interactions API 스펙.

// Interaction Types
export const PING = 1
export const APPLICATION_COMMAND = 2
export const MESSAGE_COMPONENT = 3 // 버튼/Select 클릭
export const MODAL_SUBMIT = 5 // Modal 제출

// Interaction Response Types
export const PONG = 1
export const CHANNEL_MESSAGE = 4
export const DEFERRED_CHANNEL_MESSAGE = 5 // "봇이 생각 중..." → 나중에 followup
export const UPDATE_MESSAGE = 7 // 원본 메시지 수정 (버튼 제거 등)
// 9 = MODAL (modals.ts 의 build*Modal 함수가 직접 반환)

// EPHEMERAL flag — 본인에게만 보이는 메시지
export const EPHEMERAL = 64
