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
      className="w-64 bg-white border-r border-gray-200 h-full flex flex-col"
      aria-label="워크플로우 진행 단계"
    >
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 mb-1">지원사업 준비</h2>
        <p className="text-xs text-gray-500">3단계 워크플로우</p>
      </div>

      {/* 진행률 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">진행률</span>
          <span className="text-xs font-bold text-gray-900">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-draft-blue rounded-full transition-all duration-500"
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
                ${current ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}
                ${clickable && !current ? 'hover:bg-gray-50 cursor-pointer' : ''}
                ${!clickable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* 아이콘 */}
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${completed ? 'bg-green-100 text-green-600' : ''}
                  ${current && !completed ? 'bg-blue-100 text-blue-600' : ''}
                  ${!current && !completed ? 'bg-gray-100 text-gray-400' : ''}
                `}
              >
                {completed ? <Check size={16} /> : stepIcons[step.id]}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      text-xs font-medium
                      ${completed ? 'text-green-600' : ''}
                      ${current && !completed ? 'text-blue-600' : ''}
                      ${!current && !completed ? 'text-gray-400' : ''}
                    `}
                  >
                    Step {index + 1}
                  </span>
                  {current && !completed && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                      진행 중
                    </span>
                  )}
                </div>
                <h3
                  className={`
                    text-sm font-semibold truncate
                    ${current ? 'text-gray-900' : 'text-gray-700'}
                  `}
                >
                  {step.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {step.description}
                </p>
              </div>

              {/* 화살표 */}
              {clickable && !current && (
                <ChevronRight size={16} className="text-gray-400 shrink-0 mt-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* 점수 표시 (검증 완료 시) */}
      {validationScore !== undefined && (
        <div className="p-6 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">검증 점수</div>
            <div className="flex items-baseline gap-1" aria-label={`검증 점수 ${validationScore}점`}>
              <span className="text-2xl font-black text-gray-900">
                {validationScore}
              </span>
              <span className="text-sm text-gray-400">/100</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default WorkflowSidebar;
