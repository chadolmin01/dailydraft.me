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
          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
            Elevator Pitch
          </span>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            "{result.elevator_pitch}"
          </h2>
        </div>
      </Card>

      {/* Problem & Target */}
      <Card title="Problem & Target">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-600 uppercase">Pain Point</span>
            <p className="text-sm text-gray-700 bg-rose-50 p-3 rounded-lg border border-rose-100">
              {result.problem_and_target.pain_point}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-indigo-600 uppercase">Persona</span>
            <p className="text-sm text-gray-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              {result.problem_and_target.persona}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 uppercase">Current Alternative</span>
            <p className="text-sm text-gray-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
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
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">
              P0 - MVP 핵심
            </span>
            <ul className="mt-3 space-y-3">
              {result.core_features
                .filter((f) => f.priority === 'P0')
                .map((f, i) => (
                  <li
                    key={i}
                    className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="font-semibold text-sm text-gray-800">{f.feature_name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 ml-4">{f.user_story}</p>
                  </li>
                ))}
            </ul>
          </div>

          {/* P1 Features */}
          {result.core_features.filter((f) => f.priority === 'P1').length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">
                P1 - 고도화
              </span>
              <ul className="mt-3 space-y-2">
                {result.core_features
                  .filter((f) => f.priority === 'P1')
                  .map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{f.feature_name}</span>
                        <p className="text-xs text-gray-500">{f.user_story}</p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* P2 Features */}
          {result.core_features.filter((f) => f.priority === 'P2').length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase">
                P2 - 향후
              </span>
              <ul className="mt-3 space-y-1">
                {result.core_features
                  .filter((f) => f.priority === 'P2')
                  .map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      <span>{f.feature_name}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Next Steps - Highlighted Section */}
      <div className="bg-violet-900 text-white p-6 rounded-sm">
        <h3 className="font-bold text-lg mb-6">Next Steps (MVP 수렴)</h3>

        <div className="space-y-4">
          {/* Immediate Action */}
          <div className="bg-violet-800/50 p-4 rounded-lg">
            <span className="text-violet-300 text-xs uppercase tracking-wider block mb-2">
              즉시 실행 (Immediate Action)
            </span>
            <p className="font-medium">{result.next_steps.immediate_action}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MVP Scope */}
            <div className="bg-emerald-900/30 p-4 rounded-lg border border-emerald-700/30">
              <span className="text-emerald-300 text-xs uppercase tracking-wider block mb-2">
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
            <div className="bg-red-900/30 p-4 rounded-lg border border-red-700/30">
              <span className="text-red-300 text-xs uppercase tracking-wider block mb-2">
                MVP 제외 (Skip for Now)
              </span>
              <ul className="space-y-2">
                {result.next_steps.skip_for_now.map((item, i) => (
                  <li
                    key={i}
                    className="text-red-200 flex items-start gap-2 line-through opacity-70"
                  >
                    <span className="text-red-400 mt-0.5">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Decision Needed */}
          <div className="bg-amber-900/30 p-4 rounded-lg border border-amber-700/30">
            <span className="text-amber-300 text-xs uppercase tracking-wider block mb-2">
              이번 주 결정 필요
            </span>
            <p className="text-amber-100 font-medium">{result.next_steps.decision_needed}</p>
          </div>
        </div>
      </div>

      {/* Open Questions */}
      {result.open_questions.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="space-y-4">
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">
              Open Questions
            </span>
            <div className="space-y-3">
              {result.open_questions.map((q, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-900 font-medium">{q.issue}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-600">
                    <span className="px-1.5 py-0.5 bg-amber-100 rounded">
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
