import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert, Mail, Timer, CheckCircle2, BookOpen, KeyRound } from 'lucide-react'

export const metadata: Metadata = {
  title: '보안 취약점 제보 · Draft',
  description:
    'Draft 의 조정된 공개(Coordinated Disclosure) 정책. 초기 응답 24시간, 초기 평가 72시간, 수정 배포 30일 SLA. PGP 키·보상 기준 포함.',
  alternates: { canonical: '/security' },
  openGraph: {
    type: 'article',
    title: '보안 취약점 제보 · Draft',
    description: 'Coordinated Disclosure · SLA · Safe Harbor',
    url: '/security',
    locale: 'ko_KR',
  },
}

/**
 * /security — 공개 VDP(Vulnerability Disclosure Program).
 *
 * RFC 9116 security.txt 의 Policy URL 후보. 기관 실사·Meta App Review 에서
 * "VDP 공개 URL" 이 있는지 확인하는 항목 대응.
 *
 * 내용:
 *   - 범위(in/out of scope)
 *   - 응답 SLA (24/72h/30d)
 *   - Safe Harbor — 선의 제보에 대한 법적 비추적
 *   - 보상 구조 (현재 금전 보상은 없고 Acknowledgements 만)
 *   - 금지 행위 (DDoS, 실제 유저 데이터 탈취 등)
 */

export default function SecurityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={16} className="text-brand" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-brand">보안 · VDP</p>
        </div>
        <h1 className="text-[28px] font-bold text-txt-primary tracking-tight">
          취약점 제보 가이드
        </h1>
        <p className="text-[14px] text-txt-secondary mt-2 leading-relaxed">
          Draft 는 조정된 공개(Coordinated Disclosure) 방식을 따릅니다. 발견하신 취약점은 공개 전
          먼저 저희에게 알려주시고, 수정 배포 후 상호 합의된 시점에 공개하는 구조입니다.
        </p>
      </header>

      {/* 제보 경로 */}
      <section className="mb-10 rounded-2xl border border-border bg-surface-card p-6">
        <h2 className="text-[15px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <Mail size={14} aria-hidden="true" />
          제보 경로
        </h2>
        <ul className="space-y-2 text-[13px] text-txt-secondary">
          <li>
            <strong className="text-txt-primary">이메일:</strong>{' '}
            <a href="mailto:team@dailydraft.me?subject=Security%20Report" className="text-brand underline">
              team@dailydraft.me
            </a>{' '}
            (제목에 <code className="text-[11px] bg-surface-sunken px-1 py-0.5 rounded">[Security]</code> 포함 권장)
          </li>
          <li>
            <strong className="text-txt-primary">RFC 9116:</strong>{' '}
            <a href="/.well-known/security.txt" className="text-brand underline">
              /.well-known/security.txt
            </a>
          </li>
          <li>
            <strong className="text-txt-primary">GitHub Security Advisory:</strong>{' '}
            <a
              href="https://github.com/chadolmin01/dailydraft.me/security/advisories/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline"
            >
              private vulnerability reporting
            </a>
          </li>
        </ul>
      </section>

      {/* 응답 SLA */}
      <section className="mb-10">
        <h2 className="text-[17px] font-bold text-txt-primary mb-4 flex items-center gap-2">
          <Timer size={14} aria-hidden="true" />
          응답 SLA
        </h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-sunken text-txt-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">단계</th>
                <th className="text-left px-4 py-3 font-semibold">목표</th>
                <th className="text-left px-4 py-3 font-semibold">내용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="align-top">
                <td className="px-4 py-3 font-semibold text-txt-primary">초기 응답</td>
                <td className="px-4 py-3 text-txt-secondary tabular-nums">24시간 이내</td>
                <td className="px-4 py-3 text-txt-secondary">제보 수령 확인, 담당자 배정.</td>
              </tr>
              <tr className="align-top">
                <td className="px-4 py-3 font-semibold text-txt-primary">초기 평가</td>
                <td className="px-4 py-3 text-txt-secondary tabular-nums">72시간 이내</td>
                <td className="px-4 py-3 text-txt-secondary">재현 여부·심각도 판정·수정 일정 공유.</td>
              </tr>
              <tr className="align-top">
                <td className="px-4 py-3 font-semibold text-txt-primary">수정 배포</td>
                <td className="px-4 py-3 text-txt-secondary tabular-nums">최대 30일</td>
                <td className="px-4 py-3 text-txt-secondary">심각도 SEV-0·1 은 최우선 핫픽스, SEV-2·3 은 정규 사이클 반영.</td>
              </tr>
              <tr className="align-top">
                <td className="px-4 py-3 font-semibold text-txt-primary">공개 조율</td>
                <td className="px-4 py-3 text-txt-secondary tabular-nums">수정 완료 +14일</td>
                <td className="px-4 py-3 text-txt-secondary">제보자와 공동 조율 후 Security Advisory · 릴리스 노트 게시.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 범위 */}
      <section className="mb-10 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
          <h3 className="text-[14px] font-bold text-txt-primary mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-brand" aria-hidden="true" />
            범위 (In-Scope)
          </h3>
          <ul className="text-[12px] text-txt-secondary space-y-1 list-disc pl-4">
            <li>dailydraft.me 및 서브도메인 전체</li>
            <li>Draft iOS/Android 앱 (출시 시)</li>
            <li>공개 API 엔드포인트(/api/*)</li>
            <li>OAuth 통합(Discord, Threads 등)</li>
            <li>권한 경계(RLS·admin 체크)</li>
            <li>저장된 시크릿 유출</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-surface-card p-5">
          <h3 className="text-[14px] font-bold text-txt-primary mb-2">범위 외 (Out-of-Scope)</h3>
          <ul className="text-[12px] text-txt-secondary space-y-1 list-disc pl-4">
            <li>Vercel·Supabase·Cloudflare 자체 인프라 (각 벤더에 직접 제보)</li>
            <li>브루트포스·DDoS 시도</li>
            <li>이메일 스푸핑(DMARC 설정 완료됨)</li>
            <li>Self-XSS, UI redressing 만으로는 impact 증명 불가</li>
            <li>프로덕션 유저 데이터 탈취·파괴 행위</li>
            <li>제3자 라이브러리 CVE 의 단순 버전 스캐너 출력</li>
          </ul>
        </div>
      </section>

      {/* Safe Harbor */}
      <section className="mb-10 rounded-2xl border border-border bg-surface-card p-6">
        <h2 className="text-[15px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <KeyRound size={14} aria-hidden="true" />
          Safe Harbor
        </h2>
        <p className="text-[13px] text-txt-secondary leading-relaxed">
          본 정책을 선의로 준수하여 취약점을 제보하신 연구자에게는 Draft 가 관련 법적 조치
          (정보통신망법·형법 등)를 제기하지 않습니다. 동시에, 실제 유저 데이터 열람·변경·파괴를
          수반한 행위, DDoS, 금전 요구(협박) 등은 Safe Harbor 적용 대상이 아닙니다.
        </p>
        <p className="text-[12px] text-txt-tertiary mt-3">
          본 조항은 제3자(수탁업체)에 대한 행위에는 적용되지 않습니다.
        </p>
      </section>

      {/* 보상 */}
      <section className="mb-10 space-y-3 text-[14px] text-txt-secondary leading-relaxed">
        <h2 className="text-[17px] font-bold text-txt-primary">보상</h2>
        <p>
          현재 Draft 는 금전 보상 프로그램을 운영하지 않습니다. 대신 선의의 제보자께는 공개 동의 후{' '}
          <a
            href="https://github.com/chadolmin01/dailydraft.me/blob/main/main/SECURITY.md#acknowledgements"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            SECURITY.md Acknowledgements
          </a>{' '}
          섹션에 기재해 드립니다.
        </p>
        <p>
          매출 규모가 커지면 금전 보상 프로그램(HackerOne 또는 자체 운영) 도입을 검토할 예정입니다.
        </p>
      </section>

      {/* 참고 */}
      <section className="text-[13px] text-txt-secondary space-y-2">
        <h2 className="text-[15px] font-bold text-txt-primary mb-1 flex items-center gap-2">
          <BookOpen size={14} aria-hidden="true" />
          관련 문서
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <Link href="/trust" className="text-brand underline">
              신뢰 센터
            </Link>{' '}
            — 보안·컴플라이언스 통합 진입점
          </li>
          <li>
            <Link href="/status" className="text-brand underline">
              시스템 상태
            </Link>{' '}
            — 실시간 헬스체크·인시던트 이력
          </li>
          <li>
            <a
              href="https://github.com/chadolmin01/dailydraft.me/blob/main/main/SECURITY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline"
            >
              SECURITY.md (전문)
            </a>
          </li>
        </ul>
      </section>

      <footer className="mt-16 pt-8 border-t border-border text-[12px] text-txt-tertiary">
        <p>
          본 페이지는{' '}
          <a href="/.well-known/security.txt" className="text-brand underline">
            RFC 9116 security.txt
          </a>{' '}
          의 Policy URL 로도 사용됩니다.
        </p>
      </footer>
    </main>
  )
}
