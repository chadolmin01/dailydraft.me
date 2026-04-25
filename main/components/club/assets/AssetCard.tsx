'use client'

import { useState } from 'react'
import {
  ASSET_TYPE_ICONS,
  ASSET_TYPE_LABELS,
  deriveDeepLinks,
  supportsAutoTransfer,
  type AssetType,
} from '@/src/lib/assets/url-parser'
import type { AssetItem } from './types'

interface Props {
  asset: AssetItem
  onEdit: (asset: AssetItem) => void
  onDelete: (id: string) => void
}

const TYPE_BG: Record<AssetType, string> = {
  drive: 'bg-blue-50 text-blue-700',
  gmail: 'bg-amber-50 text-amber-700',
  notion: 'bg-gray-100 text-gray-700',
  github: 'bg-gray-100 text-gray-700',
  discord: 'bg-indigo-50 text-indigo-700',
  figma: 'bg-orange-50 text-orange-700',
  instagram: 'bg-pink-50 text-pink-700',
  email: 'bg-amber-50 text-amber-700',
  other: 'bg-gray-100 text-gray-700',
}

export default function AssetCard({ asset, onEdit, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const type = asset.asset_type as AssetType
  const icon = ASSET_TYPE_ICONS[type] ?? '🔗'
  const label = ASSET_TYPE_LABELS[type] ?? '기타'
  const auto = supportsAutoTransfer(type)
  const links = deriveDeepLinks(type, asset.url)
  const initial = asset.owner.display_name?.[0] ?? '?'

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 hover:border-txt-tertiary hover:shadow-sm transition-all relative">
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold ${TYPE_BG[type] ?? TYPE_BG.other}`}>
          <span>{icon}</span>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {auto && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success-bg text-status-success-text">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              자동 양도 가능
            </span>
          )}
          {asset.needs_handover && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-warning-text">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              담당 변경 필요
            </span>
          )}
        </div>
      </div>

      <h3 className="text-[15px] font-bold text-txt-primary leading-snug">{asset.name}</h3>
      <p className="text-[12px] text-txt-tertiary mt-1 truncate font-mono">
        {asset.url.replace(/^https?:\/\//, '')}
      </p>

      <div className="flex items-center gap-2 mt-4">
        {asset.owner.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.owner.avatar_url}
            alt={asset.owner.display_name ?? ''}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center text-brand text-[11px] font-bold">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-txt-primary truncate">
            {asset.owner.display_name ?? '담당자 미지정'}
          </div>
          {asset.owner.role_label && (
            <div className="text-[10px] text-txt-tertiary truncate">{asset.owner.role_label}</div>
          )}
        </div>
      </div>

      {asset.credential_location && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[10px] text-txt-tertiary mb-1">비번 보관 위치</div>
          <div className="text-[12px] text-txt-secondary">{asset.credential_location}</div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-[12px]">
        <a
          href={links.resourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-txt-secondary font-semibold hover:text-brand transition-colors"
        >
          자산 열기 →
        </a>
        {links.adminPageUrl && (
          <>
            <span className="text-border">·</span>
            <a
              href={links.adminPageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand font-semibold hover:underline"
              title={links.adminPageLabel ?? ''}
            >
              권한 페이지
            </a>
          </>
        )}
        <button
          onClick={() => setShowMenu(v => !v)}
          className="ml-auto text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="자산 메뉴"
        >
          ⋯
        </button>
      </div>

      {showMenu && (
        <div className="absolute right-4 bottom-12 bg-surface-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[120px]">
          <button
            onClick={() => { setShowMenu(false); onEdit(asset) }}
            className="w-full text-left px-3 py-1.5 text-[12px] text-txt-secondary hover:bg-surface-sunken transition-colors"
          >
            수정
          </button>
          <button
            onClick={() => { setShowMenu(false); onDelete(asset.id) }}
            className="w-full text-left px-3 py-1.5 text-[12px] text-status-danger-text hover:bg-status-danger-bg transition-colors"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}
