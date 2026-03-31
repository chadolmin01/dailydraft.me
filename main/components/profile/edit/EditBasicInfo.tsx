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
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">닉네임 <span className="text-status-danger-text">*</span></label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              placeholder="어떻게 불러드릴까요?"
              className={`w-full px-3 py-2.5 text-base sm:text-sm border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all ${!nickname.trim() ? 'border-status-danger-text/30' : 'border-border'}`}
            />
            {!nickname.trim() && (
              <p className="text-[0.6875rem] text-status-danger-text mt-1">닉네임은 필수예요</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">한 줄 소개</label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="한 줄로 나를 표현해볼까요? 예: 사이드 프로젝트를 좋아하는 프론트엔드 개발자"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none transition-all"
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
              className={`w-full text-left px-3 py-2.5 text-xs border rounded-lg transition-all ${
                currentSituation === opt.value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-card text-txt-secondary border-border hover:bg-surface-sunken hover:border-border'
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
