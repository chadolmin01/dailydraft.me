'use client'

import { useState } from 'react'
import { Bookmark, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { PersonaTemplateRow } from '@/src/lib/personas/types'
import {
  useDeletePersonaTemplate,
  usePersonaTemplates,
  useRestoreTemplate,
  useSaveAsTemplate,
} from '@/src/hooks/usePersonaTemplates'

interface Props {
  personaId: string
  canEdit: boolean
}

/**
 * 페르소나 템플릿 라이브러리 (mirra.my "내 템플릿" 패턴).
 * 페르소나 페이지 하단, 위험 영역 위에 배치.
 *
 * - "+ 템플릿으로 저장" 버튼 → 이름 입력 모달 → 현재 상태 스냅샷
 * - 템플릿 카드: [복원] [삭제] 액션
 * - 복원은 덮어쓰기이므로 ConfirmModal로 경고
 */
export function PersonaTemplateLibrary({ personaId, canEdit }: Props) {
  const { data, isLoading } = usePersonaTemplates(personaId)
  const saveMut = useSaveAsTemplate(personaId)
  const restoreMut = useRestoreTemplate(personaId)
  const deleteMut = useDeletePersonaTemplate(personaId)

  const [saveOpen, setSaveOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<PersonaTemplateRow | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<PersonaTemplateRow | null>(
    null,
  )

  const templates = data?.templates ?? []

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-txt-primary">
            지금까지 저장해둔 버전{' '}
            <span className="text-txt-tertiary font-normal">
              {isLoading ? '' : templates.length}
            </span>
          </h2>
          <p className="text-xs text-txt-tertiary mt-0.5 leading-relaxed">
            &quot;이번 모집 시즌 톤&quot;처럼 이름을 붙여 저장해 두시면, 나중에 한 번 클릭으로 되돌리실 수 있습니다.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setSaveOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm font-semibold text-txt-primary hover:bg-surface-bg transition-colors shrink-0"
          >
            <Plus size={14} />
            템플릿으로 저장
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="h-28 rounded-xl skeleton-shimmer" />
          <div className="h-28 rounded-xl skeleton-shimmer" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyHint />
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              canEdit={canEdit}
              onRestore={() => setRestoreTarget(t)}
              onDelete={() => setDeleteTarget(t)}
            />
          ))}
        </div>
      )}

      {/* 저장 모달 */}
      <SaveTemplateModal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        saving={saveMut.isPending}
        onSave={(name, description) => {
          saveMut.mutate(
            { name, description: description || undefined },
            { onSuccess: () => setSaveOpen(false) },
          )
        }}
      />

      {/* 복원 확인 */}
      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (!restoreTarget) return
          restoreMut.mutate(restoreTarget.id, {
            onSuccess: () => setRestoreTarget(null),
          })
        }}
        title={
          restoreTarget ? `"${restoreTarget.name}" 복원` : '템플릿 복원'
        }
        message="현재 슬롯 값이 이 템플릿의 스냅샷으로 덮어쓰기됩니다. 복원 전에 현재 상태도 템플릿으로 저장해두면 안전합니다."
        confirmText={restoreMut.isPending ? '복원 중...' : '복원하기'}
        variant="warning"
      />

      {/* 삭제 확인 */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMut.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }}
        title={deleteTarget ? `"${deleteTarget.name}" 삭제` : '템플릿 삭제'}
        message="이 템플릿을 삭제합니다. 이 작업은 되돌릴 수 없습니다."
        confirmText={deleteMut.isPending ? '삭제 중...' : '삭제'}
        variant="danger"
      />
    </section>
  )
}

function TemplateCard({
  template,
  canEdit,
  onRestore,
  onDelete,
}: {
  template: PersonaTemplateRow
  canEdit: boolean
  onRestore: () => void
  onDelete: () => void
}) {
  const slotCount = template.fields_snapshot?.length ?? 0
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-brand-border transition-colors">
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center">
          <Bookmark size={14} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-txt-primary truncate">
            {template.name}
          </h3>
          <p className="text-[11px] text-txt-tertiary mt-0.5">
            {formatRelativeTime(template.created_at)}
          </p>
        </div>
      </div>

      <div className="flex-1 text-xs text-txt-secondary leading-relaxed">
        {template.description || (
          <span className="text-txt-tertiary italic">설명 없음</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-txt-tertiary">
          {slotCount}개 슬롯
        </span>
        {canEdit && (
          <div className="flex gap-1">
            <button
              onClick={onRestore}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-semibold text-txt-secondary hover:bg-surface-bg hover:text-txt-primary transition-colors"
              title="이 템플릿으로 복원"
            >
              <RotateCcw size={11} />
              복원
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-semibold text-txt-tertiary hover:bg-status-danger-text/5 hover:text-status-danger-text transition-colors"
              title="삭제"
              aria-label="템플릿 삭제"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyHint() {
  return (
    <div className="bg-surface-card border border-dashed border-border rounded-xl p-6 text-center">
      <p className="text-xs text-txt-secondary leading-relaxed">
        아직 저장된 버전이 없습니다.
      </p>
      <p className="text-[11px] text-txt-tertiary leading-relaxed mt-1.5">
        💾 페르소나를 조금 다듬으시면 오른쪽 위 <strong className="text-txt-secondary">"템플릿으로 저장"</strong> 버튼을 눌러보세요.
        <br />
        "모집용 격식체", "내부 캐주얼" 같이 이름 붙여두면 나중에 언제든 그 상태로 되돌릴 수 있습니다.
      </p>
    </div>
  )
}

function SaveTemplateModal({
  isOpen,
  onClose,
  saving,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  saving: boolean
  onSave: (name: string, description: string) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const canSave = name.trim().length > 0 && name.trim().length <= 80

  const handleSave = () => {
    if (!canSave) {
      toast.error('템플릿 이름을 입력해주세요')
      return
    }
    onSave(name.trim(), description.trim())
  }

  const handleClose = () => {
    if (saving) return
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title="템플릿으로 저장"
    >
      <div className="p-5 space-y-4">
        <p className="text-xs text-txt-secondary leading-relaxed">
          현재 페르소나의 모든 슬롯 값을 스냅샷으로 저장합니다. 이후 언제든 이 상태로 되돌릴 수 있습니다.
        </p>

        <div>
          <label className="block text-sm font-semibold text-txt-primary mb-1.5">
            이름 <span className="text-status-danger-text">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 모집 시즌 격식체"
            maxLength={80}
            disabled={saving}
            className="w-full h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 ob-input disabled:opacity-60"
          />
          <p className="text-[10px] text-txt-tertiary mt-1">
            {name.length}/80자
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-txt-primary mb-1.5">
            설명 <span className="text-txt-tertiary font-normal">(선택)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예) 신입 모집 공고·뉴스레터용. 감정 표현 절제, 수치 강조."
            rows={3}
            maxLength={500}
            disabled={saving}
            className="w-full text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2.5 ob-input leading-relaxed resize-none disabled:opacity-60"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            onClick={handleClose}
            disabled={saving}
            className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors disabled:opacity-60"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="h-9 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
