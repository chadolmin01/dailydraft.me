import React, { useState } from 'react';
import { Sparkles, FileText, ArrowRight, Zap, Layers, Sword } from 'lucide-react';
import { ValidationLevel } from '../types';

interface SelectionScreenProps {
  onSelect: (mode: 'general' | 'ai', level?: ValidationLevel) => void;
}

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect }) => {
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  // Sharp Card Component - Reverted to Vertical Card Layout for Grid
  const SelectionCard = ({ 
    icon, 
    title, 
    description, 
    onClick, 
    tag,
    variant = 'default'
  }: { 
    icon: React.ReactNode, 
    title: string, 
    description: string, 
    onClick: () => void,
    tag?: string,
    variant?: 'default' | 'ai'
  }) => (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-start p-8 h-full w-full border transition-all duration-300 text-left rounded-lg
        ${variant === 'ai' 
          ? 'bg-blue-50/40 border-blue-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/60' 
          : 'bg-white border-gray-200 hover:border-black hover:shadow-sm'
        }
      `}
    >
      {tag && (
        <div className={`absolute top-6 right-6 text-[10px] font-mono font-bold px-2 py-1 uppercase tracking-wider border rounded-md 
          ${variant === 'ai' 
            ? 'bg-blue-100 text-blue-700 border-blue-200' 
            : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
          {tag}
        </div>
      )}
      
      <div className={`mb-6 p-3 rounded-md border 
        ${variant === 'ai' 
          ? 'bg-blue-100/50 border-blue-200 text-blue-600 group-hover:scale-110 transition-transform' 
          : 'bg-gray-50 border-gray-100 text-gray-900 group-hover:scale-110 transition-transform'
        }`}>
        {icon}
      </div>
      
      <h3 className={`text-xl font-bold mb-2 tracking-tight ${variant === 'ai' ? 'text-blue-900' : 'text-gray-900'}`}>
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 leading-relaxed font-medium mb-10 break-keep">
        {description}
      </p>
      
      <div className={`mt-auto w-full flex items-center justify-between border-t pt-4 
        ${variant === 'ai' ? 'border-blue-100' : 'border-gray-100'}`}>
        <span className={`text-xs font-bold uppercase tracking-widest group-hover:underline 
          ${variant === 'ai' ? 'text-blue-700' : 'text-gray-900'}`}>
          Select Mode
        </span>
        <ArrowRight size={16} className={`transition-all group-hover:translate-x-1 
          ${variant === 'ai' ? 'text-blue-400 group-hover:text-blue-600' : 'text-gray-400 group-hover:text-black'}`} 
        />
      </div>
    </button>
  );

  // Sharp Level Card Component
  const LevelCard = ({ level, title, desc, icon, colorTheme, recommended = false }: { 
    level: ValidationLevel, 
    title: string, 
    desc: string, 
    icon: React.ReactNode, 
    colorTheme: 'yellow' | 'blue' | 'red',
    recommended?: boolean 
  }) => {
    const themeClasses = {
      yellow: {
        border: 'hover:border-yellow-500',
        iconBg: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        text: 'text-yellow-700'
      },
      blue: {
        border: 'hover:border-blue-600',
        iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
        text: 'text-blue-700'
      },
      red: {
        border: 'hover:border-red-600',
        iconBg: 'bg-red-50 text-red-600 border-red-100',
        text: 'text-red-700'
      }
    };

    const currentTheme = themeClasses[colorTheme];

    return (
      <button 
        onClick={() => onSelect('ai', level)}
        className={`group relative flex flex-col items-start p-6 w-full bg-white border transition-all duration-200 text-left rounded-lg hover:shadow-lg ${currentTheme.border} ${recommended ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200'}`}
      >
        {recommended && (
           <div className="absolute -top-2.5 left-6 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono rounded-sm shadow-sm">
              Recommended
           </div>
        )}
        
        <div className="w-full flex justify-between items-start mb-4">
          <div className={`p-2 border rounded-md transition-colors ${currentTheme.iconBg}`}>
             {icon}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-4px] group-hover:translate-x-0 text-gray-400">
             <ArrowRight size={16} />
          </div>
        </div>
        
        <h4 className="text-sm font-bold text-gray-900 mb-2 font-mono uppercase tracking-tight">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed break-keep">
          {desc}
        </p>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 py-12 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto">
        
        {!showLevelSelect ? (
          <div className="grid lg:grid-cols-12 gap-12 items-center">
             {/* Left Text Area */}
             <div className="lg:col-span-5 space-y-10 animate-in slide-in-from-left-4 duration-500">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">System Operational</span>
                </div>
                
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-6 leading-tight">
                    Welcome back,<br/>Architect.
                  </h1>
                  <p className="text-gray-500 text-lg leading-relaxed break-keep">
                    당신의 아이디어를 검증할 준비가 되셨습니까?
                    <br/>
                    AI 페르소나와 함께 비즈니스 모델을 점검하고, 실행 가능한 PRD를 설계하세요.
                  </p>
                </div>

                <div className="flex items-center gap-8 pt-4 border-t border-gray-100">
                   <div>
                      <div className="text-2xl font-bold text-gray-900 font-mono">1.2k+</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Projects</div>
                   </div>
                   <div>
                      <div className="text-2xl font-bold text-gray-900 font-mono">89%</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Success Rate</div>
                   </div>
                </div>
             </div>

             {/* Right Cards Area - Grid Layout (Reverted) */}
             <div className="lg:col-span-7 grid md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
                <SelectionCard 
                  title="일반 등록 (Manual)"
                  description="검증 과정을 건너뛰고 표준 템플릿을 사용하여 직접 문서를 작성합니다."
                  icon={<FileText size={24} />}
                  onClick={() => onSelect('general')}
                  tag="Standard"
                  variant="default"
                />
                
                <SelectionCard 
                  title="AI 검증 (Validation)"
                  description="가상의 전문가팀(개발/디자인/VC)과 함께 아이디어를 다각도로 분석합니다."
                  icon={<Sparkles size={24} />}
                  onClick={() => setShowLevelSelect(true)}
                  tag="AI Powered"
                  variant="ai"
                />
             </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
             <div className="flex items-center justify-between mb-10 border-b border-gray-200 pb-6">
                <div>
                   <button 
                     onClick={() => setShowLevelSelect(false)}
                     className="text-xs font-bold text-gray-400 hover:text-gray-900 mb-3 flex items-center gap-1 uppercase tracking-widest font-mono transition-colors"
                   >
                      ← Back to Workspace
                   </button>
                   <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Select Verification Level</h2>
                </div>
                <div className="hidden md:block text-right">
                   <div className="text-sm font-bold text-gray-900 font-mono">SESSION CONFIGURATION</div>
                   <div className="text-xs text-gray-400 mt-1">Choose your difficulty</div>
                </div>
             </div>
             
             <div className="grid md:grid-cols-3 gap-6">
                <LevelCard 
                  level={ValidationLevel.SKETCH}
                  title="Lv.1 Idea Sketch"
                  desc="초기 아이디어 구체화 단계. 친절한 조력자와 함께 가능성을 탐색합니다."
                  icon={<Zap size={20} />}
                  colorTheme="yellow"
                />
                <LevelCard 
                  level={ValidationLevel.MVP}
                  title="Lv.2 MVP Build"
                  desc="실무 중심 검증. 불필요한 기능을 제거하고 핵심 가치에 집중합니다."
                  icon={<Layers size={20} />}
                  colorTheme="blue"
                  recommended={true}
                />
                <LevelCard 
                  level={ValidationLevel.DEFENSE}
                  title="Lv.3 VC Defense"
                  desc="투자 심사 시뮬레이션. 공격적인 질문을 통해 비즈니스 모델을 검증합니다."
                  icon={<Sword size={20} />}
                  colorTheme="red"
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectionScreen;