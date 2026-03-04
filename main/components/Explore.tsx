'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, ArrowRight, Code, Zap, Users, Star, Rocket, LayoutGrid, Loader2, Globe, TrendingUp, Bookmark, Clock, Flame, ChevronRight, Hash, UserCircle, Sparkles } from 'lucide-react'
import { Card } from './ui/Card'
import { StartupIdeaCard } from './StartupIdeaCard'
import { StartupIdeaModal } from './StartupIdeaModal'
import type { StartupIdea, StartupKoreaAnalysis } from '@/src/lib/startups/types'

// Marquee 배경색 순환
const MARQUEE_COLORS = ['bg-gray-900', 'bg-draft-blue', 'bg-gray-800', 'bg-black', 'bg-gray-700']

// 카테고리 데이터
const categories = [
  { id: 'all', label: '전체', icon: LayoutGrid, count: 128 },
  { id: 'ai', label: 'AI / ML', icon: Sparkles, count: 45 },
  { id: 'saas', label: 'SaaS', icon: Code, count: 32 },
  { id: 'fintech', label: 'Fintech', icon: TrendingUp, count: 18 },
  { id: 'health', label: 'Health', icon: Zap, count: 15 },
  { id: 'community', label: 'Community', icon: Users, count: 12 },
]

// 트렌딩 태그
const trendingTags = [
  { tag: 'AI Agent', count: 234 },
  { tag: 'Automation', count: 189 },
  { tag: 'No-Code', count: 156 },
  { tag: 'B2B SaaS', count: 142 },
  { tag: 'Developer Tools', count: 98 },
]

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

interface StartupIdeaWithAnalysis extends StartupIdea {
  korea_deep_analysis: StartupKoreaAnalysis | null
  final_score: number | null
}

export const Explore: React.FC = () => {
  const [topStartupIdeas, setTopStartupIdeas] = useState<StartupIdeaWithAnalysis[]>([])
  const [startupIdeasLoading, setStartupIdeasLoading] = useState(true)
  const [selectedStartup, setSelectedStartup] = useState<StartupIdeaWithAnalysis | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('trending')

  // Fetch top startup ideas (12개)
  useEffect(() => {
    const fetchTopStartupIdeas = async () => {
      try {
        const res = await fetch('/api/startup-ideas?sort=final_score&limit=12&analyzed=true')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setTopStartupIdeas(data.data || [])
      } catch (error) {
        console.error('Failed to fetch startup ideas:', error)
      } finally {
        setStartupIdeasLoading(false)
      }
    }

    fetchTopStartupIdeas()
  }, [])

  // 캐러셀용 상위 6개 (점수 높은 순)
  const carouselIdeas = topStartupIdeas.slice(0, 6)

  // 캐러셀 자동 슬라이드 (4초 멈춤 → 한 칸씩 이동)
  const maxIndex = Math.max(0, carouselIdeas.length - 3)
  useEffect(() => {
    if (carouselIdeas.length <= 3) return
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, 4000)
    return () => clearInterval(timer)
  }, [carouselIdeas.length, maxIndex])

  // Handle open modal
  const handleOpenModal = (id: string) => {
    const startup = topStartupIdeas.find(s => s.id === id)
    if (startup) {
      setSelectedStartup(startup)
    }
  }

  // Handle start building click
  const handleStartBuilding = (id: string) => {
    const startup = topStartupIdeas.find(s => s.id === id) || selectedStartup
    if (!startup) return

    // Navigate to idea validator with context
    const params = new URLSearchParams({
      startupId: startup.id,
      name: startup.name,
    })
    window.location.href = `/idea-validator?${params.toString()}`
  }

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">

        {/* 3-Column Layout */}
        <div className="flex gap-6">

          {/* ========== 좌측 사이드바 ========== */}
          <aside className="hidden lg:block w-[220px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 카테고리 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">카테고리</h3>
                <nav className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <cat.icon size={14} />
                        {cat.label}
                      </span>
                      <span className={`text-xs ${selectedCategory === cat.id ? 'text-gray-300' : 'text-gray-400'}`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* 트렌딩 태그 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Flame size={12} /> 트렌딩 태그
                </h3>
                <div className="space-y-2">
                  {trendingTags.map((item, idx) => (
                    <button
                      key={item.tag}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">#{idx + 1}</span>
                        <Hash size={12} className="text-gray-400" />
                        {item.tag}
                      </span>
                      <span className="text-xs text-gray-400">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 필터 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">필터</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    한국 적합도 70+
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    1000+ Upvotes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    이번 주 신규
                  </label>
                </div>
              </div>

            </div>
          </aside>

          {/* ========== 메인 콘텐츠 ========== */}
          <main className="flex-1 min-w-0 space-y-8">

            {/* 상단 헤더 + 검색 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">탐색</h1>
                <p className="text-sm text-gray-500 mt-1">해외에서 검증된 스타트업 아이디어를 발견하세요</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
                    placeholder="아이디어 검색..."
                  />
                </div>
                <button className="lg:hidden p-2 bg-white border border-gray-200 rounded-lg">
                  <Filter size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* 정렬 탭 */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              {[
                { id: 'trending', label: '트렌딩', icon: Flame },
                { id: 'latest', label: '최신', icon: Clock },
                { id: 'popular', label: '인기', icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSortBy(tab.id as typeof sortBy)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
                    sortBy === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Featured Carousel */}
            {carouselIdeas.length > 0 && (
              <div className="w-full">
                <div className="overflow-hidden rounded-xl">
                  <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${carouselIndex * (100 / 3)}%)` }}
                  >
                    {carouselIdeas.map((startup, index) => {
                      const analysis = startup.korea_deep_analysis
                      const bgColor = MARQUEE_COLORS[index % MARQUEE_COLORS.length]
                      const founderType = analysis?.target_founder_type?.[0] || ''

                      return (
                        <div
                          key={startup.id}
                          className="w-1/3 flex-shrink-0 px-1.5 first:pl-0 last:pr-0"
                        >
                          <div
                            onClick={() => handleOpenModal(startup.id)}
                            className={`
                              relative overflow-hidden rounded-xl p-5 h-52 flex flex-col justify-between cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300
                              ${bgColor}
                            `}
                          >
                            <div className="flex justify-between items-start z-10">
                              <span className="text-[10px] font-mono font-bold text-white border border-white/30 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm uppercase">
                                {startup.source === 'producthunt' ? 'PH' : startup.source}
                              </span>
                              <span className="text-[10px] font-mono text-white/80 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
                                적합도 {analysis?.korea_fit_score || 0}
                              </span>
                            </div>

                            <div className="relative z-10 text-white">
                              <h3 className="text-lg font-bold mb-1.5 tracking-tight truncate">{startup.name}</h3>
                              <p className="text-white/70 text-xs mb-3 line-clamp-2">{analysis?.korean_summary || startup.tagline}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-black bg-white px-2 py-0.5 rounded font-bold">
                                  {startup.upvotes.toLocaleString()} UP
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {carouselIdeas.length > 3 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {Array.from({ length: Math.max(1, carouselIdeas.length - 2) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCarouselIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === carouselIndex ? 'bg-gray-900 w-6' : 'bg-gray-300 w-1.5 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 아이디어 그리드 */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Globe size={16} /> 이번 주 해외 검증 아이디어
                </h2>
                <a
                  href="/startup-ideas"
                  className="text-xs text-gray-500 hover:text-black flex items-center gap-1"
                >
                  전체 보기 <ChevronRight size={14} />
                </a>
              </div>

              {startupIdeasLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              ) : topStartupIdeas.length === 0 ? (
                <Card className="text-center py-12" padding="p-6">
                  <Globe className="mx-auto mb-4 text-gray-300" size={40} />
                  <p className="text-gray-500 text-sm">아직 분석된 아이디어가 없습니다</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topStartupIdeas.slice(0, 8).map((startup) => (
                    <StartupIdeaCard
                      key={startup.id}
                      id={startup.id}
                      name={startup.name}
                      tagline={startup.tagline}
                      description={startup.description}
                      logoUrl={startup.logo_url}
                      websiteUrl={startup.website_url}
                      sourceUrl={startup.source_url}
                      source={startup.source}
                      upvotes={startup.upvotes}
                      koreaFitScore={startup.korea_fit_score}
                      finalScore={startup.final_score}
                      koreaDeepAnalysis={startup.korea_deep_analysis}
                      onStartBuilding={handleOpenModal}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 프로젝트 섹션 */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <LayoutGrid size={16} /> 진행 중인 프로젝트
                </h2>
                <button className="text-xs text-gray-500 hover:text-black flex items-center gap-1">
                  전체 보기 <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((p) => (
                  <Card key={p.id} className="group hover:border-gray-300" padding="p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition-colors flex-shrink-0">
                        <Zap size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{p.title}</h3>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{p.members}명</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.desc}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{p.role}</span>
                          {p.stack.slice(0, 2).map(s => (
                            <span key={s} className="text-[10px] text-gray-400">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

          </main>

          {/* ========== 우측 사이드바 ========== */}
          <aside className="hidden xl:block w-[280px] flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* 이번 주 인기 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <TrendingUp size={12} /> 이번 주 인기
                </h3>
                <div className="space-y-3">
                  {topStartupIdeas.slice(0, 5).map((startup, idx) => (
                    <button
                      key={startup.id}
                      onClick={() => handleOpenModal(startup.id)}
                      className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-lg font-bold text-gray-300 w-5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{startup.name}</p>
                        <p className="text-xs text-gray-500 truncate">{startup.tagline}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{startup.upvotes} UP</span>
                          <span className="text-[10px] text-green-600">적합도 {startup.korea_fit_score}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 추천 인재 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <UserCircle size={12} /> 추천 인재
                </h3>
                <div className="space-y-3">
                  {talents.slice(0, 4).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {t.name.substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.role}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        t.status === 'OPEN' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 text-xs text-gray-500 hover:text-black flex items-center justify-center gap-1">
                  더 보기 <ChevronRight size={14} />
                </button>
              </div>

              {/* CTA 배너 */}
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 text-white">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                  <Rocket size={20} />
                </div>
                <h3 className="font-bold text-base mb-1">아이디어가 있나요?</h3>
                <p className="text-gray-400 text-xs mb-4">팀을 구성하고 프로젝트를 시작하세요</p>
                <button className="w-full bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  프로젝트 시작하기
                </button>
              </div>

              {/* 북마크 */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Bookmark size={12} /> 저장한 아이디어
                </h3>
                <p className="text-xs text-gray-500 text-center py-4">
                  아직 저장한 아이디어가 없습니다
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* Startup Detail Modal */}
      {selectedStartup && (
        <StartupIdeaModal
          isOpen={!!selectedStartup}
          onClose={() => setSelectedStartup(null)}
          onStartBuilding={() => handleStartBuilding(selectedStartup.id)}
          startup={{
            id: selectedStartup.id,
            name: selectedStartup.name,
            tagline: selectedStartup.tagline,
            description: selectedStartup.description,
            logoUrl: selectedStartup.logo_url,
            websiteUrl: selectedStartup.website_url,
            sourceUrl: selectedStartup.source_url,
            source: selectedStartup.source,
            upvotes: selectedStartup.upvotes,
            category: selectedStartup.category,
            koreaFitScore: selectedStartup.korea_fit_score,
            finalScore: selectedStartup.final_score,
            koreaDeepAnalysis: selectedStartup.korea_deep_analysis,
          }}
        />
      )}
    </div>
  )
}
