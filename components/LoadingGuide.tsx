'use client'

import React, { useEffect, useState } from 'react'
import { Search, MessageSquare, BarChart3, Zap } from 'lucide-react'

interface LoadingGuideProps {
  onComplete: () => void
}

const TIPS = [
  {
    id: 1,
    icon: Search,
    title: "Explore Feed",
    desc: "피드에서 관심 분야 프로젝트를 찾고, 마음에 드는 팀에 합류해보세요."
  },
  {
    id: 2,
    icon: MessageSquare,
    title: "Coffee Chat",
    desc: "프로필에서 커피챗을 열어 다른 창업자와 1:1로 만나보세요."
  },
  {
    id: 3,
    icon: BarChart3,
    title: "Start a Project",
    desc: "나만의 프로젝트를 등록하고 함께할 팀원을 모집해보세요."
  }
]

export const LoadingGuide: React.FC<LoadingGuideProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [statusText, setStatusText] = useState("Initializing System...")

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }

        const next = prev + 1

        if (next === 30) {
            setCurrentTipIndex(1)
            setStatusText("Analyzing Profile Data...")
        }
        if (next === 70) {
            setCurrentTipIndex(2)
            setStatusText("Syncing Market Trends...")
        }
        if (next === 90) {
            setStatusText("Finalizing Dashboard...")
        }

        return next
      })
    }, 40)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (progress === 100) {
      setTimeout(onComplete, 500)
    }
  }, [progress, onComplete])

  const CurrentIcon = TIPS[currentTipIndex].icon

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAFA] bg-grid-engineering flex flex-col items-center justify-center font-sans p-6">

      <div className="w-full max-w-md relative">
         <div className="bg-surface-card border border-border-strong shadow-brutal overflow-hidden relative z-10 animate-slide-up-fade">

            <div className="h-32 bg-surface-inverse relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

                <div className="relative z-10 w-16 h-16 bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                   <Zap size={32} className="text-white fill-white animate-pulse" />
                </div>

                <div className="absolute top-4 left-10 w-1 h-1 bg-blue-500 animate-ping"></div>
                <div className="absolute bottom-4 right-10 w-1.5 h-1.5 bg-green-500 animate-pulse"></div>
            </div>

            <div className="p-8">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-mono font-bold text-draft-blue uppercase animate-pulse">{statusText}</span>
                  <span className="text-3xl font-bold font-mono text-txt-primary leading-none">{progress}%</span>
               </div>

               <div className="w-full h-1.5 bg-surface-sunken overflow-hidden mb-8">
                  <div
                    className="h-full bg-black transition-all duration-100 ease-linear relative"
                    style={{ width: `${progress}%` }}
                  >
                     <div className="absolute inset-0 bg-white/20 animate-[marquee_1s_linear_infinite]"></div>
                  </div>
               </div>

               <div className="border-t border-dashed border-border pt-6">
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 bg-surface-sunken border border-border-strong flex items-center justify-center shrink-0">
                        <CurrentIcon size={20} className="text-txt-tertiary" />
                     </div>
                     <div className="flex-1 animate-in fade-in slide-in-from-right-2 duration-300" key={currentTipIndex}>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[0.625rem] font-bold bg-black text-white px-1.5 py-0.5 font-mono">TIP</span>
                           <h3 className="font-bold text-sm text-txt-primary">{TIPS[currentTipIndex].title}</h3>
                        </div>
                        <p className="text-xs text-txt-disabled leading-relaxed break-keep">
                           {TIPS[currentTipIndex].desc}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-surface-sunken px-4 py-2 border-t border-border-strong flex justify-between items-center text-[0.5625rem] font-mono text-txt-disabled">
               <span>DRAFT OS v2.4.0</span>
               <span className="flex items-center gap-1">LOADING RESOURCES <span className="animate-spin">/</span></span>
            </div>
         </div>

         <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-2xl -z-10"></div>
      </div>
    </div>
  )
}
