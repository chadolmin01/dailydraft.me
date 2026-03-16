'use client';

import React from 'react';
import { Lightbulb, FileText, Briefcase, Check, ChevronRight } from 'lucide-react';
import {
  WorkflowStep,
  WORKFLOW_STEPS,
  calculateProgress,
} from '@/src/types/workflow';

interface WorkflowSidebarProps {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  validationScore?: number;
  onStepClick?: (step: WorkflowStep) => void;
}

const stepIcons: Record<WorkflowStep, React.ReactNode> = {
  validation: <Lightbulb size={18} />,
  prd: <FileText size={18} />,
  'business-plan': <Briefcase size={18} />,
};

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  currentStep,
  completedSteps,
  validationScore,
  onStepClick,
}) => {
  const progress = calculateProgress(completedSteps);

  const isCompleted = (step: WorkflowStep) => completedSteps.includes(step);
  const isCurrent = (step: WorkflowStep) => currentStep === step;
  const isClickable = (step: WorkflowStep) => {
    // 현재 단계이거나 완료된 단계만 클릭 가능
    return isCurrent(step) || isCompleted(step);
  };

  return (
    <nav
      className="w-64 bg-surface-card border-r border-border-strong h-full flex flex-col"
      aria-label="워크플로우 진행 단계"
    >
      {/* 헤더 */}
      <div className="p-6 border-b border-border">
        <h2 className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-primary mb-1">지원사업 준비</h2>
        <p className="text-xs text-txt-tertiary">3단계 워크플로우</p>
      </div>

      {/* 진행률 */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary">진행률</span>
          <span className="text-xs font-bold text-txt-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-surface-sunken overflow-hidden">
          <div
            className="h-full bg-[#4F46E5] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 단계 목록 */}
      <div className="flex-1 py-4">
        {WORKFLOW_STEPS.map((step, index) => {
          const completed = isCompleted(step.id);
          const current = isCurrent(step.id);
          const clickable = isClickable(step.id);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => clickable && onStepClick?.(step.id)}
              disabled={!clickable}
              aria-current={current ? 'step' : undefined}
              aria-label={`${step.label} - ${completed ? '완료됨' : current ? '진행 중' : '대기 중'}`}
              className={`
                w-full px-6 py-4 flex items-start gap-4 text-left transition-all
                ${current ? 'bg-[#4F46E5]/5 border-l-4 border-[#4F46E5]' : 'border-l-4 border-transparent'}
                ${clickable && !current ? 'hover:bg-surface-sunken cursor-pointer' : ''}
                ${!clickable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* 아이콘 */}
              <div
                className={`
                  w-8 h-8 flex items-center justify-center shrink-0 border
                  ${completed ? 'border-green-600 text-green-600 bg-green-50' : ''}
                  ${current && !completed ? 'border-[#4F46E5] text-[#4F46E5] bg-[#4F46E5]/5' : ''}
                  ${!current && !completed ? 'border-border-strong text-txt-disabled bg-surface-sunken' : ''}
                `}
              >
                {completed ? <Check size={16} /> : stepIcons[step.id]}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      text-[0.625rem] font-mono font-bold uppercase tracking-widest
                      ${completed ? 'text-green-600' : ''}
                      ${current && !completed ? 'text-[#4F46E5]' : ''}
                      ${!current && !completed ? 'text-txt-disabled' : ''}
                    `}
                  >
                    Step {index + 1}
                  </span>
                  {current && !completed && (
                    <span className="px-1.5 py-0.5 border border-[#4F46E5] text-[#4F46E5] text-[0.625rem] font-mono font-bold">
                      진행 중
                    </span>
                  )}
                </div>
                <h3
                  className={`
                    text-sm font-semibold truncate
                    ${current ? 'text-txt-primary' : 'text-txt-secondary'}
                  `}
                >
                  {step.label}
                </h3>
                <p className="text-xs text-txt-tertiary mt-0.5 line-clamp-2">
                  {step.description}
                </p>
              </div>

              {/* 화살표 */}
              {clickable && !current && (
                <ChevronRight size={16} className="text-txt-disabled shrink-0 mt-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* 점수 표시 (검증 완료 시) */}
      {validationScore !== undefined && (
        <div className="p-6 border-t border-border">
          <div className="bg-surface-sunken border border-border-strong p-4">
            <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-1">검증 점수</div>
            <div className="flex items-baseline gap-1" aria-label={`검증 점수 ${validationScore}점`}>
              <span className="text-2xl font-black text-txt-primary">
                {validationScore}
              </span>
              <span className="text-sm text-txt-disabled">/100</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default WorkflowSidebar;
