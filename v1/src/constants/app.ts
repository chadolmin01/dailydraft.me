/**
 * 앱 전역 URL 상수
 *
 * process.env.NEXT_PUBLIC_APP_URL이 설정되어 있으면 그 값을 사용하고,
 * 없으면 프로덕션 도메인을 fallback으로 사용한다.
 * 하드코딩된 URL을 20곳에 흩뿌리는 대신 여기서 한 곳에서 관리.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'
