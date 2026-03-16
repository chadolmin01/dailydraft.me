'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Command, Mail, Github, Chrome, ArrowRight, Activity, Cpu, Shield, Globe, Zap, Users, Building2, Rocket, AlertCircle, Loader2, MessageCircle } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'

// Data for the Marquee
const showcaseItems = [
  { type: 'project', title: '캠퍼스 중고거래', desc: 'React Native 앱 개발', tag: '모집 중', color: 'bg-surface-inverse text-white' },
  { type: 'talent', title: '김민수', desc: '프론트엔드 개발자', tag: 'OPEN', color: 'bg-surface-card border-border-strong text-txt-primary' },
  { type: 'project', title: 'AI 스터디 플래너', desc: 'GPT 기반 학습 도우미', tag: '팀빌딩 중', color: 'bg-[#4F46E5] text-white' },
  { type: 'talent', title: '박지영', desc: 'UI/UX 디자이너', tag: 'OPEN', color: 'bg-surface-card border-border-strong text-txt-primary' },
  { type: 'project', title: '학식 알리미', desc: '대학 식당 메뉴 알림', tag: '런칭 완료', color: 'bg-surface-inverse text-white' },
  { type: 'talent', title: '이준호', desc: '백엔드 개발자', tag: 'OPEN', color: 'bg-surface-card border-border-strong text-txt-primary' },
  { type: 'project', title: '동아리 매칭', desc: '관심사 기반 동아리 추천', tag: '모집 중', color: 'bg-surface-card border-border-strong text-txt-primary' },
]

const showcaseColumn1 = [...showcaseItems, ...showcaseItems, ...showcaseItems]
const showcaseColumn2 = [...showcaseItems.reverse(), ...showcaseItems, ...showcaseItems]

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
          setTimeout(() => setPhase('ready'), 600)
          return 100
        }
        return Math.min(prev + Math.floor(Math.random() * 15) + 5, 100)
      })
    }, 80)

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

  // 1. Loading Phase (Circular System Boot)
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-surface-bg bg-grid-engineering flex flex-col items-center justify-center font-mono">
        <div className="relative w-24 h-24 flex items-center justify-center mb-8">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-default)" strokeWidth="2" />
             <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="3"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                className="transition-all duration-200 ease-out"
                strokeLinecap="square"
             />
          </svg>
          <div className="text-xl font-bold tracking-tighter text-txt-primary">{progress}%</div>
        </div>
        <div className="text-[0.625rem] text-txt-tertiary font-bold tracking-widest animate-pulse uppercase">
           SYSTEM INIT...
        </div>
      </div>
    )
  }

  // 2. Split Screen Layout
  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen overflow-hidden bg-surface-card">

      {/* LEFT: Login Panel (Fixed Width) */}
      <div className="w-full lg:w-[30rem] xl:w-[35rem] flex flex-col justify-between bg-surface-card z-20 shadow-brutal shrink-0 h-full relative border-r-2 border-border-strong">

         {/* Top Branding */}
         <div className="p-5 sm:p-8 md:p-12 animate-slide-up-fade">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 bg-surface-inverse text-txt-inverse flex items-center justify-center font-black text-lg shadow-solid-sm">D</div>
               <span className="font-bold text-xl tracking-tight text-txt-primary">Draft.</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-sunken border border-border-strong">
               <span className="w-2 h-2 bg-status-success-text animate-pulse"></span>
               <span className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">Open Beta</span>
            </div>
         </div>

         {/* Center Form */}
         <div className="px-5 sm:px-8 md:px-12 flex flex-col justify-center animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-txt-primary mb-3 tracking-tight">
               {isSignUp ? '계정 만들기' : '다시 만나서 반가워요!'}
            </h1>
            <p className="text-txt-secondary text-sm mb-10 leading-relaxed">
               {isSignUp
                  ? 'Draft에서 팀을 만들고 프로젝트를 시작하세요.'
                  : '로그인하고 프로젝트와 커피챗을 확인하세요.'}
            </p>

            {error && (
               <div className="mb-4 p-3 bg-status-danger-bg border border-status-danger-text/30 flex items-center gap-2 text-status-danger-text text-sm font-mono">
                  <AlertCircle size={16} />
                  {error}
               </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
               {isSignUp && (
                  <div className="space-y-1.5">
                     <label className="text-[0.625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest">닉네임</label>
                     <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-sunken border-2 border-border-strong text-sm font-medium focus:outline-none focus:border-[#4F46E5] focus:bg-surface-card transition-all placeholder:text-txt-disabled"
                        placeholder="닉네임을 입력하세요"
                        required={isSignUp}
                     />
                  </div>
               )}

               <div className="space-y-1.5">
                  <label className="text-[0.625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest">이메일</label>
                  <input
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full px-4 py-3 bg-surface-sunken border-2 border-border-strong text-sm font-medium focus:outline-none focus:border-[#4F46E5] focus:bg-surface-card transition-all placeholder:text-txt-disabled font-mono"
                     placeholder="email@example.com"
                     required
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[0.625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest">비밀번호</label>
                  <input
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full px-4 py-3 bg-surface-sunken border-2 border-border-strong text-sm font-medium focus:outline-none focus:border-[#4F46E5] focus:bg-surface-card transition-all placeholder:text-txt-disabled"
                     placeholder="비밀번호를 입력하세요"
                     required
                     minLength={6}
                  />
               </div>

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#4F46E5] text-white py-3.5 text-sm font-bold border-2 border-[#4F46E5] hover:bg-[#4338CA] transition-all flex items-center justify-center gap-2 group shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-solid-sm"
               >
                  {isSubmitting ? (
                     <Loader2 size={16} className="animate-spin" />
                  ) : (
                     <>
                        <span className="font-mono uppercase tracking-wide">
                           {isSignUp ? '가입하기' : '로그인'}
                        </span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                     </>
                  )}
               </button>
            </form>

            <button
               onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
               }}
               className="mt-4 text-sm text-txt-tertiary hover:text-txt-primary transition-colors text-center font-mono"
            >
               {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 가입하기'}
            </button>

            <div className="relative my-10">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-border"></div>
               </div>
               <div className="relative flex justify-center text-xs">
                  <span className="bg-surface-card px-2 text-txt-tertiary font-mono text-[0.625rem] font-bold uppercase tracking-widest">소셜 로그인</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-border-strong hover:bg-surface-inverse hover:text-txt-inverse transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
               >
                  <Chrome size={16} />
                  <span className="text-xs font-bold font-mono">Google</span>
               </button>
               <button
                  onClick={handleGithubLogin}
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-border-strong hover:bg-surface-inverse hover:text-txt-inverse transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
               >
                  <Github size={16} />
                  <span className="text-xs font-bold font-mono">GitHub</span>
               </button>
            </div>
         </div>

         {/* Bottom Footer */}
         <div className="p-5 sm:p-8 md:p-12 text-[0.625rem] text-txt-tertiary font-mono font-bold uppercase tracking-widest flex justify-between animate-slide-up-fade border-t border-dashed border-border" style={{ animationDelay: '0.2s' }}>
            <span>© 2026 DRAFT INC.</span>
            <span className="flex items-center gap-1"><Shield size={10}/> SECURE CONNECTION</span>
         </div>
      </div>

      {/* RIGHT: Infinite Vertical Marquee */}
      <div className="hidden lg:flex flex-1 bg-surface-sunken bg-grid-engineering relative overflow-hidden flex-col justify-center items-center">

         {/* Blueprint dimension lines (decorative) */}
         <div className="absolute top-8 left-8 right-8 border-t border-dashed border-border-strong/20 z-10 pointer-events-none">
           <span className="absolute -top-px left-0 w-2 h-2 border-l border-t border-border-strong/30" />
           <span className="absolute -top-px right-0 w-2 h-2 border-r border-t border-border-strong/30" />
         </div>
         <div className="absolute bottom-8 left-8 right-8 border-b border-dashed border-border-strong/20 z-10 pointer-events-none">
           <span className="absolute -bottom-px left-0 w-2 h-2 border-l border-b border-border-strong/30" />
           <span className="absolute -bottom-px right-0 w-2 h-2 border-r border-b border-border-strong/30" />
         </div>

         {/* Blueprint label */}
         <div className="absolute top-4 right-6 z-20 pointer-events-none">
           <span className="text-[0.5rem] font-mono font-bold text-txt-disabled uppercase tracking-[0.2em]">DRAFT // BLUEPRINT v2.0</span>
         </div>

         {/* Fade Overlay (Top/Bottom) */}
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-surface-sunken to-transparent z-10 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-surface-sunken to-transparent z-10 pointer-events-none"></div>

         {/* Marquee Columns Container */}
         <div className="flex gap-6 h-[120vh] -rotate-6 scale-110 opacity-90 grayscale-[20%]">

            {/* Column 1: Moving Up */}
            <div className="flex flex-col gap-6 animate-marquee-vertical-up">
               {showcaseColumn1.map((item, idx) => (
                  <ShowcaseCard key={`col1-${idx}`} item={item} />
               ))}
            </div>

            {/* Column 2: Moving Down */}
            <div className="flex flex-col gap-6 animate-marquee-vertical-down mt-20">
               {showcaseColumn2.map((item, idx) => (
                  <ShowcaseCard key={`col2-${idx}`} item={item} />
               ))}
            </div>
         </div>

         {/* Slogan Overlay */}
         <div className="absolute bottom-12 right-12 text-right z-10 max-w-md">
            <h2 className="text-4xl font-bold text-txt-primary tracking-tight leading-tight mb-2">
               프로젝트를 올리고,<br/>
               <span className="text-txt-tertiary">팀을 만들어보세요.</span>
            </h2>
            <div className="flex justify-end gap-2">
               <div className="px-3 py-1 bg-surface-card border border-border-strong text-[0.625rem] font-bold font-mono shadow-solid-sm">커피챗</div>
               <div className="px-3 py-1 bg-surface-card border border-border-strong text-[0.625rem] font-bold font-mono shadow-solid-sm">팀빌딩</div>
            </div>
         </div>
      </div>

    </div>
  )
}

// Helper Component for Marquee Cards
const ShowcaseCard = ({ item }: { item: typeof showcaseItems[0] }) => (
  <div className={`
    w-[17.5rem] p-6 border border-border-strong shadow-sharp flex flex-col justify-between transition-transform hover:scale-[1.02] relative
    ${item.color}
  `}>
    {/* Corner marks */}
    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 pointer-events-none" />
    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-30 pointer-events-none" />
    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-30 pointer-events-none" />
    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 pointer-events-none" />
    <div className="flex justify-between items-start mb-4">
       <div className={`w-8 h-8 flex items-center justify-center border ${item.color.includes('bg-surface-inverse') ? 'border-white/30 bg-white/10' : item.color.includes('bg-[#4F46E5]') ? 'border-white/30 bg-white/10' : 'border-border-strong bg-surface-sunken text-txt-primary'}`}>
          {item.type === 'startup' ? <Rocket size={14}/> : item.type === 'talent' ? <Users size={14}/> : <Zap size={14}/>}
       </div>
       <span className={`text-[0.5625rem] font-mono font-bold uppercase border px-1.5 py-0.5 ${item.color.includes('bg-surface-inverse') ? 'border-white/30' : item.color.includes('bg-[#4F46E5]') ? 'border-white/30' : 'border-border-strong'}`}>
         {item.tag}
       </span>
    </div>
    <div>
       <h4 className="font-bold text-lg mb-1">{item.title}</h4>
       <p className={`text-xs font-mono ${item.color.includes('bg-surface-inverse') ? 'text-txt-disabled' : item.color.includes('bg-[#4F46E5]') ? 'text-white/70' : 'text-txt-secondary'}`}>{item.desc}</p>
    </div>
  </div>
)
