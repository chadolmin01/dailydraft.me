'use client'

import React, { useState } from 'react'
import { Sparkles, Plus, X } from 'lucide-react'
import { CATEGORICAL_LABELS } from '@/src/lib/onboarding/constants'
import type { EditAIProfileProps } from './types'

function TagEditor({ label, tags, onChange, suggestions }: { label: string; tags: string[]; onChange: (t: string[]) => void; suggestions: string[] }) {
  const [input, setInput] = useState('')
  const add = (tag: string) => { if (tag && !tags.includes(tag)) onChange([...tags, tag]) }
  const remove = (tag: string) => onChange(tags.filter(t => t !== tag))
  return (
    <div>
      <label className="block text-xs text-txt-tertiary mb-1.5">{label}</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-brand text-white">
              {tag}
              <button onClick={() => remove(tag)} className="hover:opacity-70 p-2 sm:p-0 -m-1 sm:m-0" aria-label={`${tag} 제거`}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {suggestions.filter(s => !tags.includes(s)).map(s => (
          <button key={s} type="button" onClick={() => add(s)}
            className="px-2 py-0.5 text-xs font-medium border border-border bg-surface-card rounded-xl text-txt-secondary hover:border-border transition-colors"
          >+ {s}</button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input.trim()); setInput('') } }}
          placeholder="직접 입력" maxLength={20}
          className="flex-1 px-3 py-1.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-accent transition-colors"
        />
        <button type="button" onClick={() => { add(input.trim()); setInput('') }}
          aria-label="추가"
          className="px-2.5 py-1.5 text-sm border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
        ><Plus size={14} /></button>
      </div>
    </div>
  )
}

function CategoricalSelector({ traitKey, label, value, onChange }: {
  traitKey: string; label: string; value: string;
  onChange: (key: string, val: string) => void
}) {
  const options = CATEGORICAL_LABELS[traitKey]
  if (!options) return null
  return (
    <div>
      <span className="text-xs text-txt-secondary block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([id, lbl]) => (
          <button key={id} type="button" onClick={() => onChange(traitKey, id)}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${value === id ? 'bg-brand text-white border-brand' : 'bg-surface-card text-txt-secondary border-border hover:border-border'}`}
          >{lbl}</button>
        ))}
      </div>
    </div>
  )
}

export const EditAIProfile: React.FC<EditAIProfileProps> = ({
  personality,
  setPersonality,
  workStyleTraits,
  setWorkStyleTraits,
  hoursPerWeek,
  setHoursPerWeek,
  preferOnline,
  setPreferOnline,
  goals,
  setGoals,
  strengths,
  setStrengths,
}) => {
  const handleTraitChange = (key: string, val: string) => {
    setWorkStyleTraits(prev => ({ ...prev, [key]: val }))
  }

  return (
    <section>
      <h3 className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
        <Sparkles size={14} /> AI 프로필 분석
      </h3>
      <p className="text-xs text-txt-tertiary mb-4">온보딩 AI 대화에서 분석된 데이터입니다. 직접 수정할 수 있어요.</p>

      {/* 작업 스타일 — 선택형 버튼 */}
      <div className="space-y-4 mb-6">
        <h4 className="text-xs font-medium text-txt-secondary">작업 스타일</h4>
        <CategoricalSelector traitKey="collaboration_style" label="협업 스타일" value={workStyleTraits.collaboration_style || ''} onChange={handleTraitChange} />
        <CategoricalSelector traitKey="planning_style" label="작업 방식" value={workStyleTraits.planning_style || ''} onChange={handleTraitChange} />
        <CategoricalSelector traitKey="quality_style" label="품질 기준" value={workStyleTraits.quality_style || ''} onChange={handleTraitChange} />
      </div>

      {/* 성향 — decision 선택형 + communication 1-5 spectrum + risk/time 슬라이더 */}
      <div className="space-y-4 mb-6">
        <h4 className="text-xs font-medium text-txt-secondary">성향 점수</h4>

        <CategoricalSelector traitKey="decision_style" label="의사결정 스타일" value={workStyleTraits.decision_style || ''} onChange={handleTraitChange} />

        {/* communication: 1-5 spectrum */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-txt-secondary">소통 선호</span>
            <span className="text-xs font-mono text-txt-tertiary">{personality.communication}/5</span>
          </div>
          <input
            type="range"
            min={1} max={5} step={1}
            value={personality.communication}
            onChange={e => setPersonality(p => ({ ...p, communication: parseInt(e.target.value) }))}
            className="w-full h-1.5 accent-brand cursor-pointer"
          />
          <div className="flex justify-between">
            <span className="text-[9px] text-txt-tertiary font-mono">혼자 집중</span>
            <span className="text-[9px] text-txt-tertiary font-mono">수시 소통</span>
          </div>
        </div>

        {/* risk: 1-5 slider */}
        {[
          { key: 'risk', label: '도전 성향', low: '안정 추구', high: '도전적' },
        ].map(item => (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-txt-secondary">{item.label}</span>
              <span className="text-xs font-mono text-txt-tertiary">{personality[item.key]}/5</span>
            </div>
            <input
              type="range"
              min={1} max={5} step={1}
              value={personality[item.key]}
              onChange={e => setPersonality(p => ({ ...p, [item.key]: parseInt(e.target.value) }))}
              className="w-full h-1.5 accent-brand cursor-pointer"
            />
            <div className="flex justify-between">
              <span className="text-[9px] text-txt-tertiary font-mono">{item.low}</span>
              <span className="text-[9px] text-txt-tertiary font-mono">{item.high}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 가용성 */}
      <div className="space-y-3 mb-6">
        <h4 className="text-xs font-medium text-txt-secondary">가용성</h4>
        <div>
          <label className="block text-xs text-txt-tertiary mb-1.5">주당 투자 가능 시간</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={80}
              value={hoursPerWeek}
              onChange={e => setHoursPerWeek(e.target.value)}
              placeholder="예: 15"
              className="w-32 px-3 py-2 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-accent transition-colors"
            />
            <span className="text-xs text-txt-tertiary">시간</span>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={preferOnline} onChange={e => setPreferOnline(e.target.checked)}
            className="w-4 h-4 accent-brand" />
          <span className="text-xs text-txt-secondary">비대면(온라인) 선호</span>
        </label>
      </div>

      {/* 목표 & 강점 태그 */}
      <div className="space-y-4">
        <TagEditor label="목표" tags={goals} onChange={setGoals} suggestions={['포트폴리오', '창업', '학습', '수상', '네트워킹', '재미']} />
        <TagEditor label="강점" tags={strengths} onChange={setStrengths} suggestions={['기획력', '빠른 구현', '디자인 감각', '소통', '문제 해결', '리더십']} />
      </div>
    </section>
  )
}
