'use client'

import React, { useState } from 'react'
import { Sparkles, Plus, X } from 'lucide-react'
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
              <button onClick={() => remove(tag)} className="hover:opacity-70 p-2 sm:p-0 -m-1 sm:m-0"><X size={10} /></button>
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
          className="flex-1 px-3 py-1.5 text-sm border border-border bg-surface-card rounded-xl focus:outline-none focus:border-accent transition-colors"
        />
        <button type="button" onClick={() => { add(input.trim()); setInput('') }}
          className="px-2.5 py-1.5 text-sm border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
        ><Plus size={14} /></button>
      </div>
    </div>
  )
}

export const EditAIProfile: React.FC<EditAIProfileProps> = ({
  personality,
  setPersonality,
  workStyle,
  setWorkStyle,
  teamRole,
  setTeamRole,
  teamSize,
  setTeamSize,
  teamAtmosphere,
  setTeamAtmosphere,
  hoursPerWeek,
  setHoursPerWeek,
  preferOnline,
  setPreferOnline,
  goals,
  setGoals,
  strengths,
  setStrengths,
}) => {
  return (
    <section>
      <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
        <Sparkles size={14} /> AI 프로필 분석
      </h3>
      <p className="text-xs text-txt-tertiary mb-4">온보딩 AI 대화에서 분석된 데이터입니다. 직접 수정할 수 있어요.</p>

      {/* 성향 슬라이더 */}
      <div className="space-y-4 mb-6">
        <h4 className="text-xs font-medium text-txt-secondary">성향 점수</h4>
        {[
          { key: 'risk', label: '도전 성향', low: '안정 추구', high: '도전적' },
          { key: 'time', label: '시간 투자', low: '여유 없음', high: '풀타임' },
          { key: 'communication', label: '소통 선호', low: '혼자 집중', high: '수시 소통' },
          { key: 'decision', label: '실행 속도', low: '신중한 계획', high: '빠른 실행' },
        ].map(item => (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-txt-secondary">{item.label}</span>
              <span className="text-xs font-mono text-txt-tertiary">{personality[item.key]}/10</span>
            </div>
            <input
              type="range"
              min={1} max={10} step={1}
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

      {/* 작업 스타일 슬라이더 */}
      <div className="space-y-4 mb-6">
        <h4 className="text-xs font-medium text-txt-secondary">작업 스타일</h4>
        {[
          { key: 'collaboration', label: '협업 스타일', low: '독립형', high: '팀 소통형' },
          { key: 'planning', label: '작업 방식', low: '바로 실행', high: '기획 우선' },
          { key: 'perfectionism', label: '품질 기준', low: '속도 우선', high: '완벽주의' },
        ].map(item => (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-txt-secondary">{item.label}</span>
              <span className="text-xs font-mono text-txt-tertiary">{workStyle[item.key]}/10</span>
            </div>
            <input
              type="range"
              min={1} max={10} step={1}
              value={workStyle[item.key]}
              onChange={e => setWorkStyle(p => ({ ...p, [item.key]: parseInt(e.target.value) }))}
              className="w-full h-1.5 accent-brand cursor-pointer"
            />
            <div className="flex justify-between">
              <span className="text-[9px] text-txt-tertiary font-mono">{item.low}</span>
              <span className="text-[9px] text-txt-tertiary font-mono">{item.high}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 팀 선호 */}
      <div className="space-y-3 mb-6">
        <h4 className="text-xs font-medium text-txt-secondary">팀 선호</h4>
        <div>
          <label className="block text-xs text-txt-tertiary mb-1.5">역할</label>
          <div className="flex gap-1.5">
            {['리더', '팔로워', '유연'].map(r => (
              <button key={r} type="button" onClick={() => setTeamRole(r)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${teamRole === r ? 'bg-brand text-white border-brand' : 'bg-surface-card text-txt-secondary border-border hover:border-border'}`}
              >{r}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-txt-tertiary mb-1.5">선호 인원</label>
          <div className="flex gap-1.5">
            {['2-3명', '4-5명', '6명+'].map(s => (
              <button key={s} type="button" onClick={() => setTeamSize(s)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${teamSize === s ? 'bg-brand text-white border-brand' : 'bg-surface-card text-txt-secondary border-border hover:border-border'}`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-txt-tertiary mb-1.5">분위기</label>
          <div className="flex gap-1.5">
            {['실무형', '캐주얼', '균형'].map(a => (
              <button key={a} type="button" onClick={() => setTeamAtmosphere(a)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${teamAtmosphere === a ? 'bg-brand text-white border-brand' : 'bg-surface-card text-txt-secondary border-border hover:border-border'}`}
              >{a}</button>
            ))}
          </div>
        </div>
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
              className="w-32 px-3 py-2 text-sm border border-border bg-surface-card rounded-xl focus:outline-none focus:border-accent transition-colors"
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
