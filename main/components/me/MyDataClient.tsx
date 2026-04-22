'use client'

import { useState } from 'react'
import { Download, Trash2, AlertTriangle, CheckCircle2, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NotificationPreferences } from './NotificationPreferences'

/**
 * /me/data — 정보주체 권리 UI.
 * - 내 데이터 내려받기 (JSON 다운로드 트리거)
 * - 계정 삭제 신청 (2단계 확인)
 * - 동의 이력 표시
 */
interface MyDataClientProps {
  email: string
  nickname: string | null
  deletedAt: string | null
  dataConsent: boolean | null
  dataConsentAt: string | null
}

export function MyDataClient({ email, nickname, deletedAt, dataConsent, dataConsentAt }: MyDataClientProps) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle')
  const [deleteReason, setDeleteReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const res = await fetch('/api/me/export', { credentials: 'same-origin' })
      if (!res.ok) throw new Error('내보내기 요청에 실패했습니다')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `draft-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setExportDone(true)
      setTimeout(() => setExportDone(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleteStage('loading')
    setError(null)
    try {
      const res = await fetch('/api/me/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ confirm: true, reason: deleteReason || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error?.message || '탈퇴 요청 실패')
      }
      setDeleteStage('done')
      setTimeout(() => {
        router.push('/login?goodbye=1')
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      setDeleteStage('confirm')
    }
  }

  const alreadyDeleting = !!deletedAt

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-[22px] font-black text-txt-primary">내 데이터 관리</h1>
        <p className="text-[13px] text-txt-secondary mt-1">
          개인정보보호법에 따라 본인 데이터 열람·내려받기·삭제를 요청할 수 있습니다.
        </p>
      </header>

      {/* 알림·이메일 수신 설정 — 상단에 노출해 DSR 맥락과 일관 */}
      <NotificationPreferences />

      {/* 계정 정보 요약 */}
      <section className="bg-surface-card border border-border rounded-2xl p-5">
        <h2 className="text-[14px] font-bold text-txt-primary mb-3">계정 정보</h2>
        <dl className="space-y-2 text-[13px]">
          <div className="flex items-center gap-2">
            <dt className="text-txt-tertiary w-24">이메일</dt>
            <dd className="text-txt-primary font-medium">{email}</dd>
          </div>
          {nickname && (
            <div className="flex items-center gap-2">
              <dt className="text-txt-tertiary w-24">닉네임</dt>
              <dd className="text-txt-primary font-medium">{nickname}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <dt className="text-txt-tertiary w-24">약관 동의</dt>
            <dd className="text-txt-primary flex items-center gap-1.5">
              {dataConsent ? (
                <>
                  <CheckCircle2 size={13} className="text-brand" />
                  <span>
                    {dataConsentAt
                      ? new Date(dataConsentAt).toLocaleString('ko-KR')
                      : '동의 완료'}
                  </span>
                </>
              ) : (
                <span className="text-txt-tertiary">기록 없음</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* 탈퇴 진행 중 안내 */}
      {alreadyDeleting && (
        <section className="bg-status-warn-bg border border-status-warn-text/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-status-warn-text shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-bold text-txt-primary mb-1">탈퇴 요청 진행 중</h3>
              <p className="text-[12px] text-txt-secondary leading-relaxed">
                {new Date(deletedAt!).toLocaleString('ko-KR')} 에 탈퇴를 요청하셨습니다.
                30일 이후 자동으로 영구 삭제됩니다. 복구를 원하시면
                <Link href="/login" className="text-brand underline ml-1">로그인</Link> 후
                문의해 주십시오.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 내 데이터 내려받기 */}
      <section className="bg-surface-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <Download size={18} className="text-txt-secondary shrink-0 mt-0.5" />
          <div>
            <h2 className="text-[14px] font-bold text-txt-primary">내 데이터 내려받기</h2>
            <p className="text-[12px] text-txt-tertiary mt-0.5 leading-relaxed">
              프로필, 클럽 멤버십, 지원서, 초대, 주간 업데이트, 메시지, 감사 로그 등
              본인 계정과 관련된 모든 데이터를 JSON 파일로 받을 수 있습니다.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="w-full sm:w-auto px-4 py-2.5 bg-surface-inverse text-txt-inverse rounded-full text-[13px] font-bold disabled:opacity-60 hover:opacity-90 active:scale-[0.98] transition"
        >
          {exporting ? '준비 중...' : exportDone ? '다운로드 시작됨 ✓' : 'JSON 내려받기'}
        </button>
      </section>

      {/* 계정 삭제 */}
      {!alreadyDeleting && (
        <section className="bg-surface-card border border-status-danger-text/30 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <Trash2 size={18} className="text-status-danger-text shrink-0 mt-0.5" />
            <div>
              <h2 className="text-[14px] font-bold text-txt-primary">계정 삭제</h2>
              <p className="text-[12px] text-txt-tertiary mt-0.5 leading-relaxed">
                탈퇴 요청 후 <b>30일 동안 복구</b> 가능합니다. 그 이후엔 모든 개인정보가 영구 삭제되며
                되돌릴 수 없습니다. 동아리 소유자인 경우 소유권 이전 후에만 탈퇴할 수 있습니다.
              </p>
            </div>
          </div>

          {deleteStage === 'idle' && (
            <button
              type="button"
              onClick={() => setDeleteStage('confirm')}
              className="w-full sm:w-auto px-4 py-2.5 border border-status-danger-text/40 text-status-danger-text rounded-full text-[13px] font-bold hover:bg-status-danger-text/5 transition"
            >
              탈퇴 요청
            </button>
          )}

          {deleteStage === 'confirm' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-start gap-2 px-3 py-2 bg-status-danger-text/5 rounded-lg">
                <AlertTriangle size={14} className="text-status-danger-text shrink-0 mt-0.5" />
                <p className="text-[12px] text-status-danger-text leading-relaxed">
                  정말 탈퇴하시겠습니까? 30일 경과 후 복구 불가합니다.
                </p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-txt-tertiary mb-1 block">
                  탈퇴 사유 (선택)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="서비스 개선에 참고하겠습니다"
                  className="w-full px-3 py-2 bg-surface-bg border border-border rounded-lg text-[13px] text-txt-primary ob-input resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteStage('idle')}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-border text-txt-secondary rounded-full text-[13px] font-semibold hover:bg-surface-sunken transition"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-status-danger-text text-white rounded-full text-[13px] font-bold hover:opacity-90 active:scale-[0.98] transition"
                >
                  탈퇴 확정
                </button>
              </div>
            </div>
          )}

          {deleteStage === 'loading' && (
            <div className="text-[13px] text-txt-secondary py-3">처리 중...</div>
          )}

          {deleteStage === 'done' && (
            <div className="flex items-center gap-2 text-[13px] text-brand py-3">
              <CheckCircle2 size={15} />
              탈퇴 요청이 접수되었습니다. 잠시 후 로그인 화면으로 이동합니다.
            </div>
          )}
        </section>
      )}

      {error && (
        <div className="bg-status-danger-text/5 border border-status-danger-text/30 rounded-xl px-4 py-3 text-[13px] text-status-danger-text">
          {error}
        </div>
      )}

      {/* 법적 고지 링크 */}
      <section className="text-[12px] text-txt-tertiary flex items-center gap-3 pt-4">
        <Shield size={13} />
        <Link href="/privacy" className="underline hover:text-txt-secondary">개인정보처리방침</Link>
        <span className="text-border">·</span>
        <Link href="/terms" className="underline hover:text-txt-secondary">이용약관</Link>
      </section>
    </div>
  )
}
