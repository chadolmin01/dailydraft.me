/**
 * 개인정보처리방침 — PIPA 준수.
 * 타이틀은 `src/lib/routes/titles.ts` ROUTE_TITLES + TitleSync 로 처리 (flicker 방지).
 * 시행일 명시가 중요. 개정 시 이 페이지 + 유저 알림 병행.
 *
 * 실제 적용 전 법률 검토 권장 (대학 계약 진입 시 필수):
 * - 위탁처리 리스트는 실제 계약/환경 변수 기준으로 유지
 * - 국외 이전(Supabase/Vercel/OpenAI) 항목은 별도 동의 분리 필요할 수 있음
 */
export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-slate max-w-none print:prose-sm">
      <h1 className="text-[26px] font-black text-txt-primary mb-2">개인정보처리방침</h1>
      <p className="text-[12px] font-mono text-txt-tertiary mb-8">
        시행일: 2026년 4월 27일 · 최종 개정: 2026년 4월 20일
      </p>

      <section className="space-y-6 text-[14px] leading-relaxed text-txt-secondary">
        <p>
          Draft(이하 &quot;회사&quot;)는 「개인정보 보호법」 등 관련 법령을 준수하고 정보주체의
          권리를 보호하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <Section title="제1조 (수집하는 개인정보 항목 및 수집 방법)">
          <p>회사는 서비스 제공을 위해 다음 항목을 수집합니다.</p>

          <h3 className="text-[15px] font-bold text-txt-primary mt-4">1. 회원가입 및 프로필</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>필수</b>: 이메일 주소, 닉네임, 대학교 도메인(@**.ac.kr)</li>
            <li><b>선택</b>: 학번, 학과, 입학년도, 프로필 사진, 자기소개, 포트폴리오 링크(GitHub/LinkedIn), 활동지역, 관심분야</li>
            <li><b>OAuth 사용 시</b>: 연동 제공자(Google/GitHub/Discord)의 고유 식별자, 닉네임, 프로필 이미지</li>
          </ul>

          <h3 className="text-[15px] font-bold text-txt-primary mt-4">2. 서비스 이용 과정 자동 수집</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>IP 주소, User-Agent, 접속 시각, 쿠키</li>
            <li>앱 내 활동 기록(프로젝트 작성/지원/댓글/메시지)</li>
            <li>오류 로그(에러 메시지, 발생 지점)</li>
          </ul>

          <h3 className="text-[15px] font-bold text-txt-primary mt-4">3. 동아리/기관 연동 시</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Discord 서버 멤버십, 채널 메시지 집계(주간 활동량·텍스트 요약)</li>
            <li>GitHub 저장소 활동(commit/PR 메타데이터)</li>
          </ul>

          <p className="mt-3 text-[13px] text-txt-tertiary">
            <b>수집 방법</b>: 회원가입 폼 직접 입력, OAuth 자동 전달, 서비스 이용 중 자동 수집(쿠키/로그).
          </p>
        </Section>

        <Section title="제2조 (개인정보의 수집 및 이용 목적)">
          <p>수집된 정보는 다음 목적을 위해서만 이용됩니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별·인증 및 본인 확인</li>
            <li>동아리/프로젝트 매칭, 팀빌딩, 주간 업데이트 자동 생성</li>
            <li>기관(대학/창업지원단)에 대한 소속 학생 현황 집계 리포트(익명화된 통계 기본, 식별 정보는 기관별 동의 받은 경우에 한함)</li>
            <li>부정 이용 방지 및 분쟁 조정</li>
            <li>서비스 품질 개선, 신규 기능 개발을 위한 통계 분석</li>
          </ul>
        </Section>

        <Section title="제3조 (개인정보의 보유 및 이용 기간)">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>회원 정보</b>: 회원 탈퇴 시까지. 탈퇴 후 30일 유예 보관(복구 요청 대응), 이후 즉시 파기.</li>
            <li><b>서비스 이용 기록·접속 로그·IP</b>: 3개월 (통신비밀보호법)</li>
            <li><b>전자상거래 기록(결제 도입 시)</b>: 5년 (전자상거래법)</li>
            <li><b>부정 이용 기록</b>: 1년 (회사 정책)</li>
          </ul>
        </Section>

        <Section title="제4조 (개인정보의 제3자 제공)">
          <p>
            회사는 정보주체의 개인정보를 제1조, 제2조에서 명시한 범위 내에서 처리하며,
            이용자의 사전 동의 없이는 본래의 수집 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.
          </p>
          <p>
            단, 다음의 경우에는 예외로 합니다:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>이용자의 동의가 있는 경우 (대학/기관 리포트 동의 시 소속 기관)</li>
            <li>법령에 특별한 규정이 있거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </Section>

        <Section title="제5조 (개인정보 처리업무의 위탁)">
          <p>서비스 제공을 위해 다음 업체에 개인정보 처리를 위탁하고 있습니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border border-border rounded-lg mt-3">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="text-left p-2 font-semibold">수탁업체</th>
                  <th className="text-left p-2 font-semibold">위탁 업무</th>
                  <th className="text-left p-2 font-semibold">보관 위치</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border"><td className="p-2">Supabase Inc.</td><td className="p-2">DB 저장·인증·파일 저장</td><td className="p-2">싱가포르</td></tr>
                <tr className="border-t border-border"><td className="p-2">Vercel Inc.</td><td className="p-2">앱 호스팅</td><td className="p-2">미국</td></tr>
                <tr className="border-t border-border"><td className="p-2">Anthropic PBC, Google LLC</td><td className="p-2">AI 생성 기능(요약·초안)</td><td className="p-2">미국</td></tr>
                <tr className="border-t border-border"><td className="p-2">Discord Inc.</td><td className="p-2">Discord 연동·봇 운영</td><td className="p-2">미국</td></tr>
                <tr className="border-t border-border"><td className="p-2">GitHub, Inc.</td><td className="p-2">GitHub 연동 DevSync</td><td className="p-2">미국</td></tr>
                <tr className="border-t border-border"><td className="p-2">Resend Inc.</td><td className="p-2">이메일 발송</td><td className="p-2">미국</td></tr>
                <tr className="border-t border-border"><td className="p-2">Upstash Inc.</td><td className="p-2">Rate Limit/캐시</td><td className="p-2">미국</td></tr>
                <tr className="border-t border-border"><td className="p-2">PostHog Inc.</td><td className="p-2">사용성 분석</td><td className="p-2">미국</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] text-txt-tertiary">
            위 수탁업체 중 일부는 국외에 위치하므로 국외 이전에 해당합니다. 서비스 이용 자체가
            해당 국외 이전에 대한 필수 동의를 포함합니다. 동의하지 않을 경우 회원 가입을 진행하지 마십시오.
          </p>
        </Section>

        <Section title="제6조 (정보주체의 권리와 행사 방법)">
          <p>정보주체는 다음 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 열람 요구</li>
            <li>오류 정정·삭제 요구</li>
            <li>처리 정지 요구</li>
            <li>동의 철회·회원 탈퇴</li>
          </ul>
          <p className="mt-3">
            계정 설정 &gt; 개인정보 관리 메뉴에서 직접 <b>내 데이터 내려받기</b>(JSON) 및
            <b> 계정 삭제</b>를 신청할 수 있습니다. 또는 아래 문의처로 연락해 주십시오.
          </p>
        </Section>

        <Section title="제7조 (개인정보의 파기)">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>파기 시점</b>: 보유 기간 경과, 처리 목적 달성, 탈퇴 후 30일 유예 경과 시 자동 파기</li>
            <li><b>파기 절차</b>: 복구·재생 불가능한 방법으로 영구 삭제 (DB cascade delete + 백업에서 보존기간 내 수동 삭제)</li>
            <li><b>예외</b>: 법령에서 의무 보관하도록 규정한 정보는 해당 기간까지 분리 저장 후 파기</li>
          </ul>
        </Section>

        <Section title="제8조 (개인정보의 안전성 확보 조치)">
          <ul className="list-disc pl-5 space-y-1">
            <li>접근 통제: Row Level Security(RLS), OAuth 토큰 서명, CSRF 방어</li>
            <li>접속 기록 보관·점검: 오류 로그 3개월 이상 보관, 관리자 액세스 감사 로그 3년 보관</li>
            <li>암호화: HTTPS(TLS 1.3) 전송 구간 암호화, Supabase Postgres 저장 구간 암호화</li>
            <li>악성코드 대응: 의존성 취약점 자동 스캔</li>
            <li>물리적 조치: 위탁업체의 데이터센터 물리 보안(SOC2/ISO27001 인증 기준)</li>
          </ul>
        </Section>

        <Section title="제9조 (만 14세 미만 아동의 개인정보)">
          <p>
            Draft는 만 14세 이상만 가입할 수 있는 대학생·성인 대상 서비스입니다.
            만 14세 미만의 개인정보는 수집하지 않습니다. 확인 시 즉시 파기합니다.
          </p>
        </Section>

        <Section title="제10조 (쿠키의 운영 및 거부)">
          <p>
            회사는 서비스 제공을 위해 세션 쿠키와 필수 로컬 저장소를 사용합니다. 브라우저 설정에서
            쿠키 저장을 거부할 수 있으나, 거부 시 로그인 유지·온보딩 진행 등 일부 서비스 이용이 제한됩니다.
          </p>
        </Section>

        <Section title="제11조 (개인정보 보호책임자)">
          <p>개인정보 처리에 관한 업무를 총괄하여 책임지며 정보주체 불만 처리 및 피해 구제 등에 관한 사항을 처리합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>책임자</b>: Draft 운영팀</li>
            <li><b>이메일</b>: <a href="mailto:team@dailydraft.me" className="text-brand underline">team@dailydraft.me</a></li>
          </ul>
        </Section>

        <Section title="제12조 (권익 침해 구제 방법)">
          <p>아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 침해 신고센터 (privacy.go.kr, 국번없이 182)</li>
            <li>개인정보 분쟁조정위원회 (kopico.go.kr, 1833-6972)</li>
            <li>대검찰청 사이버수사과 (spo.go.kr, 02-3480-3573)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr, 국번없이 182)</li>
          </ul>
        </Section>

        <Section title="제13조 (처리방침 변경)">
          <p>
            이 처리방침은 시행일부터 적용되며, 법령 및 방침에 따른 변경 시 변경사항의 시행 7일 전부터
            공지합니다. 중요한 변경 시에는 회원 가입 이메일로 별도 통지합니다.
          </p>
        </Section>
      </section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] font-bold text-txt-primary mt-6 mb-2 scroll-mt-16">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
