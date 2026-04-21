import type { Metadata } from 'next'
import Link from 'next/link'
import { Wrench, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: '점검 중 · Draft',
  description: 'Draft 가 현재 예정된 시스템 점검 중입니다. 완료 예상 시간을 안내합니다.',
  robots: { index: false, follow: false },
}

/**
 * /maintenance — 예정 점검 랜딩.
 *
 * 용도:
 *   - 배포·DB 마이그레이션 등 사용자에게 일시 중단이 필요할 때 리버스 프록시/미들웨어에서 rewrite.
 *   - 스케줄 점검이 아닌 장애는 /status 로 안내 (이 페이지가 아닌).
 *
 * 주의: 자동 리디렉션은 없음 — 실제 점검 중에만 수동으로 리라우팅.
 */
export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-surface-bg flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-status-warn-bg flex items-center justify-center mx-auto mb-6">
          <Wrench size={32} className="text-status-warn-text" strokeWidth={1.5} />
        </div>

        <h1 className="text-[22px] font-bold text-txt-primary mb-2">
          잠시 시스템 점검 중입니다
        </h1>
        <p className="text-[14px] text-txt-secondary leading-relaxed mb-6 break-keep">
          예정된 유지보수가 진행되고 있습니다.
          <br />
          평소보다 더 안정적으로 돌아오도록 준비하고 있어요.
        </p>

        <div className="bg-surface-card border border-border rounded-2xl p-5 mb-6 text-left">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-txt-tertiary mb-2">
            <Clock size={12} aria-hidden="true" />
            상태 확인
          </div>
          <p className="text-[13px] text-txt-secondary leading-relaxed">
            실시간 헬스체크와 복구 시점은{' '}
            <Link href="/status" className="text-brand underline">
              시스템 상태 페이지
            </Link>
            에서 확인하실 수 있습니다. 긴급 문의는{' '}
            <a
              href="mailto:team@dailydraft.me?subject=Maintenance"
              className="text-brand underline"
            >
              team@dailydraft.me
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link
            href="/status"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-inverse text-txt-inverse text-[13px] font-bold hover:opacity-90 transition-opacity"
          >
            상태 페이지로
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-card text-txt-primary text-[13px] font-semibold hover:border-txt-tertiary transition-colors"
          >
            나중에 다시 오기
          </Link>
        </div>

        <p className="text-[11px] text-txt-tertiary mt-8">
          점검 이력은{' '}
          <Link href="/changelog" className="text-brand underline">
            릴리스 노트
          </Link>{' '}
          에 기록됩니다.
        </p>
      </div>
    </main>
  )
}
