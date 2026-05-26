// 멤버용 토큰 입력 페이지 stub — Phase C 에서 구현 (인증 X, 토큰 기반).
// SMS 또는 이메일 링크로 받은 URL: http://localhost:3100/m/<token>
export default function MemberSubmitPage({ params }: { params: { token: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">주간 보고서 제출</h1>
      <p className="text-muted">토큰: <code className="bg-surface px-2 py-1 rounded">{params.token}</code></p>
      <p className="text-sm text-muted mt-4">Phase C 작업 영역 — 폼 렌더링 + 제출 처리.</p>
    </div>
  )
}
