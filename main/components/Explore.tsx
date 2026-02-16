'use client'

import React, { useState } from 'react'
import { Search, Filter, ArrowRight, Code, Zap, Users, Star, Rocket, LayoutGrid, Loader2 } from 'lucide-react'
import { Card } from './ui/Card'

const featuredItems = [
  {
    id: 'f1',
    title: 'Project Alpha',
    subtitle: '법률 상담 자동화 솔루션 팀 빌딩',
    image: 'bg-gray-900',
    tags: ['CO-FOUNDER', 'AI ENGINEER'],
    type: 'PROJECT'
  },
  {
    id: 'f2',
    title: 'Stealth Fintech',
    subtitle: '시리즈 A 투자 유치 완료',
    image: 'bg-draft-blue',
    tags: ['HIRING', 'BACKEND'],
    type: 'STARTUP'
  },
  {
    id: 'f3',
    title: 'Deep Health',
    subtitle: '수면 데이터 분석 AI',
    image: 'bg-gray-800',
    tags: ['SEED', 'DATA SCIENTIST'],
    type: 'PROJECT'
  }
]

const marqueeItems = [...featuredItems, ...featuredItems, ...featuredItems, ...featuredItems]

const projects = [
  {
    id: '1',
    title: 'Pet Care Platform',
    desc: '반려동물 건강 데이터를 분석하는 모바일 앱 MVP 제작 중입니다.',
    role: 'UX/UI Designer',
    stack: ['Figma', 'React Native'],
    members: 3
  },
  {
    id: '2',
    title: 'EduTech Math Tutor',
    desc: '수학 문제 풀이 AI 튜터 서비스. 초기 알고리즘 개발자 찾습니다.',
    role: 'AI Researcher',
    stack: ['Python', 'PyTorch'],
    members: 2
  },
  {
    id: '3',
    title: 'Sustainable Fashion',
    desc: '친환경 의류 리세일 플랫폼. 마케팅 전략을 함께 짤 CMO 구인.',
    role: 'Co-founder',
    stack: ['Growth', 'Brand'],
    members: 4
  },
  {
    id: '4',
    title: 'Local Community DAO',
    desc: '지역 기반 커뮤니티 DAO 프로젝트. 스마트 컨트랙트 개발자 모집.',
    role: 'Blockchain Dev',
    stack: ['Solidity', 'Web3'],
    members: 5
  }
]

const talents = [
  {
    id: 't1', name: 'Sarah Kim', role: 'Product Designer', exp: '5y+', tags: ['Figma', 'Protopie'], status: 'OPEN'
  },
  {
    id: 't2', name: 'David Lee', role: 'Full Stack Dev', exp: '3y', tags: ['React', 'Node.js'], status: 'BUSY'
  },
  {
    id: 't3', name: 'Elena Park', role: 'Growth Marketer', exp: '7y+', tags: ['GA4', 'SEO'], status: 'ADVISOR'
  },
  {
    id: 't4', name: 'Minu Jung', role: 'Flutter Dev', exp: '2y', tags: ['Mobile', 'Dart'], status: 'OPEN'
  }
]

export const Explore: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All')

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering">
       <div className="max-w-[1600px] mx-auto p-8 lg:p-12 space-y-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-200 pb-6">
             <div>
                <div className="text-xs font-mono text-gray-500 mb-2 flex items-center gap-2">
                   <span className="w-2 h-2 bg-black rounded-sm"></span>
                   MARKETPLACE
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Explore</h1>
             </div>

             <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                   </div>
                   <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black text-sm transition-all"
                      placeholder="Search projects, talent..."
                   />
                </div>
                <button className="bg-white border border-gray-200 text-black px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-sm transition-colors">
                   <Filter size={16} />
                </button>
             </div>
          </div>

          {/* Featured Marquee */}
          <div className="relative w-full overflow-hidden group">
             <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FAFAFA] to-transparent z-10 pointer-events-none"></div>
             <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FAFAFA] to-transparent z-10 pointer-events-none"></div>

             <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] w-max py-2">
                {marqueeItems.map((item, index) => (
                   <div key={`${item.id}-${index}`} className={`
                      relative overflow-hidden rounded-2xl p-6 h-64 w-[450px] flex flex-col justify-between shrink-0 cursor-pointer shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300
                      ${item.image}
                   `}>
                      <div className="flex justify-between items-start z-10">
                         <span className="text-[10px] font-mono font-bold text-white border border-white/30 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm">
                            {item.type}
                         </span>
                         <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                           <ArrowRight className="text-white" size={16} />
                         </div>
                      </div>

                      <div className="relative z-10 text-white">
                         <h3 className="text-2xl font-bold mb-2 tracking-tight truncate">{item.title}</h3>
                         <p className="text-white/80 text-sm mb-4 font-light truncate">{item.subtitle}</p>
                         <div className="flex items-center gap-2 flex-wrap">
                            {item.tags.map(tag => (
                               <span key={tag} className="text-[10px] font-mono text-black bg-white px-2 py-1 rounded-sm font-bold">
                                  {tag}
                               </span>
                            ))}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1 border-b border-gray-200">
             {['All', 'Projects', 'Startups', 'Talent'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-bold font-mono transition-colors uppercase border-b-2
                     ${activeTab === tab
                        ? 'text-black border-black'
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                     }
                  `}
                >
                   {tab}
                </button>
             ))}
          </div>

          {/* Projects Grid */}
          <section>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   <LayoutGrid size={18} /> Trending Projects
                </h2>
                <button className="text-xs font-mono text-gray-500 hover:text-black transition-colors flex items-center gap-1 border-b border-gray-300 pb-0.5 hover:border-black">
                   VIEW ALL <ArrowRight size={12}/>
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projects.map((p) => (
                   <Card key={p.id} className="group h-full flex flex-col hover:-translate-y-1" padding="p-6">
                      <div className="flex justify-between items-start mb-4">
                         <div className="w-10 h-10 rounded-sm bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-black group-hover:text-white transition-colors">
                            <Zap size={20} />
                         </div>
                         <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">
                            {p.members} MEMBERS
                         </span>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-draft-blue transition-colors truncate">{p.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-1 line-clamp-2 break-keep">
                         {p.desc}
                      </p>

                      <div className="pt-4 border-t border-gray-100 mt-auto">
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-mono text-gray-400 uppercase">Need</span>
                            <span className="text-xs font-bold text-gray-900">{p.role}</span>
                         </div>
                         <div className="flex flex-wrap gap-1">
                            {p.stack.map(s => (
                               <span key={s} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm">
                                  {s}
                               </span>
                            ))}
                         </div>
                      </div>
                   </Card>
                ))}
             </div>
          </section>

          {/* Talent Grid */}
          <section>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   <Users size={18} /> Top Talent
                </h2>
                <button className="text-xs font-mono text-gray-500 hover:text-black transition-colors flex items-center gap-1 border-b border-gray-300 pb-0.5 hover:border-black">
                   VIEW ALL <ArrowRight size={12}/>
                </button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {talents.map((t) => (
                   <Card key={t.id} className="group hover:border-black" padding="p-5">
                      <div className="flex items-center gap-4 mb-5">
                         <div className="w-12 h-12 bg-gray-100 rounded-sm border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                            {t.name.substring(0,2)}
                         </div>
                         <div>
                            <h3 className="font-bold text-sm text-gray-900">{t.name}</h3>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{t.role}</p>
                         </div>
                      </div>

                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                         <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Status</span>
                         <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                            t.status === 'OPEN' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                         }`}>
                            {t.status}
                         </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                         {t.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded-sm border border-gray-100">
                               {tag}
                            </span>
                         ))}
                      </div>
                   </Card>
                ))}
             </div>
          </section>

          {/* Banner */}
          <section className="bg-black text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>

             <div className="relative z-10 flex items-center gap-4 md:gap-6 w-full md:w-auto">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shrink-0">
                   <Rocket className="text-white" size={20} />
                </div>
                <div>
                   <h2 className="text-lg md:text-xl font-bold tracking-tight">Ready to build?</h2>
                   <p className="text-gray-400 text-xs md:text-sm font-light mt-0.5">당신의 아이디어를 실현할 최고의 팀을 찾아보세요.</p>
                </div>
             </div>

             <button className="relative z-10 bg-white text-black px-6 py-2.5 text-xs md:text-sm font-bold rounded-full hover:bg-gray-200 transition-colors shadow-sm whitespace-nowrap w-full md:w-auto">
                Start Project
             </button>
          </section>

       </div>
    </div>
  )
}
