/**
 * 서비스 이용약관.
 * 시행일 + 개정일 명시. 중요 변경 시 재동의 UI 필요.
 * 타이틀은 `src/lib/routes/titles.ts` ROUTE_TITLES + TitleSync 로 처리 (flicker 방지).
 */
export default function TermsOfServicePage() {
  return (
    <article className="prose prose-slate max-w-none print:prose-sm">
      <h1 className="text-[26px] font-black text-txt-primary mb-2">서비스 이용약관</h1>
      <p className="text-[12px] font-mono text-txt-tertiary mb-8">
        시행일: 2026년 4월 27일 · 최종 개정: 2026년 4월 20일
      </p>

      <section className="space-y-6 text-[14px] leading-relaxed text-txt-secondary">
        <Section title="제1조 (목적)">
          <p>
            본 약관은 Draft(이하 &quot;회사&quot;)가 제공하는 동아리·프로젝트 운영 플랫폼 서비스(이하 &quot;서비스&quot;)의
            이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항, 이용조건 및 절차 등 기본적인 사항을
            규정함을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (용어의 정의)">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>회원</b>: 서비스에 가입하여 이용하는 자</li>
            <li><b>기관</b>: 대학, 창업지원단, 산학협력단, 학생처 등 회사와 별도 계약을 체결한 법인</li>
            <li><b>동아리/클럽</b>: 회원이 구성·운영하는 조직 단위</li>
            <li><b>콘텐츠</b>: 회원이 서비스 내에 게시·등록한 글, 이미지, 파일, 코드 등 일체의 저작물</li>
          </ul>
        </Section>

        <Section title="제3조 (약관의 게시와 개정)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>회사는 본 약관을 서비스 초기 화면에 게시합니다.</li>
            <li>회사는 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 시행일 및
              개정사유를 명시하여 최소 7일 전(이용자에게 불리한 개정은 30일 전)부터 공지합니다.</li>
            <li>회원이 개정약관에 동의하지 않는 경우 이용 계약을 해지할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (회원 가입)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>만 14세 이상의 대학 재학생·졸업생·현직자 및 이에 준하는 자가 가입할 수 있습니다.</li>
            <li>대학 이메일 도메인(@**.ac.kr) 인증이 확인된 경우 &quot;재학생 인증&quot; 상태가 부여됩니다.</li>
            <li>허위 정보 등록 시 회사는 계정 이용을 제한하거나 해지할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제5조 (회원 계정)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>회원은 자신의 계정 정보를 성실히 관리해야 하며, 제3자가 이용하게 해서는 안 됩니다.</li>
            <li>계정 탈취·부정 이용 사실을 알게 된 경우 즉시 회사에 통지해야 합니다.</li>
            <li>회사는 정당한 사유 없이 계정을 해지하지 않으며, 해지 시 사전 통지 및 해명 기회를 부여합니다.</li>
          </ol>
        </Section>

        <Section title="제6조 (회원의 의무)">
          <p>회원은 다음 행위를 해서는 안 됩니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>타인의 개인정보·계정·콘텐츠를 무단 수집·도용·공개하는 행위</li>
            <li>서비스의 정상 운영을 방해하는 행위(과도한 자동화 요청, 취약점 악용 등)</li>
            <li>범죄·허위사실·음란물·스팸·사기성 콘텐츠를 게시하는 행위</li>
            <li>회사 또는 제3자의 지식재산권·명예권·프라이버시를 침해하는 행위</li>
            <li>관련 법령 또는 본 약관을 위반하는 행위</li>
          </ul>
        </Section>

        <Section title="제7조 (콘텐츠의 권리와 이용 라이선스)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>회원이 등록한 콘텐츠의 저작권은 회원에게 귀속됩니다.</li>
            <li>회원은 회사가 서비스 운영·홍보·개선 목적으로 콘텐츠를 비독점적·무상·취소 가능한 범위에서
              이용할 수 있도록 허락합니다. (예: 추천/매칭 알고리즘 학습, 서비스 화면 내 전시, 익명 통계 작성)</li>
            <li>회원이 탈퇴하거나 콘텐츠를 삭제하면 해당 이용 권리는 즉시 종료됩니다. 단, 이미 생성된
              백업·익명 통계·제3자가 복제·공유한 결과물은 기술적 한계상 회수가 불가능할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제8조 (서비스 제공 및 변경)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>서비스는 연중무휴·1일 24시간 제공함을 원칙으로 합니다.</li>
            <li>회사는 시스템 점검·교체, 장애, 운영상 필요에 따라 서비스 전부 또는 일부를 일시 중단할 수 있습니다.</li>
            <li>회사는 기술적·사업적 사유로 서비스 내용을 변경할 수 있으며, 중대한 변경 시 사전 공지합니다.</li>
          </ol>
        </Section>

        <Section title="제9조 (유료 서비스 및 결제)">
          <p>
            현재 Draft는 주요 기능을 무료로 제공합니다. 기관 계약 또는 유료 플랜 도입 시 별도의
            요금·결제·환불 약관이 적용되며, 해당 내용은 본 약관에 통합되거나 보충 약관으로 고지됩니다.
          </p>
        </Section>

        <Section title="제10조 (이용 제한)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>회사는 회원이 본 약관 또는 관련 법령을 위반한 경우 경고·이용 제한·계정 해지 조치를 할 수 있습니다.</li>
            <li>긴급한 경우를 제외하고 사전 통지 및 소명 기회를 부여합니다.</li>
          </ol>
        </Section>

        <Section title="제11조 (계약의 해지 및 탈퇴)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>회원은 언제든지 계정 설정 메뉴를 통해 탈퇴를 신청할 수 있습니다.</li>
            <li>탈퇴 신청 후 30일 유예 기간이 부여되며, 이 기간 내 복구를 신청하지 않으면 개인정보처리방침에
              따라 데이터가 파기됩니다.</li>
            <li>회사는 중대한 약관 위반 시 계약을 해지할 수 있으며, 해지 사유와 소명 기회를 사전에 통지합니다.</li>
          </ol>
        </Section>

        <Section title="제12조 (책임의 제한)">
          <ol className="list-decimal pl-5 space-y-1">
            <li>회사는 천재지변, 제3자 서비스 장애(DDoS, 클라우드 장애 등), 회원 귀책 사유로 인한
              서비스 이용 불가에 대해 책임지지 않습니다.</li>
            <li>회사는 회원 간 또는 회원과 제3자 간에 발생한 분쟁에 개입할 의무가 없으며, 이로 인한
              손해를 배상할 책임이 없습니다.</li>
            <li>단, 회사의 고의·중대한 과실로 인한 손해는 관련 법령에 따라 책임집니다.</li>
          </ol>
        </Section>

        <Section title="제13조 (준거법 및 관할)">
          <p>
            본 약관은 대한민국 법률을 준거법으로 합니다. 서비스 이용과 관련된 분쟁은 민사소송법상의
            관할법원을 제1심 관할법원으로 합니다.
          </p>
        </Section>

        <Section title="제14조 (문의처)">
          <p>
            본 약관 및 서비스 이용 관련 문의는 <a href="mailto:contact@dailydraft.me" className="text-brand underline">contact@dailydraft.me</a>로 주십시오.
          </p>
        </Section>

        <p className="pt-4 text-[13px] text-txt-tertiary">
          부칙: 본 약관은 2026년 4월 27일부터 시행합니다.
        </p>
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
