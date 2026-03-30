'use client'

import React from 'react'
import { User, Target } from 'lucide-react'
import { SITUATION_OPTIONS } from './constants'
import type { EditBasicInfoProps } from './types'

export const EditBasicInfo: React.FC<EditBasicInfoProps> = ({
  nickname,
  setNickname,
  vision,
  setVision,
  currentSituation,
  setCurrentSituation,
}) => {
  return (
    <>
      {/* 기본 정보 */}
      <section>
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
          <User size={14} /> 기본 정보
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              placeholder="닉네임을 입력하세요"
              className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">한 줄 소개</label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="자신을 한 줄로 소개해주세요"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2.5 text-sm border border-border bg-surface-card focus:outline-none focus:border-accent resize-none transition-colors"
            />
            <p className={`text-xs mt-1 text-right font-mono ${vision.length >= 180 ? 'text-status-danger-text font-bold' : vision.length >= 150 ? 'text-status-warning-text' : 'text-txt-tertiary'}`}>{vision.length}/200</p>
          </div>
        </div>
      </section>

      {/* 현재 상황 */}
      <section>
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
          <Target size={14} /> 현재 상황
        </h3>
        <div className="space-y-1.5">
          {SITUATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCurrentSituation(currentSituation === opt.value ? '' : opt.value)}
              className={`w-full text-left px-3 py-2.5 text-xs border transition-colors ${
                currentSituation === opt.value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-card text-txt-secondary border-border hover:border-border-strong'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
