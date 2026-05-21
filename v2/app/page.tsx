// 랜딩 / 로그인. 미들웨어가 로그인 상태면 /workspace 로 보내므로 여기는 항상 비로그인 상태.

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string; revoke?: string }>
}) {
  const { error, deleted, revoke } = await searchParams
  const errorMessage = error ? mapError(error) : null
  const deletedMessage = deleted === '1'
    ? '계정과 데이터가 삭제되었습니다. Google 권한도 회수하시려면 아래 링크에서 Draft 를 제거해 주세요.'
    : null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-display-md text-ink">Draft</h1>
          <p className="text-body-md text-muted">창업기관 운영자 워크스페이스</p>
        </div>

        <a
          href="/api/auth/google"
          className="inline-flex items-center justify-center gap-3 h-12 px-6 rounded-md bg-ink text-canvas font-body text-button font-medium transition-colors hover:bg-body-strong"
        >
          Google 계정으로 시작하기
        </a>

        {errorMessage ? (
          <p className="text-body-sm text-muted-soft">{errorMessage}</p>
        ) : null}

        {deletedMessage ? (
          <div className="rounded-md border border-hairline bg-surface-soft p-4 text-left space-y-2">
            <p className="text-body-sm text-ink">{deletedMessage}</p>
            {revoke ? (
              <a
                href={revoke}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm text-ink underline underline-offset-2 hover:opacity-70"
              >
                Google 권한 페이지로 이동 ↗
              </a>
            ) : null}
          </div>
        ) : null}

        <p className="text-caption text-muted-soft pt-section">
          시작하면 Draft 가 매니저님의 Google Drive · Sheets · Gmail 에 접근합니다.
        </p>

        <footer className="pt-8 flex items-center justify-center gap-5 text-caption text-muted-soft">
          <a href="/privacy" className="hover:text-ink transition-colors">개인정보 처리방침</a>
          <span className="opacity-40">·</span>
          <a href="/terms" className="hover:text-ink transition-colors">이용약관</a>
        </footer>
      </div>
    </main>
  )
}

function mapError(code: string): string {
  switch (code) {
    case 'access_denied':
      return 'Google 권한 동의가 취소되었습니다.'
    case 'state_mismatch':
      return '인증 상태가 일치하지 않습니다. 다시 시도해 주세요.'
    case 'no_refresh_token':
      return '재인증 토큰을 받지 못했습니다. Google 계정 권한에서 Draft 를 제거한 뒤 다시 시도해 주세요.'
    case 'supabase_signin_failed':
      return '세션 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.'
    case 'token_save_failed':
      return '토큰 저장에 실패했습니다. 관리자에게 문의해 주세요.'
    case 'token_exchange_failed':
      return 'Google 토큰 교환에 실패했습니다.'
    case 'missing_code_or_state':
      return '인증 응답이 잘못되었습니다.'
    case 'no_id_token':
      return 'Google ID 토큰을 받지 못했습니다.'
    default:
      return `오류가 발생했습니다. (${code})`
  }
}
