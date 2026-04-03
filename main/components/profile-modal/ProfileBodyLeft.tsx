import Image from 'next/image'
import {
  Mail, Coffee, Code2, Globe, Github, Linkedin,
  FileText, Rocket, ChevronRight, Copy, Check,
} from 'lucide-react'
import { useState } from 'react'
import { DirectMessageBox } from './DirectMessageBox'
import { ProfileActions } from './ProfileActions'

export function ProfileBodyLeft({
  profile,
  displayBio,
  visionGoals,
  skills,
  portfolioItems,
  userProjects,
  isAuthenticated,
  user,
  showCoffeeChatForm,
  setShowCoffeeChatForm,
  showInviteModal,
  setShowInviteModal,
  setSidePanel,
  onClose,
  onSelectProject,
  initialCoffeeChatMessage,
}: {
  profile: {
    id: string
    user_id: string
    nickname: string
    contact_email: string | null
    portfolio_url: string | null
    github_url: string | null
    linkedin_url: string | null
  }
  displayBio: string | null
  visionGoals: string[]
  skills: Array<{ name: string; level: string }> | null
  portfolioItems: Array<{ id: string; title: string; description: string | null; image_url: string | null; link_url: string | null }>
  userProjects: Array<{ id: string; title: string; type: string; status: string | null; interest_tags: string[] | null; needed_roles: string[] | null; applications_count: number | null; created_at: string | null }>
  isAuthenticated: boolean
  user: { id: string } | null
  showCoffeeChatForm: boolean
  setShowCoffeeChatForm: (v: boolean) => void
  showInviteModal: boolean
  setShowInviteModal: (v: boolean) => void
  setSidePanel: (v: null | 'projects' | 'portfolio') => void
  onClose: () => void
  onSelectProject?: (projectId: string) => void
  initialCoffeeChatMessage?: string
}) {
  return (
    <div className="md:col-span-3 space-y-6">
      {/* Bio / Vision */}
      <section>
        <h3 className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="w-0.5 h-3 bg-brand rounded-full" />
          소개
        </h3>
        {displayBio ? (
          <>
            <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
              {displayBio}
            </p>
            {visionGoals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {visionGoals.map((g: string) => (
                  <span key={g} className="px-2 py-0.5 text-[11px] font-medium bg-brand-bg text-brand border border-brand-border">{g}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-5 border border-border bg-white rounded-xl text-center">
            <p className="text-xs text-txt-disabled font-mono">아직 자기소개가 없습니다</p>
          </div>
        )}
      </section>

      {/* Portfolio */}
      <section>
        <h3 className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-0.5 h-3 bg-violet-500 rounded-full" />
          <FileText size={11} /> 포트폴리오
        </h3>

        {/* Links */}
        {(profile.portfolio_url || profile.github_url || profile.linkedin_url) && (
          <div className="space-y-1.5 mb-4">
            <p className="text-[0.5rem] font-medium text-txt-disabled mb-1.5">LINKS</p>
            <div className="flex flex-wrap gap-2">
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl border border-border text-xs text-txt-secondary hover:border-brand hover:text-brand transition-colors">
                  <Globe size={12} className="shrink-0" />
                  {profile.portfolio_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              )}
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl border border-border text-xs text-txt-secondary hover:border-brand hover:text-brand transition-colors">
                  <Github size={12} className="shrink-0" />
                  {profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\/?/, '')}
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl border border-border text-xs text-txt-secondary hover:border-brand hover:text-brand transition-colors">
                  <Linkedin size={12} className="shrink-0" />
                  {profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '')}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Items -- show max 2, expand to side panel */}
        {portfolioItems.length > 0 ? (
          <>
            <p className="text-[0.5rem] font-medium text-txt-disabled mb-2">WORKS</p>
            <div className="grid grid-cols-2 gap-3">
              {portfolioItems.slice(0, 2).map((item) => (
                <a
                  key={item.id}
                  href={item.link_url || '#'}
                  target={item.link_url ? '_blank' : undefined}
                  rel={item.link_url ? 'noopener noreferrer' : undefined}
                  className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md hover-spring"
                >
                  {item.image_url && (
                    <div className="relative h-20 bg-surface-card">
                      <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-bold text-txt-primary truncate">{item.title}</p>
                    {item.description && <p className="text-[10px] text-txt-tertiary truncate mt-0.5">{item.description}</p>}
                  </div>
                </a>
              ))}
            </div>
            {portfolioItems.length > 2 && (
              <button
                onClick={() => setSidePanel('portfolio')}
                className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-2 text-[10px] font-mono font-bold text-txt-tertiary border border-border hover:bg-surface-sunken hover:text-txt-primary transition-colors"
              >
                +{portfolioItems.length - 2}개 더보기 <ChevronRight size={12} />
              </button>
            )}
          </>
        ) : !profile.portfolio_url && !profile.github_url && !profile.linkedin_url ? (
          <div className="px-4 py-5 border border-border bg-white rounded-xl text-center">
            <p className="text-xs text-txt-disabled font-mono">아직 등록된 포트폴리오가 없습니다</p>
          </div>
        ) : null}
      </section>

      {/* User's Projects */}
      <section>
        <h3 className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-0.5 h-3 bg-neutral-800 rounded-full" />
          <Rocket size={11} /> 프로젝트
          <span className="text-[10px] font-mono text-txt-tertiary font-normal">({userProjects.length})</span>
        </h3>
        {userProjects.length > 0 ? (
          <>
            <div className="space-y-2">
              {userProjects.slice(0, 2).map((project) => {
                const typeLabel = project.type === 'startup' || project.type === 'team_building' ? '창업 준비' : project.type === 'study' ? '함께 배우기' : '함께 만들기'
                return (
                  <button
                    key={project.id}
                    onClick={() => {
                      if (onSelectProject) {
                        onClose()
                        onSelectProject(project.id)
                      }
                    }}
                    className="w-full text-left px-3 py-3 bg-white rounded-xl border border-border hover:shadow-md hover:border-brand/40 hover-spring group/proj"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-txt-primary truncate group-hover/proj:text-brand transition-colors">{project.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-mono text-brand bg-brand-bg px-1.5 py-0.5 border border-brand-border">
                            {typeLabel}
                          </span>
                          {(project.needed_roles || []).slice(0, 2).map((role: string) => (
                            <span key={role} className="text-[10px] font-mono text-txt-tertiary">{role}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-indicator-online flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indicator-online rounded-full" />
                          모집중
                        </span>
                        <ChevronRight size={14} className="text-txt-disabled group-hover/proj:text-brand transition-colors" />
                      </div>
                    </div>
                    {(project.interest_tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(project.interest_tags as string[]).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[10px] font-mono bg-white text-txt-tertiary px-1.5 py-0.5 border border-border hover:bg-surface-sunken hover:text-txt-secondary transition-colors">{tag}</span>
                        ))}
                      </div>
                    )}
                    {(project.applications_count ?? 0) > 0 && (
                      <p className="text-[10px] font-mono text-txt-tertiary mt-2">{project.applications_count}명 지원</p>
                    )}
                  </button>
                )
              })}
            </div>
            {userProjects.length > 2 && (
              <button
                onClick={() => setSidePanel('projects')}
                className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-2 text-[10px] font-mono font-bold text-txt-tertiary border border-border hover:bg-surface-sunken hover:text-txt-primary transition-colors"
              >
                +{userProjects.length - 2}개 더보기 <ChevronRight size={12} />
              </button>
            )}
          </>
        ) : (
          <div className="px-4 py-5 border border-border bg-white rounded-xl text-center">
            <p className="text-xs text-txt-disabled font-mono">아직 등록된 프로젝트가 없습니다</p>
          </div>
        )}
      </section>

      {/* Contact */}
      {profile.contact_email && (
        <ContactSection email={profile.contact_email} isAuthenticated={isAuthenticated} />
      )}

      {/* DM / Login CTA */}
      {isAuthenticated ? (
        <>
          <DirectMessageBox receiverId={profile.user_id} />
          {/* Coffee Chat + Invite Actions (not for own profile) */}
          {user?.id !== profile.user_id && (
            <ProfileActions
              targetUserId={profile.user_id}
              targetName={profile.nickname}
              showCoffeeChatForm={showCoffeeChatForm}
              setShowCoffeeChatForm={setShowCoffeeChatForm}
              showInviteModal={showInviteModal}
              setShowInviteModal={setShowInviteModal}
              initialMessage={initialCoffeeChatMessage}
            />
          )}
        </>
      ) : (
        <div className="bg-surface-inverse p-5 text-center border border-surface-inverse shadow-md">
          <Coffee size={20} className="text-txt-inverse/50 mx-auto mb-2" />
          <p className="text-sm font-medium text-txt-inverse mb-1">관심 있는 사람인가요?</p>
          <p className="text-xs text-txt-inverse/50 mb-3">로그인하면 쪽지와 커피챗이 가능해요</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-txt-primary px-5 py-2 font-bold text-xs hover:bg-surface-sunken transition-colors border border-white"
          >
            로그인하기
          </a>
        </div>
      )}
    </div>
  )
}

function ContactSection({ email, isAuthenticated }: { email: string; isAuthenticated: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = email
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* */ }
      document.body.removeChild(textarea)
    }
  }

  return (
    <section>
      <h3 className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-0.5 h-3 bg-sky-500 rounded-full" />
        연락처
      </h3>
      {isAuthenticated ? (
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-surface-sunken text-sm text-txt-secondary transition-colors border border-border rounded-xl group"
        >
          <span className="flex items-center gap-2">
            <Mail size={14} />
            {email}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-txt-disabled group-hover:text-txt-secondary transition-colors">
            {copied ? <><Check size={12} className="text-indicator-online" /> 복사됨</> : <><Copy size={12} /> 복사</>}
          </span>
        </button>
      ) : (
        <a
          href="/login"
          className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-surface-sunken text-sm text-txt-tertiary transition-colors border border-border rounded-xl"
        >
          <Mail size={14} />
          로그인하면 연락처를 볼 수 있어요
        </a>
      )}
    </section>
  )
}
