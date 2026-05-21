import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: 'Draft 의 개인정보 수집·이용·보관에 관한 안내입니다.',
}

// PIPA + Google OAuth verification 기준. V1 베타 단계라 간결하게 — 사용자 늘면 업데이트.
// 운영자(매니저) 본인 정보는 사이트 footer 등에서 채워 넣을 것 (TODO 표시 부분).

const EFFECTIVE_DATE = '2026년 5월 22일'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-canvas py-section px-4">
      <article className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-display-lg text-ink">개인정보 처리방침</h1>
          <p className="text-body-sm text-muted">시행일: {EFFECTIVE_DATE}</p>
        </header>

        <Section title="1. 수집하는 개인정보 항목">
          <p>Draft 는 다음 정보를 수집합니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Google 계정 식별자 (이메일, 이름, 프로필 사진)</li>
            <li>Google Drive 폴더 / 파일 메타데이터 (제목, 수정일, 크기)</li>
            <li>Google Sheets 의 명단 시트 내용 (행 단위)</li>
            <li>매니저가 챗봇에 입력한 메시지와 응답 내역</li>
            <li>로그인 일시, 접속 IP, 브라우저 정보 (보안 감사용)</li>
          </ul>
          <p>파일 본문은 별도로 저장하지 않으며, 매트릭스 계산 시점에만 일시적으로 읽습니다.</p>
        </Section>

        <Section title="2. 수집·이용 목적">
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>매니저의 운영 폴더 진척도를 시각화하고 미제출 팀을 안내</li>
            <li>매니저의 자연어 질의에 대한 응답 생성</li>
            <li>Gmail 초안 생성 (자동 발송하지 않습니다)</li>
            <li>서비스 유지·보수 및 보안 감사</li>
          </ul>
        </Section>

        <Section title="3. 보관 기간">
          <p>
            매니저 계정 삭제 요청 시 즉시 파기합니다. 미요청 시에도 서비스 종료 시 모든
            기록을 파기합니다. 채팅 기록은 매니저가 직접 삭제할 수 있도록 V1.5 에서
            제공할 예정입니다.
          </p>
        </Section>

        <Section title="4. 제3자 제공">
          <p>
            Draft 는 매니저의 개인정보를 제3자에게 제공하지 않습니다. 단, 아래 서비스
            제공자에게 처리를 위탁합니다.
          </p>
          <table className="w-full text-body-sm border-collapse">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left py-2 pr-4 text-title-sm text-ink">위탁받는 자</th>
                <th className="text-left py-2 text-title-sm text-ink">위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <RowKv k="Google LLC" v="OAuth 인증, Drive/Sheets/Gmail API" />
              <RowKv k="Supabase Inc." v="데이터베이스 호스팅 (싱가포르 리전)" />
              <RowKv k="Vercel Inc." v="웹 호스팅" />
              <RowKv k="Anthropic PBC" v="챗봇 응답 생성 (Claude API)" />
            </tbody>
          </table>
          <p>
            각 위탁사는 자체 개인정보 처리방침을 따르며, 본 서비스는 필요 최소한의
            데이터만 전송합니다.
          </p>
        </Section>

        <Section title="5. 정보주체의 권리">
          <p>매니저는 언제든 다음 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>본인 정보 열람 (워크스페이스 내 표시)</li>
            <li>본인 정보 수정 (Google 계정 정보 변경 시 자동 반영)</li>
            <li>본인 정보 삭제 (아래 연락처로 요청)</li>
            <li>Google 권한 회수 (Google 계정 보안 페이지에서 Draft 제거)</li>
          </ul>
        </Section>

        <Section title="6. 보안 조치">
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>전송 구간 TLS 1.2 이상 암호화</li>
            <li>OAuth 토큰은 서버 측에서만 보관하며 클라이언트에 노출하지 않습니다 (Picker 제외)</li>
            <li>데이터베이스 접근은 service role 키를 가진 백엔드 라우트에서만 가능</li>
            <li>요청 단위 Cross-Origin 차단, CSP 헤더 적용</li>
          </ul>
        </Section>

        <Section title="7. 변경 이력">
          <p>
            본 방침은 법령 변경 또는 서비스 정책 변경에 따라 개정될 수 있습니다. 개정
            시 본 페이지를 통해 공지합니다.
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{EFFECTIVE_DATE}: 최초 시행 (V1 베타)</li>
          </ul>
        </Section>

        <Section title="8. 연락처">
          <p>
            본 방침과 관련된 문의는 아래로 연락해 주십시오.
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>운영자: {/* TODO: 실명 또는 운영기관명 */} Draft 운영자</li>
            <li>이메일: {/* TODO: 운영자 이메일 */} hello@dailydraft.me</li>
          </ul>
        </Section>

        <footer className="border-t border-hairline pt-6">
          <a href="/" className="text-body-sm text-muted hover:text-ink transition-colors">
            ← 홈으로
          </a>
        </footer>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-display-sm text-ink">{title}</h2>
      <div className="text-body-md text-body space-y-3">{children}</div>
    </section>
  )
}

function RowKv({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-hairline-soft">
      <td className="py-2 pr-4 text-body-sm text-ink align-top">{k}</td>
      <td className="py-2 text-body-sm text-muted">{v}</td>
    </tr>
  )
}
