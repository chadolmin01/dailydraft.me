import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * 데이터 삭제 요청 안내 — Meta App Review 의 "Data Deletion Instructions URL" 필드 대응.
 *
 * Meta 심사 요구:
 *   - 로그인 없이 접근 가능한 공개 URL
 *   - 이용자가 데이터 삭제를 요청할 수 있는 구체적 경로 명시
 *   - 미가입자/계정 삭제된 사용자도 요청할 방법 제공
 *   - 확인(confirmation) 절차 안내
 *
 * Meta 가 자동 호출하는 data deletion webhook (POST /api/oauth/threads/data-deletion) 은
 * 이용자가 Threads 앱에서 연결을 해제할 때 호출됨. 이때 회사는 confirmation code + status URL 을
 * 반환해야 하며, 이 페이지에서 status URL 포맷을 안내.
 */

export const metadata: Metadata = {
  title: '데이터 삭제 요청 · Draft',
  description:
    'Draft 계정 및 외부 채널 연동 데이터 삭제 요청 방법 — 앱 내 설정, Meta 자동 웹훅, 이메일.',
  robots: { index: true, follow: true },
}

const LAST_UPDATED = '2026년 4월 21일'

export default function DataDeletionPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-txt-primary mb-2">데이터 삭제 요청</h1>
      <p className="text-sm text-txt-tertiary mb-12">최종 개정일: {LAST_UPDATED}</p>

      <p className="text-txt-secondary leading-relaxed">
        Draft 는 이용자가 자신의 데이터를 언제든 삭제할 수 있는 권리를 보장합니다. 아래 세 가지 경로
        중 가장 편한 방법을 선택하십시오. 개인정보처리방침의 보관 기간 및 법적 의무 보관 항목은{' '}
        <Link href="/legal/privacy#5" className="text-brand underline">
          개인정보처리방침 제5조
        </Link>
        를 참조하십시오.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">삭제 경로 선택</h2>

      <div className="space-y-4 mt-6">
        <div className="rounded-2xl border border-border bg-surface-card p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-semibold text-txt-tertiary mb-1">경로 1</p>
              <h3 className="text-lg font-bold text-txt-primary">앱 내 계정 삭제</h3>
            </div>
            <span className="text-xs text-txt-tertiary whitespace-nowrap">로그인 필요</span>
          </div>
          <p className="text-txt-secondary leading-relaxed mb-4">
            Draft 에 로그인한 상태에서 계정 삭제 페이지로 이동하여 절차를 진행할 수 있습니다. 모든
            프로필, 콘텐츠, 외부 채널 연동(OAuth 토큰 포함)이 30일 유예 후 완전 삭제됩니다.
          </p>
          <Link
            href="/settings/account/delete"
            className="inline-flex items-center text-sm font-semibold text-brand hover:underline"
          >
            계정 삭제 페이지로 이동 →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface-card p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-semibold text-txt-tertiary mb-1">경로 2</p>
              <h3 className="text-lg font-bold text-txt-primary">Threads 앱에서 연결 해제</h3>
            </div>
            <span className="text-xs text-txt-tertiary whitespace-nowrap">자동 처리</span>
          </div>
          <p className="text-txt-secondary leading-relaxed mb-3">
            Threads(또는 Instagram) 앱의 설정 &gt; 연결된 앱 메뉴에서 Draft 를 제거하면, Meta 가
            Draft 의 웹훅 엔드포인트{' '}
            <code className="text-sm px-1.5 py-0.5 rounded bg-surface-sunken">
              POST /api/oauth/threads/data-deletion
            </code>{' '}
            을 호출합니다. Draft 는 해당 이용자의 토큰과 계정 참조(<code className="text-sm">user_id</code>,{' '}
            <code className="text-sm">username</code>)를 즉시 완전 삭제합니다.
          </p>
          <p className="text-sm text-txt-tertiary leading-relaxed">
            처리 완료 후 confirmation code 와 상태 조회 URL 이 Meta 에 반환되며, 이용자는 아래 &quot;
            처리 상태 확인&quot; 섹션을 통해 직접 확인할 수 있습니다.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-card p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-semibold text-txt-tertiary mb-1">경로 3</p>
              <h3 className="text-lg font-bold text-txt-primary">이메일로 요청</h3>
            </div>
            <span className="text-xs text-txt-tertiary whitespace-nowrap">미가입자 가능</span>
          </div>
          <p className="text-txt-secondary leading-relaxed mb-4">
            계정에 접근할 수 없거나, 제3자가 본인의 외부 계정을 무단으로 연결한 경우에는 이메일로
            요청해 주십시오. 가입 이메일 또는 Threads/Instagram 사용자명을 함께 기재하면 확인 후
            처리됩니다.
          </p>
          <a
            href="mailto:chadolmin01@gmail.com?subject=%5BDraft%5D%20%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD"
            className="inline-flex items-center text-sm font-semibold text-brand hover:underline"
          >
            chadolmin01@gmail.com 으로 이메일 보내기 →
          </a>
        </div>
      </div>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">처리 기한</h2>
      <p className="text-txt-secondary leading-relaxed">
        모든 삭제 요청은 영업일 기준 <b>30일 이내</b>에 처리됩니다. 실제 대부분의 경우 즉시 또는 24
        시간 이내 완료되며, 처리 완료 시 가입 이메일로 확인 메일이 발송됩니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">삭제되는 항목</h2>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>프로필 정보(이메일·닉네임·학교·학과 등)</li>
        <li>작성한 프로젝트·팀·게시물·댓글·메시지</li>
        <li>외부 채널 연동(OAuth 액세스 토큰 + 계정 참조)</li>
        <li>동아리 소속·역할 기록 (공개된 게시물은 작성자 표기가 익명 처리됩니다)</li>
        <li>오류 로그 및 서비스 이용 기록</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">
        삭제되지 않는 항목 (법정 보존)
      </h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        다음 항목은 관련 법령에 따라 별도 저장소에 분리 보관된 후 보존 기간 경과 시 파기됩니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>감사 로그(관리자 접근·중요 변경 기록): 5년 — 정보보호 및 법적 분쟁 대응 목적</li>
        <li>접속 로그·IP: 3개월 — 통신비밀보호법</li>
        <li>부정 이용 기록: 1년 — 재가입 악용 방지</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">처리 상태 확인</h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        Threads 앱에서 연결 해제로 삭제 요청을 보낸 경우, Meta 가 제공한 confirmation code 로 처리
        상태를 직접 조회할 수 있습니다.
      </p>
      <div className="rounded-xl bg-surface-sunken border border-border p-4 font-mono text-sm text-txt-secondary overflow-x-auto">
        GET https://dailydraft.me/api/oauth/threads/data-deletion/status?code=&lt;CONFIRMATION_CODE&gt;
      </div>
      <p className="text-sm text-txt-tertiary leading-relaxed mt-3">
        응답은 <code className="text-sm">{'{ "status": "processed" | "pending" | "not_found", "completed_at": ISO8601 | null }'}</code>{' '}
        형태입니다. 이메일·앱 내 삭제 요청은 별도 조회 URL 이 제공되지 않으며, 처리 완료 시 가입
        이메일로 통지됩니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">자주 묻는 질문</h2>

      <div className="space-y-6 mt-6">
        <div>
          <h3 className="text-base font-semibold text-txt-primary mb-2">
            Q. 삭제 후 같은 이메일로 재가입할 수 있습니까?
          </h3>
          <p className="text-txt-secondary leading-relaxed">
            예, 재가입이 가능합니다. 다만 부정 이용 기록이 있는 경우 1년간 가입이 제한될 수
            있습니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-txt-primary mb-2">
            Q. 동아리(클럽) 소속 상태에서 혼자만 탈퇴하면 클럽 데이터는 어떻게 됩니까?
          </h3>
          <p className="text-txt-secondary leading-relaxed">
            이용자의 프로필과 개인 식별 정보는 삭제되며, 이미 게시한 클럽 활동 기록(주간 업데이트,
            공지 등)은 작성자 표기가 익명으로 전환됩니다. 클럽 자체의 데이터는 유지됩니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-txt-primary mb-2">
            Q. Threads 연동만 해제하고 싶고 Draft 계정은 유지하고 싶습니다.
          </h3>
          <p className="text-txt-secondary leading-relaxed">
            Draft 로그인 후 클럽 설정 &gt; 페르소나 &gt; Threads 카드에서 &quot;연결 해제&quot;를
            누르시면 Draft 계정은 그대로 두고 Threads 토큰만 즉시 삭제됩니다. 반대로 Threads 앱에서
            연결 해제하셔도 동일한 결과가 됩니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-txt-primary mb-2">
            Q. 제3자가 제 Threads 계정을 Draft 에 연결한 것 같습니다.
          </h3>
          <p className="text-txt-secondary leading-relaxed">
            chadolmin01@gmail.com 으로 Threads 사용자명과 상황을 알려주십시오. 확인 후 해당 계정
            참조와 토큰을 즉시 삭제하고 관련 IP 기록을 조사합니다.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-txt-primary mb-2">
            Q. 삭제 후에도 백업에 데이터가 남아있지 않습니까?
          </h3>
          <p className="text-txt-secondary leading-relaxed">
            기술적 특성상 데이터베이스 백업에는 최대 30일간 잔존할 수 있습니다. 백업 순환 주기가
            경과하면 자동으로 완전 삭제됩니다. 이 기간 동안 해당 데이터는 격리된 저장소에 암호화
            상태로 보관되며 접근이 제한됩니다.
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">문의</h2>
      <p className="text-txt-secondary leading-relaxed">
        삭제 요청 관련 문의는{' '}
        <a href="mailto:chadolmin01@gmail.com" className="text-brand underline">
          chadolmin01@gmail.com
        </a>
        으로 연락 주십시오. 영업일 기준 30일 이내 답변드립니다.
      </p>

      <p className="text-sm text-txt-tertiary mt-12 pt-8 border-t border-border">
        관련 문서:{' '}
        <Link href="/legal/privacy" className="text-brand underline">
          개인정보처리방침
        </Link>
        {' · '}
        <Link href="/legal/terms" className="text-brand underline">
          서비스 이용약관
        </Link>
      </p>
    </article>
  )
}
