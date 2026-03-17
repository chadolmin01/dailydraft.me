'use client';

import React from 'react';
import { Card } from './ui/Card';
import type { PRDResult } from '../src/lib/api/prd';

interface PRDResultSectionProps {
  result: PRDResult;
}

export const PRDResultSection: React.FC<PRDResultSectionProps> = ({ result }) => {
  return (
    <div className="space-y-6">
      {/* Elevator Pitch */}
      <Card className="border-l-4 border-l-violet-500">
        <div className="space-y-2">
          <span className="text-[0.625rem] font-bold font-mono text-violet-600 uppercase tracking-widest">
            Elevator Pitch
          </span>
          <h2 className="text-xl font-bold text-txt-primary leading-tight">
            "{result.elevator_pitch}"
          </h2>
        </div>
      </Card>

      {/* Problem & Target */}
      <Card title="Problem & Target">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-600 uppercase font-mono">Pain Point</span>
            <p className="text-sm text-txt-secondary bg-rose-50 p-3 border border-rose-200">
              {result.problem_and_target.pain_point}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-indigo-600 uppercase font-mono">Persona</span>
            <p className="text-sm text-txt-secondary bg-indigo-50 p-3 border border-indigo-200">
              {result.problem_and_target.persona}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 uppercase font-mono">Current Alternative</span>
            <p className="text-sm text-txt-secondary bg-slate-50 p-3 border border-slate-200">
              {result.problem_and_target.current_alternative}
            </p>
          </div>
        </div>
      </Card>

      {/* Core Features */}
      <Card title="Core Features">
        <div className="space-y-6">
          {/* P0 Features */}
          <div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 font-mono uppercase border border-emerald-200">
              P0 - MVP 핵심
            </span>
            <ul className="mt-3 space-y-3">
              {result.core_features
                .filter((f) => f.priority === 'P0')
                .map((f, i) => (
                  <li
                    key={i}
                    className="bg-emerald-50/50 p-3 border border-emerald-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 flex-shrink-0" />
                      <span className="font-semibold text-sm text-txt-primary">{f.feature_name}</span>
                    </div>
                    <p className="text-xs text-txt-tertiary mt-1 ml-4">{f.user_story}</p>
                  </li>
                ))}
            </ul>
          </div>

          {/* P1 Features */}
          {result.core_features.filter((f) => f.priority === 'P1').length > 0 && (
            <div className="pt-4 border-t border-dashed border-border">
              <span className="text-xs font-bold text-status-info-text bg-status-info-bg px-2 py-1 font-mono uppercase border border-status-info-text/20">
                P1 - 고도화
              </span>
              <ul className="mt-3 space-y-2">
                {result.core_features
                  .filter((f) => f.priority === 'P1')
                  .map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-txt-tertiary">
                      <span className="w-1.5 h-1.5 bg-brand/40 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{f.feature_name}</span>
                        <p className="text-xs text-txt-disabled">{f.user_story}</p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* P2 Features */}
          {result.core_features.filter((f) => f.priority === 'P2').length > 0 && (
            <div className="pt-4 border-t border-dashed border-border">
              <span className="text-xs font-bold text-txt-disabled bg-surface-sunken px-2 py-1 font-mono uppercase border border-border">
                P2 - 향후
              </span>
              <ul className="mt-3 space-y-1">
                {result.core_features
                  .filter((f) => f.priority === 'P2')
                  .map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-txt-disabled">
                      <span className="w-1 h-1 bg-txt-disabled flex-shrink-0" />
                      <span>{f.feature_name}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Next Steps - Highlighted Section */}
      <div className="bg-violet-900 text-white p-6 border border-violet-900 shadow-brutal">
        <h3 className="font-bold text-lg mb-6">Next Steps (MVP 수렴)</h3>

        <div className="space-y-4">
          {/* Immediate Action */}
          <div className="bg-violet-800/50 p-4 border border-violet-700">
            <span className="text-violet-300 text-xs font-mono uppercase tracking-wider block mb-2">
              즉시 실행 (Immediate Action)
            </span>
            <p className="font-medium">{result.next_steps.immediate_action}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MVP Scope */}
            <div className="bg-emerald-900/30 p-4 border border-emerald-700/30">
              <span className="text-emerald-300 text-xs font-mono uppercase tracking-wider block mb-2">
                MVP 범위 (2-3개)
              </span>
              <ul className="space-y-2">
                {result.next_steps.mvp_scope.map((item, i) => (
                  <li key={i} className="text-emerald-100 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Skip for Now */}
            <div className="bg-red-900/30 p-4 border border-red-700/30">
              <span className="text-red-300 text-xs font-mono uppercase tracking-wider block mb-2">
                MVP 제외 (Skip for Now)
              </span>
              <ul className="space-y-2">
                {result.next_steps.skip_for_now.map((item, i) => (
                  <li
                    key={i}
                    className="text-red-200 flex items-start gap-2 line-through opacity-70"
                  >
                    <span className="text-status-danger-text/70 mt-0.5">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Decision Needed */}
          <div className="bg-amber-900/30 p-4 border border-amber-700/30">
            <span className="text-amber-300 text-xs font-mono uppercase tracking-wider block mb-2">
              이번 주 결정 필요
            </span>
            <p className="text-amber-100 font-medium">{result.next_steps.decision_needed}</p>
          </div>
        </div>
      </div>

      {/* Open Questions */}
      {result.open_questions.length > 0 && (
        <Card className="bg-amber-50 border border-amber-200">
          <div className="space-y-4">
            <span className="bg-amber-100 text-amber-700 text-xs font-bold font-mono px-2 py-1 border border-amber-300">
              Open Questions
            </span>
            <div className="space-y-3">
              {result.open_questions.map((q, i) => (
                <div key={i} className="bg-surface-card p-3 border border-amber-200">
                  <p className="text-sm text-amber-900 font-medium">{q.issue}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-indicator-premium-border">
                    <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-200 font-mono">
                      {q.involved_roles.join(', ')}
                    </span>
                    <span className="text-amber-500">AI 제안:</span>
                    <span className="text-amber-700">{q.ai_suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PRDResultSection;
