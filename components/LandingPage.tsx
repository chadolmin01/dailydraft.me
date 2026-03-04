import React, { useState } from 'react';
import {
  Users, FileText, ArrowRight,
  MessageSquare, Briefcase, Plus, Minus, Rocket
} from 'lucide-react';
import { OpportunitySlidePanel } from './OpportunitySlidePanel';
import { motion } from 'framer-motion';
import { useWaitlistCount } from '../src/hooks/useWaitlistCount';
import { useWaitlistOpportunities } from '../src/hooks/useWaitlistOpportunities';

interface LandingPageProps {
  onLogin: () => void;
  onDemo?: () => void;
  isDemo?: boolean;
}

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// --- Mock UI Components ---

// Project Feed Mock for Hero section - shows project cards with community feel
const MockProjectFeed = () => (
  <div className="w-full bg-white rounded-none border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
    {/* Feed Header */}
    <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-600">LIVE PROJECTS</span>
      </div>
      <span className="text-[10px] text-gray-400 font-mono">3 NEW TODAY</span>
    </div>

    {/* Project Cards */}
    <div className="divide-y divide-gray-100">
      {/* Project Card 1 */}
      <div className="p-4 hover:bg-blue-50/30 transition-colors cursor-pointer group">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">JK</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600">대학생 중고거래 플랫폼</span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 break-keep">에브리타임 연동으로 학교 인증된 사용자 간 중고거래. 신뢰 기반 캠퍼스 마켓.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono">프론트엔드</span>
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 font-mono">서울대 경영</span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 12 피드백</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 3 관심</span>
        </div>
      </div>

      {/* Project Card 2 */}
      <div className="p-4 hover:bg-blue-50/30 transition-colors cursor-pointer group">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">YH</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600">AI 학습 플래너</span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 break-keep">개인 학습 패턴 분석으로 최적의 공부 시간표 생성. 시험 준비 효율화.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 font-mono">백엔드</span>
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 font-mono">연세대 컴공</span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 8 피드백</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 5 관심</span>
        </div>
      </div>

      {/* Project Card 3 */}
      <div className="p-4 hover:bg-blue-50/30 transition-colors cursor-pointer group">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">MJ</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600">캠퍼스 밀키트</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 break-keep">자취생 타겟 소포장 밀키트. 기숙사/원룸 1인분 간편 요리 구독.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 font-mono">기획/마케팅</span>
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 font-mono">고려대 경제</span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 15 피드백</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 7 관심</span>
        </div>
      </div>
    </div>
  </div>
);

// --- Sections ---

const Header: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-6 h-6 bg-black flex items-center justify-center text-white font-bold text-xs font-mono group-hover:rotate-12 transition-transform">
            D
          </div>
          <span className="font-bold text-lg tracking-tight font-sans">Draft.</span>
        </div>

        <div className="flex items-center space-x-6">
           {/* Navigation Links - Desktop only */}
           <nav className="hidden md:flex items-center space-x-6">
             <button
               onClick={() => scrollToSection('features')}
               className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
             >
               기능
             </button>
             <button
               onClick={() => scrollToSection('faq')}
               className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
             >
               FAQ
             </button>
           </nav>

           <button
             onClick={onLogin}
             className="text-sm font-medium text-gray-500 hover:text-black hidden sm:block font-mono"
           >
             Log in
           </button>
           <button
             onClick={onLogin}
             className="bg-black text-white text-xs px-5 py-2.5 hover:bg-gray-800 transition-colors font-mono font-medium flex items-center gap-2"
           >
             GET STARTED <ArrowRight className="w-3 h-3" />
           </button>
        </div>
      </div>
    </header>
  );
};

const Hero: React.FC<{ onOpenSlidePanel: () => void; onDemo?: () => void; isDemo?: boolean }> = ({ onOpenSlidePanel, onDemo, isDemo }) => {
  const { data: waitlistCount, isLoading: isCountLoading } = useWaitlistCount();

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center relative overflow-hidden min-h-screen gap-12 lg:gap-16">
      <div className="absolute inset-0 grid-bg -z-10 opacity-60"></div>

      {/* Decorative Lines - Hidden on mobile/tablet to clean up view */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-gray-100 hidden 2xl:block"></div>
      <div className="absolute right-10 top-0 bottom-0 w-px bg-gray-100 hidden 2xl:block"></div>

      {/* Left Column: Text Content */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-1/2 text-center lg:text-left relative z-10"
      >
        <div className="inline-flex items-center px-3 py-1 bg-white border border-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] lg:mx-0 mx-auto">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase">System Operational v2.0</span>
        </div>

        <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tighter text-slate-900 mb-8 leading-[1.1] break-keep">
          모든 프로젝트는<br />
          <span className="relative inline-block text-blue-600 mx-2">Draft<svg className="absolute w-full h-3 bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.5" /></svg></span>에서 시작됩니다
        </h1>

        <p className="text-lg text-gray-600 mb-6 leading-relaxed break-keep lg:mx-0 mx-auto max-w-xl lg:max-w-none">
          프로젝트를 공유하고, 피드백 받고, 함께할 사람을 만나세요.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4 mb-6">
          <button
            onClick={onOpenSlidePanel}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200/50 group"
          >
            AI로 30초 만에 공고 만들기
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Waitlist Count */}
        {!isCountLoading && waitlistCount !== undefined && waitlistCount > 0 && (
          <div className="flex items-center lg:justify-start justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-none">
              <span className="text-sm font-medium text-gray-700">
                현재 <span className="font-bold">{waitlistCount.toLocaleString()}</span>명이 대기 중입니다
              </span>
            </div>
          </div>
        )}

        {/* Demo Button */}
        {isDemo && onDemo && (
          <div className="flex flex-row flex-wrap items-center lg:justify-start justify-center gap-3 mb-6">
            <button
              onClick={onDemo}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 font-medium transition-all flex items-center gap-2 border border-gray-700"
            >
              <Rocket className="w-4 h-4" />
              데모 체험하기
            </button>
            <span className="text-xs text-gray-500 font-mono">· 로그인 없이 바로 체험</span>
          </div>
        )}

        <div className="flex flex-wrap items-center lg:justify-start justify-center gap-4 sm:gap-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
           <span>Free Beta Access</span>
           <span className="hidden sm:inline">.</span>
           <span>No Credit Card</span>
           <span className="hidden sm:inline">.</span>
           <span>Cancel Anytime</span>
        </div>
      </motion.div>

      {/* Right Column: Project Feed Visual */}
      <motion.div
         initial={{ opacity: 0, x: 30 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
         className="w-full lg:w-1/2 relative px-4 lg:px-0"
      >
         <div className="relative group">
            {/* Project Feed */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
               <MockProjectFeed />
            </motion.div>
         </div>
      </motion.div>
    </section>
  );
};



// Seed data for opportunity cards (simplified to match AI-generated format)
const seedOpportunities = [
  {
    id: 'seed-1',
    title: 'AI 헬스케어 앱',
    description: '개인 맞춤형 건강 관리 서비스를 개발합니다. AI로 건강 데이터를 분석하고 맞춤 솔루션을 제공합니다.',
    roles: ['백엔드 개발자'],
    field: '헬스케어',
  },
  {
    id: 'seed-2',
    title: '에듀테크 플랫폼',
    description: 'AI 기반 맞춤형 학습 솔루션을 만듭니다. 학생 개개인에게 최적화된 학습 경험을 제공합니다.',
    roles: ['프론트엔드 개발자'],
    field: '에듀테크',
  },
  {
    id: 'seed-3',
    title: '핀테크 솔루션',
    description: '소상공인을 위한 결제/정산 플랫폼입니다. 간편한 금융 서비스로 사업 운영을 돕습니다.',
    roles: ['PM', '기획자'],
    field: '핀테크',
  },
  {
    id: 'seed-4',
    title: '소셜임팩트 스타트업',
    description: '지역 사회 문제를 기술로 해결하는 플랫폼입니다. 사회적 가치와 비즈니스 성장을 함께 추구합니다.',
    roles: ['디자이너'],
    field: '소셜임팩트',
  },
];

interface OpportunitySectionProps {
  onOpenSlidePanel: () => void;
}

const OpportunitySection: React.FC<OpportunitySectionProps> = ({ onOpenSlidePanel }) => {
  const { opportunities: realOpportunities, loading } = useWaitlistOpportunities(4);

  // Combine real opportunities with seed data to always show 4 cards
  const displayOpportunities = React.useMemo(() => {
    const realMapped = realOpportunities.map((opp) => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      roles: opp.roles,
      field: opp.field,
      isReal: true,
    }));

    // Fill remaining slots with seed data
    const remainingCount = Math.max(0, 4 - realMapped.length);
    const seedFill = seedOpportunities.slice(0, remainingCount).map(s => ({ ...s, isReal: false }));

    return [...realMapped, ...seedFill];
  }, [realOpportunities]);

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-200 relative">
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-orange-300 bg-orange-50 mb-6">
            <Rocket className="w-3 h-3 text-orange-500" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-orange-600">LIVE PROJECTS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight break-keep">
            지금 <span className="text-blue-600">팀원을 찾고 있는</span> 프로젝트들
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed break-keep">
            실제로 함께할 팀원을 모집하고 있는 프로젝트입니다.<br className="hidden sm:block" />
            당신의 아이디어도 여기에 등록해보세요.
          </p>
        </motion.div>

        {/* Opportunity Cards Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {displayOpportunities.map((opp) => (
            <motion.div
              key={opp.id}
              variants={fadeInUp}
              className={`bg-white border hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all group cursor-pointer ${
                opp.isReal
                  ? 'border-blue-300 hover:border-blue-500'
                  : 'border-gray-200 hover:border-black'
              }`}
            >
              <div className="p-6">
                {/* New Badge for real opportunities */}
                {opp.isReal && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold mb-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    NEW
                  </div>
                )}

                {/* Title */}
                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {opp.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 break-keep line-clamp-2">{opp.description}</p>

                {/* Roles */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {opp.roles.map((role) => (
                    <div key={role} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                      <Briefcase className="w-3 h-3" />
                      {role}
                    </div>
                  ))}
                </div>

                {/* Field */}
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 font-mono">
                  {opp.field}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={onOpenSlidePanel}
            className="bg-black hover:bg-gray-800 text-white px-8 py-4 font-bold text-lg transition-all flex items-center justify-center gap-3 group mx-auto shadow-[4px_4px_0px_0px_rgba(0,82,204,0.3)]"
          >
            AI로 30초 만에 공고 만들기
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-gray-500">
            로그인 없이 바로 시작할 수 있어요
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: 1,
      icon: FileText,
      title: '프로젝트 올리기',
      description: '아이디어 단계든 진행 중이든, 고민 포인트와 함께 공유하세요.',
    },
    {
      step: 2,
      icon: MessageSquare,
      title: '피드백 받고 탐색하기',
      description: '다른 사람들의 훈수를 받고, 관심 가는 프로젝트에 관심 표현하세요.',
    },
    {
      step: 3,
      icon: Users,
      title: '커피챗으로 만나기',
      description: '마음 맞으면 가볍게 만나서 이야기 나눠보세요.',
    },
  ];

  return (
    <section id="features" className="py-24 bg-white border-t border-gray-200 relative">
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-gray-300 bg-gray-50 mb-6">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-600">HOW IT WORKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight break-keep">
            시작은 <span className="text-blue-600">간단</span>합니다
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed break-keep">
            복잡한 절차 없이, 3단계로 함께할 사람을 만나보세요.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((item) => (
            <motion.div
              key={item.step}
              variants={fadeInUp}
              className="relative bg-white border border-gray-200 p-8 hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] transition-all group"
            >
              {/* Step Number Badge */}
              <div className="absolute -top-4 left-8 bg-black text-white w-8 h-8 flex items-center justify-center font-mono font-bold text-sm">
                {item.step}
              </div>

              {/* Icon */}
              <div className="w-14 h-14 bg-gray-50 border border-gray-200 flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                <item.icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed break-keep">{item.description}</p>

              {/* Connector Line (between cards) */}
              {item.step < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-gray-300"></div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

interface CommunityFeedbackProps {
  onOpenSlidePanel: () => void;
}

const CommunityFeedback: React.FC<CommunityFeedbackProps> = ({ onOpenSlidePanel }) => {
  const feedbackComments = [
    {
      id: 1,
      author: '김OO',
      school: '연대 경영',
      comment: '타겟을 대학생으로 좁히는 게 낫지 않을까요? 범용 중고거래는 당근이 너무 강해서...',
      avatar: 'KO',
      avatarBg: 'bg-blue-500',
    },
    {
      id: 2,
      author: '이OO',
      school: '카이스트 전산',
      comment: '당근마켓이랑 차별점이 뭔가요? 학교 인증 말고 다른 킬러 피처가 필요할 것 같아요.',
      avatar: 'LO',
      avatarBg: 'bg-green-600',
    },
    {
      id: 3,
      author: '박OO',
      school: '서울대 창업',
      comment: 'MVP는 에브리타임 연동부터 해보는 건 어때요? 이미 학생들이 거래 글 올리더라구요.',
      avatar: 'PO',
      avatarBg: 'bg-purple-600',
    },
  ];

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-200 relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-blue-300 bg-blue-50 mb-6">
            <MessageSquare className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-blue-600">COMMUNITY FEEDBACK</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight break-keep">
            여러 학교의 <span className="text-blue-600">다양한 시선</span>으로<br className="hidden sm:block" />
            프로젝트를 발전시켜요
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed break-keep">
            스택오버플로우처럼, 레딧처럼.<br className="hidden sm:block" />
            솔직한 피드백이 프로젝트를 더 강하게 만듭니다.
          </p>
        </motion.div>

        {/* Feedback Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          {/* Project Card */}
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">JK</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-xl text-gray-900">대학생 중고거래 플랫폼</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 font-mono">IDEA</span>
                  </div>
                  <p className="text-gray-600 mb-3 break-keep">
                    에브리타임 연동으로 학교 인증된 사용자끼리 중고거래할 수 있는 플랫폼입니다.
                    기숙사/학교 근처 직거래 위주로, 배송비 없이 저렴하게 거래할 수 있어요.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-medium">프론트엔드 개발자 구함</span>
                    <span className="text-[10px] px-2 py-1 bg-gray-100 border border-gray-200 text-gray-600 font-mono">서울대 경영</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">피드백 {feedbackComments.length}개</span>
              </div>

              <div className="space-y-4">
                {feedbackComments.map((fb) => (
                  <div key={fb.id} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${fb.avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                        {fb.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-gray-900">{fb.author}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 font-mono">{fb.school}</span>
                        </div>
                        <p className="text-sm text-gray-600 break-keep">{fb.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={onOpenSlidePanel}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 font-bold text-lg transition-all flex items-center justify-center gap-3 group mx-auto shadow-lg shadow-blue-200/50"
            >
              나도 프로젝트 올리고 피드백 받기
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs = [
    {
      id: 'free',
      question: 'Draft는 무료인가요?',
      answer: '네, 현재 베타 기간 동안 모든 핵심 기능을 무료로 이용하실 수 있습니다. 정식 출시 후에도 기본 기능은 무료로 제공될 예정이며, 프리미엄 기능은 유료 플랜으로 제공됩니다.',
    },
    {
      id: 'project',
      question: '어떤 프로젝트를 올릴 수 있나요?',
      answer: '아이디어 단계부터 진행 중인 프로젝트까지 모두 환영합니다. 스타트업 아이디어, 사이드 프로젝트, 학교 과제, 공모전 준비 등 함께할 사람이 필요한 모든 프로젝트를 올릴 수 있어요.',
    },
    {
      id: 'feedback',
      question: '피드백은 어떻게 받나요?',
      answer: '프로젝트를 올리면 다른 학교, 다른 전공의 사람들이 자유롭게 의견을 남길 수 있어요. 솔직한 훈수부터 건설적인 제안까지, 다양한 시선으로 프로젝트를 발전시킬 수 있습니다.',
    },
    {
      id: 'coffeechat',
      question: '커피챗은 어떻게 진행되나요?',
      answer: '관심 있는 프로젝트나 사람에게 커피챗을 신청할 수 있어요. 양쪽이 동의하면 연락처가 공유되고, 카페나 학교에서 가볍게 만나 이야기를 나눌 수 있습니다.',
    },
    {
      id: 'privacy',
      question: '개인정보는 어떻게 보호되나요?',
      answer: '모든 데이터는 암호화되어 저장되며, 프로필 공개 범위를 직접 설정할 수 있습니다. 연락처 등 민감 정보는 양측이 커피챗에 동의한 후에만 공유됩니다.',
    },
  ];

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-24 bg-white border-t border-gray-200 relative">
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none"></div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-gray-300 bg-gray-50 mb-6">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-600">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight break-keep">
            자주 묻는 <span className="text-blue-600">질문</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed break-keep">
            Draft에 대해 궁금한 점을 확인해보세요.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {faqs.map((faq) => (
            <motion.div
              key={faq.id}
              variants={fadeInUp}
              className="border border-gray-200 bg-white hover:border-gray-300 transition-colors"
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-bold text-slate-900 pr-4">{faq.question}</span>
                <div className="shrink-0 w-6 h-6 bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {openId === faq.id ? (
                    <Minus className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openId === faq.id ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5 text-gray-600 leading-relaxed break-keep">
                  {faq.answer}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const FinalCTA: React.FC<{ onLogin: () => void; onDemo?: () => void; isDemo?: boolean }> = ({ onLogin, onDemo, isDemo }) => {
    return (
        <section className="py-24 bg-black text-white relative overflow-hidden">
            <div className="grid-bg-dark absolute inset-0 opacity-20 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 tracking-tighter">
                    Ready to launch<br/>your <span className="text-blue-500">Draft</span>?
                </h2>
                <p className="text-gray-400 mb-10 text-lg max-w-2xl mx-auto leading-relaxed break-keep">
                    지금 시작하고, 초기 창업자를 위한 모든 기능을<br className="hidden sm:block"/>
                    가장 먼저 경험해보세요.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                    {isDemo && onDemo ? (
                      <button
                        onClick={onDemo}
                        className="bg-blue-600 text-white px-8 py-4 font-bold text-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 group w-full sm:w-auto"
                      >
                        <Rocket className="w-5 h-5" />
                        데모 체험하기
                      </button>
                    ) : (
                      <button
                        onClick={onLogin}
                        className="bg-blue-600 text-white px-8 py-4 font-bold text-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 group w-full sm:w-auto"
                      >
                        GET STARTED <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                </div>

                <p className="mt-8 text-xs font-mono text-gray-600 tracking-widest uppercase">
                    로그인 없이 바로 시작할 수 있어요
                </p>

                {/* Instagram CTA */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <p className="text-gray-400 mb-4 text-sm">최신 소식과 업데이트를 받아보세요</p>
                    <a
                      href="https://instagram.com/dailydraft_me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-6 py-3 font-bold hover:opacity-90 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      @dailydraft_me 팔로우하기
                    </a>
                </div>
            </div>

            <div className="absolute top-10 left-10 w-20 h-20 border-l border-t border-gray-800 hidden sm:block"></div>
            <div className="absolute bottom-10 right-10 w-20 h-20 border-r border-b border-gray-800 hidden sm:block"></div>
        </section>
    );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 pr-8">
               <span className="font-bold text-xl tracking-tight text-gray-900 block mb-4 font-sans">Draft.</span>
               <p className="text-sm text-gray-500 mb-6 leading-relaxed break-keep">
                  프로젝트를 공유하고,<br/>
                  함께할 사람을 만나는 공간.
               </p>
               <div className="flex gap-4">
                  <a href="https://instagram.com/dailydraft_me" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-gray-200 transition-colors"><span className="font-bold text-xs">IG</span></a>
               </div>
            </div>

            <div>
               <h4 className="font-bold text-sm mb-4 font-mono uppercase tracking-wider">Service</h4>
               <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#features" className="hover:text-black transition-colors">프로젝트</a></li>
                  <li><a href="#features" className="hover:text-black transition-colors">커뮤니티</a></li>
                  <li><a href="#faq" className="hover:text-black transition-colors">FAQ</a></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-sm mb-4 font-mono uppercase tracking-wider">Company</h4>
               <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-black transition-colors">팀 소개</a></li>
                  <li><a href="#" className="hover:text-black transition-colors">채용</a></li>
                  <li><a href="#" className="hover:text-black transition-colors">문의하기</a></li>
               </ul>
            </div>

             <div>
               <h4 className="font-bold text-sm mb-4 font-mono uppercase tracking-wider">Contact</h4>
               <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="https://instagram.com/dailydraft_me" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Instagram</a></li>
                  <li><a href="mailto:team@dailydraft.me" className="hover:text-black transition-colors">team@dailydraft.me</a></li>
                  <li><a href="tel:010-4631-9554" className="hover:text-black transition-colors">010-4631-9554</a></li>
               </ul>
            </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-mono">
            <p>2026 Draft Inc. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
               <span>Seoul, Korea</span>
               <span>한국어</span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onDemo, isDemo }) => {
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-100 text-slate-900 bg-white">
      <Header onLogin={scrollToWaitlist} />
      <main>
        <Hero onOpenSlidePanel={() => setIsSlideOpen(true)} onDemo={onDemo} isDemo={isDemo} />
        <HowItWorks />
        <CommunityFeedback onOpenSlidePanel={() => setIsSlideOpen(true)} />
        <OpportunitySection onOpenSlidePanel={() => setIsSlideOpen(true)} />
        <FAQ />
        <FinalCTA onLogin={scrollToWaitlist} onDemo={onDemo} isDemo={isDemo} />
      </main>
      <Footer />

      {/* AI Opportunity Slide Panel */}
      <OpportunitySlidePanel
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
      />

      {/* Demo Mode Floating Button */}
      {isDemo && onDemo && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={onDemo}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm transition-all hover:scale-105"
          >
            <Rocket size={18} />
            데모 체험하기
          </button>
        </div>
      )}
    </div>
  );
};
