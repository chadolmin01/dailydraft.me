'use client'

import React from 'react'
import { CheckSquare, Plus, X } from 'lucide-react'
import { SKILL_SUGGESTIONS, SKILL_LEVELS } from './constants'
import type { EditSkillsProps } from './types'

export const EditSkills: React.FC<EditSkillsProps> = ({
  skills,
  newSkillName,
  setNewSkillName,
  newSkillLevel,
  setNewSkillLevel,
  addSkill,
  removeSkill,
  updateSkillLevel,
}) => {
  return (
    <section>
      <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
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
        <div className="space-y-1.5 mb-3">
          {skills.map((skill) => (
            <div key={skill.name} className="flex items-center gap-2 px-3 py-2 bg-surface-card rounded-xl border border-border">
              <span className="flex-1 text-xs text-txt-primary font-medium">{skill.name}</span>
              <div className="flex items-center gap-0.5">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateSkillLevel(skill.name, level)}
                    className={`px-1.5 py-0.5 text-[0.625rem] transition-colors ${
                      skill.level === level
                        ? 'bg-brand text-white'
                        : 'text-txt-tertiary hover:text-txt-secondary'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <button
                onClick={() => removeSkill(skill.name)}
                className="p-2.5 sm:p-1 -m-1 sm:m-0 text-txt-tertiary hover:text-status-danger-text transition-colors"
                aria-label={`${skill.name} 스킬 제거`}
              >
                <X size={14} className="sm:w-3 sm:h-3" />
              </button>
            </div>
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
        <select
          value={newSkillLevel}
          onChange={(e) => setNewSkillLevel(e.target.value)}
          className="px-2 py-2 text-xs border border-border bg-surface-card rounded-lg text-txt-secondary focus:outline-none focus:border-accent transition-colors"
        >
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
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
