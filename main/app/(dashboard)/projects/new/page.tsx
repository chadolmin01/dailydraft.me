'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCreateOpportunity } from '@/src/hooks/useOpportunities'

const TYPE_OPTIONS = [
  { value: 'side_project', label: '사이드 프로젝트' },
  { value: 'startup', label: '스타트업' },
  { value: 'study', label: '스터디' },
]

const ROLE_OPTIONS = ['개발자', '디자이너', '기획자', '마케터', 'PM', '데이터분석']

const LOCATION_TYPE_OPTIONS = [
  { value: 'remote', label: '원격' },
  { value: 'hybrid', label: '하이브리드' },
  { value: 'offline', label: '오프라인' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const createOpportunity = useCreateOpportunity()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('side_project')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [tags, setTags] = useState('')
  const [locationType, setLocationType] = useState('remote')
  const [error, setError] = useState('')

  // B-5: Read AI-generated draft from localStorage (saved by OpportunitySlidePanel)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('draft-pending-opportunity')
      if (!saved) return
      const draft = JSON.parse(saved)
      if (draft.title) setTitle(draft.title)
      if (draft.problem || draft.description) setDescription(draft.problem || draft.description)
      if (draft.neededRoles?.length) setSelectedRoles(draft.neededRoles)
      if (draft.tags?.length) setTags(draft.tags.join(', '))
      localStorage.removeItem('draft-pending-opportunity')
    } catch { /* ignore parse errors */ }
  }, [])

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('프로젝트 이름을 입력해주세요'); return }
    if (!description.trim()) { setError('프로젝트 설명을 입력해주세요'); return }
    if (selectedRoles.length === 0) { setError('필요한 역할을 최소 1개 선택해주세요'); return }

    try {
      const result = await createOpportunity.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        type,
        needed_roles: selectedRoles,
        interest_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        location_type: locationType,
        status: 'active',
      })
      router.push(`/p/${result.id}`)
    } catch (err) {
      setError('프로젝트 생성에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> 돌아가기
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">새 프로젝트</h1>
        <p className="text-sm text-gray-500 mb-8">팀원을 모집할 프로젝트를 등록하세요</p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트 이름 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: AI 기반 대학생 매칭 플랫폼"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">유형 *</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    type === opt.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">프로젝트 설명 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 문제를 해결하려 하나요? 현재 진행 상황은?"
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/2000</p>
          </div>

          {/* Needed Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">필요한 역할 *</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    selectedRoles.includes(role)
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">활동 방식</label>
            <div className="flex gap-2">
              {LOCATION_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocationType(opt.value)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    locationType === opt.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">관심 태그</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: React, AI, 에듀테크 (쉼표로 구분)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={createOpportunity.isPending}
            className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createOpportunity.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> 생성 중...</>
            ) : (
              '프로젝트 등록하기'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
