'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  ExternalLink, Image as ImageIcon, Plus, X, Loader2, Upload, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { toastErrorWithRetry } from '@/src/lib/toast-helpers'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase/client'
import {
  useCreatePortfolioItem,
  useDeletePortfolioItem,
  type PortfolioItem,
} from '@/src/hooks/usePortfolioItems'

/**
 * 포트폴리오 탭 — 이미지 카드 그리드 + 추가 폼.
 * 디자인 토큰만 사용. 폼은 아코디언 형태로 인라인 노출.
 */

interface ProfilePortfolioProps {
  items: PortfolioItem[]
  isEditable?: boolean
}

export function ProfilePortfolio({ items, isEditable = false }: ProfilePortfolioProps) {
  const { user } = useAuth()
  const createItem = useCreatePortfolioItem()
  const deleteItem = useDeletePortfolioItem()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLinkUrl('')
    setImageUrl(null)
    setShowForm(false)
  }

  const uploadFile = async (file: File) => {
    if (!user?.id) return
    setUploading(true)
    try {
      const path = `${user.id}/portfolio-${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('profile-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(path)
      setImageUrl(publicUrl)
    } catch {
      // 재시도 버튼 — 같은 파일로 재업로드
      toastErrorWithRetry('이미지 업로드에 실패했습니다', () => uploadFile(file))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (!file.type.startsWith('image/')) { toast.error('이미지 파일만 가능합니다'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('5MB 이하만 가능합니다'); return }
    await uploadFile(file)
  }

  const handleCreate = () => {
    if (!title.trim()) { toast.error('제목을 입력해주세요'); return }
    createItem.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl || undefined,
        link_url: linkUrl.trim() || undefined,
        display_order: items.length,
      },
      {
        onSuccess: () => { resetForm(); toast.success('포트폴리오가 추가되었습니다') },
        onError: () => toast.error('포트폴리오 추가에 실패했습니다'),
      },
    )
  }

  const doDelete = (id: string) => {
    setDeletingId(id)
    deleteItem.mutate(id, {
      onSuccess: () => {
        toast.success('삭제되었습니다')
        setDeleteTarget(null)
      },
      onError: () => toast.error('삭제에 실패했습니다'),
      onSettled: () => setDeletingId(null),
    })
  }

  // Not editable + empty = hide whole section
  if (!isEditable && items.length === 0) return null

  return (
    <section className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-txt-primary">
          포트폴리오
          {items.length > 0 && (
            <span className="ml-2 text-sm font-medium text-txt-tertiary tabular-nums">{items.length}</span>
          )}
        </h2>
        {isEditable && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus size={12} />
            추가
          </button>
        )}
      </div>

      {/* 추가 폼 */}
      {isEditable && showForm && (
        <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-txt-primary">새 포트폴리오</p>
            <button
              onClick={resetForm}
              className="text-txt-disabled hover:text-txt-tertiary transition-colors"
              aria-label="닫기"
            >
              <X size={14} />
            </button>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-surface-sunken">
                <Image src={imageUrl} alt="프리뷰" fill className="object-cover" />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-inverse text-txt-inverse flex items-center justify-center shadow-md"
                  aria-label="이미지 제거"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-video flex flex-col items-center justify-center gap-2 bg-surface-sunken border border-dashed border-border rounded-xl text-txt-tertiary hover:border-brand hover:text-brand transition-colors"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span className="text-xs font-medium">
                  {uploading ? '업로드 중' : '대표 이미지 (선택)'}
                </span>
              </button>
            )}
          </div>

          <input
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 80))}
            placeholder="제목"
            autoFocus
            className="w-full px-4 py-2.5 text-sm font-semibold bg-surface-sunken border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 300))}
            placeholder="설명 (선택)"
            rows={3}
            className="w-full px-4 py-2.5 text-sm bg-surface-sunken border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="링크 URL (선택)"
            className="w-full px-4 py-2.5 text-sm bg-surface-sunken border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={createItem.isPending || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-50 transition-colors"
            >
              {createItem.isPending ? <Loader2 size={11} className="animate-spin" /> : null}
              추가
            </button>
          </div>
        </div>
      )}

      {/* 아이템 그리드 */}
      {items.length === 0 ? (
        !showForm && (
          <div className="bg-surface-card border border-border rounded-2xl p-12 text-center">
            <ImageIcon size={28} className="text-txt-disabled mx-auto mb-3" />
            <p className="text-sm font-semibold text-txt-primary mb-1">아직 포트폴리오가 없습니다</p>
            <p className="text-xs text-txt-tertiary">
              {isEditable ? '첫 포트폴리오를 추가해보세요' : '아직 등록된 작업물이 없습니다'}
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="relative group bg-surface-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {isEditable && (
                <button
                  onClick={() => setDeleteTarget(item)}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-surface-card border border-border flex items-center justify-center text-txt-disabled hover:text-status-danger-text hover:bg-status-danger-bg hover:border-status-danger-text/30 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  aria-label="삭제"
                >
                  {deletingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              )}
              {/* 이미지 영역 */}
              {item.image_url ? (
                <div className="relative aspect-video bg-surface-sunken">
                  <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-brand-bg to-surface-sunken flex items-center justify-center">
                  <ImageIcon size={24} className="text-txt-disabled" />
                </div>
              )}
              {/* 텍스트 영역 */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-txt-primary truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-xs text-txt-secondary mt-1 line-clamp-2">{item.description}</p>
                )}
                {item.link_url && (
                  <a
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    자세히 보기
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          doDelete(deleteTarget.id)
        }}
        title="포트폴리오 삭제"
        message={deleteTarget ? `"${deleteTarget.title}" 을(를) 삭제합니다. 이미지도 함께 사라집니다.` : ''}
        confirmText="삭제"
        variant="danger"
      />
    </section>
  )
}
