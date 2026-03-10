'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Command, Mail, Github, Chrome, ArrowRight, Activity, Cpu, Shield, Globe, Zap, Users, Building2, Rocket, AlertCircle, Loader2, MessageCircle } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'

// Data for the Marquee
const showcaseItems = [
  { type: 'startup', title: 'PetPulse', desc: 'AI 펫 헬스케어', tag: 'Series A', color: 'bg-black text-white' },
  { type: 'talent', title: 'Sarah Kim', desc: 'Product Designer (7y+)', tag: 'Open to Work', color: 'bg-white border-gray-200 text-gray-900' },
  { type: 'project', title: 'Deep Learning Ops', desc: 'MLOps 파이프라인 구축', tag: 'Hiring', color: 'bg-blue-600 text-white' },
  { type: 'startup', title: 'Green Cycle', desc: '친환경 패키징 솔루션', tag: 'Seed', color: 'bg-white border-gray-200 text-gray-900' },
  { type: 'talent', title: 'David Lee', desc: 'Full Stack Dev', tag: 'Available', color: 'bg-white border-gray-200 text-gray-900' },
  { type: 'project', title: 'Fintech MVP', desc: '송금 간편화 서비스', tag: 'Team Building', color: 'bg-gray-900 text-white' },
  { type: 'startup', title: 'EduTech Pro', desc: '성인 직무 교육', tag: 'Pre-A', color: 'bg-white border-gray-200 text-gray-900' },
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
  const redirectTo = searchParams.get('redirect') || '/explore'
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
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
  }

  const handleGithubLogin = async () => {
    setError(null)
    const { error } = await signInWithGithub()
    if (error) {
      setError(error.message)
    }
  }

  // 1. Loading Phase (Circular System Boot)
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#FAFAFA] flex flex-col items-center justify-center font-mono">
        <div className="relative w-24 h-24 flex items-center justify-center mb-8">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="2" />
             <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="#000"
                strokeWidth="2"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                className="transition-all duration-200 ease-out"
                strokeLinecap="round"
             />
          </svg>
          <div className="text-xl font-bold tracking-tighter">{progress}%</div>
        </div>
        <div className="text-[10px] text-gray-400 font-medium tracking-widest animate-pulse uppercase">
           Booting Draft OS...
        </div>
      </div>
    )
  }

  // 2. Split Screen Layout
  return (
    <div className="fixed inset-0 z-[100] flex h-screen w-screen overflow-hidden bg-white">

      {/* LEFT: Login Panel (Fixed Width) */}
      <div className="w-full lg:w-[480px] xl:w-[560px] flex flex-col justify-between bg-white z-20 shadow-2xl shrink-0 h-full relative border-r border-gray-100">

         {/* Top Branding */}
         <div className="p-8 md:p-12 animate-slide-up-fade">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg rounded-sm">D</div>
               <span className="font-bold text-xl tracking-tight">Draft.</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">System Operational</span>
            </div>
         </div>

         {/* Center Form */}
         <div className="px-8 md:px-12 flex flex-col justify-center animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
               {isSignUp ? 'Create Account' : 'Welcome back, Architect.'}
            </h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
               {isSignUp
                  ? 'Join Draft to build your dream team and find opportunities.'
                  : 'Please enter your credentials to access your projects and network.'}
            </p>

            {error && (
               <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {error}
               </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
               {isSignUp && (
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest">Nickname</label>
                     <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-300"
                        placeholder="Your nickname"
                        required={isSignUp}
                     />
                  </div>
               )}

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest">Work Email</label>
                  <input
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-300 font-mono"
                     placeholder="name@company.com"
                     required
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest">Password</label>
                  <input
                     type="password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-sm text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-300"
                     placeholder="Enter your password"
                     required
                     minLength={6}
                  />
               </div>

               <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-3.5 rounded-sm text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isSubmitting ? (
                     <Loader2 size={16} className="animate-spin" />
                  ) : (
                     <>
                        <span className="font-mono uppercase tracking-wide">
                           {isSignUp ? 'Create Account' : 'Authenticate'}
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
               className="mt-4 text-sm text-gray-500 hover:text-black transition-colors text-center"
            >
               {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            <div className="relative my-8">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
               </div>
               <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400 font-mono text-[10px] uppercase tracking-widest">Or Continue With</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-sm hover:border-black hover:bg-gray-50 transition-all"
               >
                  <Chrome size={16} />
                  <span className="text-xs font-bold text-gray-600">Google</span>
               </button>
               <button
                  onClick={handleGithubLogin}
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-sm hover:border-black hover:bg-gray-50 transition-all"
               >
                  <Github size={16} />
                  <span className="text-xs font-bold text-gray-600">GitHub</span>
               </button>
            </div>
         </div>

         {/* Bottom Footer */}
         <div className="p-8 md:p-12 text-[10px] text-gray-400 font-mono flex justify-between animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            <span>© 2026 DRAFT INC.</span>
            <span className="flex items-center gap-1"><Shield size={10}/> SECURE CONNECTION</span>
         </div>
      </div>

      {/* RIGHT: Infinite Vertical Marquee */}
      <div className="hidden lg:flex flex-1 bg-[#FAFAFA] bg-grid-engineering relative overflow-hidden flex-col justify-center items-center">

         {/* Fade Overlay (Top/Bottom) */}
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FAFAFA] to-transparent z-10 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#FAFAFA] to-transparent z-10 pointer-events-none"></div>

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
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-2">
               Build your team,<br/>
               <span className="text-gray-400">Validate your idea.</span>
            </h2>
            <div className="flex justify-end gap-2">
               <div className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold font-mono shadow-sm">AI MATCHING</div>
               <div className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold font-mono shadow-sm">CONTRACTS</div>
            </div>
         </div>
      </div>

    </div>
  )
}

// Helper Component for Marquee Cards
const ShowcaseCard = ({ item }: { item: typeof showcaseItems[0] }) => (
  <div className={`
    w-[280px] p-6 rounded-sm shadow-sm border border-gray-200/50 flex flex-col justify-between transition-transform hover:scale-[1.02]
    ${item.color}
  `}>
    <div className="flex justify-between items-start mb-4">
       <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.color.includes('bg-black') ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50 text-black'}`}>
          {item.type === 'startup' ? <Rocket size={14}/> : item.type === 'talent' ? <Users size={14}/> : <Zap size={14}/>}
       </div>
       <span className={`text-[9px] font-mono font-bold uppercase border px-1.5 py-0.5 rounded-sm ${item.color.includes('bg-black') ? 'border-gray-700' : 'border-gray-200'}`}>
         {item.tag}
       </span>
    </div>
    <div>
       <h4 className="font-bold text-lg mb-1">{item.title}</h4>
       <p className={`text-xs ${item.color.includes('bg-black') ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
    </div>
  </div>
)
