import React, { useState } from 'react';
import {
  Sparkles, Users, Calendar, FileText, ArrowRight, CheckCircle2,
  LayoutGrid, Clock, Target, MessageSquare, Zap, Briefcase,
  ChevronRight, Plus, Minus, Search, Settings, Share2, BarChart3,
  AlertTriangle, FileQuestion, Unplug, XCircle, Rocket, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../src/lib/supabase/client';

interface LandingPageProps {
  onLogin: () => void;
  onDemo?: () => void;
  isDemo?: boolean;
}

// --- Components Helpers ---

// A technical crosshair marker often seen in blueprints
const Crosshair = ({ className }: { className?: string }) => (
  <div className={`absolute w-3 h-3 pointer-events-none ${className}`}>
    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20"></div>
    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-black/20"></div>
  </div>
);

// A section divider with measurements
const TechnicalDivider = () => (
  <div className="w-full h-px bg-gray-200 relative my-12">
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-black"></div>
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-black"></div>
    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-mono text-gray-400">
      SECTION BREAK
    </div>
  </div>
);

// Animation Variants
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

const MockDashboardUI = () => (
  <div className="w-full bg-white rounded-none border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row h-full min-h-[400px]">
    {/* Sidebar */}
    <div className="w-16 border-r border-gray-200 flex flex-col items-center py-6 gap-6 bg-white hidden md:flex shrink-0">
      <div className="w-8 h-8 bg-black flex items-center justify-center text-white font-bold font-mono">D.</div>
      <div className="flex flex-col gap-6 mt-8">
        <div className="p-2 bg-gray-100 rounded"><LayoutGrid className="w-5 h-5 text-black" /></div>
        <Briefcase className="w-5 h-5 text-gray-400 hover:text-black transition-colors cursor-pointer" />
        <Users className="w-5 h-5 text-gray-400 hover:text-black transition-colors cursor-pointer" />
        <FileText className="w-5 h-5 text-gray-400 hover:text-black transition-colors cursor-pointer" />
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 bg-white p-0 relative min-w-0">
      <div className="grid-bg absolute inset-0 opacity-50 pointer-events-none"></div>

      <div className="p-4 sm:p-5 relative z-10">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end mb-6 border-b border-gray-100 pb-4 gap-4">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400 font-mono tracking-widest whitespace-nowrap">WORKSPACE / MAIN</span>
             </div>
             <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Dashboard</h3>
          </div>
          <button className="bg-black hover:bg-gray-800 text-white text-xs px-3 py-1.5 flex items-center gap-2 font-mono transition-colors whitespace-nowrap">
             <Plus className="w-3 h-3" /> NEW
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-gray-200 mb-6 bg-gray-50">
           {/* Card 1 */}
           <div className="bg-white p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-gray-200 relative group">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-xs font-mono shrink-0">P1</div>
                 <div className="min-w-0">
                    <div className="font-bold text-sm truncate">Project Alpha</div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">STRATEGY</div>
                 </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                 <span className="bg-gray-100 px-1.5 py-0.5 border border-gray-200">SEOUL</span>
              </div>
           </div>

           {/* Card 2 */}
           <div className="bg-white p-3 sm:p-4 border-b sm:border-b-0 lg:border-r border-gray-200 flex flex-col justify-between">
              <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Total Views</div>
              <div>
                <div className="text-2xl font-bold text-gray-900 font-mono tracking-tighter">1,240</div>
                <div className="text-[10px] text-green-600 mt-1 font-mono">+12%</div>
              </div>
           </div>

           {/* Card 3 */}
           <div className="bg-blue-50/30 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden sm:col-span-2 lg:col-span-1">
               <div className="absolute top-0 right-0 w-8 h-8 border-l border-b border-blue-200"></div>
               <div className="flex justify-between items-start">
                  <div className="text-[10px] text-blue-600 font-mono uppercase tracking-wider">Req</div>
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
               </div>
               <div>
                  <div className="text-2xl font-bold text-blue-900 font-mono tracking-tighter">04</div>
                  <div className="text-[10px] text-blue-600 mt-1 font-mono">WAITING</div>
               </div>
           </div>
        </div>

        {/* Recommended Section */}
        <div className="border border-gray-200 p-1">
           <div className="flex justify-between items-center bg-gray-50 px-3 py-2 border-b border-gray-200 mb-1">
              <h4 className="font-bold text-xs text-gray-900 font-mono uppercase">Opportunities</h4>
              <span className="text-[10px] text-gray-400 font-mono cursor-pointer hover:text-black">ALL</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {/* Dark Card */}
              <div className="bg-[#111] p-4 text-white relative group">
                 <div className="absolute top-3 right-3 border border-gray-700 px-1.5 py-0.5 text-[10px] font-mono text-green-400">98%</div>
                 <div className="mb-3">
                    <span className="text-[10px] font-mono text-gray-500 block mb-1">SEED STAGE</span>
                    <h5 className="font-bold text-sm leading-tight break-keep">AI Pet Health<br/>Platform</h5>
                 </div>
              </div>

               {/* Blue Card */}
               <div className="bg-blue-600 p-4 text-white relative">
                 <div className="absolute top-3 right-3 bg-blue-500 px-1.5 py-0.5 text-[10px] font-mono border border-blue-400">85%</div>
                 <div className="mb-3">
                    <span className="text-[10px] font-mono text-blue-200 block mb-1">GOV SUPPORT</span>
                    <h5 className="font-bold text-sm leading-tight break-keep">2026 예비창업<br/>패키지 모집</h5>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
);

const MockAICard = () => (
   <div className="bg-white rounded-none border border-black shadow-[8px_8px_0px_0px_#111] max-w-sm w-full relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <div className="bg-black p-4 text-white flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono font-bold tracking-wider">AI ANALYSIS</span>
         </div>
         <span className="text-[10px] font-mono text-gray-400">v2.4</span>
      </div>

      <div className="p-5 relative">
         <div className="grid-bg absolute inset-0 opacity-30"></div>
         <div className="relative z-10">
            <div className="mb-4">
               <h4 className="text-lg font-bold mb-1 tracking-tight">Matches Found</h4>
               <p className="text-[10px] text-gray-500 font-mono">BASED ON VISION</p>
            </div>

            {/* Match Item 1 */}
            <div className="bg-white border border-blue-200 p-2.5 mb-2 relative hover:border-blue-600 transition-colors cursor-pointer group shadow-sm">
               <div className="absolute -left-[1px] top-0 bottom-0 w-1 bg-blue-600"></div>
               <div className="flex justify-between items-start mb-2 pl-2">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-100 flex items-center justify-center font-bold text-xs shrink-0">SJ</div>
                     <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-blue-600">Sarah Jin</div>
                        <div className="text-[10px] text-gray-500 font-mono">ANGEL INVESTOR</div>
                     </div>
                  </div>
                  <div className="text-blue-600 text-sm font-mono font-bold">94%</div>
               </div>
               <div className="pl-2 w-full bg-gray-100 h-1 mt-2">
                  <div className="bg-blue-600 h-full w-[94%]"></div>
               </div>
            </div>

            {/* Match Item 2 */}
            <div className="bg-white border border-gray-200 p-2.5 relative opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
               <div className="flex justify-between items-start mb-2 pl-2">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-100 flex items-center justify-center font-bold text-xs shrink-0">DC</div>
                     <div>
                        <div className="font-bold text-sm text-gray-900">David Choi</div>
                        <div className="text-[10px] text-gray-500 font-mono">SENIOR BACKEND</div>
                     </div>
                  </div>
                  <div className="text-gray-600 text-sm font-mono font-bold">88%</div>
               </div>
               <div className="pl-2 w-full bg-gray-100 h-1 mt-2">
                  <div className="bg-gray-400 h-full w-[88%]"></div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
         <button className="text-[10px] font-mono font-bold text-gray-600 hover:text-black flex items-center justify-center gap-2 w-full transition-colors">
            VIEW REPORT <ArrowRight className="w-3 h-3" />
         </button>
      </div>
   </div>
);

// --- Sections ---

const Header: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
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

const Hero: React.FC<{ onLogin: () => void; onDemo?: () => void; isDemo?: boolean }> = ({ onLogin, onDemo, isDemo }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email: email.toLowerCase().trim() });

      if (error) {
        // Check for duplicate email (unique constraint violation)
        if (error.code === '23505') {
          setStatus('duplicate');
          setTimeout(() => {
            setStatus('idle');
            onLogin(); // Still go to login for existing waitlist users
          }, 2000);
        } else {
          console.error('Waitlist error:', error);
          setStatus('error');
          setErrorMessage('오류가 발생했습니다. 다시 시도해주세요.');
          setTimeout(() => setStatus('idle'), 3000);
        }
      } else {
        setStatus('success');
        setEmail('');
        setTimeout(() => {
          setStatus('idle');
          onLogin(); // Go to signup after successful waitlist submission
        }, 2000);
      }
    } catch (err) {
      console.error('Waitlist error:', err);
      setStatus('error');
      setErrorMessage('네트워크 오류가 발생했습니다.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return '신청 완료!';
      case 'duplicate':
        return '이미 신청됨!';
      case 'error':
        return '다시 시도';
      default:
        return '사전 예약하기';
    }
  };

  const getButtonStyle = () => {
    switch (status) {
      case 'success':
        return 'bg-green-600 hover:bg-green-600';
      case 'duplicate':
        return 'bg-yellow-600 hover:bg-yellow-600';
      case 'error':
        return 'bg-red-600 hover:bg-red-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

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
          완벽한 팀은<br />
          첫 번째 <span className="relative inline-block text-blue-600 mx-2">Draft<svg className="absolute w-full h-3 bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.5" /></svg></span>에서 시작됩니다
        </h1>

        <p className="text-lg text-gray-600 mb-10 leading-relaxed break-keep lg:mx-0 mx-auto max-w-xl lg:max-w-none">
          초기 창업자와 대학생을 위한 AI 팀 빌딩 플랫폼.<br className="hidden sm:block"/>
          아이디어 검증부터 IR 자료 생성까지, Draft OS 하나로 끝내세요.
        </p>

        {/* Waitlist Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center lg:justify-start justify-center max-w-xl lg:max-w-md gap-3 w-full lg:mx-0 mx-auto mb-6" id="waitlist">
          <div className="w-full relative">
             <input
              type="email"
              placeholder="이메일을 입력해주세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm font-mono placeholder:font-sans rounded-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full sm:w-auto px-8 py-3 text-white font-medium transition-all flex items-center justify-center whitespace-nowrap shadow-lg shadow-blue-200/50 rounded-none shrink-0 disabled:opacity-70 ${getButtonStyle()}`}
          >
            {getButtonContent()}
          </button>
        </form>

        {errorMessage && (
          <div className="text-red-500 text-sm mb-4 lg:text-left text-center">
            {errorMessage}
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

      {/* Right Column: Product Visual */}
      <motion.div
         initial={{ opacity: 0, x: 30 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
         className="w-full lg:w-1/2 relative px-4 lg:px-0"
      >
         <div className="relative group perspective-1000">
            {/* Main Dashboard */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
               <MockDashboardUI />
            </motion.div>

            {/* Floating Elements - Positioned to the left bottom to overlap dashboard */}
            <motion.div
               className="absolute -left-6 -bottom-10 z-20 hidden xl:block"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 1, duration: 0.8 }}
            >
               <MockAICard />
            </motion.div>
         </div>
      </motion.div>
    </section>
  );
};

const PainPoints: React.FC = () => {
  const problems = [
    {
      code: "ERR_TEAM_MISMATCH",
      title: "팀 빌딩의 미스매치",
      desc: "개발자는 기획자를, 기획자는 개발자를 찾지 못합니다. 단순 스펙 매칭으로는 비전을 공유하는 '진짜 동료'를 만날 수 없습니다.",
      path: "~/system/logs/team_match.log"
    },
    {
      code: "ERR_PROCESS_OVERLOAD",
      title: "복잡한 행정 프로세스",
      desc: "법인 설립부터 정부지원사업 서류까지. 아이디어 실행에 집중해야 할 골든타임을 복잡한 서류 작업에 뺏기고 있습니다.",
      path: "~/system/logs/admin_task.log"
    },
    {
      code: "ERR_INFO_ASYMMETRY",
      title: "정보의 비대칭",
      desc: "검증된 정보는 폐쇄적인 네트워크 안에만 존재합니다. 주변의 부정확한 '카더라' 통신에 의존하다 시행착오만 반복합니다.",
      path: "~/system/logs/network.log"
    }
  ];

  return (
    <section className="py-24 bg-[#111] text-white relative border-t border-gray-800 overflow-hidden">
        {/* Dark Grid Background */}
        <div className="grid-bg-dark absolute inset-0 opacity-20 pointer-events-none"></div>

        {/* Vertical Decorative Lines */}
        <div className="absolute top-0 left-4 sm:left-10 bottom-0 w-px bg-white/5"></div>
        <div className="absolute top-0 right-4 sm:right-10 bottom-0 w-px bg-white/5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               variants={fadeInUp}
               className="mb-20 text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-red-500/30 bg-red-500/10 text-red-400 mb-6 rounded-none backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase">SYSTEM CRITICAL WARNING</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight break-keep">
                    스타트업 초기 단계에서 발생하는<br />
                    <span className="text-gray-500">치명적인 오류들</span>
                </h2>

                <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed break-keep">
                    열정만으로는 넘어설 수 없는 현실적인 문제들.<br className="hidden sm:block"/>
                    많은 초기 창업자들이 제품을 만들기도 전에 '죽음의 계곡'을 마주합니다.
                </p>
            </motion.div>

            <motion.div
               variants={staggerContainer}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true }}
               className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
               {problems.map((item, i) => (
                   <motion.div
                     key={i}
                     variants={fadeInUp}
                     className="bg-black border border-gray-800 hover:border-gray-600 transition-colors group relative flex flex-col"
                   >
                       {/* Terminal Header */}
                       <div className="border-b border-gray-800 p-3 flex justify-between items-center bg-[#0a0a0a] group-hover:bg-[#151515] transition-colors">
                          <span className="text-[10px] font-mono text-gray-600 group-hover:text-gray-400 transition-colors truncate max-w-[150px]">{item.path}</span>
                          <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                          </div>
                       </div>

                       <div className="p-6 flex-1 flex flex-col">
                           <div className="mb-4 font-mono text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-1 self-start inline-block">
                             &gt; ERROR_CODE: {item.code}
                           </div>
                           <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                           <p className="text-sm text-gray-400 leading-relaxed break-keep">
                               {item.desc}
                           </p>
                       </div>

                       {/* Tech Corners */}
                       <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   </motion.div>
               ))}
            </motion.div>
        </div>
    </section>
  )
}

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-white border-t border-gray-200 relative">
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <TechnicalDivider />

        {/* Feature 1: Matching */}
        <motion.div
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, margin: "-100px" }}
           variants={fadeInUp}
           className="flex flex-col md:flex-row items-center gap-16 mb-32"
        >
           <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                 <Target className="w-4 h-4 text-blue-600" />
                 <span className="text-blue-600 font-mono text-xs font-bold tracking-widest uppercase">AI MATCHING ENGINE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight break-keep">
                 단순 연결이 아닌,<br/>
                 정밀한 <span className="bg-yellow-100 px-1">팀 설계</span>입니다.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 break-keep">
                 Draft의 AI는 단순한 스킬 매칭을 넘어섭니다. 프로젝트 이력, 작업 스타일, 비전 정렬도(Alignment)를 분석하여 퍼즐처럼 완벽하게 들어맞는 공동 창업자를 제안합니다.
              </p>

              <div className="space-y-4">
                 <div className="flex items-start gap-4 p-4 border border-gray-200 bg-white hover:border-black transition-colors group cursor-default">
                    <div className="bg-gray-50 p-2 border border-gray-200 group-hover:bg-black group-hover:text-white transition-colors"><BarChart3 className="w-5 h-5" /></div>
                    <div>
                       <h4 className="font-bold text-sm mb-1">매칭 적합도 분석 리포트</h4>
                       <p className="text-xs text-gray-500 break-keep">이 후보자가 왜 94% 적합한지, 30가지 지표로 분석해드립니다.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 p-4 border border-gray-200 bg-white hover:border-black transition-colors group cursor-default">
                    <div className="bg-gray-50 p-2 border border-gray-200 group-hover:bg-black group-hover:text-white transition-colors"><MessageSquare className="w-5 h-5" /></div>
                    <div>
                       <h4 className="font-bold text-sm mb-1">AI 인터뷰 모드</h4>
                       <p className="text-xs text-gray-500 break-keep">만나기 전, AI가 당신을 대신해 기술/인성 면접을 진행합니다.</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="flex-1 flex justify-center relative w-full">
              {/* Decorative elements */}
              <div className="absolute inset-0 border border-gray-100 transform rotate-3 scale-95 z-0 hidden sm:block"></div>
              <div className="relative z-10 w-full flex justify-center">
                 <MockAICard />
              </div>
           </div>
        </motion.div>

        {/* Feature 2: Docs & Management */}
        <motion.div
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, margin: "-100px" }}
           variants={fadeInUp}
           className="flex flex-col md:flex-row-reverse items-center gap-16"
        >
           <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                 <LayoutGrid className="w-4 h-4 text-green-600" />
                 <span className="text-green-600 font-mono text-xs font-bold tracking-widest uppercase">STARTUP OS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight break-keep">
                 아이디어 구상부터 IR까지,<br/>
                 <span className="bg-green-100 px-1">자동화된 워크스페이스</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 break-keep">
                 문서 양식 때문에 고민하지 마세요. 예비창업패키지용 PSST 사업계획서부터 주주간 계약서까지, 스타트업 표준 양식을 AI가 초안(Draft)으로 작성해줍니다.
              </p>

              <ul className="space-y-4 font-medium text-gray-700">
                 <li className="flex items-center gap-3 p-3 bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm">PSST 표준 사업계획서 자동 생성</span>
                 </li>
                 <li className="flex items-center gap-3 p-3 bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm">정부지원사업 마감일 자동 트래킹</span>
                 </li>
                 <li className="flex items-center gap-3 p-3 bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm">법률 검토된 공동창업 계약서 템플릿</span>
                 </li>
              </ul>
           </div>

           <div className="flex-1 w-full">
              <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
                 <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
                    <h4 className="font-bold text-sm flex items-center gap-2 font-mono"><FileText className="w-4 h-4" /> DOCUMENTS.DIR</h4>
                    <button className="bg-white border border-gray-300 text-[10px] px-2 py-1 flex items-center gap-1 font-mono hover:bg-gray-100"><Plus className="w-3 h-3"/> NEW</button>
                 </div>
                 <div className="divide-y divide-gray-100">
                    {[
                       { name: '2026 예비창업패키지 사업계획서_v1.2', tag: '#Funding', status: 'Draft', date: '2h ago' },
                       { name: '주주간 계약서 (Co-founder Agreement)', tag: '#Legal', status: 'Review', date: 'Yesterday' },
                       { name: '헬스케어 시장 SOM 분석 데이터', tag: '#Research', status: 'Final', date: 'Feb 10' },
                       { name: '서비스 소개서 (Landing Page Copy)', tag: '#Marketing', status: 'Draft', date: 'Feb 08' }
                    ].map((doc, i) => (
                       <div key={i} className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors group cursor-pointer">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <div className="w-8 h-8 bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0"><FileText className="w-4 h-4" /></div>
                             <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 mb-0.5 truncate">{doc.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{doc.tag}</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                             <span className={`text-[10px] px-2 py-0.5 border font-mono ${
                                doc.status === 'Final' ? 'bg-green-50 border-green-200 text-green-700' :
                                doc.status === 'Review' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                'bg-gray-50 border-gray-200 text-gray-500'
                             }`}>{doc.status}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </motion.div>

      </div>
    </section>
  );
};

const LiveFeed: React.FC = () => {
  const activities = [
    { type: 'MATCH', text: 'Project Alpha just matched with a Senior Backend Developer', time: '2m ago' },
    { type: 'CREATE', text: 'New Team "EcoFlow" started their journey', time: '5m ago' },
    { type: 'FUNDING', text: 'Team "NeuralNet" qualified for Pre-Startup Package', time: '12m ago' },
    { type: 'JOIN', text: 'Sarah J. joined the waitlist', time: '15m ago' },
    { type: 'MATCH', text: 'FinTech "Ledger" found their CTO', time: '22m ago' },
  ];

  return (
    <section className="py-12 border-t border-gray-200 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center gap-2 justify-center">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-gray-500">LIVE SYSTEM ACTIVITY</span>
        </div>
      </div>

      <div className="relative w-full">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-4 flex-nowrap pl-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            style={{ width: "max-content" }}
          >
            {[...activities, ...activities, ...activities, ...activities].map((activity, i) => (
              <div key={i} className="flex-shrink-0 bg-white border border-gray-200 p-4 w-72 shadow-sm hover:border-black transition-colors group">
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                      activity.type === 'MATCH' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                      activity.type === 'CREATE' ? 'bg-green-50 border-green-200 text-green-600' :
                      activity.type === 'FUNDING' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                      'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>{activity.type}</span>
                    <span className="text-[10px] font-mono text-gray-400">{activity.time}</span>
                 </div>
                 <p className="text-xs font-medium text-gray-800 line-clamp-2">{activity.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
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
                    {isDemo ? '로그인 없이 바로 체험해보세요' : 'Join 2,000+ Founders Waiting'}
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
                  초기 창업자를 위한 운영체제.<br/>
                  팀 빌딩부터 투자 유치까지, Draft가 함께합니다.
               </p>
               <div className="flex gap-4">
                  <a href="https://instagram.com/dailydraft_me" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-100 flex items-center justify-center border border-gray-200 hover:border-black hover:bg-gray-200 transition-colors"><span className="font-bold text-xs">IG</span></a>
               </div>
            </div>

            <div>
               <h4 className="font-bold text-sm mb-4 font-mono uppercase tracking-wider">Product</h4>
               <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-black transition-colors">AI 매칭</a></li>
                  <li><a href="#" className="hover:text-black transition-colors">문서 자동화</a></li>
                  <li><a href="#" className="hover:text-black transition-colors">일정 관리</a></li>
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
  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-100 text-slate-900 bg-white">
      <Header onLogin={scrollToWaitlist} />
      <main>
        <Hero onLogin={scrollToWaitlist} onDemo={onDemo} isDemo={isDemo} />
        <PainPoints />
        <Features />
        <LiveFeed />
        <FinalCTA onLogin={scrollToWaitlist} onDemo={onDemo} isDemo={isDemo} />
      </main>
      <Footer />

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
