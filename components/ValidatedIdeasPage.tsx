'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Sparkles,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  Calendar,
  MessageSquare,
  FileText,
  X,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  Loader2,
  Filter,
  Play,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import { useValidatedIdeas, useDeleteValidatedIdea } from '@/src/hooks/useValidatedIdeas'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Tables } from '@/src/types/database'

type ValidatedIdea = Tables<'validated_ideas'>
type SortField = 'date' | 'score' | 'insights'
type SortOrder = 'asc' | 'desc'

const hasArtifacts = (idea: ValidatedIdea): boolean => {
  const artifacts = idea.artifacts as { prd?: string; jd?: string } | null
  return !!(artifacts?.prd || artifacts?.jd)
}

const getAdviceList = (idea: ValidatedIdea): string[] => {
  if (!idea.reflected_advice) return []
  if (Array.isArray(idea.reflected_advice)) return idea.reflected_advice
  return []
}

const getAdviceCount = (idea: ValidatedIdea): number => {
  return getAdviceList(idea).length
}

export const ValidatedIdeasPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showCompletedToast = searchParams.get('completed') === 'true'

  const { data: ideas = [], isLoading } = useValidatedIdeas(100)
  const deleteIdea = useDeleteValidatedIdea()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedIdea, setSelectedIdea] = useState<ValidatedIdea | null>(null)
  const [filterHasArtifacts, setFilterHasArtifacts] = useState<boolean | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const hasShownCompletedToast = React.useRef(false)
  React.useEffect(() => {
    if (showCompletedToast && !hasShownCompletedToast.current) {
      hasShownCompletedToast.current = true
      toast.success('워크플로우가 완료되었습니다!')
      router.replace('/validated-ideas', { scroll: false })
    }
  }, [showCompletedToast, router])

  React.useEffect(() => {
    if (!selectedIdea) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIdea(null)
    }
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEsc)
    }
  }, [selectedIdea])

  const filteredAndSortedIdeas = useMemo(() => {
    let result = [...ideas]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(idea => {
        const matchesIdea = idea.project_idea.toLowerCase().includes(query)
        const advice = idea.reflected_advice as string[] | null
        const matchesAdvice = advice?.some(a => a.toLowerCase().includes(query)) ?? false
        return matchesIdea || matchesAdvice
      })
    }
    if (filterHasArtifacts !== null) {
      result = result.filter(idea => {
        const has = hasArtifacts(idea)
        return filterHasArtifacts ? has : !has
      })
    }
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'date') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        comparison = dateA - dateB
      } else if (sortField === 'score') {
        comparison = (a.score ?? 0) - (b.score ?? 0)
      } else if (sortField === 'insights') {
        comparison = getAdviceCount(a) - getAdviceCount(b)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    return result
  }, [ideas, searchQuery, sortField, sortOrder, filterHasArtifacts])

  const handleDelete = async (id: string) => {
    try {
      await deleteIdea.mutateAsync(id)
      if (selectedIdea?.id === id) setSelectedIdea(null)
      setDeleteTarget(null)
      toast.success('아이디어가 삭제되었습니다')
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleContinueWorkflow = (idea: ValidatedIdea) => {
    router.push(`/workflow?ideaId=${idea.id}`)
  }

  const handleStartNewWorkflow = () => {
    router.push('/workflow')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-txt-disabled" />
          <p className="text-sm text-txt-tertiary">아이디어 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-sm text-txt-tertiary hover:text-txt-primary mb-4 transition-colors">
          <ArrowLeft size={16} /> 뒤로가기
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border border-black flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-txt-primary">검증된 아이디어</h1>
              <p className="text-sm text-txt-tertiary">AI로 검증한 모든 아이디어를 확인하고 관리하세요</p>
            </div>
          </div>
          <button type="button" onClick={handleStartNewWorkflow} className="px-4 py-2 bg-black text-white border border-black text-sm font-bold hover:bg-[#333] transition-colors flex items-center gap-2 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
            <Play size={16} /> 새 워크플로우
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-card border border-border-strong shadow-sharp p-4">
          <div className="text-2xl font-bold text-txt-primary">{ideas.length}</div>
          <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary">전체 아이디어</div>
        </div>
        <div className="bg-surface-card border border-border-strong shadow-sharp p-4">
          <div className="text-2xl font-bold text-blue-600">{ideas.filter(i => hasArtifacts(i)).length}</div>
          <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary">문서 생성됨</div>
        </div>
        <div className="bg-surface-card border border-border-strong shadow-sharp p-4">
          <div className="text-2xl font-bold text-amber-600">{ideas.length > 0 ? Math.round(ideas.reduce((sum, i) => sum + (i.score ?? 0), 0) / ideas.length) : 0}</div>
          <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary">평균 점수</div>
        </div>
        <div className="bg-surface-card border border-border-strong shadow-sharp p-4">
          <div className="text-2xl font-bold text-green-600">{ideas.reduce((sum, i) => sum + getAdviceCount(i), 0)}</div>
          <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary">총 인사이트</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[12.5rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
          <input type="text" placeholder="아이디어 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-border-strong text-sm focus:outline-none focus:border-[#4F46E5] transition-colors" />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-disabled hover:text-txt-secondary" aria-label="검색어 지우기"><X size={14} /></button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-txt-disabled" aria-hidden="true" />
          <select aria-label="문서 필터" value={filterHasArtifacts === null ? 'all' : filterHasArtifacts ? 'with' : 'without'} onChange={e => { const val = e.target.value; setFilterHasArtifacts(val === 'all' ? null : val === 'with') }} className="px-3 py-2 border border-border-strong text-sm focus:outline-none focus:border-[#4F46E5]">
            <option value="all">전체</option>
            <option value="with">문서 있음</option>
            <option value="without">문서 없음</option>
          </select>
        </div>
        <div className="flex items-center gap-0 border border-border-strong overflow-hidden">
          {(['date', 'score', 'insights'] as const).map((field) => {
            const icons = { date: Calendar, score: Trophy, insights: MessageSquare }
            const labels = { date: '날짜', score: '점수', insights: '인사이트' }
            const Icon = icons[field]
            return (
              <button key={field} type="button" onClick={() => toggleSort(field)} className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${sortField === field ? 'bg-surface-sunken text-txt-primary' : 'text-txt-tertiary hover:bg-surface-sunken'}`}>
                <Icon size={14} /> {labels[field]}
                {sortField === field && (sortOrder === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />)}
              </button>
            )
          })}
        </div>
      </div>

      {searchQuery && <p className="text-sm text-txt-tertiary mb-4">{filteredAndSortedIdeas.length}개의 결과</p>}

      {ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-surface-sunken border border-border-strong flex items-center justify-center mb-4"><Lightbulb size={28} className="text-txt-disabled" /></div>
          <h3 className="text-lg font-bold text-txt-primary mb-2">아직 검증된 아이디어가 없습니다</h3>
          <p className="text-sm text-txt-tertiary mb-6 max-w-md">워크플로우를 시작하여 아이디어 검증 → PRD 생성 → 사업계획서 작성까지 한번에 진행하세요</p>
          <button type="button" onClick={handleStartNewWorkflow} className="px-6 py-3 bg-black text-white font-bold hover:bg-[#333] transition-colors flex items-center gap-2 border border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"><Play size={16} /> 워크플로우 시작하기</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="list">
        {filteredAndSortedIdeas.map(idea => {
          const adviceList = getAdviceList(idea)
          return (
            <div key={idea.id} role="listitem" tabIndex={0} onClick={() => setSelectedIdea(idea)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedIdea(idea) } }} className={`bg-surface-card border p-5 cursor-pointer transition-all hover:shadow-sharp focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 group ${selectedIdea?.id === idea.id ? 'border-border-strong ring-1 ring-black' : 'border-border-strong hover:border-border-strong'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-txt-primary line-clamp-2 flex-1">{idea.project_idea}</p>
                    {idea.score !== null && (
                      <span className={`shrink-0 px-2 py-0.5 text-xs font-bold border ${idea.score >= 80 ? 'bg-green-50 text-green-700 border-green-200' : idea.score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{idea.score}점</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-txt-tertiary">
                    <span className="flex items-center gap-1"><Calendar size={12} aria-hidden="true" />{idea.created_at ? new Date(idea.created_at).toLocaleDateString('ko-KR') : '-'}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} />{adviceList.length}개 인사이트</span>
                    {idea.validation_level && (<span className={`px-1.5 py-0.5 text-[0.625rem] font-bold border ${idea.validation_level === 'DEFENSE' ? 'bg-red-50 text-red-600 border-red-200' : idea.validation_level === 'MVP' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{idea.validation_level}</span>)}
                    {hasArtifacts(idea) && (<span className="flex items-center gap-1 text-blue-600"><FileText size={12} />문서</span>)}
                  </div>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setDeleteTarget(idea.id) }} disabled={deleteIdea.isPending} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all disabled:opacity-50 border border-transparent hover:border-red-200" title="삭제"><Trash2 size={16} className="text-red-400 hover:text-red-600" /></button>
              </div>
              {adviceList.length > 0 && (<div className="mt-3 pt-3 border-t border-dashed border-border"><p className="text-xs text-txt-tertiary line-clamp-2">{adviceList[0]}</p></div>)}
            </div>
          )
        })}
      </div>

      {ideas.length > 0 && filteredAndSortedIdeas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-txt-tertiary">검색 결과가 없습니다</p>
          <button type="button" onClick={() => { setSearchQuery(''); setFilterHasArtifacts(null) }} className="mt-2 text-sm text-[#4F46E5] hover:underline">필터 초기화</button>
        </div>
      )}

      {selectedIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => { if (e.target === e.currentTarget) setSelectedIdea(null) }}>
          <div className="bg-surface-card shadow-brutal max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-border-strong">
            <div className="px-6 py-4 border-b border-border-strong flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-status-success-bg border border-green-300 flex items-center justify-center"><Sparkles size={18} className="text-status-success-text" aria-hidden="true" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="modal-title" className="font-bold text-txt-primary">검증된 아이디어</h3>
                    {selectedIdea.score !== null && (<span className={`px-2 py-0.5 text-xs font-bold border ${selectedIdea.score >= 80 ? 'bg-green-50 text-green-700 border-green-200' : selectedIdea.score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{selectedIdea.score}점</span>)}
                  </div>
                  <p className="text-xs text-txt-tertiary">{selectedIdea.created_at ? new Date(selectedIdea.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '날짜 없음'}{selectedIdea.validation_level && ` · ${selectedIdea.validation_level} 레벨`}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedIdea(null)} className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border" aria-label="모달 닫기"><X size={20} className="text-txt-tertiary" aria-hidden="true" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">프로젝트 아이디어</h4>
                <p className="text-txt-secondary leading-relaxed bg-surface-sunken p-4 border border-border-strong">{selectedIdea.project_idea}</p>
              </div>
              {(() => { const adviceList = getAdviceList(selectedIdea); if (adviceList.length === 0) return null; return (<div><h4 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">AI 인사이트 ({adviceList.length}개)</h4><ul className="space-y-2" role="list">{adviceList.map((advice, i) => (<li key={i} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200"><span className="w-6 h-6 bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">{i + 1}</span><p className="text-sm text-txt-secondary leading-relaxed">{advice}</p></li>))}</ul></div>) })()}
              {(() => { const artifacts = selectedIdea.artifacts as { prd?: string; jd?: string } | null; if (!artifacts || (!artifacts.prd && !artifacts.jd)) return null; return (<div><h4 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-2">생성된 문서</h4><div className="flex gap-2">{artifacts.prd && (<span className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium flex items-center gap-2 border border-indigo-200"><FileText size={14} />PRD 문서</span>)}{artifacts.jd && (<span className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium flex items-center gap-2 border border-purple-200"><FileText size={14} />채용 공고</span>)}</div></div>) })()}
            </div>
            <div className="px-6 py-4 border-t border-border-strong flex items-center justify-between shrink-0">
              <button type="button" onClick={() => setDeleteTarget(selectedIdea.id)} disabled={deleteIdea.isPending} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm disabled:opacity-50 border border-transparent hover:border-red-200"><Trash2 size={16} />삭제</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedIdea(null)} className="px-4 py-2 text-txt-secondary hover:bg-surface-sunken transition-colors text-sm border border-border-strong font-bold">닫기</button>
                <button type="button" onClick={() => handleContinueWorkflow(selectedIdea)} className="px-5 py-2 bg-black text-white hover:bg-[#333] transition-colors text-sm font-bold flex items-center gap-2 border border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"><Play size={14} />워크플로우 이어하기<ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget ? handleDelete(deleteTarget) : Promise.resolve()}
        title="아이디어 삭제"
        message="이 아이디어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
      />
    </div>
  )
}
