import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * 서비스 이용약관 — Meta App Review 제출용 공개 URL (/legal/terms).
 *
 * 자동 발행 기능 관련 특약(제7조) 이 Meta 정책 대응 핵심:
 *   - 발행 전 운영진 검토 필수
 *   - 발행 결과에 대한 책임은 이용자에게
 *   - 제3자 플랫폼(Threads/Instagram/LinkedIn) 정책 위반 시 회사 면책
 *
 * 운영 주체 플레이스홀더 — 사업자 등록 완료 시 `[운영 주체 명칭]` 을 실제 상호로 교체.
 */

export const metadata: Metadata = {
  title: '서비스 이용약관 · Draft',
  description:
    'Draft 서비스 이용약관 — 이용계약, 회원 의무, 자동 발행 특약, 지적재산권, 준거법.',
  robots: { index: true, follow: true },
}

const LAST_UPDATED = '2026년 4월 21일'
const EFFECTIVE_DATE = '2026년 4월 27일'

export default function TermsOfServicePage() {
  return (
    <article>
      <h1 className="text-3xl font-bold text-txt-primary mb-2">서비스 이용약관</h1>
      <p className="text-sm text-txt-tertiary mb-12">
        최종 개정일: {LAST_UPDATED} · 시행일: {EFFECTIVE_DATE}
      </p>

      <p className="text-txt-secondary leading-relaxed">
        본 약관은 [운영 주체 명칭](이하 &quot;회사&quot;)이 제공하는 동아리·프로젝트 운영 플랫폼
        Draft(이하 &quot;서비스&quot;) 의 이용 조건 및 회사와 회원 간 권리·의무 사항을
        규정합니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제1조 (목적)</h2>
      <p className="text-txt-secondary leading-relaxed">
        본 약관은 회사와 회원 간의 서비스 이용계약 체결, 이용 조건, 권리·의무 및 책임사항을 정함을
        목적으로 합니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제2조 (용어의 정의)</h2>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>
          <b>회원</b>: 본 약관에 동의하고 서비스에 가입한 자
        </li>
        <li>
          <b>기관</b>: 대학, 창업지원단, 산학협력단 등 회사와 별도 계약을 체결한 법인
        </li>
        <li>
          <b>클럽(동아리)</b>: 회원이 구성·운영하는 조직 단위
        </li>
        <li>
          <b>프로젝트</b>: 회원 또는 클럽이 서비스 내에서 진행하는 작업 단위
        </li>
        <li>
          <b>페르소나</b>: 클럽·프로젝트·개인 단위의 외부 발행 스타일 설정 및 연결 계정 번들
        </li>
        <li>
          <b>자동 발행</b>: 운영진 승인을 거친 콘텐츠를 연결된 외부 채널(Threads, Instagram,
          LinkedIn 등)에 게시하는 기능
        </li>
        <li>
          <b>콘텐츠</b>: 회원이 서비스에 등록·게시한 글, 이미지, 파일, 코드 등 일체의 저작물
        </li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">
        제3조 (이용계약의 체결)
      </h2>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>
          이용계약은 만 14세 이상의 가입 신청자가 본 약관 및 개인정보처리방침에 동의한 후 회사가
          승낙함으로써 성립합니다.
        </li>
        <li>
          회사는 다음의 경우 가입 승낙을 거부하거나 사후 취소할 수 있습니다.
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>허위 정보를 기재하거나 타인의 정보를 도용한 경우</li>
            <li>회사에 의해 이용 제한된 이력이 있는 경우</li>
            <li>관련 법령 또는 본 약관에 위배된 목적으로 신청한 경우</li>
          </ul>
        </li>
        <li>대학 이메일 도메인(@**.ac.kr) 인증 시 &quot;재학생 인증&quot; 상태가 부여됩니다.</li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제4조 (서비스의 범위)</h2>
      <p className="text-txt-secondary leading-relaxed mb-3">회사는 다음 기능을 제공합니다.</p>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>프로필, 프로젝트, 팀 관리</li>
        <li>클럽(동아리) 운영 도구: 멤버 관리, 주간 업데이트, 공지, 감사 로그</li>
        <li>공개 피드, 탐색, 매칭 추천</li>
        <li>외부 채널 연동 및 자동 발행 — Threads, Instagram, LinkedIn, Discord, GitHub</li>
        <li>AI 기반 요약·초안 생성(페르소나 엔진)</li>
        <li>기관용 관리자 리포트(계약 기관에 한함)</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제5조 (회원의 의무)</h2>
      <p className="text-txt-secondary leading-relaxed mb-3">회원은 다음 행위를 해서는 안 됩니다.</p>
      <ul className="list-disc pl-5 space-y-1 text-txt-secondary leading-relaxed">
        <li>허위 정보를 등록하거나 타인의 개인정보·계정·콘텐츠를 무단 도용하는 행위</li>
        <li>본인이 적법한 권한을 갖지 않은 외부 계정(Threads/Instagram/LinkedIn 등)을 연결하는 행위</li>
        <li>OAuth 액세스 토큰, 관리자 계정, API 키 등 인증 정보를 제3자에게 공유하거나 방치하는 행위</li>
        <li>
          서비스의 정상 운영을 방해하는 행위 — 과도한 자동화 요청, 취약점 악용, 무단 스크래핑
        </li>
        <li>
          범죄·허위사실·음란물·차별·혐오 표현·스팸·사기성 콘텐츠를 게시하거나 외부 채널로 발행하는
          행위
        </li>
        <li>회사 또는 제3자의 지적재산권·명예권·프라이버시를 침해하는 행위</li>
        <li>Meta Platform Terms, Discord 가이드라인 등 연동된 외부 플랫폼의 정책을 위반하는 행위</li>
      </ul>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제6조 (회사의 의무)</h2>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>
          회사는 서비스 안정성을 유지하기 위해 합리적인 기술적·관리적 보안 조치를 취합니다.
          (암호화, 접근 통제, 감사 로그, 취약점 점검)
        </li>
        <li>회사는 이용자 개인정보를 「개인정보처리방침」에 따라 관리합니다.</li>
        <li>회사는 중요한 약관·정책 변경 시 사전 공지 및 재동의 절차를 제공합니다.</li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">
        제7조 (자동 발행 기능 관련 특약)
      </h2>
      <p className="text-txt-secondary leading-relaxed mb-3">
        Draft 는 Threads, Instagram, LinkedIn 등 외부 채널로의 자동 발행 기능을 제공합니다. 이 조항은
        해당 기능 이용 시 적용됩니다.
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>
          <b>발행 전 검토 필수</b>: 모든 콘텐츠는 운영진이 Draft UI 에서 내용을 검토하고
          &quot;발행&quot; 버튼을 눌러 명시적으로 승인한 후에만 외부 채널로 게시됩니다. 회사는
          이용자의 승인 없이 콘텐츠를 발행하지 않습니다.
        </li>
        <li>
          <b>발행 결과에 대한 책임</b>: 발행된 콘텐츠의 내용, 저작권, 제3자 권리 침해 여부, 외부
          플랫폼 정책 위반 여부에 대한 책임은 승인한 이용자 및 해당 콘텐츠를 작성한 이용자에게
          있습니다.
        </li>
        <li>
          <b>외부 플랫폼 정책 준수</b>: 이용자는 Meta Platform Terms, Instagram Community
          Guidelines, LinkedIn Professional Community Policies 등 해당 외부 플랫폼 정책을 준수해야
          합니다. 외부 플랫폼이 해당 콘텐츠 또는 계정을 제재할 경우 회사는 개입하지 않으며 대신
          책임지지 않습니다.
        </li>
        <li>
          <b>연결 해제의 자유</b>: 이용자는 언제든지 페르소나 설정에서 외부 계정 연결을 해제할 수
          있으며, 해제 즉시 해당 액세스 토큰은 완전 삭제됩니다.
        </li>
        <li>
          <b>AI 생성 콘텐츠의 책임</b>: 서비스는 AI 를 활용한 초안·요약을 제공하나, AI 출력물의
          정확성·저작권은 회사가 보증하지 않습니다. 이용자는 발행 전 반드시 내용을 검토해야 합니다.
        </li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제8조 (지적재산권)</h2>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>회원이 등록한 콘텐츠의 저작권은 회원에게 귀속됩니다.</li>
        <li>
          회원은 회사가 서비스 운영·홍보·개선 목적으로 해당 콘텐츠를 비독점적·무상·취소 가능한
          범위에서 이용하도록 허락합니다(서비스 화면 내 전시, 추천 알고리즘 학습, 익명 통계 작성).
        </li>
        <li>
          회사가 제공하는 서비스 자체(UI, 로고, 코드, 문서)의 지적재산권은 회사에 귀속되며, 회원은
          회사의 사전 서면 동의 없이 이를 복제·배포·2차 가공할 수 없습니다.
        </li>
        <li>
          회원이 탈퇴하거나 콘텐츠를 삭제하면 제2항의 이용 권리는 즉시 종료됩니다. 단, 이미 생성된
          백업·익명 통계·제3자가 복제·공유한 결과물은 기술적 한계상 회수가 불가능할 수 있습니다.
        </li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">
        제9조 (계약 해지 및 탈퇴)
      </h2>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>
          회원은 언제든지 앱 내 계정 삭제 메뉴(<code className="text-sm">/settings/account/delete</code>)
          또는{' '}
          <Link href="/legal/data-deletion" className="text-brand underline">
            데이터 삭제 안내
          </Link>
          에 기재된 경로를 통해 탈퇴를 신청할 수 있습니다.
        </li>
        <li>
          탈퇴 신청 후 30일 유예 기간이 부여되며, 이 기간 내 복구 신청이 없으면 개인정보처리방침에
          따라 데이터가 파기됩니다. 감사 로그는 법적 요구에 따라 5년간 분리 보관됩니다.
        </li>
        <li>회사는 회원의 중대한 약관 위반 시 계약을 해지할 수 있으며, 해지 사유와 소명 기회를 사전 통지합니다.</li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">
        제10조 (서비스 제공의 중단)
      </h2>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>회사는 연중무휴·1일 24시간 서비스 제공을 원칙으로 합니다.</li>
        <li>
          회사는 점검·교체, 장애, 운영상 필요에 따라 서비스를 일시 중단할 수 있으며, 사전 공지를
          원칙으로 합니다. 긴급한 경우 사후 공지할 수 있습니다.
        </li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">
        제11조 (면책 및 손해배상)
      </h2>
      <ol className="list-decimal pl-5 space-y-2 text-txt-secondary leading-relaxed">
        <li>
          회사는 천재지변, 제3자 서비스 장애(DDoS, 클라우드·Meta API 장애 등), 회원 귀책 사유로
          인한 서비스 이용 불가에 대해 책임지지 않습니다.
        </li>
        <li>
          회사는 회원 간 또는 회원과 제3자 간에 발생한 분쟁(자동 발행 콘텐츠로 인한 분쟁 포함)에
          개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.
        </li>
        <li>
          단, 회사의 고의 또는 중대한 과실로 인한 손해는 관련 법령에 따라 회사가 책임집니다.
        </li>
      </ol>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제12조 (준거법 및 관할)</h2>
      <p className="text-txt-secondary leading-relaxed">
        본 약관은 대한민국 법률을 준거법으로 합니다. 서비스 이용과 관련하여 회사와 회원 간 분쟁이
        발생할 경우 민사소송법상의 관할법원을 제1심 관할법원으로 하며, 특히 전속 관할로
        서울중앙지방법원을 합의 관할법원으로 정합니다.
      </p>

      <h2 className="text-xl font-bold text-txt-primary mt-12 mb-4">제13조 (문의처)</h2>
      <p className="text-txt-secondary leading-relaxed">
        본 약관 또는 서비스 이용에 관한 문의는{' '}
        <a href="mailto:chadolmin01@gmail.com" className="text-brand underline">
          chadolmin01@gmail.com
        </a>
        으로 연락 주십시오.
      </p>

      <p className="text-sm text-txt-tertiary mt-12 pt-8 border-t border-border">
        부칙: 본 약관은 2026년 4월 27일부터 시행합니다.
      </p>
    </article>
  )
}
