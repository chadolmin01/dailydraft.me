'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Github, Chrome, ArrowRight, Shield, Users, Rocket, AlertCircle, Loader2, Coffee, Eye, Heart, Code, Palette, Megaphone, BarChart3 } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'

// Showcase data — mimics real Explore cards
const projectCards = [
  { title: '캠퍼스 중고거래 앱', desc: '대학생 전용 중고 플랫폼을 함께 만들어요', roles: ['프론트엔드', '디자이너'], tags: ['React Native', 'Firebase'], views: 142, hearts: 23 },
  { title: 'AI 스터디 플래너', desc: 'GPT 기반 학습 도우미로 시험 준비를 효율적으로', roles: ['백엔드', 'AI/ML'], tags: ['Python', 'GPT API'], views: 89, hearts: 15 },
  { title: '학식 알리미', desc: '오늘 뭐 먹지? 대학 식당 메뉴를 한눈에', roles: ['풀스택'], tags: ['Next.js', 'Supabase'], views: 210, hearts: 41 },
  { title: '동아리 매칭 서비스', desc: '관심사 기반으로 딱 맞는 동아리를 추천해드려요', roles: ['기획자', '프론트엔드'], tags: ['SaaS', '에듀테크'], views: 67, hearts: 12 },
  { title: '대학생 포트폴리오', desc: '프로젝트 경험을 정리하고 공유하는 플랫폼', roles: ['디자이너', '백엔드'], tags: ['Figma', 'Node.js'], views: 178, hearts: 35 },
]

const peopleCards = [
  { name: '김민수', initial: '김', role: '프론트엔드 개발자', univ: '서울대 · 컴퓨터공학', tags: ['React', 'TypeScript', 'Next.js'], status: 'OPEN' as const },
  { name: '박지영', initial: '박', role: 'UI/UX 디자이너', univ: '홍익대 · 시각디자인', tags: ['Figma', 'Framer'], status: 'OPEN' as const },
  { name: '이준호', initial: '이', role: '백엔드 개발자', univ: 'KAIST · 전산학', tags: ['Node.js', 'Python', 'AWS'], status: 'OPEN' as const },
  { name: '최서연', initial: '최', role: '마케터 / 기획', univ: '연세대 · 경영학', tags: ['콘텐츠', 'Growth'], status: 'BUSY' as const },
  { name: '정하윤', initial: '정', role: '풀스택 개발자', univ: '고려대 · 소프트웨어', tags: ['Flutter', 'Firebase'], status: 'OPEN' as const },
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

const showcaseColumn1 = [...column1Items, ...column1Items, ...column1Items]
const showcaseColumn2 = [...column2Items, ...column2Items, ...column2Items]

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
        <div className="relative w-20 h-20 flex items-center justify-center mb-6">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-default)" strokeWidth="1.5" opacity="0.3" />
             <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="var(--text-primary)"
                strokeWidth="2.5"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progress) / 100}
                className="transition-all duration-150 ease-out"
                strokeLinecap="round"
             />
          </svg>
          <div className="w-10 h-10 bg-surface-inverse text-txt-inverse flex items-center justify-center font-black text-lg rounded-xl">D</div>
        </div>
        <div className="text-xs text-txt-tertiary font-medium tracking-wide">
           Draft
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
                           className="w-full px-4 py-3 bg-surface-sunken rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled"
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
                        className="w-full px-4 py-3 bg-surface-sunken rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled font-mono"
                        placeholder="email@example.com"
                        required
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[0.6875rem] font-medium text-txt-tertiary">비밀번호</label>
                     <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-sunken rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-surface-card transition-all placeholder:text-txt-disabled"
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
            <div className="mt-8 flex items-center gap-4 text-[0.6875rem] text-txt-disabled">
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
         <div className="flex gap-4 h-[120vh] -rotate-3 scale-105 opacity-85">

            {/* Column 1: Moving Up */}
            <div className="flex flex-col gap-4 animate-marquee-vertical-up">
               {showcaseColumn1.map((item, idx) => (
                  <ShowcaseCard key={`col1-${idx}`} item={item} />
               ))}
            </div>

            {/* Column 2: Moving Down */}
            <div className="flex flex-col gap-4 animate-marquee-vertical-down mt-16">
               {showcaseColumn2.map((item, idx) => (
                  <ShowcaseCard key={`col2-${idx}`} item={item} />
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
               <div className="px-3 py-1.5 bg-surface-card rounded-xl border border-border text-[0.6875rem] font-bold shadow-sm">커피챗</div>
               <div className="px-3 py-1.5 bg-surface-card rounded-xl border border-border text-[0.6875rem] font-bold shadow-sm">팀빌딩</div>
               <div className="px-3 py-1.5 bg-surface-card rounded-xl border border-border text-[0.6875rem] font-bold shadow-sm">사이드 프로젝트</div>
            </div>
         </div>
      </div>

    </div>
  )
}

// Role icon map
const ROLE_ICONS: Record<string, React.ElementType> = {
  '프론트엔드': Code, '백엔드': Code, '풀스택': Code, 'AI/ML': BarChart3,
  '디자이너': Palette, '기획자': BarChart3, '마케터': Megaphone,
}

// Showcase Cards — mimics real Explore UI
const ShowcaseCard = ({ item }: { item: ShowcaseItem }) => {
  if (item.type === 'project') {
    const p = item.data
    return (
      <div className="w-[17rem] bg-surface-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
        {/* Cover */}
        <div className="h-20 bg-surface-inverse relative flex items-end p-3">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
          <div className="absolute top-2 left-2 z-[1]">
            <span className="text-[0.5625rem] font-mono font-bold bg-indicator-online text-white px-1.5 py-0.5 flex items-center gap-1">
              <span className="w-1 h-1 bg-white animate-pulse" /> 모집중
            </span>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 z-[1]">
            {p.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[0.5rem] font-mono bg-black/50 text-white px-1.5 py-0.5">{tag}</span>
            ))}
          </div>
          <div className="relative z-[1] w-7 h-7 bg-surface-card flex items-center justify-center border border-border">
            <Rocket size={12} className="text-txt-primary" />
          </div>
        </div>
        {/* Body */}
        <div className="px-3 pt-2.5 pb-2">
          <h4 className="font-bold text-sm text-txt-primary truncate">{p.title}</h4>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[0.5rem] font-medium text-brand bg-brand-bg px-1 py-px border border-brand-border">NEED</span>
            {p.roles.map(role => (
              <span key={role} className="text-[0.625rem] text-txt-secondary px-1 py-px border border-border">{role}</span>
            ))}
          </div>
          <p className="text-[0.6875rem] text-txt-tertiary mt-1.5 line-clamp-1">{p.desc}</p>
        </div>
        {/* Footer */}
        <div className="px-3 pb-2.5 mt-auto">
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-[0.5625rem] font-mono text-txt-disabled">팀 모집중</span>
            <div className="flex items-center gap-2 text-[0.625rem] font-mono">
              <span className="flex items-center gap-0.5 text-txt-secondary"><Eye size={9} />{p.views}</span>
              <span className="flex items-center gap-0.5 text-status-danger-text/70"><Heart size={9} fill="currentColor" />{p.hearts}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // People card
  const t = item.data
  return (
    <div className="w-[17rem] bg-surface-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
      <div className="px-3 pt-3 pb-2">
        <div className="flex gap-2.5">
          <div className="w-9 h-9 bg-brand-bg border border-brand-border rounded-full flex items-center justify-center text-sm font-bold text-brand shrink-0">
            {t.initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-sm text-txt-primary truncate">{t.name}</h4>
              <span className={`text-[0.5rem] font-mono font-bold px-1 py-px border ${
                t.status === 'OPEN' ? 'bg-status-success-bg text-status-success-text border-indicator-online/20'
                : 'bg-status-neutral-bg text-status-neutral-text border-border'
              }`}>{t.status}</span>
            </div>
            <p className="text-[0.6875rem] text-txt-secondary truncate">{t.univ}</p>
          </div>
        </div>
      </div>
      <div className="px-3 pb-1">
        <div className="flex items-center gap-1 overflow-hidden">
          {t.tags.map(tag => (
            <span key={tag} className="text-[0.5625rem] text-txt-secondary px-1.5 py-px border border-border shrink-0">{tag}</span>
          ))}
        </div>
      </div>
      <div className="px-3 pb-2.5 mt-1">
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[0.5625rem] font-mono text-txt-disabled">{t.role}</span>
          {t.status === 'OPEN' ? (
            <span className="text-[0.5625rem] font-mono text-indicator-online flex items-center gap-0.5 bg-status-success-bg px-1 py-px border border-indicator-online/20"><Coffee size={8} /> AVAILABLE</span>
          ) : (
            <span className="text-[0.5625rem] font-mono text-txt-tertiary bg-surface-sunken px-1 py-px border border-border">BUSY</span>
          )}
        </div>
      </div>
    </div>
  )
}
