'use client'

import React from 'react'
import { CheckSquare, Plus, X } from 'lucide-react'
import { SKILL_SUGGESTIONS } from './constants'
import type { EditSkillsProps } from './types'

export const EditSkills: React.FC<EditSkillsProps> = ({
  skills,
  newSkillName,
  setNewSkillName,
  addSkill,
  removeSkill,
}) => {
  return (
    <section>
      <h3 className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
        <CheckSquare size={14} /> 기술 스택
      </h3>

      {/* 빠른 추가 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SKILL_SUGGESTIONS.filter(s => !skills.some(sk => sk.name === s)).map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => addSkill(skill)}
            className="px-2.5 py-1 text-xs font-medium border border-border bg-surface-card rounded-xl text-txt-secondary hover:border-border transition-colors"
          >
            + {skill}
          </button>
        ))}
      </div>

      {/* 추가된 스킬 */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {skills.map((skill) => (
            <span key={skill.name} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-surface-card rounded-xl border border-border text-txt-primary">
              {skill.name}
              <button
                onClick={() => removeSkill(skill.name)}
                className="text-txt-disabled hover:text-status-danger-text transition-colors"
                aria-label={`${skill.name} 스킬 제거`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 직접 입력 */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          placeholder="예: React, Python, Figma"
          maxLength={30}
          className="flex-1 px-3 py-2 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
        <button
          type="button"
          onClick={() => addSkill()}
          className="px-3 py-2 text-sm border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </section>
  )
}
