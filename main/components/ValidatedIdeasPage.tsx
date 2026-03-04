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
import type { Tables } from '@/src/types/database'

type ValidatedIdea = Tables<'validated_ideas'>
type SortField = 'date' | 'score' | 'insights'
type SortOrder = 'asc' | 'desc'

// Type guard for artifacts
const hasArtifacts = (idea: ValidatedIdea): boolean => {
  const artifacts = idea.artifacts as { prd?: string; jd?: string } | null
  return !!(artifacts?.prd || artifacts?.jd)
}

// Type guard for reflected_advice - returns safe array
const getAdviceList = (idea: ValidatedIdea): string[] => {
  if (!idea.reflected_advice) return []
  if (Array.isArray(idea.reflected_advice)) return idea.reflected_advice
  return []
}

// Helper to get advice count
const getAdviceCount = (idea: ValidatedIdea): number => {
  return getAdviceList(idea).length
}

export const ValidatedIdeasPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showCompletedToast = searchParams.get('completed') === 'true'

  // DB hooks
  const { data: ideas = [], isLoading } = useValidatedIdeas(100)
  const deleteIdea = useDeleteValidatedIdea()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedIdea, setSelectedIdea] = useState<ValidatedIdea | null>(null)
  const [filterHasArtifacts, setFilterHasArtifacts] = useState<boolean | null>(null)

  // Show completion toast (only once)
  const hasShownCompletedToast = React.useRef(false)
  React.useEffect(() => {
    if (showCompletedToast && !hasShownCompletedToast.current) {
      hasShownCompletedToast.current = true
      toast.success('워크플로우가 완료되었습니다!')
      // Remove query param
      router.replace('/validated-ideas', { scroll: false })
    }
  }, [showCompletedToast, router])

  // Modal accessibility: scroll lock and ESC key
  React.useEffect(() => {
    if (!selectedIdea) return

    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // ESC key handler
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIdea(null)
    }
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEsc)
    }
  }, [selectedIdea])

  // Filter and sort ideas
  const filteredAndSortedIdeas = useMemo(() => {
    let result = [...ideas]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(idea => {
        const matchesIdea = idea.project_idea.toLowerCase().includes(query)
        const advice = idea.reflected_advice as string[] | null
        const matchesAdvice = advice?.some(a => a.toLowerCase().includes(query)) ?? false
        return matchesIdea || matchesAdvice
      })
    }

    // Artifacts filter
    if (filterHasArtifacts !== null) {
      result = result.filter(idea => {
        const has = hasArtifacts(idea)
        return filterHasArtifacts ? has : !has
      })
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'date') {
        // Handle nullable created_at - fallback to epoch if null
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
    // Confirm before delete
    const confirmed = window.confirm('이 아이디어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!confirmed) return

    try {
      await deleteIdea.mutateAsync(id)
      if (selectedIdea?.id === id) {
        setSelectedIdea(null)
      }
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
          <Loader2 size={32} className="animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">아이디어 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          뒤로가기
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">검증된 아이디어</h1>
              <p className="text-sm text-gray-500">
                AI로 검증한 모든 아이디어를 확인하고 관리하세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartNewWorkflow}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Play size={16} />
            새 워크플로우
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{ideas.length}</div>
          <div className="text-xs text-gray-500">전체 아이디어</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">
            {ideas.filter(i => hasArtifacts(i)).length}
          </div>
          <div className="text-xs text-gray-500">문서 생성됨</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-600">
            {ideas.length > 0
              ? Math.round(ideas.reduce((sum, i) => sum + (i.score ?? 0), 0) / ideas.length)
              : 0}
          </div>
          <div className="text-xs text-gray-500">평균 점수</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">
            {ideas.reduce((sum, i) => sum + getAdviceCount(i), 0)}
          </div>
          <div className="text-xs text-gray-500">총 인사이트</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="아이디어 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="검색어 지우기"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" aria-hidden="true" />
          <select
            aria-label="문서 필터"
            value={filterHasArtifacts === null ? 'all' : filterHasArtifacts ? 'with' : 'without'}
            onChange={e => {
              const val = e.target.value
              setFilterHasArtifacts(val === 'all' ? null : val === 'with')
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
          >
            <option value="all">전체</option>
            <option value="with">문서 있음</option>
            <option value="without">문서 없음</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSort('date')}
            className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${
              sortField === 'date' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Calendar size={14} />
            날짜
            {sortField === 'date' &&
              (sortOrder === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />)}
          </button>
          <button
            type="button"
            onClick={() => toggleSort('score')}
            className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${
              sortField === 'score' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Trophy size={14} />
            점수
            {sortField === 'score' &&
              (sortOrder === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />)}
          </button>
          <button
            type="button"
            onClick={() => toggleSort('insights')}
            className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${
              sortField === 'insights' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <MessageSquare size={14} />
            인사이트
            {sortField === 'insights' &&
              (sortOrder === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />)}
          </button>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-gray-500 mb-4">
          {filteredAndSortedIdeas.length}개의 결과
        </p>
      )}

      {/* Empty State */}
      {ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Lightbulb size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">아직 검증된 아이디어가 없습니다</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            워크플로우를 시작하여 아이디어 검증 → PRD 생성 → 사업계획서 작성까지 한번에 진행하세요
          </p>
          <button
            type="button"
            onClick={handleStartNewWorkflow}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Play size={16} />
            워크플로우 시작하기
          </button>
        </div>
      )}

      {/* Ideas List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="list">
        {filteredAndSortedIdeas.map(idea => {
          const adviceList = getAdviceList(idea)
          return (
            <div
              key={idea.id}
              role="listitem"
              tabIndex={0}
              onClick={() => setSelectedIdea(idea)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedIdea(idea)
                }
              }}
              className={`bg-white border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 group ${
                selectedIdea?.id === idea.id
                  ? 'border-black ring-1 ring-black'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-gray-900 line-clamp-2 flex-1">
                      {idea.project_idea}
                    </p>
                    {idea.score !== null && (
                      <span className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded-full ${
                        idea.score >= 80 ? 'bg-green-100 text-green-700' :
                        idea.score >= 60 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {idea.score}점
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} aria-hidden="true" />
                      {idea.created_at ? new Date(idea.created_at).toLocaleDateString('ko-KR') : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {adviceList.length}개 인사이트
                    </span>
                    {idea.validation_level && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        idea.validation_level === 'DEFENSE' ? 'bg-red-50 text-red-600' :
                        idea.validation_level === 'MVP' ? 'bg-blue-50 text-blue-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {idea.validation_level}
                      </span>
                    )}
                    {hasArtifacts(idea) && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <FileText size={12} />
                        문서
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleDelete(idea.id)
                  }}
                  disabled={deleteIdea.isPending}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 size={16} className="text-red-400 hover:text-red-600" />
                </button>
              </div>

              {/* Preview of insights */}
              {adviceList.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {adviceList[0]}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* No results */}
      {ideas.length > 0 && filteredAndSortedIdeas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">검색 결과가 없습니다</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setFilterHasArtifacts(null)
            }}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            필터 초기화
          </button>
        </div>
      )}

      {/* Detail Panel */}
      {selectedIdea && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) setSelectedIdea(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Sparkles size={18} className="text-green-600" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="modal-title" className="font-bold text-gray-900">검증된 아이디어</h3>
                    {selectedIdea.score !== null && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        selectedIdea.score >= 80 ? 'bg-green-100 text-green-700' :
                        selectedIdea.score >= 60 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedIdea.score}점
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedIdea.created_at
                      ? new Date(selectedIdea.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '날짜 없음'}
                    {selectedIdea.validation_level && ` · ${selectedIdea.validation_level} 레벨`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIdea(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="모달 닫기"
              >
                <X size={20} className="text-gray-500" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Project Idea */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  프로젝트 아이디어
                </h4>
                <p className="text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {selectedIdea.project_idea}
                </p>
              </div>

              {/* Reflected Advice */}
              {(() => {
                const adviceList = getAdviceList(selectedIdea)
                if (adviceList.length === 0) return null
                return (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      AI 인사이트 ({adviceList.length}개)
                    </h4>
                    <ul className="space-y-2" role="list">
                      {adviceList.map((advice, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl"
                        >
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-700 leading-relaxed">{advice}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}

              {/* Artifacts */}
              {(() => {
                const artifacts = selectedIdea.artifacts as { prd?: string; jd?: string } | null
                if (!artifacts || (!artifacts.prd && !artifacts.jd)) return null
                return (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      생성된 문서
                    </h4>
                    <div className="flex gap-2">
                      {artifacts.prd && (
                        <span className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg flex items-center gap-2">
                          <FileText size={14} />
                          PRD 문서
                        </span>
                      )}
                      {artifacts.jd && (
                        <span className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg flex items-center gap-2">
                          <FileText size={14} />
                          채용 공고
                        </span>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleDelete(selectedIdea.id)}
                disabled={deleteIdea.isPending}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Trash2 size={16} />
                삭제
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIdea(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => handleContinueWorkflow(selectedIdea)}
                  className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Play size={14} />
                  워크플로우 이어하기
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
