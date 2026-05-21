import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '도움말',
  description: 'Draft 사용법 — 폴더 연결, 파일명 규칙, 챗봇 활용',
}

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-canvas py-section px-4">
      <article className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-display-lg text-ink">도움말</h1>
          <p className="text-body-md text-muted">
            5분 안에 Draft 의 모든 기능을 익힐 수 있도록 정리했습니다.
          </p>
        </header>

        <Section title="1. 폴더 연결">
          <p>
            매니저가 운영하는 단위 (예: FLIP 1기, KVP 2기) 마다 Google Drive 폴더를
            하나씩 연결합니다.
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-2">
            <li>워크스페이스에서 <strong>폴더 연결</strong> 클릭</li>
            <li><strong>Drive 에서 폴더 선택</strong> (Picker) 또는 폴더 이름 일부 입력으로 검색</li>
            <li>이름 (예: &quot;FLIP 1기&quot;), program (예: &quot;FLIP1기&quot;), 프로그램 시작일 입력</li>
            <li>(선택) 명단이 적힌 Google Sheets 도 함께 연결</li>
          </ol>
          <p className="text-caption text-muted-soft">
            팁: Drive URL 을 그대로 붙여넣어도 ID 가 자동으로 추출됩니다.
          </p>
        </Section>

        <Section title="2. 파일명 규칙">
          <p>매트릭스를 그리려면 파일명이 다음 규칙을 따라야 합니다.</p>
          <pre className="rounded-md bg-surface-soft p-4 font-mono text-mono-md text-ink overflow-x-auto">
{`[프로그램_N주차]_팀명_과제명.확장자

예시:
[FLIP1기_3주차]_3팀_MVP기획서.pdf
[FLIP1기_5주차]_7팀_시장조사_v2.docx`}
          </pre>
          <p>
            규칙에 안 맞는 파일은 매트릭스에 반영되지 않습니다. 파일 탭에서 미매칭
            목록을 확인할 수 있습니다.
          </p>
          <p className="text-caption text-muted-soft">
            팀에 이 규칙을 한 번 카톡으로 공지하면 그 다음부터는 자동입니다.
          </p>
        </Section>

        <Section title="3. 챗봇 사용 예시">
          <p>좌측 패널의 챗봇에게 한국어로 질문하면 폴더 데이터를 즉석에서 분석합니다.</p>
          <ul className="space-y-1.5 pl-2 text-body-md">
            <li>· &quot;FLIP 1기 3주차 미제출 팀 알려주세요.&quot;</li>
            <li>· &quot;전체 진행 상황 요약해주세요.&quot;</li>
            <li>· &quot;미제출 팀에 보낼 리마인드 메일 초안 만들어주세요.&quot;</li>
            <li>· &quot;가장 최근에 올린 파일이 뭐예요?&quot;</li>
          </ul>
        </Section>

        <Section title="4. 메일 초안">
          <p>
            챗봇이 메일을 만들면 자동으로 <strong>Gmail 초안함</strong> 에 저장됩니다.
            매니저가 Gmail 에서 열어 확인한 뒤 직접 보내주십시오.
          </p>
          <p className="text-caption text-muted-soft">
            Draft 는 메일을 자동 발송하지 않습니다. 마지막 검토와 발신은 항상 매니저의 손에 있습니다.
          </p>
        </Section>

        <Section title="5. 매트릭스 읽는 법">
          <ul className="space-y-1.5 pl-2 text-body-md">
            <li>● <strong>제출</strong> — 해당 주차에 파일이 있음 (셀 클릭 시 파일 목록)</li>
            <li>◐ <strong>진행</strong> — 이번 주차, 아직 제출 없음 (압박 X)</li>
            <li>✕ <strong>미제출</strong> — 지나간 주차에 제출이 없음 (행동 필요)</li>
            <li>○ <strong>예정</strong> — 아직 시작 안 한 주차</li>
          </ul>
          <p className="text-caption text-muted-soft">
            프로그램 시작일을 등록하지 않으면 ● / ○ 만 표시됩니다.
          </p>
        </Section>

        <Section title="6. 자주 묻는 질문">
          <FaqRow q="Drive 폴더를 옮기거나 이름을 바꿔도 되나요?">
            <p>네, Drive 의 폴더 자체는 자유롭게 옮기고 이름을 바꿔도 Draft 가 폴더 ID 로 추적합니다. 파일 안의 데이터에 영향 없습니다.</p>
          </FaqRow>
          <FaqRow q="멤버에게 Draft 를 알려야 하나요?">
            <p>아닙니다. 멤버는 Drive 와 Gmail 만 쓰면 됩니다. Draft 는 매니저 본인의 도구입니다.</p>
          </FaqRow>
          <FaqRow q="다른 매니저와 같은 워크스페이스를 쓸 수 있나요?">
            <p>V1 은 매니저 1명 = 워크스페이스 1개. 멀티 매니저는 V2 에서 검토합니다.</p>
          </FaqRow>
          <FaqRow q="Draft 에 올린 데이터는 어디에 저장되나요?">
            <p>매니저의 폴더 메타데이터와 챗봇 기록만 Draft (Supabase) 에 저장합니다. 파일 본문은 저장하지 않고 매번 Drive 에서 직접 읽습니다. 자세한 내용은 <a href="/privacy" className="underline underline-offset-2">개인정보 처리방침</a>.</p>
          </FaqRow>
        </Section>

        <footer className="border-t border-hairline pt-6 flex gap-4">
          <a href="/workspace" className="text-body-sm text-muted hover:text-ink transition-colors">
            ← 워크스페이스로
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

function FaqRow({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg border border-hairline bg-surface-soft p-4 group">
      <summary className="cursor-pointer text-title-sm text-ink list-none flex items-center justify-between gap-2">
        <span>{q}</span>
        <span className="text-muted text-body-sm group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="mt-3 text-body-md text-body">{children}</div>
    </details>
  )
}
