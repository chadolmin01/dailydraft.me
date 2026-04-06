import Image from 'next/image'
import {
  Mail, Coffee, Globe, Github, Linkedin,
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
        <h3 className="text-[15px] font-bold text-txt-primary mb-3">소개</h3>
        {displayBio ? (
          <>
            <p className="text-[15px] text-txt-secondary leading-relaxed whitespace-pre-line">
              {displayBio}
            </p>
            {visionGoals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {visionGoals.map((g: string) => (
                  <span key={g} className="px-3 py-1 text-[12px] font-semibold bg-[#EBF4FF] dark:bg-[#1A2A42] text-[#3182F6] rounded-full">{g}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-5 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl text-center">
            <p className="text-[13px] text-txt-disabled">아직 자기소개가 없습니다</p>
          </div>
        )}
      </section>

      {/* Portfolio */}
      <section>
        <h3 className="text-[15px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <FileText size={15} /> 포트폴리오
        </h3>

        {/* Links */}
        {(profile.portfolio_url || profile.github_url || profile.linkedin_url) && (
          <div className="space-y-2 mb-4">
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl text-[13px] text-txt-secondary hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-colors">
                <Globe size={15} className="text-[#3182F6] shrink-0" />
                <span className="truncate">{profile.portfolio_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
              </a>
            )}
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl text-[13px] text-txt-secondary hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-colors">
                <Github size={15} className="shrink-0" />
                <span className="truncate">{profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\/?/, '')}</span>
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl text-[13px] text-txt-secondary hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-colors">
                <Linkedin size={15} className="text-[#0A66C2] shrink-0" />
                <span className="truncate">{profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '')}</span>
              </a>
            )}
          </div>
        )}

        {/* Items -- show max 2, expand to side panel */}
        {portfolioItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {portfolioItems.slice(0, 2).map((item) => (
                <a
                  key={item.id}
                  href={item.link_url || '#'}
                  target={item.link_url ? '_blank' : undefined}
                  rel={item.link_url ? 'noopener noreferrer' : undefined}
                  className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl overflow-hidden hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-colors"
                >
                  {item.image_url && (
                    <div className="relative h-24 bg-[#F2F3F5] dark:bg-[#2C2C2E]">
                      <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-[13px] font-bold text-txt-primary truncate">{item.title}</p>
                    {item.description && <p className="text-[12px] text-txt-tertiary truncate mt-0.5">{item.description}</p>}
                  </div>
                </a>
              ))}
            </div>
            {portfolioItems.length > 2 && (
              <button
                onClick={() => setSidePanel('portfolio')}
                className="w-full mt-3 flex items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-semibold text-txt-secondary bg-[#F2F3F5] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-2xl transition-colors"
              >
                +{portfolioItems.length - 2}개 더보기 <ChevronRight size={14} />
              </button>
            )}
          </>
        ) : !profile.portfolio_url && !profile.github_url && !profile.linkedin_url ? (
          <div className="px-4 py-5 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl text-center">
            <p className="text-[13px] text-txt-disabled">아직 등록된 포트폴리오가 없습니다</p>
          </div>
        ) : null}
      </section>

      {/* User's Projects */}
      <section>
        <h3 className="text-[15px] font-bold text-txt-primary mb-3 flex items-center gap-2">
          <Rocket size={15} /> 프로젝트
          {userProjects.length > 0 && (
            <span className="text-[12px] font-semibold text-[#3182F6]">{userProjects.length}</span>
          )}
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
                    className="w-full text-left px-4 py-3.5 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-colors group/proj"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-txt-primary truncate group-hover/proj:text-[#3182F6] transition-colors">{project.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[12px] font-semibold text-[#3182F6] bg-[#EBF4FF] dark:bg-[#1A2A42] px-2 py-0.5 rounded-full">
                            {typeLabel}
                          </span>
                          {(project.needed_roles || []).slice(0, 2).map((role: string) => (
                            <span key={role} className="text-[12px] text-txt-tertiary">{role}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[12px] font-semibold text-[#34C759] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#34C759] rounded-full" />
                          모집중
                        </span>
                        <ChevronRight size={14} className="text-txt-disabled group-hover/proj:text-[#3182F6] transition-colors" />
                      </div>
                    </div>
                    {(project.interest_tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(project.interest_tags as string[]).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[11px] bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-tertiary px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                    {(project.applications_count ?? 0) > 0 && (
                      <p className="text-[12px] text-txt-tertiary mt-2">{project.applications_count}명 지원</p>
                    )}
                  </button>
                )
              })}
            </div>
            {userProjects.length > 2 && (
              <button
                onClick={() => setSidePanel('projects')}
                className="w-full mt-3 flex items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-semibold text-txt-secondary bg-[#F2F3F5] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-2xl transition-colors"
              >
                +{userProjects.length - 2}개 더보기 <ChevronRight size={14} />
              </button>
            )}
          </>
        ) : (
          <div className="px-4 py-5 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl text-center">
            <p className="text-[13px] text-txt-disabled">아직 등록된 프로젝트가 없습니다</p>
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
        <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] p-5 rounded-2xl text-center">
          <Coffee size={20} className="text-txt-disabled mx-auto mb-2" />
          <p className="text-[15px] font-bold text-txt-primary mb-1">관심 있는 사람인가요?</p>
          <p className="text-[13px] text-txt-tertiary mb-4">로그인하면 쪽지와 커피챗이 가능해요</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-[#3182F6] text-white px-6 py-3 font-semibold text-[14px] rounded-2xl hover:bg-[#2272EB] transition-colors active:scale-[0.97]"
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
      <h3 className="text-[15px] font-bold text-txt-primary mb-3">연락처</h3>
      {isAuthenticated ? (
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] hover:bg-[#EDF0F3] dark:hover:bg-[#252527] text-[14px] text-txt-secondary transition-colors rounded-2xl group"
        >
          <span className="flex items-center gap-2.5">
            <Mail size={15} className="text-[#3182F6]" />
            {email}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-txt-disabled group-hover:text-txt-secondary transition-colors">
            {copied ? <><Check size={13} className="text-[#34C759]" /> 복사됨</> : <><Copy size={13} /> 복사</>}
          </span>
        </button>
      ) : (
        <a
          href="/login"
          className="flex items-center gap-2.5 px-4 py-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] hover:bg-[#EDF0F3] dark:hover:bg-[#252527] text-[14px] text-txt-tertiary transition-colors rounded-2xl"
        >
          <Mail size={15} />
          로그인하면 연락처를 볼 수 있어요
        </a>
      )}
    </section>
  )
}
