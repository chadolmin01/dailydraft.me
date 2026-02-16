'use client';

import React from 'react';
import { AnalysisResult, LogEntry, Role } from '../types';
import type { PRDResult } from '../src/lib/api/prd';
import { CheckCircle2, Target, Lightbulb, ArrowRight, Layers, AlertCircle, Users, Ban, MessageSquare, History, FileText, Clock, Zap, XCircle, HelpCircle } from 'lucide-react';

interface ResultSectionProps {
  result: AnalysisResult | null;
  selectedView: string;
  logs: LogEntry[];
  prdResult?: PRDResult | null;
}

const ResultSection: React.FC<ResultSectionProps> = ({ result, selectedView, logs, prdResult }) => {
  if (!result) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <Target className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-center font-medium">왼쪽에서 의견을 입력하고<br/>통합 버튼을 눌러주세요.</p>
        </div>
    );
  }

  // View: Vision (Default)
  if (selectedView === 'VISION') {
    return (
        <div className="animate-fade-in space-y-8 h-full overflow-y-auto pr-2 custom-scrollbar">

          {/* Header / Pitch */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black text-white text-xs font-semibold tracking-wide uppercase">
              <Target className="w-3 h-3" /> 비전 (Vision)
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight break-keep">
              &quot;{result.elevatorPitch}&quot;
            </h2>
          </div>

          {/* Problem / Target / Alternatives Grid */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
             <div className="grid grid-cols-1 gap-4">
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                    <AlertCircle className="w-4 h-4" /> 문제 (Pain Point)
                 </div>
                 <p className="text-sm text-gray-700 leading-relaxed break-keep bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                   {result.problemTarget.problem}
                 </p>
               </div>

               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <Users className="w-4 h-4" /> 타겟 (Persona)
                 </div>
                 <p className="text-sm text-gray-700 leading-relaxed break-keep bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                   {result.problemTarget.targetAudience}
                 </p>
               </div>

               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                    <Ban className="w-4 h-4" /> 기존 대안 (Alternatives)
                 </div>
                 <p className="text-sm text-gray-700 leading-relaxed break-keep bg-slate-50 p-3 rounded-lg border border-slate-100">
                   {result.problemTarget.alternatives}
                 </p>
               </div>
            </div>
          </div>

          {/* Core Features */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">기능 로드맵</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">P0 - MVP 핵심</span>
                        <ul className="mt-3 space-y-3">
                            {result.coreFeatures.p0.map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-800 break-keep group">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span className="leading-snug">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">P1 - 고도화</span>
                        <ul className="mt-3 space-y-3">
                            {result.coreFeatures.p1.map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 break-keep">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 flex-shrink-0"></span>
                                    <span className="leading-snug">{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Lightbulb className="w-24 h-24" />
                </div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                     다음 실행 계획 <ArrowRight className="w-4 h-4 animate-pulse" />
                </h3>
                <div className="space-y-4 text-sm relative z-10">
                    <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">즉시 실행 (Action Item)</span>
                        <p className="font-medium break-keep text-base">{result.nextSteps.immediateAction}</p>
                    </div>
                    <div className="w-full h-px bg-gray-700"></div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">MVP 범위</span>
                            <p className="text-gray-300 break-keep leading-snug">{result.nextSteps.mvpScope}</p>
                        </div>
                        <div>
                            <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">다음 회의</span>
                            <p className="text-gray-300 break-keep leading-snug">{result.nextSteps.nextMeetingTopic}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Open Questions */}
           <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 flex flex-col gap-4">
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded whitespace-nowrap self-start">논의 필요 사항</span>
                <div className="flex flex-col gap-2">
                    {result.openQuestions.map((q, i) => (
                        <span key={i} className="text-sm text-amber-900 font-medium flex items-center gap-2 break-keep">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span> {q}
                        </span>
                    ))}
                </div>
           </div>

        </div>
      );
  }

  // View: PRD (Product Requirements Document)
  if (selectedView === 'PRD' && prdResult) {
    return (
      <div className="animate-fade-in space-y-8 h-full overflow-y-auto pr-2 custom-scrollbar">

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-semibold tracking-wide uppercase">
            <FileText className="w-3 h-3" /> PRD (Product Requirements)
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight break-keep">
            &quot;{prdResult.elevator_pitch}&quot;
          </h2>
        </div>

        {/* Problem / Target / Alternatives */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                <AlertCircle className="w-4 h-4" /> Pain Point
              </div>
              <p className="text-sm text-gray-700 leading-relaxed break-keep bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                {prdResult.problem_and_target.pain_point}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                <Users className="w-4 h-4" /> Persona
              </div>
              <p className="text-sm text-gray-700 leading-relaxed break-keep bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                {prdResult.problem_and_target.persona}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                <Ban className="w-4 h-4" /> Current Alternative
              </div>
              <p className="text-sm text-gray-700 leading-relaxed break-keep bg-slate-50 p-3 rounded-lg border border-slate-100">
                {prdResult.problem_and_target.current_alternative}
              </p>
            </div>
          </div>
        </div>

        {/* Core Features with Priorities */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900">Feature Roadmap (MVP 수렴 적용)</h3>
          </div>

          <div className="space-y-6">
            {/* P0 Features */}
            <div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider">P0 - MVP 핵심</span>
              <ul className="mt-3 space-y-3">
                {prdResult.core_features.filter(f => f.priority === 'P0').map((f, i) => (
                  <li key={i} className="flex flex-col gap-1 text-sm text-gray-800 break-keep group bg-emerald-50/30 p-3 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-semibold">{f.feature_name}</span>
                    </div>
                    <span className="text-gray-600 text-xs ml-6">{f.user_story}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* P1 Features */}
            <div className="pt-4 border-t border-gray-50">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">P1 - 고도화</span>
              <ul className="mt-3 space-y-3">
                {prdResult.core_features.filter(f => f.priority === 'P1').map((f, i) => (
                  <li key={i} className="flex flex-col gap-1 text-sm text-gray-600 break-keep">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0"></span>
                      <span className="font-medium">{f.feature_name}</span>
                    </div>
                    <span className="text-gray-500 text-xs ml-4">{f.user_story}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* P2 Features */}
            {prdResult.core_features.filter(f => f.priority === 'P2').length > 0 && (
              <div className="pt-4 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">P2 - 향후</span>
                <ul className="mt-3 space-y-2">
                  {prdResult.core_features.filter(f => f.priority === 'P2').map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-500 break-keep">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0"></span>
                      <span>{f.feature_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps - MVP Focus */}
        <div className="bg-violet-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-24 h-24" />
          </div>
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            Next Steps (MVP 수렴) <ArrowRight className="w-4 h-4 animate-pulse" />
          </h3>

          <div className="space-y-6 text-sm relative z-10">
            {/* Immediate Action */}
            <div className="bg-violet-800/50 p-4 rounded-lg">
              <span className="text-violet-300 text-xs uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> 즉시 실행 (Immediate Action)
              </span>
              <p className="font-medium break-keep text-base">{prdResult.next_steps.immediate_action}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MVP Scope */}
              <div className="bg-emerald-900/30 p-4 rounded-lg border border-emerald-700/30">
                <span className="text-emerald-300 text-xs uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> MVP 범위 (2-3개)
                </span>
                <ul className="space-y-2">
                  {prdResult.next_steps.mvp_scope.map((item, i) => (
                    <li key={i} className="text-emerald-100 break-keep flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">&#8226;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skip for Now */}
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-700/30">
                <span className="text-red-300 text-xs uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> MVP 제외 (Skip for Now)
                </span>
                <ul className="space-y-2">
                  {prdResult.next_steps.skip_for_now.map((item, i) => (
                    <li key={i} className="text-red-200 break-keep flex items-start gap-2 line-through opacity-70">
                      <span className="text-red-400 mt-1">&#8226;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Decision Needed */}
            <div className="bg-amber-900/30 p-4 rounded-lg border border-amber-700/30">
              <span className="text-amber-300 text-xs uppercase tracking-wider block mb-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> 이번 주 결정 필요
              </span>
              <p className="text-amber-100 break-keep font-medium">{prdResult.next_steps.decision_needed}</p>
            </div>
          </div>
        </div>

        {/* Role Perspectives */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Role Perspectives</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Business */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Business</span>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Monetization:</span>
                  <p className="text-gray-700 break-keep">{prdResult.role_perspectives.business.monetization}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Key Metrics:</span>
                  <p className="text-gray-700 break-keep">{prdResult.role_perspectives.business.key_metrics}</p>
                </div>
              </div>
            </div>

            {/* Design */}
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
              <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">Design</span>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Mood:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {prdResult.role_perspectives.design.mood_keywords.map((keyword, i) => (
                      <span key={i} className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">{keyword}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">References:</span>
                  <p className="text-gray-700 break-keep">{prdResult.role_perspectives.design.references.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Tech */}
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Tech</span>
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Stack:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {prdResult.role_perspectives.tech.expected_stack.map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">{tech}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Risks:</span>
                  <p className="text-gray-700 break-keep">{prdResult.role_perspectives.tech.technical_risks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Open Questions */}
        {prdResult.open_questions.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 space-y-4">
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">Open Questions</span>
            <div className="space-y-3">
              {prdResult.open_questions.map((q, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-900 font-medium break-keep">{q.issue}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                    <span className="px-1.5 py-0.5 bg-amber-100 rounded">{q.involved_roles.join(', ')}</span>
                    <span className="text-amber-500">AI 제안:</span>
                    <span className="text-amber-700">{q.ai_suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  // View: Specific Role
  let roleTitle = "";
  let roleContent = "";
  let roleColor = "";
  let roleIcon = null;

  if (selectedView === Role.PM) {
      roleTitle = "기획 / 전략 (PM) 관점";
      roleContent = result.rolePerspectives.pmFocus;
      roleColor = "text-blue-600 bg-blue-50";
      roleIcon = <Target className="w-5 h-5" />;
  } else if (selectedView === Role.DESIGNER) {
      roleTitle = "디자인 / UX 관점";
      roleContent = result.rolePerspectives.designFocus;
      roleColor = "text-pink-600 bg-pink-50";
      roleIcon = <Users className="w-5 h-5" />;
  } else if (selectedView === Role.DEV) {
      roleTitle = "개발 / 테크 관점";
      roleContent = result.rolePerspectives.devFocus;
      roleColor = "text-emerald-600 bg-emerald-50";
      roleIcon = <Layers className="w-5 h-5" />;
  }

  // Filter logs for the selected role view
  const roleLogs = logs.filter(l => l.role === selectedView);

  return (
    <div className="animate-fade-in space-y-6 h-full">
        {/* Main Analysis Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-6 ${roleColor}`}>
                {roleIcon}
                <span className="font-bold text-sm">{roleTitle}</span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-8 leading-snug break-keep">
                &quot;이 직군에서는<br/>
                <span className="text-gray-500">이렇게 생각합니다.&quot;</span>
            </h3>

            <div className="prose prose-lg text-gray-700 break-keep leading-relaxed">
                <p>{roleContent}</p>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>AI가 분석한 핵심 요약입니다.</span>
            </div>
        </div>

        {/* Input History Section for this Role */}
        {roleLogs.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                    <History className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Input History Timeline</span>
                </div>

                <div className="space-y-4">
                    {roleLogs.map((log) => (
                        <div key={log.id} className="relative pl-6 border-l-2 border-gray-200 last:border-0 pb-1">
                            {/* Dot */}
                            <div className="absolute top-1.5 left-[-5px] w-2 h-2 rounded-full bg-gray-400 border-2 border-white box-content"></div>

                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-500">
                                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs font-bold text-gray-700">{log.action}</span>
                            </div>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                                {log.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default ResultSection;
