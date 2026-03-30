'use client';

import React from 'react';
import { Lightbulb, Target, GitMerge, Layers } from 'lucide-react';

interface AnalysisPanelProps {
  reasoning: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ reasoning, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="w-72 h-full border-r border-border bg-surface-card flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-border flex justify-between items-center bg-surface-sunken">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 text-indigo-700">
            <Lightbulb size={14} />
          </div>
          <h2 className="font-bold text-txt-primary text-sm">AI 아키텍처 분석</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <h3 className="text-[0.625rem] font-medium text-txt-disabled mb-2 flex items-center gap-2">
            <Target size={12} />
            분해 전략
          </h3>
          <div className="text-xs text-txt-secondary leading-relaxed bg-indigo-50/50 p-3 border border-indigo-100">
            {reasoning || "PRD를 기반으로 최적의 작업 단위를 계산하고 있습니다..."}
          </div>
        </div>

        <div>
          <h3 className="text-[0.625rem] font-medium text-txt-disabled mb-2 flex items-center gap-2">
            <Layers size={12} />
            권장 실행 순서
          </h3>
          <ol className="relative border-l border-border-subtle ml-2 space-y-4">
            <li className="ml-3">
              <div className="absolute w-2 h-2 bg-surface-sunken -left-[0.3125rem] border border-surface-card"></div>
              <p className="text-[0.625rem] font-bold text-txt-primary">Phase 1: 설계</p>
              <p className="text-[0.625rem] text-txt-tertiary">DB 스키마 및 API 명세</p>
            </li>
            <li className="ml-3">
              <div className="absolute w-2 h-2 bg-surface-sunken -left-[0.3125rem] border border-surface-card"></div>
              <p className="text-[0.625rem] font-bold text-txt-primary">Phase 2: 백엔드</p>
              <p className="text-[0.625rem] text-txt-tertiary">인증, 데이터 처리 API</p>
            </li>
            <li className="ml-3">
              <div className="absolute w-2 h-2 bg-surface-sunken -left-[0.3125rem] border border-surface-card"></div>
              <p className="text-[0.625rem] font-bold text-txt-primary">Phase 3: 프론트엔드</p>
              <p className="text-[0.625rem] text-txt-tertiary">컴포넌트 및 API 연동</p>
            </li>
          </ol>
        </div>

        <div>
          <h3 className="text-[0.625rem] font-medium text-txt-disabled mb-2 flex items-center gap-2">
            <GitMerge size={12} />
            주요 의존성
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-[0.625rem] border border-border">User Auth</span>
            <span className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-[0.625rem] border border-border">Supabase</span>
            <span className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-[0.625rem] border border-border">Payment</span>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-dashed border-border bg-surface-sunken text-[0.625rem] text-center text-txt-disabled">
        Gemini 2.5 Flash Model
      </div>
    </div>
  );
};
