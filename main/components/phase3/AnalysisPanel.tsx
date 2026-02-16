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
    <div className="w-72 h-full border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-700">
            <Lightbulb size={14} />
          </div>
          <h2 className="font-bold text-gray-900 text-sm">AI 아키텍처 분석</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Target size={12} />
            분해 전략
          </h3>
          <div className="text-xs text-gray-700 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
            {reasoning || "PRD를 기반으로 최적의 작업 단위를 계산하고 있습니다..."}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Layers size={12} />
            권장 실행 순서
          </h3>
          <ol className="relative border-l-2 border-gray-100 ml-2 space-y-4">
            <li className="ml-3">
              <div className="absolute w-2 h-2 bg-gray-200 rounded-full -left-[5px] border-2 border-white"></div>
              <p className="text-[10px] font-bold text-gray-900">Phase 1: 설계</p>
              <p className="text-[10px] text-gray-500">DB 스키마 및 API 명세</p>
            </li>
            <li className="ml-3">
              <div className="absolute w-2 h-2 bg-gray-200 rounded-full -left-[5px] border-2 border-white"></div>
              <p className="text-[10px] font-bold text-gray-900">Phase 2: 백엔드</p>
              <p className="text-[10px] text-gray-500">인증, 데이터 처리 API</p>
            </li>
            <li className="ml-3">
              <div className="absolute w-2 h-2 bg-gray-200 rounded-full -left-[5px] border-2 border-white"></div>
              <p className="text-[10px] font-bold text-gray-900">Phase 3: 프론트엔드</p>
              <p className="text-[10px] text-gray-500">컴포넌트 및 API 연동</p>
            </li>
          </ol>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <GitMerge size={12} />
            주요 의존성
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200">User Auth</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200">Supabase</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200">Payment</span>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 text-[10px] text-center text-gray-400">
        Gemini 2.5 Flash Model
      </div>
    </div>
  );
};
