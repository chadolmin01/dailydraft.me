'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Github, Chrome, ArrowRight, Shield, Users, Rocket, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'

// Showcase data — decorative cards for login page marquee
const projectCards = [
  { title: '사이드 프로젝트', desc: '함께 만들어갈 팀원을 찾고 있어요', roles: ['프론트엔드', '디자이너'], tags: ['React', 'Figma'] },
  { title: 'AI 프로젝트', desc: 'AI 기반 서비스를 함께 만들어요', roles: ['백엔드', 'AI/ML'], tags: ['Python', 'LLM'] },
  { title: '앱 개발', desc: '모바일 앱을 함께 개발할 팀원 모집', roles: ['풀스택'], tags: ['Next.js', 'Supabase'] },
  { title: '스터디 그룹', desc: '함께 공부하고 성장해요', roles: ['기획자', '프론트엔드'], tags: ['스터디', '개발'] },
  { title: '포트폴리오 프로젝트', desc: '프로젝트 경험을 함께 쌓아요', roles: ['디자이너', '백엔드'], tags: ['Figma', 'Node.js'] },
]

const peopleCards = [
  { name: '프론트엔드', initial: 'F', role: '프론트엔드 개발자', univ: '개발', tags: ['React', 'TypeScript', 'Next.js'], status: 'OPEN' as const },
  { name: '디자이너', initial: 'D', role: 'UI/UX 디자이너', univ: '디자인', tags: ['Figma', 'Framer'], status: 'OPEN' as const },
  { name: '백엔드', initial: 'B', role: '백엔드 개발자', univ: '개발', tags: ['Node.js', 'Python', 'AWS'], status: 'OPEN' as const },
  { name: '기획자', initial: 'P', role: '마케터 / 기획', univ: '기획', tags: ['콘텐츠', 'Growth'], status: 'BUSY' as const },
  { name: '풀스택', initial: 'S', role: '풀스택 개발자', univ: '개발', tags: ['Flutter', 'Firebase'], status: 'OPEN' as const },
]

type ShowcaseItem = { type: 'project'; data: typeof projectCards[0] } | { type: 'people'; data: typeof peopleCards[0] }

const column1Items: ShowcaseItem[] = [
  { type: 'project', data: projectCards[0] },
  { type: 'people', data: peopleCards[0] },
  { type: 'project', data: projectCards[1] },
  { type: 'people', data: peopleCards[1] },
  { type: 'project', data: projectCards[2] },
  { type: 'people', data: peopleCards[2] },
  { type: 'project', data: projectCards[3] },
]
const column2Items: ShowcaseItem[] = [
  { type: 'people', data: peopleCards[3] },
  { type: 'project', data: projectCards[4] },
  { type: 'people', data: peopleCards[4] },
  { type: 'project', data: projectCards[0] },
  { type: 'people', data: peopleCards[0] },
  { type: 'project', data: projectCards[2] },
  { type: 'people', data: peopleCards[1] },
]
const column3Items: ShowcaseItem[] = [
  { type: 'project', data: projectCards[2] },
  { type: 'people', data: peopleCards[1] },
  { type: 'project', data: projectCards[4] },
  { type: 'people', data: peopleCards[3] },
  { type: 'project', data: projectCards[1] },
  { type: 'people', data: peopleCards[4] },
  { type: 'project', data: projectCards[3] },
]

const showcaseColumn1 = [...column1Items, ...column1Items, ...column1Items]
const showcaseColumn2 = [...column2Items, ...column2Items, ...column2Items]
const showcaseColumn3 = [...column3Items, ...column3Items, ...column3Items]

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const { signIn, signUp, signInWithGoogle, signInWithGithub, isAuthenticated, isLoading: authLoading, profile } = useAuth()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || '/explore'
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/explore'
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')
  const [progress, setProgress] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [authLoading, isAuthenticated, profile, router])

  // Initial System Boot Sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => setPhase('ready'), 400)
          return 100
        }
        return Math.min(prev + Math.floor(Math.random() * 18) + 8, 100)
      })
    }, 60)

    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        if (!nickname.trim()) {
          setError('닉네임을 입력해주세요.')
          setIsSubmitting(false)
          return
        }
        const { error } = await signUp(email, password, nickname)
        if (error) {
          setError(error.message)
        } else {
          router.push(redirectTo)
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          router.push(redirectTo)
        }
      }
    } catch {
      setError('인증 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    try {
      const { error } = await signInWithGoogle()
      if (error) setError(error.message)
    } catch {
      setError('Google 로그인 중 오류가 발생했습니다.')
    }
  }

  const handleGithubLogin = async () => {
    setError(null)
    try {
      const { error } = await signInWithGithub()
      if (error) setError(error.message)
    } catch {
      setError('GitHub 로그인 중 오류가 발생했습니다.')
    }
  }

  // 1. Loading Phase
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-surface-bg flex flex-col items-center justify-center">
        <div
          className="w-12 h-12 bg-surface-inverse rounded-2xl flex items-center justify-center mb-8"
          style={{ animation: 'dcto-logo 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <span className="text-white text-lg font-black">D</span>
        </div>

        <div className="w-48 mb-4" style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '200ms' }}>
          <div className="h-1 bg-surface-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-surface-inverse rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-txt-disabled" style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '400ms' }}>
          <span>DRAFT</span>
          <span className="text-txt-tertiary">{progress}%</span>
        </div>
      </div>
    )
  }

  // 2. Split Screen Layout
  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen overflow-hidden bg-surface-bg">

      {/* LEFT: Login Panel */}
      <div className="w-full lg:w-[30rem] xl:w-[34rem] flex flex-col bg-surface-card z-20 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.08)] shrink-0 h-full relative">

         {/* Top Branding */}
         <div className="p-5 sm:p-8 md:p-10 animate-slide-up-fade">
            <div className="flex items-center gap-2.5">
               <div className="w-9 h-9 bg-surface-inverse text-txt-inverse flex items-center justify-center font-black text-lg rounded-xl shadow-sm">D</div>
               <span className="font-bold text-xl tracking-tight text-txt-primary">Draft.</span>
               <span className="ml-2 text-[0.5625rem] font-medium text-txt-disabled bg-surface-sunken px-2 py-0.5 rounded-full border border-border">Beta</span>
            </div>
         </div>

         {/* Center Form */}
         <div className="flex-1 px-5 sm:px-8 md:px-10 flex flex-col justify-center animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-txt-primary mb-2 tracking-tight">
               {isSignUp ? '계정 만들기' : '다시 만나서 반가워요!'}
            </h1>
            <p className="text-txt-secondary text-sm mb-8 leading-relaxed">
               {isSignUp
                  ? 'Draft에서 팀을 만들고 프로젝트를 시작하세요.'
                  : '로그인하고 프로젝트와 커피챗을 확인하세요.'}
            </p>

            {error && (
               <div className="mb-5 p-3 bg-status-danger-bg rounded-xl border border-status-danger-text/20 flex items-center gap-2 text-status-danger-text text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
               </div>
            )}

            {/* Social Login — Primary */}
            <div className="space-y-3 mb-6">
               <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-surface-card rounded-xl border border-border text-sm font-semibold text-txt-primary hover:bg-surface-sunken hover:border-border hover:shadow-sm active:scale-[0.98] transition-all"
               >
                  <Chrome size={18} />
                  Google로 계속하기
               </button>
               <button
                  onClick={handleGithubLogin}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-surface-inverse rounded-xl text-sm font-semibold text-txt-inverse hover:opacity-90 active:scale-[0.98] transition-all"
               >
                  <Github size={18} />
                  GitHub로 계속하기
               </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
               </div>
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

            {/* Email Form — Secondary (collapsible) */}
            {showEmailForm && (
               <form onSubmit={handleLogin} className="space-y-4 animate-slide-up-fade">
                  {isSignUp && (
                     <div className="space-y-1.5">
                        <label className="text-[0.6875rem] font-medium text-txt-tertiary">닉네임</label>
                        <input
                           type="text"
                           value={nickname}
                           onChange={(e) => setNickname(e.target.value)}
                           className="w-full px-4 py-3 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled"
                           placeholder="닉네임을 입력하세요"
                           required={isSignUp}
                        />
                     </div>
                  )}

                  <div className="space-y-1.5">
                     <label className="text-[0.6875rem] font-medium text-txt-tertiary">이메일</label>
                     <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled font-mono"
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
                        className="w-full px-4 py-3 bg-surface-sunken rounded-xl border border-border text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled"
                        placeholder="비밀번호를 입력하세요"
                        required
                        minLength={6}
                     />
                  </div>

                  <button
                     type="submit"
                     disabled={isSubmitting}
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
                     onClick={() => {
                        setIsSignUp(!isSignUp)
                        setError(null)
                     }}
                     className="w-full text-[0.8125rem] text-txt-tertiary hover:text-txt-primary transition-colors text-center py-1"
                  >
                     {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 가입하기'}
                  </button>
               </form>
            )}

            {/* Trust Signals */}
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-4 text-[0.6875rem] text-txt-disabled">
               <span className="flex items-center gap-1"><Users size={12} /> 대학생 커뮤니티</span>
               <span className="w-px h-3 bg-border" />
               <span className="flex items-center gap-1"><Rocket size={12} /> 프로젝트 매칭</span>
               <span className="w-px h-3 bg-border" />
               <span className="flex items-center gap-1"><Shield size={12} /> 안전한 인증</span>
            </div>
         </div>

         {/* Bottom Footer */}
         <div className="p-5 sm:p-8 md:p-10 text-[0.625rem] text-txt-disabled font-medium flex justify-between animate-slide-up-fade border-t border-border/50" style={{ animationDelay: '0.2s' }}>
            <span>&copy; 2026 DRAFT</span>
            <span className="flex items-center gap-1"><Shield size={10} /> SECURE CONNECTION</span>
         </div>
      </div>

      {/* RIGHT: Infinite Vertical Marquee */}
      <div className="hidden lg:flex flex-1 bg-surface-sunken relative overflow-hidden flex-col justify-center items-center">

         {/* Subtle grid background */}
         <div className="absolute inset-0 bg-grid-engineering opacity-50" />

         {/* Fade Overlay (Top/Bottom) */}
         <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-surface-sunken to-transparent z-10 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-surface-sunken to-transparent z-10 pointer-events-none" />

         {/* Marquee Columns Container */}
         <div className="flex gap-4 h-[120vh] -rotate-3 scale-105 opacity-80 shrink-0">

            {/* Column 1: Moving Up */}
            <div className="flex flex-col gap-4 animate-marquee-vertical-up shrink-0 w-[17rem]">
               {showcaseColumn1.map((item, idx) => (
                  <ShowcaseCard key={`col1-${idx}`} item={item} />
               ))}
            </div>

            {/* Column 2: Moving Down */}
            <div className="flex flex-col gap-4 animate-marquee-vertical-down mt-16 shrink-0 w-[17rem]">
               {showcaseColumn2.map((item, idx) => (
                  <ShowcaseCard key={`col2-${idx}`} item={item} />
               ))}
            </div>

            {/* Column 3: Moving Up */}
            <div className="flex flex-col gap-4 animate-marquee-vertical-up mt-8 shrink-0 w-[17rem]">
               {showcaseColumn3.map((item, idx) => (
                  <ShowcaseCard key={`col3-${idx}`} item={item} />
               ))}
            </div>
         </div>

         {/* Slogan Overlay */}
         <div className="absolute bottom-14 right-14 text-right z-10 max-w-md">
            <h2 className="text-4xl font-bold text-txt-primary tracking-tight leading-tight mb-3">
               프로젝트를 올리고,<br/>
               <span className="text-txt-tertiary">팀을 만들어보세요.</span>
            </h2>
            <div className="flex justify-end gap-2">
               <div className="px-3 py-1.5 bg-surface-card rounded-full border border-border text-[0.6875rem] font-bold shadow-sm">커피챗</div>
               <div className="px-3 py-1.5 bg-surface-card rounded-full border border-border text-[0.6875rem] font-bold shadow-sm">팀빌딩</div>
               <div className="px-3 py-1.5 bg-surface-card rounded-full border border-border text-[0.6875rem] font-bold shadow-sm">사이드 프로젝트</div>
            </div>
         </div>
      </div>

    </div>
  )
}

// Accent colors for project cards
const PROJECT_ACCENTS = [
  'from-brand/10 to-brand/5',
  'from-status-success-bg to-status-success-bg/50',
  'from-violet-100 to-violet-50',
  'from-amber-100 to-amber-50',
  'from-sky-100 to-sky-50',
]

// Showcase Cards — clean decorative cards with subtle color accents
const ShowcaseCard = ({ item }: { item: ShowcaseItem }) => {
  if (item.type === 'project') {
    const p = item.data
    const accentIdx = p.title.length % PROJECT_ACCENTS.length
    return (
      <div className="w-[17rem] shrink-0 bg-surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Subtle gradient accent header */}
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

  // People card
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
            {t.status === 'OPEN' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indicator-online shrink-0" />
            )}
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
