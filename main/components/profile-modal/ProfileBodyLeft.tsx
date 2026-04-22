import Image from 'next/image'
import {
  Mail, Coffee, Globe, Github, Linkedin,
  FileText, Rocket, ChevronRight, Copy, Check,
  Sparkles, Loader2, AlertCircle,
} from 'lucide-react'
import { useState } from 'react'
import { DirectMessageBox } from './DirectMessageBox'
import { ProfileActions } from './ProfileActions'
import { useMatchAnalysis } from '@/src/hooks/useMatchAnalysis'

type Tab = 'intro' | 'portfolio' | 'ai-analysis'

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
  onClose: () => void
  onSelectProject?: (projectId: string) => void
  initialCoffeeChatMessage?: string
}) {
  const [activeTab, setActiveTab] = useState<Tab>('intro')

  const portfolioCount = portfolioItems.length + (profile.portfolio_url ? 1 : 0) + (profile.github_url ? 1 : 0) + (profile.linkedin_url ? 1 : 0)

  const canAnalyze = !!user && user.id !== profile.user_id

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'intro', label: '소개' },
    { id: 'portfolio', label: '포트폴리오·프로젝트', count: portfolioItems.length + userProjects.length || undefined },
    ...(canAnalyze ? [{ id: 'ai-analysis' as Tab, label: 'AI 분석' }] : []),
  ]

  return (
    <div className="md:col-span-3 space-y-6">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-[15px] font-bold transition-colors ${
              activeTab === tab.id
                ? 'text-txt-primary'
                : 'text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1 text-xs text-brand font-semibold">{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in fade-in duration-200">

        {/* ── 소개 탭 ── */}
        {activeTab === 'intro' && (
          <div className="space-y-6">
            {/* Bio / Vision */}
            <section>
              {displayBio ? (
                <>
                  <p className="text-[15px] text-txt-secondary leading-relaxed whitespace-pre-line">
                    {displayBio}
                  </p>
                  {visionGoals.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {visionGoals.map((g: string) => (
                        <span key={g} className="px-3 py-1 text-xs font-semibold bg-brand-bg text-brand rounded-full">{g}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-5 bg-surface-sunken rounded-2xl text-center">
                  <p className="text-[13px] text-txt-disabled">아직 자기소개가 없습니다</p>
                </div>
              )}
            </section>

            {/* Contact */}
            {profile.contact_email && (
              <ContactSection email={profile.contact_email} isAuthenticated={isAuthenticated} />
            )}
          </div>
        )}

        {/* ── 포트폴리오·프로젝트 탭 ── */}
        {activeTab === 'portfolio' && (
          <div className="space-y-8">
            {/* Portfolio Section */}
            <section>
              <h3 className="text-[15px] font-bold text-txt-primary mb-3 flex items-center gap-2">
                <FileText size={15} /> 포트폴리오
              </h3>

              {/* Links */}
              {(profile.portfolio_url || profile.github_url || profile.linkedin_url) && (
                <div className="space-y-2 mb-4">
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 bg-surface-sunken rounded-2xl text-[13px] text-txt-secondary hover:bg-border-subtle transition-colors">
                      <Globe size={15} className="text-brand shrink-0" />
                      <span className="truncate">{profile.portfolio_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 bg-surface-sunken rounded-2xl text-[13px] text-txt-secondary hover:bg-border-subtle transition-colors">
                      <Github size={15} className="shrink-0" />
                      <span className="truncate">{profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\/?/, '')}</span>
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 bg-surface-sunken rounded-2xl text-[13px] text-txt-secondary hover:bg-border-subtle transition-colors">
                      <Linkedin size={15} className="text-[#0A66C2] shrink-0" />
                      <span className="truncate">{profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '')}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Portfolio Items - show all */}
              {portfolioItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {portfolioItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.link_url || '#'}
                      target={item.link_url ? '_blank' : undefined}
                      rel={item.link_url ? 'noopener noreferrer' : undefined}
                      className="bg-surface-sunken rounded-2xl overflow-hidden hover:bg-border-subtle transition-colors"
                    >
                      {item.image_url && (
                        <div className="relative h-24 bg-border-subtle">
                          <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-[13px] font-bold text-txt-primary truncate">{item.title}</p>
                        {item.description && <p className="text-xs text-txt-tertiary truncate mt-0.5">{item.description}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              ) : !profile.portfolio_url && !profile.github_url && !profile.linkedin_url ? (
                <div className="px-4 py-5 bg-surface-sunken rounded-2xl text-center">
                  <p className="text-[13px] text-txt-disabled">아직 등록된 포트폴리오가 없습니다</p>
                </div>
              ) : null}
            </section>

            {/* Divider */}
            <div className="h-px bg-border-subtle" />

            {/* Projects Section - show all */}
            <section>
              <h3 className="text-[15px] font-bold text-txt-primary mb-3 flex items-center gap-2">
                <Rocket size={15} /> 프로젝트
                {userProjects.length > 0 && (
                  <span className="text-xs font-semibold text-brand">{userProjects.length}</span>
                )}
              </h3>
              {userProjects.length > 0 ? (
                <div className="space-y-2">
                  {userProjects.map((project) => {
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
                        className="w-full text-left px-4 py-3.5 bg-surface-sunken rounded-2xl hover:bg-border-subtle transition-colors group/proj"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-txt-primary truncate group-hover/proj:text-brand transition-colors">{project.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
                                {typeLabel}
                              </span>
                              {(project.needed_roles || []).slice(0, 2).map((role: string) => (
                                <span key={role} className="text-xs text-txt-tertiary">{role}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-status-success-text flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-status-success-text rounded-full" />
                              모집중
                            </span>
                            <ChevronRight size={14} className="text-txt-disabled group-hover/proj:text-brand transition-colors" />
                          </div>
                        </div>
                        {(project.interest_tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(project.interest_tags as string[]).slice(0, 3).map((tag: string) => (
                              <span key={tag} className="text-[11px] bg-border-subtle text-txt-tertiary px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        {(project.applications_count ?? 0) > 0 && (
                          <p className="text-xs text-txt-tertiary mt-2">{project.applications_count}명 지원</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-5 bg-surface-sunken rounded-2xl text-center">
                  <p className="text-[13px] text-txt-disabled">아직 등록된 프로젝트가 없습니다</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── AI 심층 분석 탭 ── */}
        {activeTab === 'ai-analysis' && canAnalyze && (
          <MatchAnalysisSection targetId={profile.user_id} targetName={profile.nickname} />
        )}
      </div>

      {/* DM / Login CTA - always visible below tabs */}
      {isAuthenticated ? (
        <>
          <DirectMessageBox receiverId={profile.user_id} />
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
        <div className="bg-surface-sunken p-5 rounded-2xl text-center">
          <Coffee size={20} className="text-txt-disabled mx-auto mb-2" />
          <p className="text-[15px] font-bold text-txt-primary mb-1">관심 있는 사람인가요?</p>
          <p className="text-[13px] text-txt-tertiary mb-4">로그인하면 쪽지와 커피챗이 가능해요</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 font-semibold text-sm rounded-2xl hover:bg-brand-hover transition-colors active:scale-[0.97]"
          >
            로그인하기
          </a>
        </div>
      )}
    </div>
  )
}

function MatchAnalysisSection({ targetId, targetName }: { targetId: string; targetName: string }) {
  const { data, isLoading, error, runAnalysis } = useMatchAnalysis(targetId)
  const analysis = data?.analysis

  if (isLoading) {
    return (
      <div className="px-5 py-10 bg-surface-sunken rounded-2xl text-center">
        <Loader2 size={22} className="text-brand mx-auto mb-3 animate-spin" />
        <p className="text-sm font-bold text-txt-primary mb-1">AI가 두 분의 시너지를 분석 중이에요</p>
        <p className="text-xs text-txt-tertiary">몇 초만 기다려주세요…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-5 py-6 bg-status-danger-bg rounded-2xl">
        <div className="flex items-start gap-2.5 mb-3">
          <AlertCircle size={16} className="text-status-danger-text shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-txt-primary">분석에 실패했습니다</p>
            <p className="text-xs text-txt-tertiary mt-0.5">{error.message}</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          className="px-4 py-2 bg-surface-card text-[13px] font-semibold text-txt-primary rounded-full hover:bg-border-subtle transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="px-5 py-8 bg-gradient-to-br from-[#EBF4FF] to-[#F7F8F9] dark:from-[#1A2A42] dark:to-[#1C1C1E] rounded-2xl text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 bg-surface-card rounded-full mb-3 shadow-sm">
          <Sparkles size={18} className="text-brand" />
        </div>
        <p className="text-[15px] font-bold text-txt-primary mb-1">{targetName}님과의 시너지 분석</p>
        <p className="text-[13px] text-txt-tertiary mb-5 leading-relaxed">
          AI가 두 분의 프로필을 비교해<br />협업 시너지, 강점, 유의점을 알려드려요
        </p>
        <button
          onClick={runAnalysis}
          className="inline-flex items-center gap-1.5 bg-brand text-white px-5 py-2.5 font-semibold text-[13px] rounded-full hover:bg-brand-hover transition-colors active:scale-[0.97]"
        >
          <Sparkles size={13} />
          분석 시작하기
        </button>
        <p className="text-[11px] text-txt-disabled mt-3">결과는 7일간 저장돼요</p>
      </div>
    )
  }

  const createdAt = data?.created_at ? new Date(data.created_at) : null

  return (
    <div className="space-y-5">
      {/* Synergy */}
      <section className="px-5 py-4 bg-gradient-to-br from-[#EBF4FF] to-transparent dark:from-[#1A2A42] dark:to-transparent rounded-2xl">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} className="text-brand" />
          <span className="text-xs font-bold text-brand">시너지</span>
        </div>
        <p className="text-sm text-txt-primary leading-relaxed whitespace-pre-line">
          {analysis.synergy}
        </p>
      </section>

      {/* Strengths */}
      <section>
        <h4 className="text-[13px] font-bold text-txt-primary mb-2">함께하면 강해지는 점</h4>
        <ul className="space-y-1.5">
          {analysis.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-txt-secondary">
              <Check size={14} className="text-status-success-text shrink-0 mt-0.5" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Caution */}
      <section className="px-4 py-3 bg-status-warning-bg rounded-2xl">
        <p className="text-xs font-bold text-status-warning-text mb-1">유의할 점</p>
        <p className="text-[13px] text-txt-secondary leading-relaxed">{analysis.caution}</p>
      </section>

      {createdAt && (
        <p className="text-[11px] text-txt-disabled text-center">
          {createdAt.toLocaleDateString('ko-KR')} 분석 · 7일간 저장
        </p>
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
          className="w-full flex items-center justify-between px-4 py-3 bg-surface-sunken hover:bg-border-subtle text-sm text-txt-secondary transition-colors rounded-2xl group"
        >
          <span className="flex items-center gap-2.5">
            <Mail size={15} className="text-brand" />
            {email}
          </span>
          <span className="flex items-center gap-1 text-xs text-txt-disabled group-hover:text-txt-secondary transition-colors">
            {copied ? <><Check size={13} className="text-status-success-text" /> 복사됨</> : <><Copy size={13} /> 복사</>}
          </span>
        </button>
      ) : (
        <a
          href="/login"
          className="flex items-center gap-2.5 px-4 py-3 bg-surface-sunken hover:bg-border-subtle text-sm text-txt-tertiary transition-colors rounded-2xl"
        >
          <Mail size={15} />
          로그인하면 연락처를 볼 수 있어요
        </a>
      )}
    </section>
  )
}
