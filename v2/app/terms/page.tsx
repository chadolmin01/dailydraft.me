import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관',
  description: 'Draft 서비스 이용에 관한 약관입니다.',
}

const EFFECTIVE_DATE = '2026년 5월 22일'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-canvas py-section px-4">
      <article className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-display-lg text-ink">이용약관</h1>
          <p className="text-body-sm text-muted">시행일: {EFFECTIVE_DATE}</p>
        </header>

        <Section title="제1조 (목적)">
          <p>
            이 약관은 Draft (이하 &quot;서비스&quot;) 의 이용과 관련하여 운영자와 매니저
            사이의 권리·의무를 정함을 목적으로 합니다. 본 서비스는 현재 V1 베타 단계로,
            창업기관 운영자(매니저) 가 Google Drive · Sheets · Gmail 자료를 한 화면에서
            관리할 수 있도록 보조합니다.
          </p>
        </Section>

        <Section title="제2조 (정의)">
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>매니저: 본 서비스에 Google 계정으로 로그인하여 워크스페이스를 운영하는 자</li>
            <li>멤버: 매니저가 관리하는 팀 구성원. 본 서비스에 직접 로그인하지 않음</li>
            <li>워크스페이스: 매니저당 1개의 운영 단위</li>
            <li>폴더: Google Drive 폴더와 (선택적으로) Google Sheets 명단을 연결한 운영 단위</li>
          </ul>
        </Section>

        <Section title="제3조 (계정과 권한)">
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>매니저는 본인 명의의 Google 계정으로 로그인해야 합니다.</li>
            <li>매니저는 Google Drive (읽기), Sheets (읽기·쓰기), Gmail (초안 작성) 권한을 본 서비스에 부여합니다.</li>
            <li>매니저는 언제든 Google 계정 보안 페이지에서 Draft 권한을 회수할 수 있으며, 이 경우 본 서비스 이용이 즉시 중단됩니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (서비스의 범위와 한계)">
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>본 서비스는 Drive 의 파일명을 기준으로 진행도를 계산합니다. 파일명이 규칙 (예: <code className="filename">[FLIP1기_3주차]_3팀_과제명.pdf</code>) 에 맞지 않으면 매트릭스에 반영되지 않습니다.</li>
            <li>본 서비스는 Gmail 을 자동 발송하지 않습니다. 매니저가 mailto 링크를 통해 직접 발송합니다.</li>
            <li>본 서비스는 V1 베타 단계로, 데이터 손실·일시 중단·기능 변경이 발생할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제5조 (매니저의 의무)">
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>매니저는 자신의 Google 계정 로그인 정보를 안전하게 관리할 의무가 있습니다.</li>
            <li>매니저가 운영하는 멤버(팀 구성원) 에게 본 서비스가 Drive 자료를 읽는다는 사실을 알리고 동의를 구해야 합니다.</li>
            <li>매니저는 본 서비스를 이용하여 타인의 개인정보를 침해하거나 법령을 위반하는 행위를 해서는 안 됩니다.</li>
          </ol>
        </Section>

        <Section title="제6조 (요금)">
          <p>
            V1 베타 기간 동안 본 서비스는 무료로 제공됩니다. 정식 출시 시 별도 공지 후
            유료 전환될 수 있으며, 기존 매니저에게는 사전 안내합니다.
          </p>
        </Section>

        <Section title="제7조 (책임의 제한)">
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>본 서비스는 Google · Supabase · Vercel · Anthropic 등 외부 서비스를 활용합니다. 해당 서비스 장애로 인한 일시 중단의 직접 책임을 지지 않습니다.</li>
            <li>본 서비스의 챗봇 응답은 매니저의 의사결정을 보조할 뿐, 최종 검토와 발신은 매니저 책임입니다.</li>
            <li>본 서비스를 통한 메일 초안이 잘못 작성된 경우, 매니저가 직접 검토하여 발송 여부를 결정합니다.</li>
          </ol>
        </Section>

        <Section title="제8조 (계약의 해지)">
          <p>
            매니저는 언제든 본 서비스 이용을 중단할 수 있으며, 이 경우 운영자에게
            계정 삭제를 요청할 수 있습니다. 운영자는 약관 위반 또는 법령 위반이 확인된
            경우 사전 통지 후 서비스 이용을 제한할 수 있습니다.
          </p>
        </Section>

        <Section title="제9조 (약관의 변경)">
          <p>
            운영자는 필요 시 본 약관을 변경할 수 있으며, 변경된 약관은 본 페이지를 통해
            공지합니다. 매니저가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고
            계정 삭제를 요청할 수 있습니다.
          </p>
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
