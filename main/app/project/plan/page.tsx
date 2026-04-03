'use client';

import React, { useState } from 'react';
import { Role, RoleInputData, AnalysisResult, LogEntry } from '@/types';
import InputSection from '@/components/InputSection';
import TriangleVisual from '@/components/TriangleVisual';
import ResultSection from '@/components/ResultSection';
import { useGeneratePRD, type PRDResult } from '@/src/lib/api/prd';
import { Clock, FileText } from 'lucide-react';

export default function PlanPage() {
  const [inputs, setInputs] = useState<RoleInputData[]>([
    { role: Role.PM, content: "", isSubmitted: false },
    { role: Role.DESIGNER, content: "", isSubmitted: false },
    { role: Role.DEV, content: "", isSubmitted: false }
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedView, setSelectedView] = useState<string>('VISION');
  const [hasInitialSynthesis, setHasInitialSynthesis] = useState(false);
  const [prdResult, setPrdResult] = useState<PRDResult | null>(null);

  const { mutate: generatePRDMutation, isPending: isGeneratingPRD } = useGeneratePRD();

  const handleInputChange = (role: Role, value: string) => {
    setInputs(prev => prev.map(item =>
      item.role === role ? { ...item, content: value } : item
    ));
  };

  const handleSendRole = async (role: Role) => {
    const currentInput = inputs.find(i => i.role === role);
    if (!currentInput) return;

    const isUpdate = currentInput.isSubmitted;
    const newLog: LogEntry = {
        id: Date.now(),
        role: role,
        timestamp: new Date(),
        action: isUpdate ? "의견 수정" : "초기 제안",
        content: currentInput.content
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    const newInputs = inputs.map(item =>
      item.role === role ? { ...item, isSubmitted: true } : item
    );
    setInputs(newInputs);

    const allSubmitted = newInputs.every(i => i.isSubmitted);

    if (allSubmitted || hasInitialSynthesis) {
        if (allSubmitted) {
            await performAnalysis(newInputs);
        }
    }
  };

  const handleUndoLog = (logId: number) => {
    const targetLog = logs.find(l => l.id === logId);
    if (!targetLog) return;

    const newLogs = logs.filter(l => l.id !== logId);
    setLogs(newLogs);

    const roleLogs = newLogs.filter(l => l.role === targetLog.role);
    const latestLogForRole = roleLogs[0];

    const wasLatest = !roleLogs.some(l => l.timestamp > targetLog.timestamp);

    if (wasLatest) {
        if (latestLogForRole) {
            setInputs(prev => prev.map(item =>
                item.role === targetLog.role
                ? { ...item, content: latestLogForRole.content, isSubmitted: true }
                : item
            ));
        } else {
            setInputs(prev => prev.map(item =>
                item.role === targetLog.role
                ? { ...item, content: "", isSubmitted: false }
                : item
            ));
        }
    }
  };

  const performAnalysis = async (currentInputs: RoleInputData[]) => {
    setIsAnalyzing(true);
    if (!hasInitialSynthesis) {
        setResult(null);
        setSelectedView('VISION');
    }

    try {
      const prdInput = {
        pm: currentInputs.find(i => i.role === Role.PM)?.content || '',
        designer: currentInputs.find(i => i.role === Role.DESIGNER)?.content || '',
        developer: currentInputs.find(i => i.role === Role.DEV)?.content || '',
      };

      await new Promise<void>((resolve, reject) => {
        generatePRDMutation(prdInput, {
          onSuccess: (response) => {
            if (response.success && response.data) {
              setPrdResult(response.data);

              const analysisResult: AnalysisResult = {
                elevatorPitch: response.data.elevator_pitch,
                problemTarget: {
                  problem: response.data.problem_and_target.pain_point,
                  targetAudience: response.data.problem_and_target.persona,
                  alternatives: response.data.problem_and_target.current_alternative,
                },
                coreFeatures: {
                  p0: response.data.core_features.filter(f => f.priority === 'P0').map(f => f.feature_name),
                  p1: response.data.core_features.filter(f => f.priority === 'P1').map(f => f.feature_name),
                  p2: response.data.core_features.filter(f => f.priority === 'P2').map(f => f.feature_name),
                },
                rolePerspectives: {
                  pmFocus: `수익 모델: ${response.data.role_perspectives.business.monetization}. 핵심 지표: ${response.data.role_perspectives.business.key_metrics}`,
                  designFocus: `무드: ${response.data.role_perspectives.design.mood_keywords.join(', ')}. 레퍼런스: ${response.data.role_perspectives.design.references.join(', ')}`,
                  devFocus: `스택: ${response.data.role_perspectives.tech.expected_stack.join(', ')}. 리스크: ${response.data.role_perspectives.tech.technical_risks}`,
                },
                openQuestions: response.data.open_questions.map(q => q.issue),
                nextSteps: {
                  immediateAction: response.data.next_steps.immediate_action,
                  mvpScope: response.data.next_steps.mvp_scope.join(', '),
                  nextMeetingTopic: response.data.next_steps.decision_needed,
                },
              };

              setResult(analysisResult);
              setHasInitialSynthesis(true);
              resolve();
            } else {
              reject(new Error('PRD generation failed'));
            }
          },
          onError: (error) => {
            reject(error);
          },
        });
      });

    } catch (error) {
      console.error("Analysis failed", error);
      alert("분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRoleColor = (role: Role) => {
      switch(role) {
          case Role.PM: return "text-status-info-text bg-status-info-bg";
          case Role.DESIGNER: return "text-pink-600 bg-pink-50";
          case Role.DEV: return "text-emerald-600 bg-emerald-50";
      }
  }

  const handleGeneratePRD = () => {
    setSelectedView('PRD');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-txt-primary">Phase 2: Plan</h2>
          <p className="text-txt-secondary mt-1">
            팀원들의 의견을 모아 PRD(Product Requirements Document)를 생성합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasInitialSynthesis && (
            <button
              onClick={handleGeneratePRD}
              disabled={isGeneratingPRD}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-sm border border-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50 hover:opacity-90 active:scale-[0.97]"
            >
              <FileText className="w-3.5 h-3.5" />
              PRD 보기
            </button>
          )}
          <span className={`flex items-center gap-1.5 text-xs font-medium ${hasInitialSynthesis ? 'text-emerald-600' : 'text-txt-tertiary'}`}>
            <div className={`w-1.5 h-1.5 ${hasInitialSynthesis ? 'bg-emerald-500 animate-pulse' : 'bg-txt-disabled'}`}></div>
            {hasInitialSynthesis ? 'Live Sync Active' : `Waiting (${inputs.filter(i => i.isSubmitted).length}/3)`}
          </span>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Triangle + Input (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Triangle Visual */}
          <div className="bg-surface-card rounded-xl border border-border p-4">
            <div className="text-[10px] font-medium text-txt-disabled mb-2">Alignment Map</div>
            <div className="h-[17.5rem]">
              <TriangleVisual
                inputs={inputs}
                analyzing={isAnalyzing}
                completed={!!result}
                selectedView={selectedView}
                onSelectView={setSelectedView}
              />
            </div>
          </div>

          {/* Input Section */}
          <div className="bg-surface-card rounded-xl border border-border overflow-hidden">
            <div className="h-[20rem]">
              <InputSection
                inputs={inputs}
                logs={logs}
                onChange={handleInputChange}
                onSend={handleSendRole}
                onUndo={handleUndoLog}
                isAnalyzing={isAnalyzing}
                hasInitialSynthesis={hasInitialSynthesis}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Result Dashboard (3/5) */}
        <div className="lg:col-span-3">
          <div className="bg-surface-card rounded-xl border border-border p-6">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <div className="w-1.5 h-4 bg-black"></div>
                Project Dashboard
              </h3>
              {result && (
                <span className="text-[10px] font-mono text-txt-disabled flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Activity Log */}
            {logs.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-border">
                <span className="text-[10px] font-medium text-txt-disabled whitespace-nowrap">Updates</span>
                {logs.slice(0, 3).map(log => (
                  <div key={log.id} className="flex items-center gap-1.5 px-2 py-1 bg-surface-sunken rounded-xl border border-border whitespace-nowrap">
                    <span className="text-[10px] text-txt-disabled font-mono">
                      {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[10px] font-bold px-1 ${getRoleColor(log.role)}`}>
                      {log.role.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Result Content */}
            <div className="max-h-[31.25rem] overflow-y-auto custom-scrollbar">
              <ResultSection result={result} selectedView={selectedView} logs={logs} prdResult={prdResult} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <a
          href="/project/ideate"
          className="px-6 py-2.5 border border-border text-txt-secondary text-sm font-medium hover:bg-black hover:text-white transition-colors"
        >
          &larr; 이전: Ideate
        </a>
        <a
          href="/project/build"
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            hasInitialSynthesis
              ? 'bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 hover:opacity-90 active:scale-[0.97]'
              : 'bg-surface-sunken text-txt-disabled border border-border cursor-not-allowed pointer-events-none'
          }`}
        >
          다음: Build &rarr;
        </a>
      </div>
    </div>
  );
}
