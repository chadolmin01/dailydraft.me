/**
 * Supabase Auth 에러 메시지 한국어 매핑.
 * error.message 또는 error.code 기반으로 매핑하고, 매칭 없으면 generic 한국어 문구 반환.
 */
const MESSAGE_MAP: Array<[RegExp | string, string]> = [
  [/invalid login credentials/i, '이메일 또는 비밀번호가 올바르지 않습니다'],
  [/email not confirmed/i, '이메일 인증을 완료해주세요. 받은 편지함을 확인해주세요'],
  [/user already registered/i, '이미 가입된 이메일입니다. 로그인을 시도해주세요'],
  [/email rate limit/i, '메일 발송이 일시적으로 제한되었습니다. 잠시 후 다시 시도해주세요'],
  [/password should be at least/i, '비밀번호는 최소 6자 이상이어야 합니다'],
  [/user not found/i, '등록되지 않은 계정입니다'],
  [/weak password/i, '비밀번호가 너무 약합니다. 숫자·문자·특수문자를 조합해주세요'],
  [/over request rate limit/i, '요청이 너무 많습니다. 잠시 후 다시 시도해주세요'],
  [/network|fetch/i, '네트워크 오류가 발생했습니다. 연결을 확인해주세요'],
  [/oauth|provider/i, 'OAuth 인증 중 오류가 발생했습니다'],
]

export function translateAuthError(message: string | undefined): string {
  if (!message) return '인증 중 오류가 발생했습니다'
  for (const [pattern, korean] of MESSAGE_MAP) {
    if (typeof pattern === 'string' ? message === pattern : pattern.test(message)) {
      return korean
    }
  }
  return '인증 중 오류가 발생했습니다. 다시 시도해주세요'
}
