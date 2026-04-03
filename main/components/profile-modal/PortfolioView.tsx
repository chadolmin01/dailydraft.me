import {
  ArrowLeft, ExternalLink, FileText,
  Globe, Github, Linkedin, Code2,
} from 'lucide-react'
import { cleanNickname } from '@/src/lib/clean-nickname'

export function PortfolioView({
  profile,
  skills,
  onBack,
}: {
  profile: { nickname: string; desired_position: string | null; portfolio_url: string | null; github_url: string | null; linkedin_url: string | null; avatar_url: string | null }
  skills: Array<{ name: string }> | null
  onBack: () => void
}) {
  // Only allow https:// URLs for iframe embedding
  const hasPortfolio = profile.portfolio_url && profile.portfolio_url.startsWith('https://')
  const hasGithub = profile.github_url
  const hasLinkedin = profile.linkedin_url

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-8 py-4 border-b border-border flex items-center gap-3">
        <button
          onClick={onBack}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border hover:bg-black hover:text-white transition-all"
        >
          <ArrowLeft size={12} />
          프로필로 돌아가기
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-6 h-6 bg-surface-inverse flex items-center justify-center text-[0.5rem] font-bold text-txt-inverse shrink-0">
            {cleanNickname(profile.nickname).substring(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-txt-primary">{cleanNickname(profile.nickname)}</p>
            <p className="text-[10px] font-mono text-txt-tertiary">{profile.desired_position || 'Explorer'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6 space-y-6">
        {/* Portfolio Site */}
        {hasPortfolio && (
          <section>
            <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-1">
              <Globe size={11} /> PORTFOLIO SITE
            </h3>
            <div className="border border-border overflow-hidden">
              <div className="bg-surface-card px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs text-txt-secondary font-mono truncate flex-1 mr-2">
                  {profile.portfolio_url!.replace(/^https?:\/\//, '')}
                </span>
                <a
                  href={profile.portfolio_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold border border-border hover:bg-black hover:text-white transition-all shrink-0"
                >
                  <ExternalLink size={10} />
                  새 탭에서 열기
                </a>
              </div>
              <div className="relative bg-white" style={{ height: '400px' }}>
                <iframe
                  src={profile.portfolio_url!}
                  title={`${cleanNickname(profile.nickname)}의 포트폴리오`}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-popups"
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* GitHub */}
        {hasGithub && (
          <section>
            <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-1">
              <Github size={11} /> GITHUB
            </h3>
            <a
              href={profile.github_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-surface-card rounded-xl border border-border hover:border-brand/30 hover:shadow-md hover-spring"
            >
              <div className="w-12 h-12 bg-surface-inverse flex items-center justify-center shrink-0">
                <Github size={24} className="text-txt-inverse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-txt-primary group-hover:text-brand transition-colors">
                  {profile.github_url!.replace(/^https?:\/\/(www\.)?github\.com\/?/, '') || 'GitHub Profile'}
                </p>
                <p className="text-xs text-txt-tertiary font-mono truncate">{profile.github_url}</p>
              </div>
              <ExternalLink size={14} className="text-txt-disabled group-hover:text-brand shrink-0 transition-colors" />
            </a>
          </section>
        )}

        {/* LinkedIn */}
        {hasLinkedin && (
          <section>
            <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-1">
              <Linkedin size={11} /> LINKEDIN
            </h3>
            <a
              href={profile.linkedin_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-surface-card rounded-xl border border-border hover:border-brand/30 hover:shadow-md hover-spring"
            >
              <div className="w-12 h-12 bg-[#0A66C2] flex items-center justify-center shrink-0">
                <Linkedin size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-txt-primary group-hover:text-brand transition-colors">
                  {profile.linkedin_url!.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '') || 'LinkedIn Profile'}
                </p>
                <p className="text-xs text-txt-tertiary font-mono truncate">{profile.linkedin_url}</p>
              </div>
              <ExternalLink size={14} className="text-txt-disabled group-hover:text-brand shrink-0 transition-colors" />
            </a>
          </section>
        )}

        {/* Skills in portfolio context */}
        {skills && skills.length > 0 && (
          <section>
            <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-1">
              <Code2 size={11} /> TECH STACK
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-flex items-center px-3 py-1.5 bg-white text-tag-default-text text-xs border border-border font-medium"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasPortfolio && !hasGithub && !hasLinkedin && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={32} className="text-txt-tertiary mb-3" />
            <p className="font-bold text-txt-primary mb-1">등록된 포트폴리오가 없습니다</p>
            <p className="text-sm text-txt-tertiary">아직 포트폴리오 링크가 등록되지 않았어요</p>
          </div>
        )}
      </div>
    </div>
  )
}
