'use client'

import React from 'react'
import { Mail, Link, Globe, Github, Linkedin } from 'lucide-react'
import type { EditContactProps, EditSocialLinksProps } from './types'

/**
 * GitHub username 입력값을 정규화한다.
 * - 앞뒤 공백 제거
 * - '@' 접두사 제거
 * - GitHub 프로필 URL에서 username 추출
 * - 소문자 변환 (GitHub username은 case-insensitive)
 */
export function normalizeGithubUsername(raw: string): string {
  let value = raw.trim()
  // URL 형태 입력 처리: https://github.com/username 또는 github.com/username
  const urlMatch = value.match(/(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_-]+)/i)
  if (urlMatch) {
    value = urlMatch[1]
  }
  // @ 접두사 제거
  value = value.replace(/^@/, '')
  return value.toLowerCase()
}

export const EditContact: React.FC<EditContactProps & EditSocialLinksProps> = ({
  contactEmail,
  setContactEmail,
  userEmail,
  portfolioUrl,
  setPortfolioUrl,
  githubUrl,
  setGithubUrl,
  githubUsername,
  setGithubUsername,
  linkedinUrl,
  setLinkedinUrl,
}) => {
  return (
    <>
      {/* 연락처 */}
      <section>
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
          <Mail size={14} /> 연락처
        </h3>
        <div>
          <label className="block text-xs font-medium text-txt-secondary mb-1.5">이메일</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={userEmail || 'email@example.com'}
            inputMode="email"
            autoComplete="email"
            className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-xs text-txt-tertiary mt-1">커피챗 수락 시 상대방에게 공개됩니다</p>
        </div>
      </section>

      {/* 소셜 링크 */}
      <section>
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
          <Link size={14} /> 소셜 링크
        </h3>
        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-txt-secondary mb-1.5">
              <Globe size={12} /> 포트폴리오
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://myportfolio.com"
              inputMode="url"
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-txt-secondary mb-1.5">
              <Github size={12} /> GitHub
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              inputMode="url"
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-txt-secondary mb-1.5">
              <Github size={12} /> GitHub 사용자명
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              onBlur={(e) => {
                // 포커스 아웃 시 정규화 (URL이나 @접두사 자동 정리)
                const normalized = normalizeGithubUsername(e.target.value)
                if (normalized !== githubUsername) {
                  setGithubUsername(normalized)
                }
              }}
              placeholder="github-username"
              autoComplete="off"
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-txt-tertiary mt-1">GitHub 커밋 알림에서 본인을 자동 매칭합니다 (@ 또는 URL 입력 시 자동 변환)</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-txt-secondary mb-1.5">
              <Linkedin size={12} /> LinkedIn
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              inputMode="url"
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
        <p className="text-xs text-txt-tertiary mt-2">프로필에 표시되어 다른 사용자가 볼 수 있습니다</p>
      </section>
    </>
  )
}
