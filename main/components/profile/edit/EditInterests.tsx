'use client'

import React from 'react'
import { Hash, Plus, X } from 'lucide-react'
import { INTEREST_OPTIONS } from './constants'
import type { EditInterestsProps } from './types'

export const EditInterests: React.FC<EditInterestsProps> = ({
  interestTags,
  customTag,
  setCustomTag,
  toggleTag,
  addCustomTag,
}) => {
  return (
    <section>
      <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
        <Hash size={14} /> 관심 분야
      </h3>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {INTEREST_OPTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
              interestTags.includes(tag)
                ? 'bg-brand text-white border-brand'
                : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 커스텀 태그 */}
      {interestTags.filter(t => !INTEREST_OPTIONS.includes(t)).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {interestTags.filter(t => !INTEREST_OPTIONS.includes(t)).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand text-white"
            >
              {tag}
              <button onClick={() => toggleTag(tag)} className="hover:opacity-70 p-2 sm:p-0 -m-1 sm:m-0">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <input
          type="text"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
          placeholder="직접 입력"
          maxLength={20}
          className="flex-1 px-3 py-2 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="px-3 py-2 text-sm border border-border text-txt-secondary hover:bg-surface-sunken transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </section>
  )
}
