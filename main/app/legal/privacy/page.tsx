import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * 개인정보처리방침 — Meta App Review 제출용 공개 URL (/legal/privacy).
 *
 * Meta Platform Terms / Developer Policies 대응:
 *   - 수집 데이터 목록 / 수집 목적 / 제3자 공유 / 보관 기간 / 삭제 요청 경로 /
 *     연락처 / Meta 특례 섹션 7개 항목 포함.
 *   - 근거 체크리스트: docs/meta-app-review/privacy-policy-checklist.md
 *
 * 운영 주체 플레이스홀더 — 사업자 등록 완료 시 `이성민 (사업자 등록 예정)` 을 실제 상호로 교체.
 * 법무 검토 권장 — 대학·기관 계약 진입 시 PIPA 위탁 리스트·국외 이전 동의를 실계약 기준으로 갱신.
 *
 * 이 페이지는 `/legal/layout.tsx` 가 navbar 없는 공개 레이아웃을 제공하므로 추가 chrome 불필요.
 */

const LAST_UPDATED = '2026년 4월 21일'
const EFFECTIVE_DATE = '2026년 4월 27일'
// ISO8601 for OG article times — 크롤러가 최종 수정일을 인식해 last-crawled 기준 결정.
const PUBLISHED_ISO = '2026-04-21T00:00:00+09:00'
const MODIFIED_ISO = '2026-04-21T00:00:00+09:00'

export const metadata: Metadata = {
  title: '개인정보처리방침 · Draft',
  description:
    'Draft 개인정보처리방침 — 수집 항목, 목적, 보관 기간, 이용자 권리, Meta 플랫폼 데이터에 관한 고지.',
  // 공개 정책 문서는 반드시 색인되어야 함 (Meta App Review · 기관 계약 실사 검증용).
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/legal/privacy',
    languages: {
      'ko-KR': '/legal/privacy',
      'x-default': '/legal/privacy',
    },
  },
  openGraph: {
    type: 'article',
    title: '개인정보처리방침 · Draft',
    description:
      'Draft 개인정보처리방침 — 수집 항목, 목적, 보관 기간, 이용자 권리, Meta 플랫폼 데이터에 관한 고지.',
    url: '/legal/privacy',
    siteName: 'Draft',
    locale: 'ko_KR',
    publishedTime: PUBLISHED_ISO,
    modifiedTime: MODIFIED_ISO,
  },
}

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-txt-primary mb-2">개인정보처리방침</h1>
      <p className="text-sm text-txt-tertiary mb-12">
        최종 개정일: {LAST_UPDATED} · 시행일: {EFFECTIVE_DATE}
      </p>

      <p className="text-txt-secondary leading-relaxed">
        이성민 (사업자 등록 예정)(이하 &quot;회사&quot;)은(는) 「개인정보 보호법」 등 관련 법령을 준수하며,
        정보주체의 권리를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
        본 방침은 Draft(https://dailydraft.me, 이하 &quot;서비스&quot;) 이용 시 적용됩니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">1. 수집하는 개인정보 항목</h2>
      <p className="text-txt-secondary leading-relaxed mb-4">
        회사는 서비스 제공을 위해 다음 항목을 수집합니다.
      </p>

      <h3 className="text-base font-semibold text-txt-primary mt-6 mb-2">가. 계정·프로필 정보</h3>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>필수: 이메일 주소, 닉네임, 소속 학교 도메인(@**.ac.kr)</li>
        <li>
          선택: 학번, 학과, 입학년도, 프로필 사진, 자기소개, 포트폴리오 링크(GitHub/LinkedIn 등),
          관심분야
        </li>
      </ul>

      <h3 className="text-base font-semibold text-txt-primary mt-6 mb-2">나. 콘텐츠 정보</h3>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>프로젝트, 팀, 공개 게시물, 댓글, 메시지, 주간 업데이트 초안</li>
        <li>동아리(클럽) 소속·역할·활동 기록</li>
      </ul>

      <h3 className="text-base font-semibold text-txt-primary mt-6 mb-2">
        다. 외부 계정 연결(OAuth) 정보
      </h3>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>
          Threads(Meta Platforms) / Instagram / LinkedIn / Discord / GitHub 연동 시 제공자가
          반환하는 고유 식별자(user_id), 사용자명(username), 프로필 이미지
        </li>
        <li>
          OAuth 액세스 토큰 — 저장 시 <b>AES-256-GCM 으로 암호화</b>되며 평문 상태로 로그·백업에
          기록되지 않습니다
        </li>
        <li>토큰 만료 시각(expires_at), 발급 scope</li>
      </ul>

      <h3 className="text-base font-semibold text-txt-primary mt-6 mb-2">
        라. 서비스 이용 과정 자동 수집
      </h3>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>IP 주소, User-Agent, 접속 시각, 세션 쿠키</li>
        <li>앱 내 활동 기록, 오류 로그(에러 메시지, 발생 지점)</li>
        <li>관리자 접근·중요 변경에 대한 감사 로그(audit log)</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">2. 수집·이용 목적</h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        수집한 정보는 다음 목적에만 이용됩니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>회원 식별·인증, 본인 확인</li>
        <li>동아리·프로젝트 추천, 팀빌딩, 공개 피드 제공</li>
        <li>운영진이 승인한 콘텐츠의 외부 채널 자동 발행(Threads/Instagram/LinkedIn)</li>
        <li>기관(대학·창업지원단)에 대한 소속 학생 현황 집계 리포트(익명화된 통계 원칙)</li>
        <li>부정 이용 방지, 보안 사고 대응, 분쟁 조정</li>
        <li>서비스 품질 개선 및 통계 분석</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">3. 제3자 제공</h2>
      <p className="text-txt-secondary leading-relaxed">
        회사는 정보주체의 사전 동의 없이 수집 목적 범위를 초과하여 개인정보를 제3자에게 제공하지
        않습니다. 특히 Meta Platform Data(Threads/Instagram API 로 받은 데이터)는 어떠한
        제3자에게도 판매·공유·양도되지 않으며, 다른 통합에서 수집한 데이터와 결합되지 않습니다.
        법령에 의한 제공 요구 시 해당 사실을 이용자에게 공지합니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">4. 처리 위탁</h2>
      <p className="text-txt-secondary leading-relaxed mb-4">
        회사는 서비스 운영을 위해 다음 수탁업체에 개인정보 처리를 위탁합니다. 수탁업체는 회사의
        지시에 따라 위탁 목적 범위에서만 정보를 처리하며, 독립적 분석·마케팅 권한을 갖지
        않습니다.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
          <thead className="bg-surface-sunken text-txt-primary">
            <tr>
              <th className="text-left p-3 font-semibold">수탁업체</th>
              <th className="text-left p-3 font-semibold">위탁 업무</th>
              <th className="text-left p-3 font-semibold">보관 국가</th>
            </tr>
          </thead>
          <tbody className="text-txt-secondary">
            <tr className="border-t border-border">
              <td className="p-3">Meta Platforms, Inc.</td>
              <td className="p-3">Threads / Instagram Graph API 연동</td>
              <td className="p-3">미국</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-3">Supabase Inc.</td>
              <td className="p-3">데이터베이스, 인증, 파일 저장</td>
              <td className="p-3">싱가포르</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-3">Vercel Inc.</td>
              <td className="p-3">애플리케이션 호스팅</td>
              <td className="p-3">미국(글로벌 엣지)</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-3">Anthropic PBC</td>
              <td className="p-3">AI 생성 기능(요약·초안 작성)</td>
              <td className="p-3">미국</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-3">Google LLC</td>
              <td className="p-3">AI 생성 기능(Gemini)</td>
              <td className="p-3">미국</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-3">Discord Inc.</td>
              <td className="p-3">Discord 서버 연동·봇 운영</td>
              <td className="p-3">미국</td>
            </tr>
            <tr className="border-t border-border">
              <td className="p-3">LinkedIn Corporation</td>
              <td className="p-3">LinkedIn 연동·자동 발행</td>
              <td className="p-3">미국</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">5. 보관 기간</h2>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>회원 정보: 회원 자격 유지 기간 동안. 탈퇴 신청 시 30일 유예 보관 후 즉시 파기</li>
        <li>
          OAuth 액세스 토큰: 제공자 정책상 만료 시각까지(통상 60일 이내). 연결 해제 즉시 완전
          삭제(hard delete)
        </li>
        <li>접속 로그·IP: 3개월 (통신비밀보호법)</li>
        <li>
          감사 로그(관리자 접근·중요 변경): <b>5년</b> (정보보호 및 법적 대응 요구)
        </li>
        <li>부정 이용 기록: 1년</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">6. 국외 이전</h2>
      <p className="text-txt-secondary leading-relaxed">
        위 수탁업체의 일부는 대한민국 외 국가(미국·싱가포르)에 서버를 두고 있어 개인정보가
        국외로 이전됩니다. 회사는 서비스 가입 시 본 방침을 고지함으로써 국외 이전에 관한 동의를
        받으며, 각 수탁업체는 자체 Data Processing Agreement 및 SOC2/ISO27001 기준의 보안 수준을
        유지합니다. 동의를 원치 않을 경우 회원 가입을 진행하지 마십시오.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">7. 정보주체의 권리</h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        정보주체는 언제든지 다음 권리를 행사할 수 있습니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>개인정보 열람 요구</li>
        <li>오류 정정·삭제 요구</li>
        <li>처리 정지 요구</li>
        <li>동의 철회·회원 탈퇴</li>
        <li>자동화된 결정(매칭 추천 등)에 대한 이의 제기</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">8. 데이터 삭제 요청 방법</h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        아래 세 가지 경로 중 하나로 요청할 수 있으며, 자세한 절차는{' '}
        <Link href="/legal/data-deletion" className="text-brand underline">
          데이터 삭제 안내 페이지
        </Link>
        에 정리되어 있습니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>
          앱 내: 로그인 후 <code className="text-sm">/me/data</code> 에서 계정 삭제
        </li>
        <li>
          Meta 자동 삭제 웹훅: Threads 앱에서 연결 해제 시 <code className="text-sm">POST /api/oauth/threads/data-deletion</code>{' '}
          을 통해 자동 처리
        </li>
        <li>
          이메일:{' '}
          <a href="mailto:team@dailydraft.me" className="text-brand underline">
            team@dailydraft.me
          </a>{' '}
          으로 가입 이메일과 함께 요청
        </li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">9. 안전성 확보 조치</h2>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>접근 통제: Supabase Row Level Security(RLS), 관리자 권한 분리, CSRF 방어</li>
        <li>전송 구간 암호화: HTTPS(TLS 1.3)</li>
        <li>저장 구간 암호화: Postgres 저장 암호화, OAuth 토큰은 AES-256-GCM 별도 암호화</li>
        <li>감사: 관리자 접근·중요 변경 사항을 5년간 감사 로그로 보관</li>
        <li>취약점 대응: 의존성 자동 스캔, 주기적 RLS 감사</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">10. 쿠키</h2>
      <p className="text-txt-secondary leading-relaxed">
        서비스는 로그인 세션 유지, 온보딩 진행 상태 저장 등을 위해 쿠키와 로컬 저장소를 사용합니다.
        브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 로그인을 포함한 일부 기능이 제한됩니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">
        11. Meta 플랫폼 데이터에 관한 고지
      </h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        본 조항은 Meta Platforms, Inc. 가 제공하는 Threads API / Instagram Graph API 를 통해
        수집되는 데이터에만 적용됩니다.
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>
          <b>수집 범위</b>: Threads/Instagram 계정의 고유 식별자(<code className="text-sm">id</code>),
          사용자명(<code className="text-sm">username</code>), 액세스 토큰에 한정합니다. 기존
          게시물, 팔로워/팔로잉, DM, 피드 콘텐츠는 수집하지 않습니다.
        </li>
        <li>
          <b>수집 목적</b>: (i) 운영진이 Draft 안에서 명시적으로 승인한 텍스트 콘텐츠를
          운영진이 연결한 본인의 계정으로 발행, (ii) 연결된 계정을 UI 에 &quot;@username&quot; 으로
          표시하여 발행 대상을 확인하는 용도로만 사용합니다.
        </li>
        <li>
          <b>자동 발행 없음</b>: 이용자의 명시적 승인 없이 콘텐츠가 외부에 게시되지 않습니다. 모든
          발행은 운영진이 Draft UI 에서 &quot;발행&quot; 버튼을 눌러야 실행됩니다.
        </li>
        <li>
          <b>제3자 비공유</b>: Meta Platform Data 는 제3자에게 판매·공유·양도되지 않으며, 다른
          통합(Discord, LinkedIn 등)에서 수집한 데이터와 결합되지 않습니다.
        </li>
        <li>
          <b>데이터 삭제</b>: 이용자는 언제든지 (i) 앱 내 페르소나 설정에서 연결 해제, (ii)
          Threads 앱에서 연결 해제 시 자동으로 호출되는 Meta data deletion webhook(
          <code className="text-sm">POST /api/oauth/threads/data-deletion</code>), (iii) 이메일
          요청 중 하나로 즉시 토큰을 삭제할 수 있습니다. 연결 해제 즉시 DB 에서 완전 삭제(hard
          delete)됩니다.
        </li>
        <li>
          <b>Meta 정책 준수</b>: 본 서비스는{' '}
          <a
            href="https://developers.facebook.com/terms/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Meta Platform Terms
          </a>
          {' '}및{' '}
          <a
            href="https://developers.facebook.com/devpolicy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Developer Policies
          </a>
          를 준수합니다.
        </li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">12. 개인정보 보호책임자</h2>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>책임자: Draft 운영팀</li>
        <li>
          이메일:{' '}
          <a href="mailto:team@dailydraft.me" className="text-brand underline">
            team@dailydraft.me
          </a>
        </li>
        <li>처리 기한: 영업일 기준 30일 이내 답변</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">13. 권익 침해 구제</h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>개인정보 침해신고센터 (privacy.go.kr, 국번없이 182)</li>
        <li>개인정보 분쟁조정위원회 (kopico.go.kr, 1833-6972)</li>
        <li>대검찰청 사이버수사과 (spo.go.kr, 02-3480-3573)</li>
        <li>경찰청 사이버수사국 (ecrm.police.go.kr, 국번없이 182)</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">14. 개정 이력</h2>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>
          2026년 4월 21일 — 최초 제정 (Meta App Review 대응: 수집 항목·Meta 특례·삭제 경로 명문화).
          시행일 2026년 4월 27일.
        </li>
      </ul>

      <p className="text-sm text-txt-tertiary mt-12 pt-8 border-t border-border">
        본 방침은 시행일부터 적용됩니다. 중요한 변경이 있는 경우 시행 최소 7일 전(이용자에게 불리한
        개정은 30일 전) 서비스 내 공지 및 가입 이메일을 통해 통지합니다.
      </p>
    </article>
  )
}
