'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Github, Chrome, ArrowRight, Shield, Users, Rocket, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { translateAuthError } from '@/src/lib/auth/login-errors'

export interface LoginShowcaseProject {
  title: string
  desc: string
  roles: string[]
  tags: string[]
}

export interface LoginShowcasePeople {
  name: string
  initial: string
  role: string
  univ: string
  tags: string[]
  status: 'OPEN' | 'BUSY'
}

type ShowcaseItem =
  | { type: 'project'; data: LoginShowcaseProject }
  | { type: 'people'; data: LoginShowcasePeople }

interface LoginClientProps {
  // 서버에서 prefetch한 실데이터. 부족하면 더미로 채워 3개 컬럼 마퀴 구성.
  projects: LoginShowcaseProject[]
  people: LoginShowcasePeople[]
}

// redirect 파라미터 allowlist 검증 — `/`로 시작 + `//`·`/\\` 로 시작하지 않는 내부 경로만.
function sanitizeRedirect(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/')) return '/dashboard'
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard'
  if (/^\/(login|signup|oauth|api\/)/i.test(raw)) return '/dashboard'
  return raw
}

export default function LoginClient(props: LoginClientProps) {
  return (
    <Suspense>
      <LoginContent {...props} />
    </Suspense>
  )
}

function LoginContent({ projects, people }: LoginClientProps) {
  const router = useRouter()
  const { signIn, signUp, signInWithGoogle, signInWithGithub, signInWithDiscord, isAuthenticated, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const redirectTo = sanitizeRedirect(searchParams.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // OAuth 중복 클릭 가드 — 버튼 3개 공용 플래그. 한 번 클릭 후 redirect까지 비활성화.
  const [oauthPending, setOauthPending] = useState<'google' | 'github' | 'discord' | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)

  // 이미 로그인된 유저가 /login 직접 열었을 때 즉시 리다이렉트.
  // 서버 컴포넌트에서 1차 차단하지만, 클라이언트 hydrate 후 상태 변화(다른 탭 로그인 등)도 반영.
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push(redirectTo)
  }, [authLoading, isAuthenticated, redirectTo, router])

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        if (!nickname.trim()) {
          setError('닉네임을 입력해주세요')
          setIsSubmitting(false)
          return
        }
        const { error } = await signUp(email, password, nickname)
        if (error) setError(translateAuthError(error.message))
        else router.push(redirectTo)
      } else {
        const { error } = await signIn(email, password)
        if (error) setError(translateAuthError(error.message))
        else router.push(redirectTo)
      }
    } catch {
      setError('인증 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const oauthHandler = (provider: 'google' | 'github' | 'discord') => async () => {
    if (oauthPending) return // 중복 클릭 방어
    setError(null)
    setOauthPending(provider)
    try {
      const fn = provider === 'google' ? signInWithGoogle
        : provider === 'github' ? signInWithGithub
        : signInWithDiscord
      const { error } = await fn()
      if (error) {
        setError(translateAuthError(error.message))
        setOauthPending(null)
      }
      // 성공 시 Supabase가 외부 provider로 redirect — 페이지가 떠날 예정이라 pending 유지
    } catch {
      setError(`${provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'Discord'} 로그인 중 오류가 발생했습니다`)
      setOauthPending(null)
    }
  }

  // 마퀴 아이템 구성 — 실데이터 부족 시 hydrate용 placeholder 채우기 (빈 마퀴 방지)
  const buildColumns = (): ShowcaseItem[][] => {
    const mix: ShowcaseItem[] = []
    const len = Math.max(projects.length, people.length, 5)
    for (let i = 0; i < len; i++) {
      if (projects[i]) mix.push({ type: 'project', data: projects[i] })
      if (people[i]) mix.push({ type: 'people', data: people[i] })
    }
    if (mix.length === 0) return [[], [], []]
    const col1 = [...mix, ...mix, ...mix]
    const col2 = [...mix.slice(Math.floor(mix.length / 3)), ...mix.slice(Math.floor(mix.length / 3)), ...mix.slice(Math.floor(mix.length / 3))]
    const col3 = [...mix.slice(Math.floor((mix.length * 2) / 3)), ...mix.slice(Math.floor((mix.length * 2) / 3)), ...mix.slice(Math.floor((mix.length * 2) / 3))]
    return [col1, col2, col3]
  }
  const [col1, col2, col3] = buildColumns()

  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen overflow-hidden bg-surface-bg">

      {/* LEFT: Login Panel */}
      <div className="w-full lg:w-[30rem] xl:w-[34rem] flex flex-col bg-surface-card z-20 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)] shrink-0 h-full relative">

         <div className="p-5 sm:p-8 md:p-10">
            <div className="flex items-center gap-2.5">
               <div className="w-9 h-9 bg-surface-inverse text-txt-inverse flex items-center justify-center font-black text-lg rounded-xl shadow-sm">D</div>
               <span className="font-bold text-xl tracking-tight text-txt-primary">Draft.</span>
               <span className="ml-2 text-[0.5625rem] font-medium text-txt-disabled bg-surface-sunken px-2 py-0.5 rounded-full border border-border">Beta</span>
            </div>
         </div>

         <div className="flex-1 px-5 sm:px-8 md:px-10 flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-txt-primary mb-2 tracking-tight">
               {isSignUp ? '계정 만들기' : '다시 만나서 반가워요!'}
            </h1>
            <p className="text-txt-secondary text-sm mb-8 leading-relaxed">
               {isSignUp
                  ? 'Draft에서 팀을 만들고 프로젝트를 시작하세요'
                  : '로그인하고 프로젝트와 커피챗을 확인하세요'}
            </p>

            {error && (
               <div className="mb-5 p-3 bg-status-danger-bg rounded-xl border border-status-danger-text/20 flex items-center gap-2 text-status-danger-text text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
               </div>
            )}

            {/* Social Login */}
            <div className="space-y-3 mb-6">
               <button
                  onClick={oauthHandler('google')}
                  type="button"
                  disabled={oauthPending !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-surface-card rounded-xl border border-border text-sm font-semibold text-txt-primary hover:bg-surface-sunken hover:border-border hover:shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  {oauthPending === 'google' ? <Loader2 size={18} className="animate-spin" /> : <Chrome size={18} />}
                  Google로 계속하기
               </button>
               <button
                  onClick={oauthHandler('github')}
                  type="button"
                  disabled={oauthPending !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-surface-inverse rounded-xl text-sm font-semibold text-txt-inverse hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  {oauthPending === 'github' ? <Loader2 size={18} className="animate-spin" /> : <Github size={18} />}
                  GitHub로 계속하기
               </button>
               <button
                  onClick={oauthHandler('discord')}
                  type="button"
                  disabled={oauthPending !== null}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#5865F2' }}
               >
                  {oauthPending === 'discord' ? <Loader2 size={18} className="animate-spin" /> : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  )}
                  Discord로 계속하기
               </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
               <div className="relative flex justify-center">
                  <button
                     onClick={() => setShowEmailForm(!showEmailForm)}
                     className="bg-surface-card px-3 py-0.5 text-[0.6875rem] text-txt-tertiary hover:text-txt-secondary transition-colors flex items-center gap-1.5"
                  >
                     <Mail size={12} />
                     {showEmailForm ? '이메일 로그인 접기' : '이메일로 로그인'}
                  </button>
               </div>
            </div>

            {showEmailForm && (
               <form onSubmit={handleLogin} className="space-y-4">
                  {isSignUp && (
                     <div className="space-y-1.5">
                        <label className="text-[0.6875rem] font-medium text-txt-tertiary">닉네임</label>
                        <input
                           type="text"
                           value={nickname}
                           onChange={(e) => setNickname(e.target.value)}
                           className="w-full px-4 py-3.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled"
                           placeholder="닉네임을 입력하세요"
                           required={isSignUp}
                           autoComplete="nickname"
                        />
                     </div>
                  )}

                  <div className="space-y-1.5">
                     <label className="text-[0.6875rem] font-medium text-txt-tertiary">이메일</label>
                     <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled font-mono"
                        placeholder="email@example.com"
                        inputMode="email"
                        autoComplete="email"
                        required
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[0.6875rem] font-medium text-txt-tertiary">비밀번호</label>
                     <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3.5 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled"
                        placeholder="비밀번호를 입력하세요"
                        required
                        minLength={6}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                     />
                  </div>

                  <button
                     type="submit"
                     disabled={isSubmitting || oauthPending !== null}
                     className="w-full bg-brand text-white py-3.5 rounded-xl text-sm font-bold hover:bg-brand-hover transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                     ) : (
                        <>
                           <span>{isSignUp ? '가입하기' : '로그인'}</span>
                           <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                     )}
                  </button>

                  <button
                     type="button"
                     onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
                     className="w-full text-[0.8125rem] text-txt-tertiary hover:text-txt-primary transition-colors text-center py-1"
                  >
                     {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 가입하기'}
                  </button>
               </form>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-4 text-[0.6875rem] text-txt-disabled">
               <span className="flex items-center gap-1"><Users size={12} /> 대학생 커뮤니티</span>
               <span className="w-px h-3 bg-border" />
               <span className="flex items-center gap-1"><Rocket size={12} /> 프로젝트 매칭</span>
               <span className="w-px h-3 bg-border" />
               <span className="flex items-center gap-1"><Shield size={12} /> 안전한 인증</span>
            </div>
         </div>

         <div className="p-5 sm:p-8 md:p-10 text-[0.625rem] text-txt-disabled font-medium flex justify-between border-t border-border/50">
            <span>&copy; 2026 DRAFT</span>
            <span className="flex items-center gap-1"><Shield size={10} /> SECURE CONNECTION</span>
         </div>
      </div>

      {/* RIGHT: Marquee */}
      <div className="hidden lg:flex flex-1 bg-surface-sunken relative overflow-hidden flex-col justify-center items-center">
         <div className="absolute inset-0 bg-grid-engineering opacity-50" />
         <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-surface-sunken to-transparent z-10 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-surface-sunken to-transparent z-10 pointer-events-none" />

         <div className="flex gap-4 h-[120vh] -rotate-3 scale-105 opacity-80 shrink-0">
            <div className="flex flex-col gap-4 animate-marquee-vertical-up shrink-0 w-[17rem]">
               {col1.map((item, idx) => <ShowcaseCard key={`col1-${idx}`} item={item} />)}
            </div>
            <div className="flex flex-col gap-4 animate-marquee-vertical-down mt-16 shrink-0 w-[17rem]">
               {col2.map((item, idx) => <ShowcaseCard key={`col2-${idx}`} item={item} />)}
            </div>
            <div className="flex flex-col gap-4 animate-marquee-vertical-up mt-8 shrink-0 w-[17rem]">
               {col3.map((item, idx) => <ShowcaseCard key={`col3-${idx}`} item={item} />)}
            </div>
         </div>

         <div className="absolute bottom-14 right-14 text-right z-10 max-w-md">
            <h2 className="text-4xl font-bold text-txt-primary tracking-tight leading-tight mb-3">
               프로젝트를 올리고,<br/>
               <span className="text-txt-tertiary">팀을 만들어보세요.</span>
            </h2>
            <div className="flex justify-end gap-2">
               <div className="px-3 py-1.5 bg-surface-card rounded-full border border-border text-[0.6875rem] font-bold shadow-sm">커피챗</div>
               <div className="px-3 py-1.5 bg-surface-card rounded-full border border-border text-[0.6875rem] font-bold shadow-sm">팀빌딩</div>
               <div className="px-3 py-1.5 bg-surface-card rounded-full border border-border text-[0.6875rem] font-bold shadow-sm">함께 만들기</div>
            </div>
         </div>
      </div>
    </div>
  )
}

const PROJECT_ACCENTS = [
  'from-brand/10 to-brand/5',
  'from-status-success-bg to-status-success-bg/50',
  'from-violet-100 to-violet-50',
  'from-amber-100 to-amber-50',
  'from-sky-100 to-sky-50',
]

const ShowcaseCard = ({ item }: { item: ShowcaseItem }) => {
  if (item.type === 'project') {
    const p = item.data
    const accentIdx = p.title.length % PROJECT_ACCENTS.length
    return (
      <div className="w-[17rem] shrink-0 bg-surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className={`h-2.5 bg-gradient-to-r ${PROJECT_ACCENTS[accentIdx]}`} />
        <div className="p-4 pt-3">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 bg-brand-bg border border-brand-border rounded-xl flex items-center justify-center shrink-0">
              <Rocket size={13} className="text-brand" />
            </div>
            <span className="text-[0.5625rem] font-mono font-bold text-status-success-text bg-status-success-bg px-2 py-0.5 rounded-full border border-indicator-online/20">모집중</span>
          </div>
          <h4 className="font-bold text-[0.8125rem] text-txt-primary mb-1">{p.title}</h4>
          <p className="text-[0.6875rem] text-txt-tertiary line-clamp-2 mb-3">{p.desc}</p>
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {p.roles.map(role => (
              <span key={role} className="text-[0.625rem] font-medium text-brand bg-brand-bg px-2 py-0.5 rounded-full border border-brand-border">{role}</span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {p.tags.map(tag => (
              <span key={tag} className="text-[0.5625rem] text-txt-secondary px-2 py-0.5 rounded-full border border-border bg-surface-sunken">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const t = item.data
  return (
    <div className="w-[17rem] shrink-0 bg-surface-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 bg-brand-bg border border-brand-border rounded-full flex items-center justify-center text-sm font-bold text-brand shrink-0">
          {t.initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-[0.8125rem] text-txt-primary">{t.name}</h4>
            {t.status === 'OPEN' && <span className="w-1.5 h-1.5 rounded-full bg-indicator-online shrink-0" />}
          </div>
          <p className="text-[0.6875rem] text-txt-secondary truncate">{t.univ}</p>
        </div>
      </div>
      <p className="text-[0.6875rem] text-txt-tertiary mb-2.5">{t.role}</p>
      <div className="flex items-center gap-1 flex-wrap">
        {t.tags.map(tag => (
          <span key={tag} className="text-[0.5625rem] text-txt-secondary px-2 py-0.5 rounded-full border border-border bg-surface-sunken">{tag}</span>
        ))}
      </div>
    </div>
  )
}
