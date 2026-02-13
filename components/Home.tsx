import React from 'react';
import { ArrowRight, Zap, Target, Clock } from 'lucide-react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  return (
    <div className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering flex flex-col relative">
      
      {/* 1. Top Bar (Date & Status) */}
      <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-xs font-mono text-gray-500">SYSTEM ONLINE</span>
        </div>
        <div className="text-xs font-mono font-bold text-gray-900 uppercase">
           2026년 2월 13일 목요일
        </div>
      </div>

      {/* 2. Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 max-w-[1400px] mx-auto w-full">
         
         {/* Greeting */}
         <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight mb-6 break-keep">
               실행의 시간입니다,<br/>
               <span className="text-gray-400">설계자 이성민님.</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed break-keep">
               성공을 위한 청사진이 준비되었습니다.<br className="hidden md:block"/> 
               오늘 검토가 필요한 <span className="font-bold text-black border-b-2 border-draft-accent">3개의 높은 매칭 기회</span>가 기다리고 있습니다.
            </p>
         </div>

         {/* Action Cards (Bento Grid Style) */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            
            {/* Primary Action */}
            <div 
               onClick={() => setActiveTab('explore')}
               className="md:col-span-2 bg-black text-white p-8 rounded-sm shadow-xl flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-transform hover:-translate-y-1"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 transition-opacity group-hover:opacity-30"></div>
               
               <div className="relative z-10 flex justify-between items-start">
                  {/* Yellow D Logo */}
                  <div className="w-10 h-10 flex items-center justify-center font-black text-2xl text-yellow-400 font-mono bg-white/10 rounded-sm backdrop-blur-md border border-white/10 shadow-inner">
                    D
                  </div>
                  <span className="font-mono text-xs text-gray-400 border border-gray-700 px-2 py-1 rounded">RECOMMENDED</span>
               </div>
               
               <div className="relative z-10 mt-12">
                  <h3 className="text-2xl font-bold mb-2 break-keep">AI 매칭 리포트 확인</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-md leading-relaxed break-keep">
                     하드웨어 경험을 보유한 CMO를 찾는<br className="hidden md:block"/> 
                     핀테크 스타트업이 발견되었습니다.<br className="block md:hidden"/>
                     <span className="opacity-80 mt-1 block">예상 적합도: <span className="text-yellow-400 font-mono">98.5%</span></span>
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/30 pb-1 w-fit group-hover:border-white transition-colors">
                     기회 확인하기 <ArrowRight size={16} />
                  </div>
               </div>
            </div>

            {/* Secondary Action */}
            <div 
               onClick={() => setActiveTab('projects')}
               className="bg-white border border-gray-200 p-8 rounded-sm shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between hover:border-black"
            >
               <div className="flex justify-between items-start">
                  <div className="p-2 bg-gray-100 rounded-sm group-hover:bg-black group-hover:text-white transition-colors">
                     <Zap size={24} />
                  </div>
               </div>
               
               <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Quick Draft</h3>
                  <p className="text-gray-500 text-sm mb-4 break-keep leading-relaxed">
                     새로운 프로젝트 제안서를<br/>작성해보세요.
                  </p>
                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all">
                     <ArrowRight size={14} />
                  </div>
               </div>
            </div>

            {/* Stat Card 1 */}
            <div 
               onClick={() => setActiveTab('projects')}
               className="bg-white border border-gray-200 p-6 rounded-sm flex items-center gap-6 cursor-pointer hover:border-black transition-colors"
            >
               <div className="w-12 h-12 bg-blue-50 text-draft-blue flex items-center justify-center rounded-full shrink-0">
                  <Target size={24} />
               </div>
               <div>
                  <div className="text-3xl font-bold font-mono text-gray-900">12</div>
                  <div className="text-xs text-gray-500 font-mono uppercase tracking-wide break-keep">
                     내 프로젝트<br/>조회수
                  </div>
               </div>
            </div>

            {/* Stat Card 2 */}
            <div 
               onClick={() => setActiveTab('calendar')}
               className="bg-white border border-gray-200 p-6 rounded-sm flex items-center gap-6 md:col-span-2 cursor-pointer hover:border-black transition-colors"
            >
               <div className="w-12 h-12 bg-red-50 text-red-500 flex items-center justify-center rounded-full shrink-0">
                  <Clock size={24} />
               </div>
               <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                     <div className="text-3xl font-bold font-mono text-gray-900">D-1</div>
                     <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">마감임박</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono uppercase tracking-wide truncate">
                     2026 창업성공패키지 초기창업기업 모집
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* 3. Footer / Ticker */}
      <div className="border-t border-gray-200 bg-white py-3 px-8">
         <div className="flex items-center gap-8 overflow-hidden whitespace-nowrap text-[10px] font-mono font-medium text-gray-500">
            <span className="flex items-center gap-2">
               <span className="font-bold text-black">LATEST:</span> '프로젝트 알파'에 새로운 팀원이 합류했습니다.
            </span>
            <span className="w-px h-3 bg-gray-300"></span>
            <span className="flex items-center gap-2">
               <span className="font-bold text-black">MARKET:</span> K-스타트업 지수 2.4% 상승
            </span>
            <span className="w-px h-3 bg-gray-300"></span>
            <span className="flex items-center gap-2">
               <span className="font-bold text-black">WEATHER:</span> 서울 24°C, 맑음
            </span>
         </div>
      </div>

    </div>
  );
};