'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { supportsAutoTransfer, type AssetType } from '@/src/lib/assets/url-parser'
import AssetCard from './assets/AssetCard'
import AssetAddModal from './assets/AssetAddModal'
import type { AssetItem } from './assets/types'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Props {
  slug: string
  clubName: string
}

interface ListResponse {
  items: AssetItem[]
}

export default function AssetsSettingsClient({ slug, clubName }: Props) {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AssetItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const queryKey = ['club-assets', slug] as const
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${slug}/assets`)
      if (!res.ok) throw new Error('Failed to load assets')
      return res.json()
    },
    staleTime: 30_000,
  })

  const items = data?.items ?? []
  const autoCount = items.filter(a => supportsAutoTransfer(a.asset_type as AssetType)).length
  const handoverCount = items.filter(a => a.needs_handover).length

  function refresh() {
    queryClient.invalidateQueries({ queryKey })
  }

  async function handleDelete(id: string) {
    setDeleteId(null)
    const res = await fetch(`/api/clubs/${slug}/assets/${id}`, { method: 'DELETE' })
    if (res.ok) refresh()
  }

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <Link
          href={`/clubs/${slug}/settings`}
          className="inline-flex items-center gap-1 text-[12px] text-txt-tertiary hover:text-txt-primary transition-colors mb-3"
        >
          <ChevronLeft size={14} />
          {clubName} 설정
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary tracking-tight">운영 자산</h1>
            <p className="text-[13px] text-txt-tertiary mt-1">
              동아리에서 쓰는 외부 도구·계정·문서의 위치와 담당자를 한 곳에 정리합니다
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-[13px] font-bold rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Plus size={14} strokeWidth={2.5} />
            자산 추가
          </button>
        </div>

        {/* Stats strip */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface-card border border-border rounded-2xl p-4">
              <div className="text-[11px] text-txt-tertiary mb-1">전체 자산</div>
              <div className="text-2xl font-bold tabular-nums text-txt-primary">{items.length}</div>
            </div>
            <div className="bg-surface-card border border-border rounded-2xl p-4">
              <div className="text-[11px] text-txt-tertiary mb-1">자동 양도 가능</div>
              <div className="text-2xl font-bold tabular-nums text-status-success-text">
                {autoCount}
                <span className="text-base text-txt-disabled">/{items.length}</span>
              </div>
            </div>
            <div className="bg-surface-card border border-border rounded-2xl p-4">
              <div className="text-[11px] text-txt-tertiary mb-1">담당 변경 필요</div>
              <div className="text-2xl font-bold tabular-nums text-status-warning-text">{handoverCount}</div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-48 bg-surface-card border border-border rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="bg-surface-card border border-border rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-surface-sunken rounded-full flex items-center justify-center mb-5 text-3xl">📋</div>
            <h3 className="text-[17px] font-black text-txt-primary mb-2">아직 등록된 자산이 없습니다</h3>
            <p className="text-[13px] text-txt-tertiary mb-6 leading-relaxed max-w-md">
              구글 드라이브·노션·디스코드·GitHub·Figma 같은 동아리 자산의 URL 을 등록하면
              Draft 가 자동으로 유형을 인식하고 권한 페이지 딥링크를 만들어줍니다.
            </p>
            <button
              onClick={() => { setEditing(null); setModalOpen(true) }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-inverse text-txt-inverse text-[14px] font-bold rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
            >
              <Plus size={15} strokeWidth={2.5} />
              첫 자산 등록하기
            </button>
          </div>
        )}

        {/* Asset grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={(a) => { setEditing(a); setModalOpen(true) }}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        )}

        {/* Helper hint */}
        {!isLoading && items.length > 0 && (
          <div className="mt-8 p-4 bg-surface-card border border-border rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-bg rounded-lg flex items-center justify-center text-base shrink-0">💡</div>
            <div className="text-[13px] text-txt-secondary leading-relaxed">
              <span className="font-semibold text-txt-primary">콘텐츠는 원본에 그대로 둡니다.</span>{' '}
              Draft 는 URL·메타데이터·담당자만 보관하고, 실시간 협업·권한 관리는 원본 도구에서 그대로 이뤄집니다.
              비밀번호는 절대 저장하지 마시고 보관 위치만 적어주세요.
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <AssetAddModal
          slug={slug}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); refresh() }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) handleDelete(deleteId) }}
        title="이 자산을 삭제하시겠습니까?"
        message="자산 정보가 Draft 에서 제거됩니다. 원본 도구의 자료나 권한은 영향받지 않습니다."
        confirmText="삭제"
        variant="danger"
      />
    </div>
  )
}
