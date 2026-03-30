'use client'

import React, { useState } from 'react'
import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'
import { DashboardLayout } from '@/components/ui/DashboardLayout'
import { Modal } from '@/components/ui/Modal'
import {
  Zap, Users, Coffee, Rocket, Plus, Star, Clock, Check, X,
  MapPin, ChevronRight, Flame, ArrowRight, MessageSquare,
  Briefcase, Mail, Building2, CheckSquare, UserCircle,
  Layout, Columns3, Maximize2, Box, Layers,
} from 'lucide-react'

/* ============================================================
   DESIGN SYSTEM SHOWCASE
   /design — 레이아웃 + 카드 전부 한 페이지에서 확인
   ============================================================ */

export default function DesignPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md')

  return (
    <div className="bg-surface-bg min-h-full pb-20">

      {/* ============================================================
         PAGE HEADER
         ============================================================ */}
      <PageContainer size="wide" className="pt-8 pb-6">
        <div className="flex items-end justify-between border-b border-gray-200 pb-6">
          <div>
            <p className="text-[0.625rem] text-gray-400 mb-2">DRAFT DESIGN SYSTEM</p>
            <h1 className="text-2xl font-bold text-gray-900">Layout & Cards</h1>
            <p className="text-sm text-gray-500 mt-1">레이아웃 쉘 + 카드 컴포넌트 — 디자인 확정 후 실제 코드에 적용</p>
          </div>
          <div className="flex gap-2">
            <a href="#layouts" className="px-3 py-1.5 text-xs font-semibold bg-surface-inverse text-txt-inverse rounded-lg">Layouts</a>
            <a href="#cards" className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Cards</a>
          </div>
        </div>
      </PageContainer>


      {/* ████████████████████████████████████████████████████████████
         PART 1: LAYOUT SYSTEM
         ████████████████████████████████████████████████████████████ */}
      <div id="layouts">
        <PageContainer size="wide" className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Layout size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Layout System</h2>
          </div>
          <p className="text-xs text-gray-500">PageContainer, Section, DashboardLayout, Modal — 4개 쉘 컴포넌트</p>
        </PageContainer>

        {/* ──────────────────────────────────────────
           L1. PageContainer — 3가지 너비
           ────────────────────────────────────────── */}
        <PageContainer size="wide" className="mb-8">
          <SectionLabel label="L1. PageContainer" description="max-width 컨테이너. narrow (768px) / standard (1200px) / wide (1400px)" />
        </PageContainer>

        {/* Narrow */}
        <div className="border-y border-blue-200 bg-blue-50/30 mb-1">
          <PageContainer size="narrow" className="py-4">
            <div className="bg-white border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-[0.625rem] text-blue-500 mb-1">narrow — 768px</p>
              <p className="text-xs text-gray-500">로그인, 설정, 폼 등 좁은 콘텐츠</p>
            </div>
          </PageContainer>
        </div>

        {/* Standard */}
        <div className="border-y border-green-200 bg-green-50/30 mb-1">
          <PageContainer size="standard" className="py-4">
            <div className="bg-white border border-green-200 rounded-xl p-4 text-center">
              <p className="text-[0.625rem] text-green-500 mb-1">standard — 1200px</p>
              <p className="text-xs text-gray-500">랜딩 페이지, 일반 콘텐츠</p>
            </div>
          </PageContainer>
        </div>

        {/* Wide */}
        <div className="border-y border-violet-200 bg-violet-50/30 mb-6">
          <PageContainer size="wide" className="py-4">
            <div className="bg-white border border-violet-200 rounded-xl p-4 text-center">
              <p className="text-[0.625rem] text-violet-500 mb-1">wide — 1400px</p>
              <p className="text-xs text-gray-500">대시보드, 3컬럼 레이아웃</p>
            </div>
          </PageContainer>
        </div>

        {/* ──────────────────────────────────────────
           L2. Section — 스페이싱 + 배경
           ────────────────────────────────────────── */}
        <PageContainer size="wide" className="mb-4">
          <SectionLabel label="L2. Section" description="랜딩/마케팅용 섹션 래퍼. spacing (sm/md/lg) × bg (white/gray/transparent)" />
        </PageContainer>

        <div className="space-y-1 mb-8">
          <Section spacing="sm" bg="white">
            <PageContainer size="standard">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.625rem] text-gray-400">spacing=sm · bg=white</span>
                  <p className="text-xs text-gray-500 mt-1">py-12 — 컴팩트한 간격</p>
                </div>
                <div className="text-[0.625rem] font-mono text-gray-300">py-12</div>
              </div>
            </PageContainer>
          </Section>

          <Section spacing="md" bg="gray">
            <PageContainer size="standard">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.625rem] text-gray-400">spacing=md · bg=gray</span>
                  <p className="text-xs text-gray-500 mt-1">py-16 md:py-20 — 기본 간격</p>
                </div>
                <div className="text-[0.625rem] font-mono text-gray-300">py-16 ~ py-20</div>
              </div>
            </PageContainer>
          </Section>

          <Section spacing="lg" bg="white">
            <PageContainer size="standard">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.625rem] text-gray-400">spacing=lg · bg=white</span>
                  <p className="text-xs text-gray-500 mt-1">py-20 md:py-28 — 히어로/CTA용</p>
                </div>
                <div className="text-[0.625rem] font-mono text-gray-300">py-20 ~ py-28</div>
              </div>
            </PageContainer>
          </Section>
        </div>

        {/* ──────────────────────────────────────────
           L3. DashboardLayout — 1/2/3 컬럼
           ────────────────────────────────────────── */}
        <PageContainer size="wide" className="mb-4">
          <SectionLabel label="L3. DashboardLayout" description="대시보드 레이아웃. sidebar (w-56, lg+) / main / aside (w-64, xl+)" />
        </PageContainer>

        {/* 1 Column */}
        <div className="border border-gray-300 rounded-xl mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
            <span className="text-[0.625rem] text-gray-500">1-column — main only</span>
          </div>
          <DashboardLayout size="wide">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-xs font-medium text-blue-600">Main Content</p>
              <p className="text-[0.625rem] text-blue-400 mt-1">flex-1, 전체 폭</p>
            </div>
          </DashboardLayout>
        </div>

        {/* 2 Column */}
        <div className="border border-gray-300 rounded-xl mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
            <span className="text-[0.625rem] text-gray-500">2-column — sidebar + main</span>
          </div>
          <DashboardLayout
            size="wide"
            sidebar={
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-indicator-premium-border">Sidebar</p>
                <p className="text-[0.625rem] text-amber-400 mt-1">w-56, lg:block</p>
                <div className="mt-3 space-y-2">
                  {['필터 1', '필터 2', '필터 3'].map(f => (
                    <div key={f} className="h-7 bg-amber-100 rounded-md flex items-center justify-center text-[0.625rem] text-amber-500">{f}</div>
                  ))}
                </div>
              </div>
            }
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-xs font-medium text-blue-600">Main Content</p>
              <p className="text-[0.625rem] text-blue-400 mt-1">flex-1</p>
            </div>
          </DashboardLayout>
        </div>

        {/* 3 Column */}
        <div className="border border-gray-300 rounded-xl mx-4 sm:mx-6 lg:mx-8 mb-8 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
            <span className="text-[0.625rem] text-gray-500">3-column — sidebar + main + aside</span>
          </div>
          <DashboardLayout
            size="wide"
            sidebar={
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-indicator-premium-border">Sidebar</p>
                <p className="text-[0.625rem] text-amber-400 mt-1">w-56, lg:block</p>
                <div className="mt-3 space-y-2">
                  {['카테고리', '필터', '태그'].map(f => (
                    <div key={f} className="h-7 bg-amber-100 rounded-md flex items-center justify-center text-[0.625rem] text-amber-500">{f}</div>
                  ))}
                </div>
              </div>
            }
            aside={
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-green-600">Aside</p>
                <p className="text-[0.625rem] text-green-400 mt-1">w-64, xl:block</p>
                <div className="mt-3 space-y-2">
                  {['추천', 'CTA', '정보'].map(f => (
                    <div key={f} className="h-7 bg-green-100 rounded-md flex items-center justify-center text-[0.625rem] text-green-500">{f}</div>
                  ))}
                </div>
              </div>
            }
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center min-h-[12.5rem] flex flex-col items-center justify-center">
              <p className="text-xs font-medium text-blue-600">Main Content</p>
              <p className="text-[0.625rem] text-blue-400 mt-1">flex-1, 나머지 공간 전부</p>
              <p className="text-[0.625rem] text-blue-300 mt-3">Explore, Profile, Projects 페이지가 이 구조</p>
            </div>
          </DashboardLayout>
        </div>

        {/* ──────────────────────────────────────────
           L4. Modal — 사이즈 비교
           ────────────────────────────────────────── */}
        <PageContainer size="wide" className="mb-4">
          <SectionLabel label="L4. Modal" description="모달 쉘. sm/md/lg/xl/full. 스크롤락 + 포커스트랩 + ESC닫기 내장." />
          <div className="flex gap-2 flex-wrap">
            {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setModalSize(s); setModalOpen(true) }}
                className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-black hover:text-white hover:border-border transition-colors"
              >
                {s.toUpperCase()} 모달 열기
              </button>
            ))}
          </div>
        </PageContainer>

        {/* Modal size reference (static) */}
        <PageContainer size="wide" className="mb-10">
          <div className="relative bg-gray-100 rounded-xl p-6 overflow-hidden">
            <p className="text-[0.625rem] font-mono text-gray-400 mb-4">SIZE REFERENCE (축소 표현)</p>
            <div className="space-y-3">
              {[
                { size: 'sm', width: '24rem (384px)', pct: '27%' },
                { size: 'md', width: '28rem (448px)', pct: '32%' },
                { size: 'lg', width: '42rem (672px)', pct: '48%' },
                { size: 'xl', width: '56rem (896px)', pct: '64%' },
                { size: 'full', width: '100vw - 4rem', pct: '95%' },
              ].map((m) => (
                <div key={m.size} className="flex items-center gap-3">
                  <span className="text-[0.625rem] font-mono text-gray-500 w-8">{m.size}</span>
                  <div className="bg-white border border-gray-300 rounded-lg h-8 flex items-center px-3" style={{ width: m.pct }}>
                    <span className="text-[0.625rem] text-gray-400">{m.width}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>

        {/* Actual Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size={modalSize} title={`${modalSize.toUpperCase()} Modal`}>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              모달 사이즈: <span className="font-mono font-bold">{modalSize}</span>
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500">ESC로 닫기 · 바깥 클릭으로 닫기 · Tab 포커스 트랩 · 스크롤 잠금</p>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-black">취소</button>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-surface-inverse text-txt-inverse text-sm font-semibold rounded-lg hover:bg-gray-800">확인</button>
          </div>
        </Modal>
      </div>


      {/* ████████████████████████████████████████████████████████████
         구분선
         ████████████████████████████████████████████████████████████ */}
      <PageContainer size="wide" className="my-12">
        <div className="border-t-2 border-gray-900 pt-6" id="cards">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Card Components</h2>
          </div>
          <p className="text-xs text-gray-500">ContentCard, SurfaceCard, StatusCard, CTACard, ProfileMiniCard, StatCard</p>
        </div>
      </PageContainer>


      {/* ████████████████████████████████████████████████████████████
         PART 2: CARDS (기존 코드)
         ████████████████████████████████████████████████████████████ */}
      <PageContainer size="wide">

        {/* ============================================================
           1. CONTENT CARD — 프로젝트 카드
           ============================================================ */}
        <SectionLabel label="1. ContentCard — 프로젝트" description="탐색, 프로젝트 목록에서 사용. 클릭하면 상세 모달." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">

          {/* A: 기본형 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                <Zap size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">AI 기반 이력서 분석 플랫폼</h3>
                  <span className="text-[0.625rem] text-gray-400 shrink-0">D-12</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">GPT-4를 활용해 이력서를 분석하고 맞춤형 피드백을 제공하는 서비스입니다.</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">프론트엔드</span>
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">AI/ML</span>
                  <span className="text-[0.625rem] text-gray-400">SaaS</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-[0.625rem] text-gray-400">
                    <span className="flex items-center gap-1"><Users size={10} /> 김민수</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> 서울</span>
                  </div>
                  <span className="text-[0.625rem] text-gray-400">3명 지원</span>
                </div>
              </div>
            </div>
          </div>

          {/* B: 모집중 배지 + 업데이트 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                <Rocket size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">캠퍼스 중고거래 앱</h3>
                  <span className="text-[0.625rem] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">모집중</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">대학교 내 중고거래를 위한 모바일 앱. 위치 기반 매칭.</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">React Native</span>
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">백엔드</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-[0.625rem] text-gray-400">
                    <span className="flex items-center gap-1"><Users size={10} /> 이서연</span>
                  </div>
                  <span className="text-[0.625rem] text-green-600 font-mono">2일 전 업데이트</span>
                </div>
              </div>
            </div>
          </div>

          {/* C: 마감 임박 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                <Flame size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">헬스케어 데이터 대시보드</h3>
                  <span className="text-[0.625rem] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">D-2</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">환자 데이터 시각화 및 실시간 모니터링 대시보드.</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">데이터 엔지니어</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                  <span className="text-[0.625rem] text-gray-400 flex items-center gap-1"><Users size={10} /> 박지훈</span>
                  <span className="text-[0.625rem] text-gray-400">7명 지원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
           2. CONTENT CARD — 사람 카드
           ============================================================ */}
        <SectionLabel label="2. ContentCard — 사람" description="탐색 > 사람 탭, 추천 인재에서 사용." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">

          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">김민</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">김민수</span>
                  <span className="text-[0.625rem] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">OPEN</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">프론트엔드 개발자</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">AI와 디자인의 접점을 탐구하고 있습니다</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">React</span>
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">TypeScript</span>
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">Figma</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">이서</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">이서연</span>
                  <span className="text-[0.625rem] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Coffee size={8} /> 커피챗</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">PM / 기획자 · 서울대학교</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">사용자 중심 프로덕트를 만들고 싶어요</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">PM</span>
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">UX리서치</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer opacity-75">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">박지</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">박지훈</span>
                  <span className="text-[0.625rem] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">BUSY</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">백엔드 개발자</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">현재 프로젝트 진행 중</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">Node.js</span>
                  <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">PostgreSQL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
           3. SURFACE CARD — 사이드바 컨테이너
           ============================================================ */}
        <SectionLabel label="3. SurfaceCard — 사이드바 / 컨테이너" description="사이드바, 필터, 정보 블록 등 범용 컨테이너." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[0.625rem] font-medium text-gray-400 mb-3">카테고리</h3>
            <nav className="space-y-1">
              {['전체', 'AI / ML', 'SaaS', '모바일', '웹'].map((cat, i) => (
                <button key={cat} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all ${i === 0 ? 'bg-surface-inverse text-txt-inverse font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[0.625rem] font-medium text-gray-400 mb-3">바로가기</h3>
            <nav className="space-y-1">
              {[
                { label: '내 프로젝트', icon: Zap, count: 2 },
                { label: '받은 커피챗', icon: Coffee, count: 3 },
                { label: '기술 스택', icon: CheckSquare, count: 5 },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2"><item.icon size={14} />{item.label}</span>
                  <span className="text-[0.625rem] text-gray-400">{item.count}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[0.625rem] font-medium text-gray-400 mb-3">프로필 완성도</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">60%</span>
              <span className="text-[0.625rem] text-gray-400">3/5</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-black rounded-full" style={{ width: '60%' }} />
            </div>
            <div className="space-y-1.5">
              {[
                { label: '닉네임', done: true }, { label: '포지션', done: true }, { label: '대학교', done: true },
                { label: '한 줄 소개', done: false }, { label: '기술 스택', done: false },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-xs">
                  {f.done ? <Check size={12} className="text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                  <span className={f.done ? 'text-gray-400 line-through' : 'text-gray-600'}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-[0.625rem] font-medium text-gray-400 mb-3 flex items-center gap-1"><Flame size={10} /> 트렌딩</h3>
            <div className="space-y-2">
              {['#AI에이전트', '#사이드프로젝트', '#React', '#커뮤니티', '#EdTech'].map((tag) => (
                <button key={tag} className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-black transition-colors">
                  <span>{tag}</span>
                  <span className="text-[0.625rem] text-gray-400">{Math.floor(Math.random() * 50 + 10)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
           4. STATUS CARD — 커피챗 / 알림
           ============================================================ */}
        <SectionLabel label="4. StatusCard — 커피챗 / 알림" description="상태가 있는 인터랙티브 카드. 수락/거절 액션." />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">

          <div className="bg-white border border-amber-200 rounded-xl p-4 bg-amber-50/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">이서</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">이서연</span>
                    <span className="text-[0.625rem] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">대기중</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">안녕하세요! AI 이력서 프로젝트에 관심이 있어 커피챗 요청드립니다.</p>
                  <p className="text-[0.625rem] text-gray-400 mt-1">2026.03.11</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 text-xs font-semibold bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800">수락</button>
                <button className="px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">거절</button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700 shrink-0">박지</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">박지훈</span>
                  <span className="text-[0.625rem] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">수락됨</span>
                </div>
                <p className="text-[0.625rem] text-gray-400 mt-0.5">2026.03.10 · 연락처: jh@example.com</p>
              </div>
              <button className="text-xs text-gray-500 hover:text-black transition-colors flex items-center gap-1"><MessageSquare size={12} /> 메시지</button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">최유</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">최유진</span>
                  <span className="text-[0.625rem] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">거절됨</span>
                </div>
                <p className="text-[0.625rem] text-gray-400 mt-0.5">2026.03.09</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-xl p-4 bg-amber-50/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">정하</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">정하은</span>
                    <span className="text-[0.625rem] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">대기중</span>
                  </div>
                  <p className="text-xs text-gray-500">디자인 합류 희망합니다!</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="text" placeholder="연락처 입력" className="w-32 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-border" />
                <button className="p-1.5 bg-surface-inverse text-txt-inverse rounded-lg"><Check size={12} /></button>
                <button className="p-1.5 bg-gray-200 text-gray-600 rounded-lg"><X size={12} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
           5. CTA CARD
           ============================================================ */}
        <SectionLabel label="5. CTACard — 행동 유도" description="사이드바 하단, 빈 상태 등에서 사용." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 text-white">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4"><Rocket size={20} /></div>
            <h3 className="font-bold text-base mb-1">팀원을 찾고 계신가요?</h3>
            <p className="text-gray-400 text-xs mb-4">프로젝트를 등록하고 함께할 팀원을 모집하세요</p>
            <button className="w-full bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"><Plus size={16} /> 프로젝트 등록하기</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4"><Coffee size={20} className="text-blue-600" /></div>
            <h3 className="font-bold text-base text-gray-900 mb-1">커피챗 해보세요</h3>
            <p className="text-gray-500 text-xs mb-4">관심 있는 프로젝트 리더와 부담 없이 대화해보세요</p>
            <button className="w-full bg-surface-inverse text-txt-inverse text-sm font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors">둘러보기</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Zap size={24} className="text-gray-300" /></div>
            <h3 className="font-semibold text-sm text-gray-900 mb-1">아직 프로젝트가 없습니다</h3>
            <p className="text-xs text-gray-500 mb-4">첫 프로젝트를 만들어 팀원을 모집해보세요</p>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-surface-inverse text-txt-inverse rounded-lg hover:bg-gray-800 transition-colors"><Plus size={16} /> 프로젝트 만들기</button>
          </div>
        </div>

        {/* ============================================================
           6. PROFILE MINI CARD
           ============================================================ */}
        <SectionLabel label="6. ProfileMiniCard — 사이드바 프로필" description="좌측 사이드바 상단, 네트워크 그리드에서 사용." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-400 mb-3">김민</div>
              <h3 className="font-bold text-sm text-gray-900">김민수</h3>
              <p className="text-xs text-gray-500 mt-0.5">프론트엔드 개발자</p>
              <p className="text-[0.625rem] text-gray-400 mt-1">서울대학교</p>
            </div>
            <button className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-black hover:text-white hover:border-border transition-colors">프로필 수정</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-xl flex items-center justify-center text-lg font-bold text-violet-600 mb-3">이서</div>
              <h3 className="font-bold text-sm text-gray-900">이서연</h3>
              <p className="text-xs text-gray-500 mt-0.5">PM / 기획자</p>
              <div className="flex gap-1 mt-2">
                <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">PM</span>
                <span className="text-[0.625rem] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">UX</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center text-lg font-bold text-green-600 mb-3">박지</div>
              <h3 className="font-bold text-sm text-gray-900">박지훈</h3>
              <p className="text-xs text-gray-500 mt-0.5">백엔드 개발자</p>
              <span className="text-[0.625rem] bg-green-50 text-green-600 px-1.5 py-0.5 rounded mt-2 flex items-center gap-0.5"><Coffee size={8} /> 커피챗 가능</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 group hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-lg font-bold text-indicator-premium-border mb-3">최유</div>
              <h3 className="font-bold text-sm text-gray-900">최유진</h3>
              <p className="text-xs text-gray-500 mt-0.5">디자이너</p>
              <span className="text-[0.625rem] bg-amber-50 text-indicator-premium-border px-1.5 py-0.5 rounded mt-2">프로젝트 1개 진행중</span>
            </div>
          </div>
        </div>

        {/* ============================================================
           7. STAT CARD
           ============================================================ */}
        <SectionLabel label="7. StatCard — 숫자 / 지표" description="대시보드, 프로필 요약에서 사용." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: '내 프로젝트', value: '3', icon: Zap, color: 'bg-blue-50 text-blue-600' },
            { label: '받은 커피챗', value: '7', icon: Coffee, color: 'bg-amber-50 text-indicator-premium-border' },
            { label: '총 조회수', value: '1.2k', icon: Users, color: 'bg-green-50 text-green-600' },
            { label: '프로필 완성도', value: '80%', icon: Star, color: 'bg-violet-50 text-violet-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}><stat.icon size={16} /></div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-[0.625rem] text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

      </PageContainer>
    </div>
  )
}

/* ============================================================
   헬퍼 컴포넌트
   ============================================================ */
function SectionLabel({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-4 pb-3 border-b border-gray-200">
      <h2 className="text-base font-bold text-gray-900">{label}</h2>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  )
}
