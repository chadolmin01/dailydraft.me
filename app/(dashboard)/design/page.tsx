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
  Layout, Columns3, Maximize2, Box, Layers, Palette, FolderOpen, Send, ChevronLeft,
} from 'lucide-react'

/* ============================================================
   DESIGN SYSTEM SHOWCASE
   /design — 레이아웃 + 카드 전부 한 페이지에서 확인
   ============================================================ */

export default function DesignPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md')
  const [coffeeChatOpen, setCoffeeChatOpen] = useState(false)
  const [coffeeChatStep, setCoffeeChatStep] = useState<'template' | 'write'>('template')
  const [coffeeChatTemplate, setCoffeeChatTemplate] = useState<number | null>(null)
  const [coffeeChatMessage, setCoffeeChatMessage] = useState('')

  return (
    <div className="bg-surface-bg min-h-full pb-20">

      {/* ============================================================
         PAGE HEADER
         ============================================================ */}
      <PageContainer size="wide" className="pt-8 pb-6">
        <div className="flex items-end justify-between border-b border-border pb-6">
          <div>
            <p className="text-xs font-mono text-txt-tertiary uppercase tracking-widest mb-2">DRAFT DESIGN SYSTEM — BRUTALIST</p>
            <h1 className="text-xl font-bold text-txt-primary">Layout · Cards · Palette</h1>
            <p className="text-sm text-txt-secondary mt-1">브루탈리즘 · 각진 모서리 · 하드 셰도우 · 모노크롬</p>
          </div>
          <div className="flex gap-2">
            <a href="#palette" className="px-3 py-1.5 text-sm font-semibold bg-accent text-txt-inverse ">Palette</a>
            <a href="#layouts" className="px-3 py-1.5 text-sm font-semibold border border-border text-txt-secondary hover:bg-surface-sunken">Layouts</a>
            <a href="#cards" className="px-3 py-1.5 text-sm font-semibold border border-border text-txt-secondary hover:bg-surface-sunken">Cards</a>
          </div>
        </div>
      </PageContainer>


      {/* ████████████████████████████████████████████████████████████
         PART 0: COLOR PALETTE
         ████████████████████████████████████████████████████████████ */}
      <div id="palette">
        <PageContainer size="wide" className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-accent flex items-center justify-center">
              <Palette size={16} className="text-txt-inverse" />
            </div>
            <h2 className="text-xl font-bold text-txt-primary">Color Palette</h2>
          </div>
          <p className="text-sm text-txt-secondary">CSS 변수 기반 모노크롬 디자인 토큰. 다크모드 대응 준비 완료.</p>
        </PageContainer>

        <PageContainer size="wide" className="mb-10 space-y-8">

          {/* ── Surface ── */}
          <div>
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Surface</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: 'bg', var: '--surface-bg', hex: '#FAFAFA', desc: '페이지 배경' },
                { name: 'card', var: '--surface-card', hex: '#FFFFFF', desc: '카드/패널' },
                { name: 'elevated', var: '--surface-elevated', hex: '#FFFFFF', desc: '모달/드롭다운' },
                { name: 'sunken', var: '--surface-sunken', hex: '#F4F4F5', desc: '인셋/비활성' },
                { name: 'inverse', var: '--surface-inverse', hex: '#18181B', desc: '다크 섹션', dark: true },
                { name: 'overlay', var: '--surface-overlay', hex: 'rgba(0,0,0,0.5)', desc: '오버레이', dark: true },
              ].map(c => (
                <div key={c.name} className="group">
                  <div
                    className={`h-16 border ${c.dark ? 'border-transparent' : 'border-border'} mb-2`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <p className="text-xs font-semibold text-txt-primary">{c.name}</p>
                  <p className="text-xs font-mono text-txt-tertiary">{c.var}</p>
                  <p className="text-xs text-txt-secondary mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Text ── */}
          <div>
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Text</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: 'primary', hex: '#18181B', desc: '제목/본문' },
                { name: 'secondary', hex: '#52525B', desc: '부제목/설명' },
                { name: 'tertiary', hex: '#71717A', desc: '보조/힌트' },
                { name: 'disabled', hex: '#D4D4D8', desc: '비활성' },
                { name: 'inverse', hex: '#FFFFFF', desc: '다크 위 텍스트', needsDark: true },
                { name: 'link', hex: '#18181B', desc: '링크 (밑줄)' },
              ].map(c => (
                <div key={c.name} className="group">
                  <div
                    className={`h-16 border border-border mb-2 flex items-center justify-center ${c.needsDark ? 'bg-surface-inverse' : 'bg-surface-card'}`}
                  >
                    <span className="text-sm font-bold" style={{ color: c.hex }}>Aa</span>
                  </div>
                  <p className="text-xs font-semibold text-txt-primary">{c.name}</p>
                  <p className="text-xs font-mono text-txt-tertiary">{c.hex}</p>
                  <p className="text-xs text-txt-secondary mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Border ── */}
          <div>
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Border</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
              {[
                { name: 'default', hex: '#E4E4E7', desc: '기본 보더' },
                { name: 'strong', hex: '#A1A1AA', desc: '강조/호버' },
                { name: 'subtle', hex: '#F4F4F5', desc: '미세 구분선' },
              ].map(c => (
                <div key={c.name} className="group">
                  <div className="h-12 bg-surface-card mb-2" style={{ border: `2px solid ${c.hex}` }} />
                  <p className="text-xs font-semibold text-txt-primary">{c.name}</p>
                  <p className="text-xs font-mono text-txt-tertiary">{c.hex}</p>
                  <p className="text-xs text-txt-secondary mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Status ── */}
          <div>
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Status (뮤트)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'success', bg: 'var(--status-success-bg)', text: 'var(--status-success-text)', label: '성공/활성', example: 'OPEN' },
                { name: 'warning', bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)', label: '경고/주의', example: '마감임박' },
                { name: 'danger', bg: 'var(--status-danger-bg)', text: 'var(--status-danger-text)', label: '에러/위험', example: '마감' },
                { name: 'info', bg: 'var(--status-info-bg)', text: 'var(--status-info-text)', label: '정보/기본', example: '진행중' },
              ].map(c => (
                <div key={c.name} className="group">
                  <div
                    className="h-14 mb-2 flex items-center justify-center"
                    style={{ backgroundColor: c.bg }}
                  >
                    <span className="text-sm font-semibold px-3 py-1 rounded-md" style={{ color: c.text }}>{c.example}</span>
                  </div>
                  <p className="text-xs font-semibold text-txt-primary">{c.name}</p>
                  <p className="text-xs text-txt-secondary mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tags 비교 ── */}
          <div>
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Tags & Badges</h3>
            <div className="bg-surface-card border border-border p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono text-txt-tertiary uppercase mb-2">모노크롬 (기본 — 이걸 쓰세요)</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded-xs font-medium">Frontend</span>
                    <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded-xs font-medium">React</span>
                    <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded-xs font-medium">TypeScript</span>
                    <span className="text-xs bg-tag-strong-bg text-tag-strong-text px-2 py-0.5 rounded-xs font-medium">AI/ML</span>
                    <span className="text-xs border border-border text-txt-secondary px-2 py-0.5 rounded-xs font-medium">SaaS</span>
                  </div>
                </div>
                <div className="border-t border-border-subtle pt-4">
                  <p className="text-xs font-mono text-txt-tertiary uppercase mb-2">시맨틱 (상태 표시 전용)</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-status-success-bg text-status-success-text px-2 py-0.5 rounded-xs font-medium">모집중</span>
                    <span className="text-xs bg-status-warning-bg text-status-warning-text px-2 py-0.5 rounded-xs font-medium">마감임박</span>
                    <span className="text-xs bg-status-danger-bg text-status-danger-text px-2 py-0.5 rounded-xs font-medium">마감</span>
                    <span className="text-xs bg-status-info-bg text-status-info-text px-2 py-0.5 rounded-xs font-medium">진행중</span>
                  </div>
                </div>
                <div className="border-t border-border-subtle pt-4">
                  <p className="text-xs font-mono text-txt-tertiary uppercase mb-2 flex items-center gap-2">
                    <span className="line-through text-txt-disabled">바이브코딩 (쓰지 마세요)</span>
                    <X size={12} className="text-status-danger-text" />
                  </p>
                  <div className="flex flex-wrap gap-2 opacity-40">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-xs font-medium">Frontend</span>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-xs font-medium">모집중</span>
                    <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-xs font-medium">커피챗</span>
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-xs font-medium">마감임박</span>
                    <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-xs font-medium">인기</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Accent / Interactive ── */}
          <div>
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Accent & Interactive</h3>
            <div className="bg-surface-card border border-border p-6">
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-accent text-txt-inverse text-sm font-semibold hover:bg-accent-hover transition-colors">Primary</button>
                <button className="px-4 py-2 bg-accent-secondary text-txt-primary text-sm font-semibold hover:bg-accent-secondary-hover transition-colors">Secondary</button>
                <button className="px-4 py-2 border border-border text-txt-secondary text-sm font-semibold hover:bg-surface-sunken transition-colors">Outline</button>
                <button className="px-4 py-2 text-txt-secondary text-sm font-semibold hover:bg-surface-sunken transition-colors">Ghost</button>
                <button className="px-4 py-2 bg-status-danger-bg text-status-danger-text text-sm font-semibold hover:bg-status-danger-text hover:text-txt-inverse transition-colors">Danger</button>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-txt-primary font-semibold underline underline-offset-2 cursor-pointer">링크 텍스트</span>
                <span className="text-txt-tertiary">비활성 텍스트</span>
                <span className="text-txt-disabled">Disabled</span>
              </div>
            </div>
          </div>

          {/* ── Radius & Shadow ── */}
          <div>
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Radius & Shadow</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'sm', val: '6px' },
                { name: 'md', val: '8px' },
                { name: 'lg', val: '12px' },
                { name: 'xl', val: '16px' },
              ].map(r => (
                <div key={r.name} className="bg-surface-card border border-border p-4 text-center" style={{ borderRadius: r.val }}>
                  <p className="text-xs font-semibold text-txt-primary">radius-{r.name}</p>
                  <p className="text-xs font-mono text-txt-tertiary">{r.val}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-surface-card p-4 text-center shadow-soft">
                <p className="text-xs font-semibold text-txt-primary">shadow-soft</p>
                <p className="text-xs font-mono text-txt-tertiary">0 2px 8px rgba(0,0,0,0.05)</p>
              </div>
              <div className="bg-surface-card p-4 text-center shadow-sharp">
                <p className="text-xs font-semibold text-txt-primary">shadow-sharp</p>
                <p className="text-xs font-mono text-txt-tertiary">2px 2px 0px 0px rgba(0,0,0,0.1)</p>
              </div>
            </div>
          </div>

        </PageContainer>
      </div>


      {/* ████████████████████████████████████████████████████████████
         PART 1: LAYOUT SYSTEM
         ████████████████████████████████████████████████████████████ */}
      <div id="layouts">
        <PageContainer size="wide" className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-accent flex items-center justify-center">
              <Layout size={16} className="text-txt-inverse" />
            </div>
            <h2 className="text-xl font-bold text-txt-primary">Layout System</h2>
          </div>
          <p className="text-sm text-txt-secondary">PageContainer, Section, DashboardLayout, Modal — 4개 쉘 컴포넌트</p>
        </PageContainer>

        {/* ──────────────────────────────────────────
           L1. PageContainer — 3가지 너비
           ────────────────────────────────────────── */}
        <PageContainer size="wide" className="mb-8">
          <SectionLabel label="L1. PageContainer" description="max-width 컨테이너. narrow (768px) / standard (1200px) / wide (1400px)" />
        </PageContainer>

        {/* Narrow */}
        <div className="border-y border-dashed border-border bg-surface-sunken/50 mb-1">
          <PageContainer size="narrow" className="py-4">
            <div className="bg-surface-card border border-border p-4 text-center">
              <p className="text-xs font-mono text-txt-tertiary uppercase tracking-widest mb-1">narrow — 768px</p>
              <p className="text-sm text-txt-secondary">로그인, 설정, 폼 등 좁은 콘텐츠</p>
            </div>
          </PageContainer>
        </div>

        {/* Standard */}
        <div className="border-y border-dashed border-border bg-surface-sunken/50 mb-1">
          <PageContainer size="standard" className="py-4">
            <div className="bg-surface-card border border-border p-4 text-center">
              <p className="text-xs font-mono text-txt-tertiary uppercase tracking-widest mb-1">standard — 1200px</p>
              <p className="text-sm text-txt-secondary">랜딩 페이지, 일반 콘텐츠</p>
            </div>
          </PageContainer>
        </div>

        {/* Wide */}
        <div className="border-y border-dashed border-border bg-surface-sunken/50 mb-6">
          <PageContainer size="wide" className="py-4">
            <div className="bg-surface-card border border-border p-4 text-center">
              <p className="text-xs font-mono text-txt-tertiary uppercase tracking-widest mb-1">wide — 1400px</p>
              <p className="text-sm text-txt-secondary">대시보드, 3컬럼 레이아웃</p>
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
                  <span className="text-xs font-mono text-txt-tertiary uppercase">spacing=sm · bg=white</span>
                  <p className="text-sm text-txt-secondary mt-1">py-12 — 컴팩트한 간격</p>
                </div>
                <div className="text-xs font-mono text-txt-disabled">py-12</div>
              </div>
            </PageContainer>
          </Section>

          <Section spacing="md" bg="gray">
            <PageContainer size="standard">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-txt-tertiary uppercase">spacing=md · bg=gray</span>
                  <p className="text-sm text-txt-secondary mt-1">py-16 md:py-20 — 기본 간격</p>
                </div>
                <div className="text-xs font-mono text-txt-disabled">py-16 ~ py-20</div>
              </div>
            </PageContainer>
          </Section>

          <Section spacing="lg" bg="white">
            <PageContainer size="standard">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-txt-tertiary uppercase">spacing=lg · bg=white</span>
                  <p className="text-sm text-txt-secondary mt-1">py-20 md:py-28 — 히어로/CTA용</p>
                </div>
                <div className="text-xs font-mono text-txt-disabled">py-20 ~ py-28</div>
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
        <div className="border border-dashed border-border mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden">
          <div className="bg-surface-sunken px-4 py-2 border-b border-dashed border-border">
            <span className="text-xs font-mono text-txt-tertiary uppercase">1-column — main only</span>
          </div>
          <DashboardLayout size="wide">
            <div className="bg-surface-inverse/5 border border-border p-6 text-center">
              <p className="text-sm font-medium text-txt-primary">Main Content</p>
              <p className="text-xs text-txt-tertiary mt-1">flex-1, 전체 폭</p>
            </div>
          </DashboardLayout>
        </div>

        {/* 2 Column */}
        <div className="border border-dashed border-border mx-4 sm:mx-6 lg:mx-8 mb-4 overflow-hidden">
          <div className="bg-surface-sunken px-4 py-2 border-b border-dashed border-border">
            <span className="text-xs font-mono text-txt-tertiary uppercase">2-column — sidebar + main</span>
          </div>
          <DashboardLayout
            size="wide"
            sidebar={
              <div className="bg-surface-sunken border border-border p-4 text-center">
                <p className="text-sm font-medium text-txt-primary">Sidebar</p>
                <p className="text-xs text-txt-tertiary mt-1">w-56, lg:block</p>
                <div className="mt-3 space-y-2">
                  {['필터 1', '필터 2', '필터 3'].map(f => (
                    <div key={f} className="h-7 bg-surface-card border border-border rounded-md flex items-center justify-center text-xs text-txt-secondary">{f}</div>
                  ))}
                </div>
              </div>
            }
          >
            <div className="bg-surface-inverse/5 border border-border p-6 text-center">
              <p className="text-sm font-medium text-txt-primary">Main Content</p>
              <p className="text-xs text-txt-tertiary mt-1">flex-1</p>
            </div>
          </DashboardLayout>
        </div>

        {/* 3 Column */}
        <div className="border border-dashed border-border mx-4 sm:mx-6 lg:mx-8 mb-8 overflow-hidden">
          <div className="bg-surface-sunken px-4 py-2 border-b border-dashed border-border">
            <span className="text-xs font-mono text-txt-tertiary uppercase">3-column — sidebar + main + aside</span>
          </div>
          <DashboardLayout
            size="wide"
            sidebar={
              <div className="bg-surface-sunken border border-border p-4 text-center">
                <p className="text-sm font-medium text-txt-primary">Sidebar</p>
                <p className="text-xs text-txt-tertiary mt-1">w-56, lg:block</p>
                <div className="mt-3 space-y-2">
                  {['카테고리', '필터', '태그'].map(f => (
                    <div key={f} className="h-7 bg-surface-card border border-border rounded-md flex items-center justify-center text-xs text-txt-secondary">{f}</div>
                  ))}
                </div>
              </div>
            }
            aside={
              <div className="bg-surface-sunken border border-border p-4 text-center">
                <p className="text-sm font-medium text-txt-primary">Aside</p>
                <p className="text-xs text-txt-tertiary mt-1">w-64, xl:block</p>
                <div className="mt-3 space-y-2">
                  {['추천', 'CTA', '정보'].map(f => (
                    <div key={f} className="h-7 bg-surface-card border border-border rounded-md flex items-center justify-center text-xs text-txt-secondary">{f}</div>
                  ))}
                </div>
              </div>
            }
          >
            <div className="bg-surface-inverse/5 border border-border p-6 text-center min-h-[12.5rem] flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-txt-primary">Main Content</p>
              <p className="text-xs text-txt-tertiary mt-1">flex-1, 나머지 공간 전부</p>
              <p className="text-xs text-txt-disabled mt-3">Explore, Profile, Projects 페이지가 이 구조</p>
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
                className="px-4 py-2 text-sm font-semibold border border-border hover:bg-accent hover:text-txt-inverse hover:border-accent transition-colors"
              >
                {s.toUpperCase()} 모달 열기
              </button>
            ))}
          </div>
        </PageContainer>

        {/* Modal size reference (static) */}
        <PageContainer size="wide" className="mb-10">
          <div className="relative bg-surface-sunken p-6 overflow-hidden">
            <p className="text-xs font-mono text-txt-tertiary mb-4">SIZE REFERENCE (축소 표현)</p>
            <div className="space-y-3">
              {[
                { size: 'sm', width: '24rem (384px)', pct: '27%' },
                { size: 'md', width: '28rem (448px)', pct: '32%' },
                { size: 'lg', width: '42rem (672px)', pct: '48%' },
                { size: 'xl', width: '56rem (896px)', pct: '64%' },
                { size: 'full', width: '100vw - 4rem', pct: '95%' },
              ].map((m) => (
                <div key={m.size} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-txt-secondary w-8">{m.size}</span>
                  <div className="bg-surface-card border border-border h-8 flex items-center px-3" style={{ width: m.pct }}>
                    <span className="text-xs text-txt-tertiary">{m.width}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>

        {/* Actual Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size={modalSize} title={`${modalSize.toUpperCase()} Modal`}>
          <div className="p-6">
            <p className="text-sm text-txt-secondary mb-4">
              모달 사이즈: <span className="font-mono font-bold">{modalSize}</span>
            </p>
            <div className="bg-surface-sunken p-4 mb-4">
              <p className="text-sm text-txt-secondary">ESC로 닫기 · 바깥 클릭으로 닫기 · Tab 포커스 트랩 · 스크롤 잠금</p>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-surface-sunken " />
              ))}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-txt-secondary hover:text-txt-primary">취소</button>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-accent text-txt-inverse text-sm font-semibold hover:bg-accent-hover">확인</button>
          </div>
        </Modal>
      </div>


      {/* ████████████████████████████████████████████████████████████
         구분선
         ████████████████████████████████████████████████████████████ */}
      <PageContainer size="wide" className="my-12">
        <div className="border-t-2 border-surface-inverse pt-6" id="cards">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-accent flex items-center justify-center">
              <Layers size={16} className="text-txt-inverse" />
            </div>
            <h2 className="text-xl font-bold text-txt-primary">Card Components</h2>
          </div>
          <p className="text-sm text-txt-secondary">ContentCard, SurfaceCard, StatusCard, CTACard, ProfileMiniCard, StatCard</p>
        </div>
      </PageContainer>


      {/* ████████████████████████████████████████████████████████████
         PART 2: CARDS (기존 코드)
         ████████████████████████████████████████████████████████████ */}
      <PageContainer size="wide">

        {/* ============================================================
           1. CONTENT CARD — 프로젝트 카드
           ============================================================ */}
        {/* ============================================================
           VIEW MODE TOGGLE — 간단히 / 자세히
           ============================================================ */}
        <ViewModeDemo />

        {/* ============================================================
           개별 카드 비교 (레퍼런스)
           ============================================================ */}
        <div className="border-t border-dashed border-border pt-8 mb-4">
          <p className="text-xs font-mono text-txt-tertiary uppercase tracking-widest mb-6">아래는 개별 카드 변형 레퍼런스</p>
        </div>

        <SectionLabel label="REF-A. 프로젝트 카드 — 자세히 모드" description="동일 구조, 상태별 변형 3종. 커버는 이미지/그라데이션 모두 대응." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">

          {/* 상태 1: 일반 모집중 (그라데이션 커버) */}
          <div className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[21.25rem] flex flex-col">
            {/* 헤더: 커버 — 고정 144px */}
            <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
              <div className="absolute top-3 left-3">
                <span className="text-xs bg-surface-inverse/60 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold">모집중</span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1.5">
                <span className="text-xs bg-surface-card/15 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-medium">AI/ML</span>
                <span className="text-xs bg-surface-card/15 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-medium">SaaS</span>
              </div>
              <div className="w-10 h-10 bg-surface-card flex items-center justify-center shadow-sharp">
                <Rocket size={20} className="text-txt-primary" />
              </div>
            </div>
            {/* 본문: 제목+태그+설명 — 고정 영역, 넘치면 숨김 */}
            <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
              <h3 className="font-semibold text-base text-txt-primary mb-1.5 truncate">AI 기반 이력서 분석 플랫폼</h3>
              <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                <span className="text-xs font-mono text-txt-disabled uppercase tracking-wide shrink-0">NEED</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">프론트엔드</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">백엔드</span>
              </div>
              <p className="text-sm text-txt-secondary line-clamp-2">GPT-4를 활용해 이력서를 분석하고 맞춤형 피드백을 제공하는 서비스입니다.</p>
            </div>
            {/* 푸터: 작성자+메타 — 고정 영역 */}
            <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
              <div className="flex items-center justify-between w-full pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-surface-sunken flex items-center justify-center text-xs font-bold text-txt-secondary">김</div>
                  <span className="text-xs text-txt-tertiary">김민수</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-txt-tertiary">
                  <span>3/4명</span>
                  <span>D-12</span>
                </div>
              </div>
            </div>
          </div>

          {/* 상태 2: 마감임박 D≤3 (이미지 커버 대응) */}
          <div className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[21.25rem] flex flex-col">
            <div className="relative h-36 shrink-0 bg-surface-inverse/90 flex items-end p-4">
              <div className="absolute top-3 left-3">
                <span className="text-xs bg-status-danger-accent/90 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold">D-2 마감임박</span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1.5">
                <span className="text-xs bg-surface-card/15 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-medium">HealthTech</span>
              </div>
              <div className="w-10 h-10 bg-surface-card flex items-center justify-center shadow-sharp">
                <Rocket size={20} className="text-txt-primary" />
              </div>
            </div>
            <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
              <h3 className="font-semibold text-base text-txt-primary mb-1.5 truncate">헬스케어 데이터 대시보드</h3>
              <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                <span className="text-xs font-mono text-txt-disabled uppercase tracking-wide shrink-0">NEED</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">데이터 엔지니어</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">디자이너</span>
              </div>
              <p className="text-sm text-txt-secondary line-clamp-2">환자 데이터 시각화 및 실시간 모니터링 대시보드.</p>
            </div>
            <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
              <div className="flex items-center justify-between w-full pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-surface-sunken flex items-center justify-center text-xs font-bold text-txt-secondary">박</div>
                  <span className="text-xs text-txt-tertiary">박지훈</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-txt-tertiary">
                  <span>7/2명</span>
                  <span className="text-status-danger-text font-semibold">D-2</span>
                </div>
              </div>
            </div>
          </div>

          {/* 상태 3: 최근 업데이트 + 이미지 없음 fallback */}
          <div className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[21.25rem] flex flex-col">
            <div className="relative h-36 shrink-0 bg-surface-sunken flex items-end p-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <FolderOpen size={32} className="text-border" />
              </div>
              <div className="absolute top-3 left-3">
                <span className="text-xs bg-surface-inverse/60 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold">모집중</span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1.5">
                <span className="text-xs bg-surface-inverse/40 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-mono">2일 전 업데이트</span>
              </div>
              <div className="relative w-10 h-10 bg-surface-card flex items-center justify-center shadow-sharp">
                <Building2 size={20} className="text-txt-primary" />
              </div>
            </div>
            <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
              <h3 className="font-semibold text-base text-txt-primary mb-1.5 truncate">캠퍼스 중고거래 앱</h3>
              <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                <span className="text-xs font-mono text-txt-disabled uppercase tracking-wide shrink-0">NEED</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">React Native</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">백엔드</span>
              </div>
              <p className="text-sm text-txt-secondary line-clamp-2">대학교 내 중고거래를 위한 모바일 앱. 위치 기반 매칭 시스템.</p>
            </div>
            <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
              <div className="flex items-center justify-between w-full pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-surface-sunken flex items-center justify-center text-xs font-bold text-txt-secondary">이</div>
                  <span className="text-xs text-txt-tertiary">이서연</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-txt-tertiary">
                  <span>1/3명</span>
                  <span>D-25</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
           NEW: 커버 이미지 카드 — 사람
           ============================================================ */}
        <SectionLabel label="NEW-B. 사람 카드 (프로필 강조)" description="B의 가로형 레이아웃 + C의 상태 푸터 하이브리드. 상태별 변형 3종." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">

          {/* 상태 1: OPEN — 팀 합류 가능 */}
          <div className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[13.75rem] flex flex-col">
            {/* 헤더: 아바타 + 이름/역할 — 고정 */}
            <div className="px-4 pt-4 h-[4.75rem] shrink-0">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-surface-sunken flex items-center justify-center text-base font-bold text-txt-secondary shrink-0">
                  김민
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-base text-txt-primary truncate">김민수</h3>
                    <span className="text-xs bg-status-success-bg text-status-success-text px-1.5 py-0.5 rounded shrink-0">OPEN</span>
                  </div>
                  <p className="text-sm text-txt-secondary truncate">프론트엔드 개발자 · 서울대학교</p>
                </div>
              </div>
            </div>
            {/* 본문: 바이오 + 스킬 — 고정 */}
            <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
              <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">AI와 디자인의 접점을 탐구하고 있습니다. React와 인터랙션 디자인에 관심이 많습니다.</p>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">React</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">TypeScript</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">Figma</span>
              </div>
            </div>
            {/* 푸터: 상태 표시줄 — 고정 (C에서 가져옴) */}
            <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
              <div className="flex items-center justify-between w-full pt-2 border-t border-border-subtle">
                <span className="text-xs text-txt-tertiary">프로젝트 1개 진행중</span>
                <span className="text-xs text-status-success-text flex items-center gap-1"><Coffee size={10} /> 커피챗 가능</span>
              </div>
            </div>
          </div>

          {/* 상태 2: 커피챗 — 대화 가능 */}
          <div className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[13.75rem] flex flex-col">
            <div className="px-4 pt-4 h-[4.75rem] shrink-0">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-surface-sunken flex items-center justify-center text-base font-bold text-txt-secondary shrink-0">
                  이서
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-base text-txt-primary truncate">이서연</h3>
                    <span className="text-xs bg-status-info-bg text-status-info-text px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5"><Coffee size={8} /> 커피챗</span>
                  </div>
                  <p className="text-sm text-txt-secondary truncate">PM / 기획자 · 연세대학교</p>
                </div>
              </div>
            </div>
            <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
              <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">사용자 중심 프로덕트를 만들고 싶어요. 커뮤니티와 교육 분야에 관심이 많습니다.</p>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">PM</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">UX리서치</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">Notion</span>
              </div>
            </div>
            <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
              <div className="flex items-center justify-between w-full pt-2 border-t border-border-subtle">
                <span className="text-xs text-txt-tertiary">프로젝트 2개 진행중</span>
                <span className="text-xs text-txt-tertiary flex items-center gap-1"><MessageSquare size={10} /> 평균 응답 3시간</span>
              </div>
            </div>
          </div>

          {/* 상태 3: BUSY — 현재 바쁨 */}
          <div className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[13.75rem] flex flex-col">
            <div className="px-4 pt-4 h-[4.75rem] shrink-0">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-surface-sunken flex items-center justify-center text-base font-bold text-txt-secondary shrink-0">
                  박지
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-base text-txt-primary truncate">박지훈</h3>
                    <span className="text-xs bg-status-neutral-bg text-status-neutral-text px-1.5 py-0.5 rounded shrink-0">BUSY</span>
                  </div>
                  <p className="text-sm text-txt-secondary truncate">백엔드 개발자 · KAIST</p>
                </div>
              </div>
            </div>
            <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
              <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">확장 가능한 시스템 설계에 관심 있습니다. 현재 헬스케어 스타트업에서 인턴 중.</p>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">Node.js</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">PostgreSQL</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">AWS</span>
              </div>
            </div>
            <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
              <div className="flex items-center justify-between w-full pt-2 border-t border-border-subtle">
                <span className="text-xs text-txt-tertiary">프로젝트 3개 진행중</span>
                <span className="text-xs text-status-neutral-text">현재 팀 합류 불가</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
           3. SURFACE CARD — 사이드바 컨테이너
           ============================================================ */}
        <SectionLabel label="3. SurfaceCard — 사이드바 / 컨테이너" description="사이드바, 필터, 정보 블록 등 범용 컨테이너." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">

          <div className="bg-surface-card border border-border p-4">
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">카테고리</h3>
            <nav className="space-y-1">
              {['전체', 'AI / ML', 'SaaS', '모바일', '웹'].map((cat, i) => (
                <button key={cat} className={`w-full flex items-center px-3 py-2 text-sm transition-all ${i === 0 ? 'bg-accent text-txt-inverse font-medium' : 'text-txt-secondary hover:bg-surface-sunken'}`}>
                  {cat}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-surface-card border border-border p-4">
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">바로가기</h3>
            <nav className="space-y-1">
              {[
                { label: '내 프로젝트', icon: Zap, count: 2 },
                { label: '받은 커피챗', icon: Coffee, count: 3 },
                { label: '기술 스택', icon: CheckSquare, count: 5 },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center justify-between px-3 py-2 text-sm text-txt-secondary hover:bg-surface-sunken transition-colors">
                  <span className="flex items-center gap-2"><item.icon size={14} />{item.label}</span>
                  <span className="text-xs text-txt-tertiary">{item.count}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-surface-card border border-border p-4">
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">프로필 완성도</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-txt-primary">60%</span>
              <span className="text-xs text-txt-tertiary">3/5</span>
            </div>
            <div className="w-full h-1.5 bg-surface-sunken border border-border overflow-hidden mb-3">
              <div className="h-full bg-accent" style={{ width: '60%' }} />
            </div>
            <div className="space-y-1.5">
              {[
                { label: '닉네임', done: true }, { label: '포지션', done: true }, { label: '대학교', done: true },
                { label: '한 줄 소개', done: false }, { label: '기술 스택', done: false },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm">
                  {f.done ? <Check size={12} className="text-status-success-text" /> : <div className="w-3 h-3 border border-border" />}
                  <span className={f.done ? 'text-txt-disabled line-through' : 'text-txt-primary'}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-card border border-border p-4">
            <h3 className="text-xs font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3 flex items-center gap-1"><Flame size={10} /> 트렌딩</h3>
            <div className="space-y-2">
              {['#AI에이전트', '#사이드프로젝트', '#React', '#커뮤니티', '#EdTech'].map((tag) => (
                <button key={tag} className="flex items-center justify-between w-full text-sm text-txt-secondary hover:text-txt-primary transition-colors">
                  <span>{tag}</span>
                  <span className="text-xs text-txt-tertiary">{[34, 28, 19, 45, 12][['#AI에이전트', '#사이드프로젝트', '#React', '#커뮤니티', '#EdTech'].indexOf(tag)] || 20}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================
           4. STATUS CARD — 커피챗 / 알림
           ============================================================ */}
        <SectionLabel label="4. StatusCard — 커피챗 / 알림" description="상태가 있는 인터랙티브 카드. 수락/거절 액션." />
        <div className="grid grid-cols-1 gap-3 mb-12 max-w-3xl">

          <div className="bg-surface-card border border-border-strong p-4 bg-status-warning-bg/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-surface-sunken flex items-center justify-center text-sm font-bold text-txt-secondary shrink-0">이서</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-base text-txt-primary">이서연</span>
                    <span className="text-xs bg-status-warning-bg text-status-warning-text px-1.5 py-0.5 rounded">대기중</span>
                  </div>
                  <p className="text-sm text-txt-secondary line-clamp-2">안녕하세요! AI 이력서 프로젝트에 관심이 있어 커피챗 요청드립니다.</p>
                  <p className="text-xs text-txt-tertiary mt-1">2026.03.11</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 text-sm font-semibold bg-accent text-txt-inverse hover:bg-accent-hover">수락</button>
                <button className="px-3 py-1.5 text-sm font-semibold border border-border text-txt-secondary hover:bg-surface-sunken">거절</button>
              </div>
            </div>
          </div>

          <div className="bg-surface-card border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-surface-sunken flex items-center justify-center text-sm font-bold text-txt-secondary shrink-0">박지</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base text-txt-primary">박지훈</span>
                  <span className="text-xs bg-status-success-bg text-status-success-text px-1.5 py-0.5 rounded">수락됨</span>
                </div>
                <p className="text-xs text-txt-tertiary mt-0.5">2026.03.10 · 연락처: jh@example.com</p>
              </div>
              <button className="text-sm text-txt-secondary hover:text-txt-primary transition-colors flex items-center gap-1"><MessageSquare size={12} /> 메시지</button>
            </div>
          </div>

          <div className="bg-surface-card border border-border p-4 opacity-60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-surface-sunken flex items-center justify-center text-sm font-bold text-txt-tertiary shrink-0">최유</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-txt-primary">최유진</span>
                    <span className="text-xs bg-status-neutral-bg text-status-neutral-text px-1.5 py-0.5 rounded">거절됨</span>
                  </div>
                  <p className="text-xs text-txt-tertiary mt-0.5">2026.03.09</p>
                </div>
              </div>
              <button className="text-sm text-txt-tertiary hover:text-txt-primary transition-colors flex items-center gap-1 shrink-0">다른 프로젝트 둘러보기 <ArrowRight size={12} /></button>
            </div>
          </div>

          <div className="bg-surface-card border border-border-strong p-4 bg-status-warning-bg/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 bg-surface-sunken flex items-center justify-center text-sm font-bold text-txt-secondary shrink-0">정하</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-base text-txt-primary">정하은</span>
                    <span className="text-xs bg-status-warning-bg text-status-warning-text px-1.5 py-0.5 rounded">대기중</span>
                  </div>
                  <p className="text-sm text-txt-secondary">디자인 합류 희망합니다!</p>
                  <p className="text-xs text-txt-tertiary mt-1">2026.03.11</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="px-3 py-1.5 text-sm font-semibold bg-accent text-txt-inverse hover:bg-accent-hover">수락</button>
                <button className="px-3 py-1.5 text-sm font-semibold border border-border text-txt-secondary hover:bg-surface-sunken">거절</button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
           5. CTA CARD
           ============================================================ */}
        <SectionLabel label="5. CTACard — 행동 유도" description="사이드바 하단, 빈 상태 등에서 사용." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">

          <div className="bg-surface-inverse p-5 text-txt-inverse">
            <div className="w-10 h-10 bg-surface-card/10 flex items-center justify-center mb-4"><Rocket size={20} /></div>
            <h3 className="font-bold text-base mb-1">팀원을 찾고 계신가요?</h3>
            <p className="text-txt-inverse/70 text-sm mb-4">프로젝트를 등록하고 함께할 팀원을 모집하세요</p>
            <button className="w-full bg-surface-card text-txt-primary text-sm font-semibold py-2 hover:bg-surface-sunken transition-colors flex items-center justify-center gap-1.5"><Plus size={16} /> 프로젝트 등록하기</button>
          </div>

          <div className="bg-surface-card border border-border p-5">
            <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center mb-4"><Coffee size={20} className="text-txt-secondary" /></div>
            <h3 className="font-bold text-base text-txt-primary mb-1">커피챗 해보세요</h3>
            <p className="text-txt-secondary text-sm mb-4">관심 있는 프로젝트 리더와 부담 없이 대화해보세요</p>
            <button className="w-full bg-accent text-txt-inverse text-sm font-semibold py-2 hover:bg-accent-hover transition-colors">둘러보기</button>
          </div>

          <div className="bg-surface-card border border-border p-5 text-center">
            <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center mx-auto mb-3"><FolderOpen size={20} className="text-txt-disabled" /></div>
            <h3 className="font-semibold text-base text-txt-primary mb-1">아직 프로젝트가 없습니다</h3>
            <p className="text-sm text-txt-secondary mb-4">첫 프로젝트를 만들어 팀원을 모집해보세요</p>
            <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-accent text-txt-inverse hover:bg-accent-hover transition-colors"><Plus size={16} /> 프로젝트 만들기</button>
          </div>
        </div>

        {/* ============================================================
           6. PROFILE MINI CARD
           ============================================================ */}
        <SectionLabel label="6. ProfileMiniCard — 사이드바 프로필" description="좌측 사이드바 상단, 네트워크 그리드에서 사용." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">

          <div className="bg-surface-card border border-border p-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-surface-sunken flex items-center justify-center text-xl font-bold text-txt-secondary mb-3">김민</div>
              <h3 className="font-bold text-base text-txt-primary">김민수</h3>
              <p className="text-sm text-txt-secondary mt-0.5">프론트엔드 개발자</p>
              <p className="text-xs text-txt-tertiary mt-1">서울대학교</p>
            </div>
            <button className="w-full mt-4 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold border border-border hover:bg-accent hover:text-txt-inverse hover:border-accent transition-colors">프로필 수정</button>
          </div>

          <div className="bg-surface-card border border-border p-4 group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-surface-sunken flex items-center justify-center text-xl font-bold text-txt-secondary mb-3">이서</div>
              <h3 className="font-bold text-base text-txt-primary">이서연</h3>
              <p className="text-sm text-txt-secondary mt-0.5">PM / 기획자</p>
              <div className="flex gap-1 mt-2">
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-1.5 py-0.5 rounded">PM</span>
                <span className="text-xs bg-tag-default-bg text-tag-default-text px-1.5 py-0.5 rounded">UX</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-card border border-border p-4 group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-surface-sunken flex items-center justify-center text-xl font-bold text-txt-secondary mb-3">박지</div>
              <h3 className="font-bold text-base text-txt-primary">박지훈</h3>
              <p className="text-sm text-txt-secondary mt-0.5">백엔드 개발자</p>
              <span className="text-xs bg-status-success-bg text-status-success-text px-1.5 py-0.5 rounded mt-2 flex items-center gap-0.5"><Coffee size={8} /> 커피챗 가능</span>
            </div>
          </div>

          <div className="bg-surface-card border border-border p-4 group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-surface-sunken flex items-center justify-center text-xl font-bold text-txt-secondary mb-3">최유</div>
              <h3 className="font-bold text-base text-txt-primary">최유진</h3>
              <p className="text-sm text-txt-secondary mt-0.5">디자이너</p>
              <span className="text-xs bg-status-info-bg text-status-info-text px-1.5 py-0.5 rounded mt-2">프로젝트 1개 진행중</span>
            </div>
          </div>
        </div>

        {/* ============================================================
           7. MODAL — 커피챗 신청
           ============================================================ */}
        <SectionLabel label="7. CoffeeChatModal — 커피챗 신청" description="템플릿 선택 → 메시지 작성 2단계. sm 모달." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">

          {/* 스텝 1: 템플릿 선택 (스태틱 프리뷰) */}
          <div className="bg-surface-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-surface-sunken flex items-center justify-center">
                  <Coffee size={16} className="text-txt-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-txt-primary">커피챗 신청</h3>
                  <p className="text-xs text-txt-tertiary">AI 기반 이력서 분석 플랫폼 · 김민수</p>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken transition-colors">
                <X size={16} className="text-txt-tertiary" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs font-mono text-txt-disabled uppercase tracking-wide mb-3">STEP 1 — 어떤 목적인가요?</p>
              <div className="space-y-2">
                {[
                  { icon: '👋', label: '관심 표현', desc: '프로젝트가 흥미로워서 이야기 나눠보고 싶어요' },
                  { icon: '🙋', label: '팀 합류 희망', desc: '이 프로젝트에 팀원으로 참여하고 싶습니다' },
                  { icon: '💡', label: '피드백 / 제안', desc: '아이디어나 기술적 피드백을 드리고 싶어요' },
                  { icon: '✏️', label: '직접 작성', desc: '자유롭게 메시지를 작성할게요' },
                ].map((t, i) => (
                  <button
                    key={i}
                    className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1 ${
                      i === 1
                        ? 'border-accent bg-surface-sunken'
                        : 'border-border hover:border-border-strong hover:bg-surface-sunken'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-txt-primary">{t.label}</p>
                      <p className="text-xs text-txt-tertiary truncate">{t.desc}</p>
                    </div>
                    {i === 1 && <Check size={16} className="text-accent shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border-subtle flex justify-end">
              <button className="px-4 py-2 bg-accent text-txt-inverse text-sm font-semibold hover:bg-accent-hover transition-colors flex items-center gap-1.5">
                다음 <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 스텝 2: 메시지 작성 (스태틱 프리뷰) */}
          <div className="bg-surface-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken transition-colors">
                  <ChevronLeft size={16} className="text-txt-tertiary" />
                </button>
                <div>
                  <h3 className="font-semibold text-base text-txt-primary">메시지 작성</h3>
                  <p className="text-xs text-txt-tertiary">팀 합류 희망 · AI 기반 이력서 분석 플랫폼</p>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken transition-colors">
                <X size={16} className="text-txt-tertiary" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs font-mono text-txt-disabled uppercase tracking-wide mb-3">STEP 2 — 메시지</p>
              {/* 자동 생성된 템플릿 */}
              <div className="bg-surface-sunken p-4 mb-4">
                <p className="text-xs text-txt-tertiary mb-2 flex items-center gap-1"><Star size={10} /> 자동 생성된 메시지</p>
                <p className="text-sm text-txt-secondary leading-relaxed">
                  안녕하세요! 프론트엔드 개발자 이서연입니다. AI 기반 이력서 분석 플랫폼 프로젝트에 팀원으로 합류하고 싶습니다. React와 TypeScript 경험이 있고, AI 서비스 UI에 관심이 많습니다.
                </p>
              </div>
              {/* 편집 가능 텍스트 */}
              <div className="relative">
                <textarea
                  className="w-full h-28 px-4 py-3 text-sm text-txt-primary bg-surface-card border border-border resize-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors placeholder:text-txt-disabled"
                  placeholder="메시지를 수정하거나 추가로 작성하세요..."
                  defaultValue="안녕하세요! 프론트엔드 개발자 이서연입니다. AI 기반 이력서 분석 플랫폼 프로젝트에 팀원으로 합류하고 싶습니다. React와 TypeScript 경험이 있고, AI 서비스 UI에 관심이 많습니다."
                  readOnly
                />
                <span className="absolute bottom-3 right-3 text-xs text-txt-disabled font-mono">142/500</span>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border-subtle flex items-center justify-between">
              <p className="text-xs text-txt-tertiary">상대방 이메일로 알림이 전송됩니다</p>
              <button className="px-5 py-2 bg-accent text-txt-inverse text-sm font-semibold hover:bg-accent-hover transition-colors flex items-center gap-1.5">
                <Send size={14} /> 커피챗 신청
              </button>
            </div>
          </div>
        </div>

        {/* ── 인터랙티브 모달 (실제 동작) ── */}
        <div className="mb-12">
          <button
            onClick={() => { setCoffeeChatOpen(true); setCoffeeChatStep('template'); setCoffeeChatTemplate(null); setCoffeeChatMessage('') }}
            className="px-4 py-2 text-sm font-semibold border border-border hover:bg-accent hover:text-txt-inverse hover:border-accent transition-colors flex items-center gap-1.5"
          >
            <Coffee size={14} /> 인터랙티브 커피챗 모달 열기
          </button>
        </div>

        {/* 인터랙티브 커피챗 모달 */}
        <Modal isOpen={coffeeChatOpen} onClose={() => setCoffeeChatOpen(false)} size="sm" showClose={false} aria-label="커피챗 신청">
          {/* 커스텀 헤더 */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {coffeeChatStep === 'write' ? (
                <button
                  onClick={() => setCoffeeChatStep('template')}
                  className="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken transition-colors"
                >
                  <ChevronLeft size={16} className="text-txt-tertiary" />
                </button>
              ) : (
                <div className="w-8 h-8 bg-surface-sunken flex items-center justify-center">
                  <Coffee size={16} className="text-txt-secondary" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-base text-txt-primary">
                  {coffeeChatStep === 'template' ? '커피챗 신청' : '메시지 작성'}
                </h3>
                <p className="text-xs text-txt-tertiary">
                  {coffeeChatStep === 'template'
                    ? 'AI 기반 이력서 분석 플랫폼 · 김민수'
                    : `${['관심 표현', '팀 합류 희망', '피드백 / 제안', '직접 작성'][coffeeChatTemplate ?? 0]} · AI 기반 이력서 분석 플랫폼`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setCoffeeChatOpen(false)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken transition-colors"
            >
              <X size={16} className="text-txt-tertiary" />
            </button>
          </div>

          {coffeeChatStep === 'template' ? (
            <>
              <div className="p-5">
                <p className="text-xs font-mono text-txt-disabled uppercase tracking-wide mb-3">STEP 1 — 어떤 목적인가요?</p>
                <div className="space-y-2">
                  {[
                    { icon: '👋', label: '관심 표현', desc: '프로젝트가 흥미로워서 이야기 나눠보고 싶어요' },
                    { icon: '🙋', label: '팀 합류 희망', desc: '이 프로젝트에 팀원으로 참여하고 싶습니다' },
                    { icon: '💡', label: '피드백 / 제안', desc: '아이디어나 기술적 피드백을 드리고 싶어요' },
                    { icon: '✏️', label: '직접 작성', desc: '자유롭게 메시지를 작성할게요' },
                  ].map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setCoffeeChatTemplate(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1 ${
                        coffeeChatTemplate === i
                          ? 'border-accent bg-surface-sunken'
                          : 'border-border hover:border-border-strong hover:bg-surface-sunken'
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-txt-primary">{t.label}</p>
                        <p className="text-xs text-txt-tertiary truncate">{t.desc}</p>
                      </div>
                      {coffeeChatTemplate === i && <Check size={16} className="text-accent shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border-subtle flex justify-end">
                <button
                  onClick={() => setCoffeeChatStep('write')}
                  disabled={coffeeChatTemplate === null}
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                    coffeeChatTemplate !== null
                      ? 'bg-accent text-txt-inverse hover:bg-accent-hover'
                      : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'
                  }`}
                >
                  다음 <ChevronRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-5">
                <p className="text-xs font-mono text-txt-disabled uppercase tracking-wide mb-3">STEP 2 — 메시지</p>
                {coffeeChatTemplate !== 3 && (
                  <div className="bg-surface-sunken p-4 mb-4">
                    <p className="text-xs text-txt-tertiary mb-2 flex items-center gap-1"><Star size={10} /> 자동 생성된 메시지</p>
                    <p className="text-sm text-txt-secondary leading-relaxed">
                      {coffeeChatTemplate === 0 && '안녕하세요! 프로젝트가 정말 흥미로워서 연락드립니다. 관련 분야에 관심이 많아 이야기 나눠보고 싶습니다.'}
                      {coffeeChatTemplate === 1 && '안녕하세요! 이 프로젝트에 팀원으로 합류하고 싶습니다. 관련 경험이 있어 기여할 수 있을 것 같습니다.'}
                      {coffeeChatTemplate === 2 && '안녕하세요! 프로젝트를 보고 몇 가지 피드백을 드리고 싶어서 연락드립니다.'}
                    </p>
                  </div>
                )}
                <div className="relative">
                  <textarea
                    className="w-full h-28 px-4 py-3 text-sm text-txt-primary bg-surface-card border border-border resize-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors placeholder:text-txt-disabled"
                    placeholder="메시지를 수정하거나 추가로 작성하세요..."
                    value={coffeeChatMessage}
                    onChange={(e) => setCoffeeChatMessage(e.target.value.slice(0, 500))}
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-txt-disabled font-mono">{coffeeChatMessage.length}/500</span>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border-subtle flex items-center justify-between">
                <p className="text-xs text-txt-tertiary">상대방 이메일로 알림이 전송됩니다</p>
                <button
                  onClick={() => setCoffeeChatOpen(false)}
                  disabled={coffeeChatMessage.length === 0}
                  className={`px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                    coffeeChatMessage.length > 0
                      ? 'bg-accent text-txt-inverse hover:bg-accent-hover'
                      : 'bg-surface-sunken text-txt-disabled cursor-not-allowed'
                  }`}
                >
                  <Send size={14} /> 커피챗 신청
                </button>
              </div>
            </>
          )}
        </Modal>

      </PageContainer>
    </div>
  )
}

/* ============================================================
   헬퍼 컴포넌트
   ============================================================ */
/* ============================================================
   VIEW MODE DEMO — 간단히 / 자세히 토글
   ============================================================ */
function ViewModeDemo() {
  const [viewMode, setViewMode] = useState<'compact' | 'detail'>('detail')
  const [tab, setTab] = useState<'projects' | 'people'>('projects')
  const [sortKey, setSortKey] = useState<string>('title')
  const [sortAsc, setSortAsc] = useState(true)

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const projects = [
    { title: 'AI 기반 이력서 분석 플랫폼', desc: 'GPT-4를 활용해 이력서를 분석하고 맞춤형 피드백을 제공하는 서비스입니다.', roles: ['프론트엔드', 'AI/ML'], tags: ['SaaS'], creator: '김민수', daysLeft: 12, applicants: 3, capacity: 4, status: 'active' as const, color: 'bg-surface-inverse' },
    { title: '캠퍼스 중고거래 앱', desc: '대학교 내 중고거래를 위한 모바일 앱. 위치 기반 매칭 시스템.', roles: ['React Native', '백엔드'], tags: ['모바일'], creator: '이서연', daysLeft: 25, applicants: 1, capacity: 3, status: 'active' as const, color: 'bg-surface-inverse/90', updated: '2일 전' },
    { title: '헬스케어 데이터 대시보드', desc: '환자 데이터 시각화 및 실시간 모니터링 대시보드.', roles: ['데이터 엔지니어', '디자이너'], tags: ['HealthTech'], creator: '박지훈', daysLeft: 2, applicants: 7, capacity: 2, status: 'active' as const, color: 'bg-surface-inverse/95' },
    { title: '대학생 네트워킹 플랫폼', desc: '같은 관심사를 가진 대학생들을 연결하는 소셜 플랫폼.', roles: ['풀스택', 'PM'], tags: ['Social'], creator: '최유진', daysLeft: 18, applicants: 5, capacity: 3, status: 'active' as const, color: 'bg-surface-inverse/85' },
    { title: 'AI 영어 회화 튜터', desc: '음성 인식 + GPT로 실시간 영어 대화 연습.', roles: ['프론트엔드', 'AI/ML'], tags: ['EdTech'], creator: '정하은', daysLeft: 8, applicants: 2, capacity: 4, status: 'active' as const, color: 'bg-surface-inverse' },
    { title: '스터디 그룹 매칭', desc: '시험, 자격증, 코딩 테스트 스터디원을 자동으로 매칭.', roles: ['백엔드', '디자이너'], tags: ['EdTech'], creator: '한소희', daysLeft: 30, applicants: 0, capacity: 5, status: 'active' as const, color: 'bg-surface-inverse/90' },
  ]

  const people = [
    { name: '김민수', role: '프론트엔드 개발자', uni: '서울대학교', bio: 'AI와 디자인의 접점을 탐구하고 있습니다', skills: ['React', 'TypeScript', 'Figma'], status: 'open' as const, color: 'bg-surface-sunken text-txt-secondary', projectCount: 1 },
    { name: '이서연', role: 'PM / 기획자', uni: '연세대학교', bio: '사용자 중심 프로덕트를 만들고 싶어요', skills: ['PM', 'UX리서치', 'Notion'], status: 'coffee' as const, color: 'bg-surface-sunken text-txt-secondary', projectCount: 2 },
    { name: '박지훈', role: '백엔드 개발자', uni: 'KAIST', bio: '확장 가능한 시스템 설계에 관심 있습니다', skills: ['Node.js', 'PostgreSQL', 'AWS'], status: 'open' as const, color: 'bg-surface-sunken text-txt-secondary', projectCount: 3 },
    { name: '최유진', role: '디자이너', uni: '홍익대학교', bio: '브랜딩과 UI/UX 디자인을 합니다', skills: ['Figma', 'Branding', 'Motion'], status: 'busy' as const, color: 'bg-surface-sunken text-txt-secondary', projectCount: 3 },
    { name: '정하은', role: '데이터 사이언티스트', uni: '고려대학교', bio: '데이터로 가치를 만드는 일을 좋아합니다', skills: ['Python', 'TensorFlow', 'SQL'], status: 'open' as const, color: 'bg-surface-sunken text-txt-secondary', projectCount: 1 },
    { name: '한소희', role: '풀스택 개발자', uni: '성균관대학교', bio: '빠르게 만들고 빠르게 검증하는 걸 좋아해요', skills: ['Next.js', 'Supabase', 'Tailwind'], status: 'coffee' as const, color: 'bg-surface-sunken text-txt-secondary', projectCount: 2 },
  ]

  return (
    <div className="mb-12">
      <SectionLabel label="VIEW MODE — 간단히 / 자세히" description="사용자가 뷰 모드를 전환. 같은 데이터를 다른 밀도로 표시." />

      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between mb-4">
        {/* 탭 */}
        <div className="flex items-center gap-1 border-b border-border">
          <button
            onClick={() => setTab('projects')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
              tab === 'projects' ? 'border-accent text-txt-primary' : 'border-transparent text-txt-tertiary hover:text-txt-primary'
            }`}
          >
            <Zap size={14} /> 프로젝트
          </button>
          <button
            onClick={() => setTab('people')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors ${
              tab === 'people' ? 'border-accent text-txt-primary' : 'border-transparent text-txt-tertiary hover:text-txt-primary'
            }`}
          >
            <Users size={14} /> 사람
          </button>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center gap-1 bg-surface-sunken p-1">
          <button
            onClick={() => setViewMode('compact')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'compact' ? 'bg-surface-card text-txt-primary shadow-sharp' : 'text-txt-tertiary hover:text-txt-primary'
            }`}
          >
            간단히
          </button>
          <button
            onClick={() => setViewMode('detail')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'detail' ? 'bg-surface-card text-txt-primary shadow-sharp' : 'text-txt-tertiary hover:text-txt-primary'
            }`}
          >
            자세히
          </button>
        </div>
      </div>

      {/* 프로젝트 그리드 */}
      {tab === 'projects' && (
        <div className={viewMode === 'detail' ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-1'}>
          {projects.map((p) => viewMode === 'detail' ? (
            /* ── 자세히: 커버 이미지 카드 (REF-A 동일 구조) ── */
            <div key={p.title} className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[21.25rem] flex flex-col">
              <div className={`relative h-36 shrink-0 ${p.color} flex items-end p-4`}>
                <div className="absolute top-3 left-3">
                  {p.daysLeft <= 3 ? (
                    <span className="text-xs bg-status-danger-accent/90 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold">D-{p.daysLeft} 마감임박</span>
                  ) : (
                    <span className="text-xs bg-surface-inverse/60 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-semibold">모집중</span>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {p.tags.map(t => (
                    <span key={t} className="text-xs bg-surface-card/15 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-medium">{t}</span>
                  ))}
                  {p.updated && (
                    <span className="text-xs bg-surface-inverse/40 backdrop-blur-sm text-txt-inverse px-2 py-0.5 rounded font-mono">{p.updated}</span>
                  )}
                </div>
                <div className="relative w-10 h-10 bg-surface-card flex items-center justify-center shadow-sharp">
                  <Rocket size={20} className="text-txt-primary" />
                </div>
              </div>
              <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
                <h3 className="font-semibold text-base text-txt-primary mb-1.5 truncate">{p.title}</h3>
                <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                  <span className="text-xs font-mono text-txt-disabled uppercase tracking-wide shrink-0">NEED</span>
                  {p.roles.map(r => (
                    <span key={r} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{r}</span>
                  ))}
                </div>
                <p className="text-sm text-txt-secondary line-clamp-2">{p.desc}</p>
              </div>
              <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
                <div className="flex items-center justify-between w-full pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-surface-sunken flex items-center justify-center text-xs font-bold text-txt-secondary">{p.creator.slice(0, 1)}</div>
                    <span className="text-xs text-txt-tertiary">{p.creator}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-txt-tertiary">
                    <ApplicantBadge applicants={p.applicants} capacity={p.capacity} />
                    <span className={p.daysLeft <= 3 ? 'text-status-danger-text font-semibold' : ''}>D-{p.daysLeft}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null)}

          {/* ── 간단히: 테이블형 리스트 ── */}
          {viewMode === 'compact' && (
            <div>
              {/* 컬럼 헤더 */}
              <div className="flex items-center gap-6 px-5 py-2.5 border-b border-border text-xs font-bold text-txt-tertiary uppercase tracking-wider">
                <div className="w-8 shrink-0" />
                <button onClick={() => toggleSort('title')} className="flex-1 min-w-0 flex items-center gap-1 hover:text-txt-secondary transition-colors text-left">
                  프로젝트명 <SortIcon active={sortKey === 'title'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('roles')} className="hidden md:flex items-center gap-1 w-40 shrink-0 hover:text-txt-secondary transition-colors">
                  모집직군 <SortIcon active={sortKey === 'roles'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('tags')} className="hidden lg:flex items-center gap-1 w-28 shrink-0 hover:text-txt-secondary transition-colors">
                  분야 <SortIcon active={sortKey === 'tags'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('applicants')} className="hidden sm:flex items-center gap-1 w-24 shrink-0 hover:text-txt-secondary transition-colors">
                  지원/모집 <SortIcon active={sortKey === 'applicants'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('daysLeft')} className="flex items-center gap-1 w-24 shrink-0 hover:text-txt-secondary transition-colors">
                  마감 <SortIcon active={sortKey === 'daysLeft'} asc={sortAsc} />
                </button>
              </div>
              {/* 행 */}
              <div className="divide-y divide-border-subtle">
                {[...projects].sort((a, b) => {
                  const dir = sortAsc ? 1 : -1
                  if (sortKey === 'title') return a.title.localeCompare(b.title) * dir
                  if (sortKey === 'roles') return a.roles[0].localeCompare(b.roles[0]) * dir
                  if (sortKey === 'tags') return a.tags[0].localeCompare(b.tags[0]) * dir
                  if (sortKey === 'applicants') return (a.applicants - b.applicants) * dir
                  if (sortKey === 'daysLeft') return (a.daysLeft - b.daysLeft) * dir
                  return 0
                }).map((p) => (
                  <div key={p.title} className="flex items-center gap-6 px-5 py-3.5 hover:bg-surface-sunken transition-colors cursor-pointer group">
                    <div className="w-8 shrink-0">
                      <div className="w-7 h-7 rounded-md bg-surface-sunken flex items-center justify-center text-txt-tertiary group-hover:bg-accent group-hover:text-txt-inverse transition-colors">
                        <Zap size={12} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-txt-primary truncate">{p.title}</h3>
                      <p className="text-xs text-txt-tertiary truncate">{p.desc}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 w-40 shrink-0">
                      {p.roles.slice(0, 2).map(r => (
                        <span key={r} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium truncate max-w-[5rem]">{r}</span>
                      ))}
                    </div>
                    <div className="hidden lg:flex items-center w-28 shrink-0">
                      <span className="text-xs text-txt-secondary bg-surface-sunken px-2 py-0.5 rounded">{p.tags[0]}</span>
                    </div>
                    <div className="hidden sm:flex items-center w-24 shrink-0">
                      <ApplicantBadge applicants={p.applicants} capacity={p.capacity} />
                    </div>
                    <div className="w-24 shrink-0">
                      {p.daysLeft <= 3 ? (
                        <span className="text-xs bg-status-danger-bg text-status-danger-text px-2 py-0.5 rounded font-semibold">D-{p.daysLeft}</span>
                      ) : p.updated ? (
                        <span className="text-xs text-status-success-text font-mono">{p.updated}</span>
                      ) : (
                        <span className="text-xs text-txt-tertiary">D-{p.daysLeft}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 사람 그리드 */}
      {tab === 'people' && (
        <div className={viewMode === 'detail' ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-1'}>
          {people.map((p) => viewMode === 'detail' ? (
            /* ── 자세히: NEW-B 확정 디자인 (가로형 + 상태 푸터) ── */
            <div key={p.name} className="bg-surface-card border border-border overflow-hidden group hover:border-border-strong hover:shadow-sharp transition-all cursor-pointer h-[13.75rem] flex flex-col">
              {/* 헤더: 아바타 + 이름/역할 */}
              <div className="px-4 pt-4 h-[4.75rem] shrink-0">
                <div className="flex gap-3">
                  <div className={`w-12 h-12 ${p.color} flex items-center justify-center text-base font-bold shrink-0`}>
                    {p.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-base text-txt-primary truncate">{p.name}</h3>
                      {p.status === 'open' && <span className="text-xs bg-status-success-bg text-status-success-text px-1.5 py-0.5 rounded shrink-0">OPEN</span>}
                      {p.status === 'coffee' && <span className="text-xs bg-status-info-bg text-status-info-text px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5"><Coffee size={8} /> 커피챗</span>}
                      {p.status === 'busy' && <span className="text-xs bg-status-neutral-bg text-status-neutral-text px-1.5 py-0.5 rounded shrink-0">BUSY</span>}
                    </div>
                    <p className="text-sm text-txt-secondary truncate">{p.role} · {p.uni}</p>
                  </div>
                </div>
              </div>
              {/* 본문: 바이오 + 스킬 */}
              <div className="px-4 h-[5.75rem] shrink-0 overflow-hidden">
                <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">{p.bio}</p>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {p.skills.map(s => (
                    <span key={s} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium shrink-0">{s}</span>
                  ))}
                </div>
              </div>
              {/* 푸터: 상태 표시줄 */}
              <div className="px-4 pb-4 h-[3.25rem] shrink-0 flex items-end">
                <div className="flex items-center justify-between w-full pt-2 border-t border-border-subtle">
                  <span className="text-xs text-txt-tertiary">프로젝트 {p.projectCount}개 진행중</span>
                  {p.status === 'open' && <span className="text-xs text-status-success-text flex items-center gap-1"><Coffee size={10} /> 커피챗 가능</span>}
                  {p.status === 'coffee' && <span className="text-xs text-txt-tertiary flex items-center gap-1"><MessageSquare size={10} /> 평균 응답 3시간</span>}
                  {p.status === 'busy' && <span className="text-xs text-status-neutral-text">현재 팀 합류 불가</span>}
                </div>
              </div>
            </div>
          ) : null)}

          {/* ── 간단히: 테이블형 리스트 ── */}
          {viewMode === 'compact' && (
            <div>
              {/* 컬럼 헤더 */}
              <div className="flex items-center gap-6 px-5 py-2.5 border-b border-border text-xs font-bold text-txt-tertiary uppercase tracking-wider">
                <div className="w-8 shrink-0" />
                <button onClick={() => toggleSort('name')} className="flex-1 min-w-0 flex items-center gap-1 hover:text-txt-secondary transition-colors text-left">
                  이름 <SortIcon active={sortKey === 'name'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('role')} className="hidden md:flex items-center gap-1 w-36 shrink-0 hover:text-txt-secondary transition-colors">
                  직군 <SortIcon active={sortKey === 'role'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('skills')} className="hidden lg:flex items-center gap-1 w-40 shrink-0 hover:text-txt-secondary transition-colors">
                  기술스택 <SortIcon active={sortKey === 'skills'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('uni')} className="hidden sm:flex items-center gap-1 w-32 shrink-0 hover:text-txt-secondary transition-colors">
                  소속 <SortIcon active={sortKey === 'uni'} asc={sortAsc} />
                </button>
                <button onClick={() => toggleSort('status')} className="flex items-center gap-1 w-24 shrink-0 hover:text-txt-secondary transition-colors">
                  상태 <SortIcon active={sortKey === 'status'} asc={sortAsc} />
                </button>
              </div>
              {/* 행 */}
              <div className="divide-y divide-border-subtle">
                {[...people].sort((a, b) => {
                  const dir = sortAsc ? 1 : -1
                  if (sortKey === 'name') return a.name.localeCompare(b.name) * dir
                  if (sortKey === 'role') return a.role.localeCompare(b.role) * dir
                  if (sortKey === 'skills') return a.skills[0].localeCompare(b.skills[0]) * dir
                  if (sortKey === 'uni') return a.uni.localeCompare(b.uni) * dir
                  if (sortKey === 'status') return a.status.localeCompare(b.status) * dir
                  return 0
                }).map((p) => (
                  <div key={p.name} className={`flex items-center gap-6 px-5 py-3.5 hover:bg-surface-sunken transition-colors cursor-pointer group ${p.status === 'busy' ? 'opacity-60' : ''}`}>
                    <div className="w-8 shrink-0">
                      <div className={`w-7 h-7 ${p.color} flex items-center justify-center text-xs font-bold`}>
                        {p.name.slice(0, 2)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-txt-primary truncate">{p.name}</h3>
                      <p className="text-xs text-txt-tertiary truncate">{p.bio}</p>
                    </div>
                    <div className="hidden md:flex items-center w-36 shrink-0">
                      <span className="text-xs text-txt-secondary truncate">{p.role}</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-1 w-40 shrink-0">
                      {p.skills.slice(0, 2).map(s => (
                        <span key={s} className="text-xs bg-tag-default-bg text-tag-default-text px-2 py-0.5 rounded font-medium truncate max-w-[5rem]">{s}</span>
                      ))}
                    </div>
                    <div className="hidden sm:flex items-center w-32 shrink-0">
                      <span className="text-xs text-txt-tertiary truncate">{p.uni}</span>
                    </div>
                    <div className="w-24 shrink-0">
                      {p.status === 'open' && <span className="text-xs bg-status-success-bg text-status-success-text px-2 py-0.5 rounded">OPEN</span>}
                      {p.status === 'coffee' && <span className="text-xs bg-status-info-bg text-status-info-text px-2 py-0.5 rounded flex items-center gap-0.5"><Coffee size={8} /> 커피챗</span>}
                      {p.status === 'busy' && <span className="text-xs bg-status-neutral-bg text-status-neutral-text px-2 py-0.5 rounded">BUSY</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApplicantBadge({ applicants, capacity }: { applicants: number; capacity: number }) {
  const ratio = capacity > 0 ? applicants / capacity : 0
  const isHot = ratio >= 2     // 2배 이상 지원 = 🔥 인기
  const isOver = ratio > 1     // 정원 초과
  const isFull = applicants >= capacity && !isOver

  return (
    <span className={`text-xs font-mono inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
      isHot ? 'bg-status-danger-bg text-status-danger-text font-semibold' :
      isOver ? 'bg-status-warning-bg text-status-warning-text font-semibold' :
      isFull ? 'bg-status-success-bg text-status-success-text' :
      applicants === 0 ? 'text-txt-disabled' :
      'text-txt-secondary'
    }`}>
      {applicants}/{capacity}
      {isHot && <Flame size={10} className="text-status-danger-text" />}
      {isOver && !isHot && <span className="text-status-warning-text">!</span>}
    </span>
  )
}

function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <span className={`inline-flex flex-col gap-0 ml-0.5 ${active ? 'text-txt-primary' : 'text-txt-disabled'}`}>
      <ChevronRight size={8} className={`-rotate-90 ${active && asc ? 'text-txt-primary' : ''}`} style={{ marginBottom: '-2px' }} />
      <ChevronRight size={8} className={`rotate-90 ${active && !asc ? 'text-txt-primary' : ''}`} style={{ marginTop: '-2px' }} />
    </span>
  )
}

function SectionLabel({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-4 pb-3 border-b border-border">
      <h2 className="text-base font-bold text-txt-primary">{label}</h2>
      <p className="text-sm text-txt-secondary mt-0.5">{description}</p>
    </div>
  )
}
