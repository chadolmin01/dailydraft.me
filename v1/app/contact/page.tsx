import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Shield, Handshake, MessagesSquare, Bug, Newspaper, Gavel } from 'lucide-react'

export const metadata: Metadata = {
  title: '연락처 · Draft',
  description:
    '파트너십·보안·실사·지원·언론 문의 경로를 한 곳에 정리했습니다. 문의 유형별 이메일·SLA·첨부 양식을 확인하세요.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    title: '연락처 · Draft',
    description: '문의 유형별 이메일·SLA·첨부 양식.',
    url: '/contact',
    locale: 'ko_KR',
  },
}

/**
 * /contact — 연락처 라우팅.
 *
 * 엔터프라이즈 실사·언론·보안·지원 문의가 섞여 한 이메일로 들어오는 문제 해소.
 * 각 유형별 권장 제목·SLA·첨부물을 명시해 초기 응답 시간을 단축.
 */

interface ContactLane {
  title: string
  icon: typeof Mail
  email: string
  subject: string
  sla: string
  what: string
  attach?: string
}

const LANES: ContactLane[] = [
  {
    title: '일반·지원',
    icon: MessagesSquare,
    email: 'team@dailydraft.me',
    subject: 'Support',
    sla: '영업일 2일 이내',
    what: '계정·결제·기능 사용·버그(보안 외)·피드백.',
  },
  {
    title: '파트너십·기관',
    icon: Handshake,
    email: 'team@dailydraft.me',
    subject: 'Partnership',
    sla: '영업일 3일 이내',
    what: '대학 창업교육센터·산학협력단·VC·기업 제휴. 계약·DPA 논의.',
    attach: '기관 소개·도입 희망 범위·예산 개요(있는 경우)',
  },
  {
    title: '보안 제보',
    icon: Shield,
    email: 'team@dailydraft.me',
    subject: '[Security]',
    sla: '24시간 초기 응답',
    what: 'Draft 서비스의 취약점 제보. Coordinated Disclosure.',
    attach: '재현 단계·영향 범위·가능하면 PoC (유저 데이터 탈취 금지)',
  },
  {
    title: '버그 제보',
    icon: Bug,
    email: 'team@dailydraft.me',
    subject: '[Bug]',
    sla: '영업일 3일 이내',
    what: '기능 오작동·에러 페이지·데이터 일치 이상.',
    attach: '재현 URL·브라우저·스크린샷',
  },
  {
    title: '법무·실사',
    icon: Gavel,
    email: 'team@dailydraft.me',
    subject: 'Due Diligence Docs',
    sla: '영업일 5일 이내 (NDA 필요 시 추가 2일)',
    what: 'PIPA 수탁 계약서, RoPA, 보안 아키텍처 상세, 침투 시험 결과(예정).',
    attach: 'NDA 초안 또는 실사 체크리스트',
  },
  {
    title: '언론·취재',
    icon: Newspaper,
    email: 'team@dailydraft.me',
    subject: 'Press',
    sla: '영업일 2일 이내',
    what: '인터뷰·기획기사·프레스킷 요청.',
    attach: '매체명·마감 일정·질문 초안',
  },
]

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <p className="text-[12px] font-semibold text-brand mb-3">연락</p>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">연락처</h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          모든 문의는 <code className="text-[12px] bg-surface-sunken px-1.5 py-0.5 rounded">team@dailydraft.me</code> 로 수신됩니다. 초기 응답 시간을 단축하기 위해 유형별 권장 제목 태그·첨부 양식을 아래에 정리했습니다.
        </p>
      </header>

      <section className="space-y-3 mb-12">
        {LANES.map((l) => {
          const Icon = l.icon
          const mailto = `mailto:${l.email}?subject=${encodeURIComponent(l.subject)}`
          return (
            <div key={l.title} className="bg-surface-card border border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-brand" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-[15px] font-bold text-txt-primary">{l.title}</h2>
                    <span className="text-[11px] font-mono tabular-nums text-txt-tertiary">
                      SLA {l.sla}
                    </span>
                  </div>
                  <p className="text-[13px] text-txt-secondary mt-1 leading-relaxed">{l.what}</p>
                  {l.attach && (
                    <p className="text-[12px] text-txt-tertiary mt-1">권장 첨부: {l.attach}</p>
                  )}
                  <a
                    href={mailto}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:underline"
                  >
                    <Mail size={12} aria-hidden="true" />
                    {l.email} · 제목 태그 [{l.subject}]
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">제보·긴급 경로</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            긴급 서비스 장애:{' '}
            <Link href="/status" className="text-brand underline">
              /status
            </Link>{' '}
            — 자동 헬스체크·최근 인시던트 이력
          </li>
          <li>
            보안 취약점 상세 정책:{' '}
            <Link href="/security" className="text-brand underline">
              /security
            </Link>{' '}
            (Coordinated Disclosure·Safe Harbor)
          </li>
          <li>
            개인정보 삭제 요청:{' '}
            <Link href="/legal/data-deletion" className="text-brand underline">
              /legal/data-deletion
            </Link>{' '}
            (PIPA 36조)
          </li>
        </ul>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-[12px] text-txt-tertiary">
        <p>
          모든 이메일은 Draft 운영자만 접근 가능하며, 읽음 확인·자동 회신·스팸 필터 분류 정보는{' '}
          <Link href="/legal/retention" className="text-brand underline">
            보관·파기 정책
          </Link>
          을 따릅니다.
        </p>
      </footer>
    </main>
  )
}
