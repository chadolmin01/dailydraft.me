'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Github, Chrome, ArrowRight, Shield, Zap, Users, Rocket, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'

// Data for the Marquee
const showcaseItems = [
  { type: 'project', title: '캠퍼스 중고거래', desc: 'React Native 앱 개발', tag: '모집 중', color: 'bg-surface-inverse text-white' },
  { type: 'talent', title: '김민수', desc: '프론트엔드 개발자', tag: 'OPEN', color: 'bg-surface-card text-txt-primary' },
  { type: 'project', title: 'AI 스터디 플래너', desc: 'GPT 기반 학습 도우미', tag: '팀빌딩 중', color: 'bg-brand text-white' },
  { type: 'talent', title: '박지영', desc: 'UI/UX 디자이너', tag: 'OPEN', color: 'bg-surface-card text-txt-primary' },
  { type: 'project', title: '학식 알리미', desc: '대학 식당 메뉴 알림', tag: '런칭 완료', color: 'bg-surface-inverse text-white' },
  { type: 'talent', title: '이준호', desc: '백엔드 개발자', tag: 'OPEN', color: 'bg-surface-card text-txt-primary' },
  { type: 'project', title: '동아리 매칭', desc: '관심사 기반 동아리 추천', tag: '모집 중', color: 'bg-surface-card text-txt-primary' },
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
         <div className="flex gap-5 h-[120vh] -rotate-6 scale-110 opacity-80">

            {/* Column 1: Moving Up */}
            <div className="flex flex-col gap-5 animate-marquee-vertical-up">
               {showcaseColumn1.map((item, idx) => (
                  <ShowcaseCard key={`col1-${idx}`} item={item} />
               ))}
            </div>

            {/* Column 2: Moving Down */}
            <div className="flex flex-col gap-5 animate-marquee-vertical-down mt-20">
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

// Helper Component for Marquee Cards
const ShowcaseCard = ({ item }: { item: typeof showcaseItems[0] }) => (
  <div className={`
    w-[16rem] p-5 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between relative
    ${item.color}
  `}>
    <div className="flex justify-between items-start mb-4">
       <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${
         item.color.includes('bg-surface-inverse') ? 'bg-white/10 border border-white/20' :
         item.color.includes('bg-brand') ? 'bg-white/10 border border-white/20' :
         'bg-surface-sunken border border-border'
       }`}>
          {item.type === 'startup' ? <Rocket size={14}/> : item.type === 'talent' ? <Users size={14}/> : <Zap size={14}/>}
       </div>
       <span className={`text-[0.5625rem] font-semibold px-2 py-0.5 rounded-full ${
         item.color.includes('bg-surface-inverse') ? 'bg-white/15 border border-white/20' :
         item.color.includes('bg-brand') ? 'bg-white/15 border border-white/20' :
         'bg-surface-sunken border border-border'
       }`}>
         {item.tag}
       </span>
    </div>
    <div>
       <h4 className="font-bold text-base mb-0.5">{item.title}</h4>
       <p className={`text-xs ${
         item.color.includes('bg-surface-inverse') ? 'text-white/60' :
         item.color.includes('bg-brand') ? 'text-white/60' :
         'text-txt-tertiary'
       }`}>{item.desc}</p>
    </div>
  </div>
)
