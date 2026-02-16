'use client'

import React from 'react'
import { Bot, FileText, Share2, ArrowUpRight, Cpu, Network } from 'lucide-react'

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 md:px-12 bg-white border-t border-gray-100 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
                <h2 className="text-3xl font-bold mb-2 tracking-tight">시스템 모듈</h2>
                <p className="text-gray-500">사이드 프로젝트부터 MVP까지, 빌더를 위한 모든 도구.</p>
            </div>
            <div className="flex gap-2">
                <span className="px-3 py-1 border border-gray-300 text-xs font-mono text-gray-600 bg-white">AI MATCHING</span>
                <span className="px-3 py-1 border border-gray-300 text-xs font-mono text-gray-600 bg-white">TEAM GUIDE</span>
                <span className="px-3 py-1 border border-gray-300 text-xs font-mono text-gray-600 bg-white">NETWORK</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: AI Assistant */}
          <div className="group border border-gray-200 p-8 bg-white hover:border-black transition-all duration-300 relative overflow-hidden">
            {/* Background schematic lines */}
            <div className="absolute top-0 right-0 w-24 h-24 border-l border-b border-gray-100 -mr-4 -mt-4 transform rotate-45 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <ArrowUpRight size={20} className="text-black" />
            </div>
            <div className="w-12 h-12 bg-black flex items-center justify-center mb-6 border border-black shadow-sm">
              <Bot className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">AI 팀 매칭</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 break-keep">
              프로필 데이터를 분석하여 내 프로젝트에 딱 맞는 팀원을 추천해줍니다. 개발자, 디자이너, 기획자 등 상호 보완적인 스킬셋을 가진 멤버를 AI가 찾아드려요.
            </p>
            <div className="bg-gray-50 p-3 border border-gray-200 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
                <div className="flex gap-2 items-center mb-2">
                    <Cpu size={12} className="text-indigo-600" />
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Synergy Analysis</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[92%]"></div>
                </div>
            </div>
          </div>

          {/* Feature 2: Contracts / Docs */}
          <div className="group border border-gray-200 p-8 bg-white hover:border-black transition-all duration-300 relative">
             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <ArrowUpRight size={20} className="text-black" />
            </div>
            <div className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
              <FileText className="text-black" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">팀 협업 가이드</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 break-keep">
              팀 빌딩 초기에 필요한 그라운드 룰, 역할 분담표, 간단한 프로젝트 협약서를 템플릿으로 제공합니다. 어색한 조율 과정을 매끄럽게 시작하세요.
            </p>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs p-2 bg-gray-50 border border-gray-200 group-hover:border-gray-300 transition-colors">
                    <span className="flex items-center gap-2 font-mono"><FileText size={12}/> Team_Charter.pdf</span>
                    <span className="font-mono text-green-600 text-[10px] border border-green-200 px-1 bg-green-50">AGREED</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-gray-50 border border-gray-200 border-dashed">
                     <span className="flex items-center gap-2 font-mono"><FileText size={12}/> Roles_R&R.docx</span>
                     <span className="font-mono text-gray-400 text-[10px] px-1">DRAFT</span>
                </div>
            </div>
          </div>

          {/* Feature 3: Network */}
          <div className="group border border-gray-200 p-8 bg-white hover:border-black transition-all duration-300 md:col-span-2 lg:col-span-1 relative">
             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <ArrowUpRight size={20} className="text-black" />
            </div>
            <div className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
              <Share2 className="text-black" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">네트워킹 허브</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 break-keep">
              우리 팀에 관심 있는 멘토나 잠재적 동료와의 관계를 시각화하여 관리하세요. 미팅 기록과 피드백 히스토리를 한눈에 파악할 수 있습니다.
            </p>
            <div className="relative h-12 bg-gray-50 border border-gray-200 overflow-hidden flex items-center px-4">
                 <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '8px 8px'}}></div>
                 <Network className="text-gray-300 absolute right-2 bottom-2" size={48} opacity={0.2} />

                 <div className="flex -space-x-2 relative z-10">
                     {[1,2,3,4,5].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-mono text-gray-600 hover:z-20 hover:scale-110 transition-transform cursor-pointer">
                            {String.fromCharCode(64 + i)}
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] border border-white">
                        +12
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
