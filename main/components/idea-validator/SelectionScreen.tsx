'use client';

import React, { useState } from 'react';
import { Sparkles, FileText, ArrowRight, Zap, Layers, Sword } from 'lucide-react';
import { ValidationLevel } from './types';

interface SelectionScreenProps {
  onSelect: (mode: 'general' | 'ai', level?: ValidationLevel) => void;
  skipToLevelSelect?: boolean;
  onBack?: () => void;
}

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect, skipToLevelSelect = false, onBack }) => {
  const [showLevelSelect, setShowLevelSelect] = useState(skipToLevelSelect);

  // Sharp Card Component - Matches project design system
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
      className={`group relative flex flex-col items-start p-6 h-full w-full border transition-all duration-200 text-left
        ${variant === 'ai'
          ? 'bg-surface-card border-border hover:border-border hover:shadow-md'
          : 'bg-surface-card border-border hover:border-border hover:shadow-md'
        }
      `}
    >
      {tag && (
        <div className={`absolute top-5 right-5 text-[0.5625rem] font-medium px-2 py-0.5 border
          ${variant === 'ai'
            ? 'bg-draft-blue/10 text-draft-blue border-draft-blue/20'
            : 'bg-surface-sunken text-txt-tertiary border-border'
          }`}>
          {tag}
        </div>
      )}

      <div className={`mb-5 p-2.5 border
        ${variant === 'ai'
          ? 'bg-surface-sunken border-border-subtle text-txt-primary group-hover:bg-black group-hover:text-white group-hover:border-border transition-colors'
          : 'bg-surface-sunken border-border-subtle text-txt-primary group-hover:bg-black group-hover:text-white group-hover:border-border transition-colors'
        }`}>
        {icon}
      </div>

      <h3 className="text-lg font-bold mb-2 tracking-tight text-txt-primary">
        {title}
      </h3>

      <p className="text-xs text-txt-tertiary leading-relaxed mb-6 break-keep">
        {description}
      </p>

      <div className="mt-auto w-full flex items-center justify-between border-t border-border pt-4">
        <span className="text-[0.625rem] font-medium text-txt-tertiary group-hover:text-black transition-colors">
          Select
        </span>
        <ArrowRight size={14} className="text-txt-disabled group-hover:text-black group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );

  // Level Card Component - Matches project design system
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
        border: 'hover:border-status-warning-text',
        iconBg: 'bg-status-warning-bg text-status-warning-text border-status-warning-text/20',
      },
      blue: {
        border: 'hover:border-border',
        iconBg: 'bg-surface-sunken text-txt-primary border-border',
      },
      red: {
        border: 'hover:border-status-danger-text',
        iconBg: 'bg-status-danger-bg text-status-danger-text border-status-danger-text/20',
      }
    };

    const currentTheme = themeClasses[colorTheme];

    return (
      <button
        onClick={() => onSelect('ai', level)}
        className={`group relative flex flex-col items-start p-5 w-full h-full bg-surface-card border transition-all duration-200 text-left hover:shadow-md ${currentTheme.border} ${recommended ? 'border-border ring-1 ring-black' : 'border-border'}`}
      >
        {recommended && (
           <div className="absolute -top-2.5 left-5 bg-surface-inverse text-txt-inverse text-[0.5625rem] font-medium px-2 py-0.5">
              Recommended
           </div>
        )}

        <div className="w-full flex justify-between items-start mb-4">
          <div className={`p-2 border transition-colors ${currentTheme.iconBg}`}>
             {icon}
          </div>
          <ArrowRight size={14} className="text-txt-disabled group-hover:text-black group-hover:translate-x-1 transition-all" />
        </div>

        <h4 className="text-xs font-medium text-txt-primary mb-2">{title}</h4>
        <p className="text-xs text-txt-tertiary leading-relaxed break-keep">
          {desc}
        </p>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 py-8 overflow-y-auto bg-surface-sunken">
      <div className="w-full max-w-6xl">

        {!showLevelSelect ? (
          <div className="grid grid-cols-12 gap-6 lg:gap-10 items-center">
             {/* Left Text Area */}
             <div className="col-span-5 space-y-6 lg:space-y-8">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-card rounded-xl border border-border">
                  <span className="w-1.5 h-1.5 bg-indicator-online animate-pulse"></span>
                  <span className="text-[0.5625rem] font-medium text-txt-tertiary">System Operational</span>
                </div>

                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-txt-primary mb-4 leading-tight">
                    Idea Validator
                  </h1>
                  <p className="text-txt-tertiary text-sm leading-relaxed break-keep">
                    AI 페르소나(개발/디자인/VC)와 함께 비즈니스 모델을 점검하고,
                    실행 가능한 PRD를 설계하세요.
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-border">
                   <div>
                      <div className="text-xl font-bold text-txt-primary font-mono">1.2k+</div>
                      <div className="text-[0.5625rem] text-txt-disabled font-medium mt-0.5">Projects</div>
                   </div>
                   <div>
                      <div className="text-xl font-bold text-txt-primary font-mono">89%</div>
                      <div className="text-[0.5625rem] text-txt-disabled font-medium mt-0.5">Success Rate</div>
                   </div>
                </div>
             </div>

             {/* Right Cards Area */}
             <div className="col-span-7 grid grid-cols-2 gap-4 lg:gap-5">
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
          <div className="flex flex-col items-center justify-center opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
             <div className="text-center mb-8">
                {(onBack || !skipToLevelSelect) && (
                  <button
                    onClick={() => onBack ? onBack() : setShowLevelSelect(false)}
                    className="text-[0.625rem] font-medium text-txt-disabled hover:text-txt-primary mb-4 flex items-center gap-1 transition-colors mx-auto"
                  >
                     ← Back
                  </button>
                )}
                <h2 className="text-3xl font-bold text-txt-primary tracking-tight">검증 난이도를 선택하세요</h2>
             </div>

             <div className="flex justify-center items-stretch gap-4">
                <div className="w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.4s_forwards]">
                  <LevelCard
                    level={ValidationLevel.SKETCH}
                    title="Lv.1 Idea Sketch"
                    desc="초기 아이디어 구체화 단계. 친절한 조력자와 함께 가능성을 탐색합니다."
                    icon={<Zap size={20} />}
                    colorTheme="yellow"
                  />
                </div>
                <div className="w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.55s_forwards]">
                  <LevelCard
                    level={ValidationLevel.MVP}
                    title="Lv.2 MVP Build"
                    desc="실무 중심 검증. 불필요한 기능을 제거하고 핵심 가치에 집중합니다."
                    icon={<Layers size={20} />}
                    colorTheme="blue"
                    recommended={true}
                  />
                </div>
                <div className="w-72 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.7s_forwards]">
                  <LevelCard
                    level={ValidationLevel.DEFENSE}
                    title="Lv.3 VC Defense"
                    desc="투자 심사 시뮬레이션. 공격적인 질문을 통해 비즈니스 모델을 검증합니다."
                    icon={<Sword size={20} />}
                    colorTheme="red"
                  />
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectionScreen;
