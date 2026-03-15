'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
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
  { value: 'onsite', label: '오프라인' },
]

const TIME_OPTIONS = [
  { value: 'part_time', label: '파트타임 (주 10시간 미만)' },
  { value: 'full_time', label: '풀타임 (주 10시간 이상)' },
]

const COMPENSATION_OPTIONS = [
  { value: 'unpaid', label: '무급 (경험)' },
  { value: 'equity', label: '지분' },
  { value: 'salary', label: '유급' },
  { value: 'hybrid', label: '혼합' },
]

const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'
const chipActiveClass = 'bg-black text-white border-black'
const chipInactiveClass = 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'

export default function NewProjectPage() {
  const router = useRouter()
  const createOpportunity = useCreateOpportunity()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('side_project')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [tags, setTags] = useState('')
  const [locationType, setLocationType] = useState('remote')
  const [painPoint, setPainPoint] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [compensationType, setCompensationType] = useState('')
  const [compensationDetails, setCompensationDetails] = useState('')
  const [links, setLinks] = useState<{ label: string; url: string }[]>([])
  const [error, setError] = useState('')

  // Read AI-generated draft from localStorage
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

  const addLink = () => setLinks(prev => [...prev, { label: '', url: '' }])
  const removeLink = (idx: number) => setLinks(prev => prev.filter((_, i) => i !== idx))
  const updateLink = (idx: number, field: 'label' | 'url', value: string) => {
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('프로젝트 이름을 입력해주세요'); return }
    if (!description.trim()) { setError('프로젝트 설명을 입력해주세요'); return }
    if (selectedRoles.length === 0) { setError('필요한 역할을 최소 1개 선택해주세요'); return }

    const projectLinks = links
      .filter(l => l.url.trim())
      .reduce((acc, l) => ({ ...acc, [l.label.trim() || l.url.trim()]: l.url.trim() }), {} as Record<string, string>)

    try {
      const result = await createOpportunity.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        type,
        needed_roles: selectedRoles,
        interest_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        location_type: locationType,
        pain_point: painPoint.trim() || null,
        time_commitment: timeCommitment || null,
        compensation_type: compensationType || null,
        compensation_details: compensationDetails.trim() || null,
        project_links: Object.keys(projectLinks).length > 0 ? projectLinks : null,
        status: 'active',
      })
      router.push(`/p/${result.id}`)
    } catch {
      setError('프로젝트 생성에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface-bg">
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

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── 기본 정보 ── */}
          <fieldset className="space-y-6">
            <legend className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-4">기본 정보</legend>

            {/* Title */}
            <div>
              <label className={labelClass}>프로젝트 이름 *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="예: AI 기반 대학생 매칭 플랫폼" maxLength={100} className={inputClass} />
            </div>

            {/* Type */}
            <div>
              <label className={labelClass}>유형 *</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                    className={`px-4 py-2.5 text-sm rounded-lg border transition-colors ${type === opt.value ? chipActiveClass : chipInactiveClass}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>프로젝트 설명 *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="어떤 서비스인지, 현재 진행 상황은 어떤지 자유롭게 적어주세요"
                rows={5} maxLength={2000} className={`${inputClass} resize-none`} />
              <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/2000</p>
            </div>

            {/* Pain Point */}
            <div>
              <label className={labelClass}>해결하려는 문제</label>
              <textarea value={painPoint} onChange={(e) => setPainPoint(e.target.value)}
                placeholder="어떤 불편함을 해결하나요? (선택)"
                rows={3} maxLength={1000} className={`${inputClass} resize-none`} />
            </div>
          </fieldset>

          {/* ── 팀 구성 ── */}
          <fieldset className="space-y-6">
            <legend className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-4">팀 구성</legend>

            {/* Needed Roles */}
            <div>
              <label className={labelClass}>필요한 역할 *</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(role => (
                  <button key={role} type="button" onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedRoles.includes(role) ? 'bg-blue-50 text-blue-700 border-blue-200' : chipInactiveClass
                    }`}>
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Type */}
            <div>
              <label className={labelClass}>활동 방식</label>
              <div className="flex flex-wrap gap-2">
                {LOCATION_TYPE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setLocationType(opt.value)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${locationType === opt.value ? chipActiveClass : chipInactiveClass}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Commitment */}
            <div>
              <label className={labelClass}>시간 투자</label>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setTimeCommitment(prev => prev === opt.value ? '' : opt.value)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${timeCommitment === opt.value ? chipActiveClass : chipInactiveClass}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compensation */}
            <div>
              <label className={labelClass}>보상 방식</label>
              <div className="flex flex-wrap gap-2">
                {COMPENSATION_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setCompensationType(prev => prev === opt.value ? '' : opt.value)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${compensationType === opt.value ? chipActiveClass : chipInactiveClass}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {compensationType && compensationType !== 'unpaid' && (
                <input type="text" value={compensationDetails} onChange={(e) => setCompensationDetails(e.target.value)}
                  placeholder="보상 상세 (예: 지분 5%, 월 50만원 등)" className={`${inputClass} mt-2`} />
              )}
            </div>
          </fieldset>

          {/* ── 추가 정보 ── */}
          <fieldset className="space-y-6">
            <legend className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-4">추가 정보</legend>

            {/* Tags */}
            <div>
              <label className={labelClass}>관심 태그</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                placeholder="예: React, AI, 에듀테크 (쉼표로 구분)" className={inputClass} />
            </div>

            {/* Project Links */}
            <div>
              <label className={labelClass}>프로젝트 링크</label>
              <div className="space-y-2">
                {links.map((link, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={link.label} onChange={(e) => updateLink(idx, 'label', e.target.value)}
                      placeholder="이름 (GitHub, Figma...)" className={`${inputClass} sm:w-1/3`} />
                    <div className="flex gap-2">
                      <input type="url" value={link.url} onChange={(e) => updateLink(idx, 'url', e.target.value)}
                        placeholder="https://..." className={`${inputClass} flex-1`} />
                      <button type="button" onClick={() => removeLink(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addLink}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors">
                  <Plus size={14} /> 링크 추가
                </button>
              </div>
            </div>
          </fieldset>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button type="submit" disabled={createOpportunity.isPending}
            className="w-full py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
