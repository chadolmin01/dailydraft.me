'use client'

import { useState, useMemo } from 'react'
import {
  detectAssetType,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_ICONS,
  supportsAutoTransfer,
} from '@/src/lib/assets/url-parser'
import type { AssetItem } from './types'

interface Props {
  slug: string
  initial: AssetItem | null
  onClose: () => void
  onSaved: () => void
}

export default function AssetAddModal({ slug, initial, onClose, onSaved }: Props) {
  const [url, setUrl] = useState(initial?.url ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [credentialLocation, setCredentialLocation] = useState(initial?.credential_location ?? '')
  const [ownerDisplayName, setOwnerDisplayName] = useState(initial?.owner.display_name ?? '')
  const [ownerRoleLabel, setOwnerRoleLabel] = useState(initial?.owner.role_label ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detected = useMemo(() => {
    if (!url.trim()) return null
    const t = detectAssetType(url)
    if (t === 'other') return null
    return {
      type: t,
      icon: ASSET_TYPE_ICONS[t],
      label: ASSET_TYPE_LABELS[t],
      auto: supportsAutoTransfer(t),
    }
  }, [url])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const isEdit = !!initial
      const endpoint = isEdit
        ? `/api/clubs/${slug}/assets/${initial.id}`
        : `/api/clubs/${slug}/assets`
      const res = await fetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          url,
          credential_location: credentialLocation || null,
          owner_display_name: ownerDisplayName || null,
          owner_role_label: ownerRoleLabel || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setError(j?.error?.message ?? '저장에 실패했습니다')
        return
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !!name.trim() && !!url.trim() && !submitting

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface-card rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 pb-4 border-b border-border">
          <h3 className="text-[16px] font-bold text-txt-primary">
            {initial ? '자산 수정' : '자산 추가'}
          </h3>
          <p className="text-[12px] text-txt-tertiary mt-1">
            URL 만 붙여넣으면 Draft 가 유형을 자동 인식합니다 — 콘텐츠는 옮기지 않습니다
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-txt-secondary mb-1.5">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-3 py-2.5 border border-border rounded-xl text-[13px] focus:border-txt-primary focus:outline-none font-mono bg-surface-bg"
            />
            <div className="text-[11px] mt-1.5 h-4">
              {detected ? (
                <span className="text-status-success-text font-semibold">
                  ✓ {detected.icon} {detected.label} 인식됨
                  {detected.auto && <span className="text-txt-tertiary"> · 자동 양도 가능</span>}
                </span>
              ) : url.trim() ? (
                <span className="text-txt-tertiary">유형 미인식 · "기타" 로 등록됩니다</span>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-txt-secondary mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 21기 기수 자료"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-[13px] focus:border-txt-primary focus:outline-none bg-surface-bg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[12px] font-semibold text-txt-secondary mb-1.5">담당자</label>
              <input
                type="text"
                value={ownerDisplayName}
                onChange={(e) => setOwnerDisplayName(e.target.value)}
                placeholder="이름"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-[13px] focus:border-txt-primary focus:outline-none bg-surface-bg"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-txt-secondary mb-1.5">역할</label>
              <input
                type="text"
                value={ownerRoleLabel}
                onChange={(e) => setOwnerRoleLabel(e.target.value)}
                placeholder="예: 회장"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-[13px] focus:border-txt-primary focus:outline-none bg-surface-bg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-txt-secondary mb-1.5">
              비번 보관 위치
              <span className="text-[11px] font-normal text-txt-tertiary ml-1">· 비번 자체는 입력하지 마세요</span>
            </label>
            <input
              type="text"
              value={credentialLocation}
              onChange={(e) => setCredentialLocation(e.target.value)}
              placeholder="예: 1Password 팀 vault > flip-ops"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-[13px] focus:border-txt-primary focus:outline-none bg-surface-bg"
            />
          </div>

          <div className="bg-status-warning-bg border border-status-warning-text/20 rounded-xl p-3 flex gap-2">
            <span className="text-base shrink-0">⚠️</span>
            <p className="text-[11px] text-status-warning-text leading-relaxed">
              <span className="font-bold">비번을 직접 입력하지 마세요.</span>{' '}
              Draft 는 비번을 저장하지 않습니다. 1Password·Bitwarden 같은 비밀번호 관리 도구의 위치만 적어주세요.
            </p>
          </div>

          {error && (
            <div className="text-[12px] text-status-danger-text bg-status-danger-bg rounded-xl px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 bg-surface-sunken border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-[12px] font-semibold text-txt-tertiary hover:text-txt-primary transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 bg-surface-inverse text-txt-inverse text-[12px] font-bold rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '저장 중…' : initial ? '저장' : '자산 추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
