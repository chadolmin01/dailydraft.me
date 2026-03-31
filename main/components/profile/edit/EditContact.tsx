'use client'

import React from 'react'
import { Mail, Link, Globe, Github, Linkedin } from 'lucide-react'
import type { EditContactProps, EditSocialLinksProps } from './types'

export const EditContact: React.FC<EditContactProps & EditSocialLinksProps> = ({
  contactEmail,
  setContactEmail,
  userEmail,
  portfolioUrl,
  setPortfolioUrl,
  githubUrl,
  setGithubUrl,
  linkedinUrl,
  setLinkedinUrl,
}) => {
  return (
    <>
      {/* 연락처 */}
      <section>
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
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
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
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
