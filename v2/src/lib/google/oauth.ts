// Google OAuth 2.0 raw 헬퍼.
// V2 는 Supabase Auth provider 가 아니라 자체 OAuth 흐름을 쓴다 (refresh_token 직접 관리).
// 콜백에서 id_token 으로 Supabase signInWithIdToken → 세션 세팅.

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

// CLAUDE.md Hard Rule: OAuth scope 최소 (drive.readonly, spreadsheets, gmail.compose)
// + openid/email/profile (Supabase signInWithIdToken 용 + 기본 식별자)
export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.compose',
] as const

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',   // refresh_token 받기
    prompt: 'consent',        // 매번 동의 받아서 refresh_token 보장
    state,
    include_granted_scopes: 'true',
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string  // 첫 동의 시에만 옴 (prompt=consent 로 강제)
  expires_in: number      // seconds
  token_type: 'Bearer'
  scope: string
  id_token: string        // JWT (Supabase signInWithIdToken 용)
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: 'authorization_code',
  })

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Google token exchange failed: ${res.status} ${errText}`)
  }

  return res.json() as Promise<GoogleTokenResponse>
}

export async function refreshAccessToken(refresh_token: string): Promise<Omit<GoogleTokenResponse, 'refresh_token' | 'id_token'>> {
  const body = new URLSearchParams({
    refresh_token,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: 'refresh_token',
  })

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Google token refresh failed: ${res.status} ${errText}`)
  }

  return res.json()
}
