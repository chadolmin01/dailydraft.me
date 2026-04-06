'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  ExternalLink,
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
  Upload,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase/client'
import {
  useCreatePortfolioItem,
  useDeletePortfolioItem,
  type PortfolioItem,
} from '@/src/hooks/usePortfolioItems'

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
  const fileRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLinkUrl('')
    setImageUrl(null)
    setShowForm(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    setUploading(true)
    try {
      const path = `${user.id}/portfolio-${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('profile-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path)
      setImageUrl(publicUrl)
    } catch {
      toast.error('이미지 업로드에 실패했습니다')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleCreate = () => {
    if (!title.trim()) return
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

  const handleDelete = (id: string) => {
    setDeletingId(id)
    deleteItem.mutate(id, {
      onSuccess: () => toast.success('포트폴리오가 삭제되었습니다'),
      onError: () => toast.error('삭제에 실패했습니다'),
      onSettled: () => setDeletingId(null),
    })
  }

  // Hide entirely if not editable and no items
  if (!isEditable && items.length === 0) return null

  return (
    <section className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-txt-primary flex items-center gap-2">
          포트폴리오
          {items.length > 0 && <span className="text-xs text-txt-tertiary">{items.length}</span>}
        </h3>
        {isEditable && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-xl hover:bg-surface-inverse hover:text-txt-inverse transition-colors hover:shadow-md active:scale-[0.97]"
          >
            <Plus size={14} /> 추가
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Existing items */}
        {items.map((item) => (
          <div
            key={item.id}
            className="relative bg-surface-card rounded-xl border border-border overflow-hidden group hover:shadow-lg hover-spring shadow-md"
          >

            {/* Delete button */}
            {isEditable && (
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="absolute top-2 right-2 z-20 w-7 h-7 bg-white/90 border border-border rounded-lg flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-status-danger-bg hover:border-status-danger-text/30 hover:text-status-danger-text"
              >
                {deletingId === item.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
              </button>
            )}

            {item.link_url ? (
              <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="block">
                {item.image_url ? (
                  <div className="relative h-36 bg-surface-sunken">
                    <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-36 bg-surface-inverse flex items-center justify-center">
                    <ImageIcon size={24} className="text-white/20" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-bold text-sm text-txt-primary mb-1 truncate">{item.title}</h4>
                  {item.description && <p className="text-xs text-txt-secondary line-clamp-2">{item.description}</p>}
                  <p className="flex items-center gap-1 text-xs text-txt-tertiary mt-2">
                    <ExternalLink size={10} /> 링크
                  </p>
                </div>
              </a>
            ) : (
              <>
                {item.image_url ? (
                  <div className="relative h-36 bg-surface-sunken">
                    <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-36 bg-surface-inverse flex items-center justify-center">
                    <ImageIcon size={24} className="text-white/20" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-bold text-sm text-txt-primary mb-1 truncate">{item.title}</h4>
                  {item.description && <p className="text-xs text-txt-secondary line-clamp-2">{item.description}</p>}
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add form card */}
        {showForm && (
          <div className="relative bg-surface-card border border-brand/30 rounded-xl overflow-hidden shadow-md flex flex-col">
            {/* Image upload area */}
            <div
              className="relative h-36 bg-surface-bg border-b border-border flex items-center justify-center cursor-pointer hover:bg-surface-sunken transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imageUrl ? (
                <>
                  <Image src={imageUrl} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-medium text-white">변경</span>
                  </div>
                </>
              ) : uploading ? (
                <Loader2 size={20} className="text-txt-disabled animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-txt-disabled">
                  <Upload size={18} />
                  <span className="text-xs font-medium">이미지 추가</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            {/* Form fields */}
            <div className="p-4 flex-1 flex flex-col gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목 *"
                className="text-base sm:text-sm font-bold bg-transparent border-b border-border outline-none px-0 py-1 focus:border-brand transition-colors placeholder:text-txt-disabled"
                autoFocus
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="설명 (선택)"
                className="text-xs bg-transparent border-b border-border outline-none px-0 py-1 focus:border-brand transition-colors placeholder:text-txt-disabled"
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="링크 URL (선택)"
                className="text-xs font-mono bg-transparent border-b border-border outline-none px-0 py-1 focus:border-brand transition-colors placeholder:text-txt-disabled"
              />
              <div className="flex items-center justify-end gap-2 mt-auto pt-3">
                <button
                  onClick={resetForm}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-txt-secondary border border-border rounded-xl hover:bg-surface-sunken transition-colors"
                >
                  <X size={10} /> 취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || createItem.isPending}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-surface-inverse text-txt-inverse border border-surface-inverse rounded-xl hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                >
                  {createItem.isPending ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state — add prompt */}
        {isEditable && items.length === 0 && !showForm && (
          <div
            className="border border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-brand/40 hover:bg-brand-bg/30 transition-colors group/add flex flex-col items-center justify-center gap-2 min-h-[13rem] col-span-full sm:col-span-1"
            onClick={() => setShowForm(true)}
          >
            <ImageIcon size={20} className="text-txt-disabled group-hover/add:text-brand transition-colors" />
            <p className="text-sm font-medium text-txt-tertiary group-hover/add:text-txt-primary transition-colors">포트폴리오를 추가해보세요</p>
            <p className="text-xs text-txt-disabled text-center">프로젝트 스크린샷, 디자인 작업물 등</p>
          </div>
        )}
      </div>
    </section>
  )
}
