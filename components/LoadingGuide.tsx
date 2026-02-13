import React, { useEffect, useState } from 'react';
import { Sparkles, Search, MessageSquare, BarChart3, ChevronRight, Zap } from 'lucide-react';

interface LoadingGuideProps {
  onComplete: () => void;
}

const TIPS = [
  {
    id: 1,
    icon: Search,
    title: "Explore Opportunities",
    desc: "검색창에서 'Pre-A' 또는 'Co-founder' 같은 키워드로 필터링하여 원하는 공고를 빠르게 찾으세요."
  },
  {
    id: 2,
    icon: MessageSquare,
    title: "AI Co-founder",
    desc: "채팅 탭(Comm)에서 AI에게 사업계획서 초안 작성이나 시장 분석을 요청해보세요."
  },
  {
    id: 3,
    icon: BarChart3,
    title: "Market Insight",
    desc: "대시보드 우측에서 실시간 시장 트렌드와 급상승 키워드를 확인할 수 있습니다."
  }
];

export const LoadingGuide: React.FC<LoadingGuideProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [statusText, setStatusText] = useState("Initializing System...");

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        
        // Progress Logic
        const next = prev + 1;
        
        // Update Tip & Status based on progress
        if (next === 30) {
            setCurrentTipIndex(1);
            setStatusText("Analyzing Profile Data...");
        }
        if (next === 70) {
            setCurrentTipIndex(2);
            setStatusText("Syncing Market Trends...");
        }
        if (next === 90) {
            setStatusText("Finalizing Dashboard...");
        }

        return next;
      });
    }, 40); // Total duration approx 4 seconds

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(onComplete, 500);
    }
  }, [progress, onComplete]);

  const CurrentIcon = TIPS[currentTipIndex].icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAFA] bg-grid-engineering flex flex-col items-center justify-center font-sans p-6">
      
      <div className="w-full max-w-md relative">
         {/* Main Card */}
         <div className="bg-white border border-gray-200 shadow-xl rounded-sm overflow-hidden relative z-10 animate-slide-up-fade">
            
            {/* Header / Visualization Area */}
            <div className="h-32 bg-gray-900 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                
                {/* Center Icon Animation */}
                <div className="relative z-10 w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                   <Zap size={32} className="text-white fill-white animate-pulse" />
                </div>

                {/* Background Particles (Decorative) */}
                <div className="absolute top-4 left-10 w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 right-10 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            {/* Content Body */}
            <div className="p-8">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-mono font-bold text-draft-blue uppercase animate-pulse">{statusText}</span>
                  <span className="text-3xl font-bold font-mono text-gray-900 leading-none">{progress}%</span>
               </div>

               {/* Progress Bar */}
               <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
                  <div 
                    className="h-full bg-black transition-all duration-100 ease-linear relative"
                    style={{ width: `${progress}%` }}
                  >
                     <div className="absolute inset-0 bg-white/20 animate-[marquee_1s_linear_infinite]"></div>
                  </div>
               </div>

               {/* Tip Section */}
               <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 bg-gray-50 rounded-sm border border-gray-100 flex items-center justify-center shrink-0">
                        <CurrentIcon size={20} className="text-gray-600" />
                     </div>
                     <div className="flex-1 animate-in fade-in slide-in-from-right-2 duration-300" key={currentTipIndex}>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded-sm font-mono">TIP</span>
                           <h3 className="font-bold text-sm text-gray-900">{TIPS[currentTipIndex].title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed break-keep">
                           {TIPS[currentTipIndex].desc}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer Decorative */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between items-center text-[9px] font-mono text-gray-400">
               <span>DRAFT OS v2.4.0</span>
               <span className="flex items-center gap-1">LOADING RESOURCES <span className="animate-spin">/</span></span>
            </div>
         </div>
         
         {/* Back Glow */}
         <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-2xl -z-10 rounded-full"></div>
      </div>
    </div>
  );
};