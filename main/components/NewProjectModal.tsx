'use client';

import React, { useState } from 'react';
import { X, Clock, FileText } from 'lucide-react';
import { Role, RoleInputData, AnalysisResult, LogEntry } from '@/types';
import InputSection from '@/components/InputSection';
import TriangleVisual from '@/components/TriangleVisual';
import ResultSection from '@/components/ResultSection';
import { useGeneratePRD, type PRDResult } from '@/src/lib/api/prd';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToBuild?: (prdData: PRDResult | null) => void;
  initialIdea?: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onProceedToBuild, initialIdea }) => {
  const [inputs, setInputs] = useState<RoleInputData[]>([
    { role: Role.PM, content: initialIdea || "", isSubmitted: false },
    { role: Role.DESIGNER, content: "", isSubmitted: false },
    { role: Role.DEV, content: "", isSubmitted: false }
  ]);

  // Update PM content when initialIdea changes
  React.useEffect(() => {
    if (initialIdea) {
      setInputs(prev => prev.map(item =>
        item.role === Role.PM ? { ...item, content: initialIdea } : item
      ));
    }
  }, [initialIdea]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedView, setSelectedView] = useState<string>('VISION');
  const [hasInitialSynthesis, setHasInitialSynthesis] = useState(false);
  const [prdResult, setPrdResult] = useState<PRDResult | null>(null);

  const { mutate: generatePRDMutation } = useGeneratePRD();

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
          case Role.PM: return "text-blue-600 bg-blue-50";
          case Role.DESIGNER: return "text-pink-600 bg-pink-50";
          case Role.DEV: return "text-emerald-600 bg-emerald-50";
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-[98vw] max-w-[1600px] h-[92vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-lg">New Project</h2>
              <p className="text-xs text-gray-500">팀원들의 의견을 모아 PRD를 생성합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1.5 text-xs font-medium ${hasInitialSynthesis ? 'text-emerald-600' : 'text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasInitialSynthesis ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
              {hasInitialSynthesis ? 'Live Sync Active' : `Waiting (${inputs.filter(i => i.isSubmitted).length}/3)`}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Triangle + Input */}
          <div className="w-[35%] flex flex-col border-r border-gray-200 bg-gray-50/50">
            {/* Triangle Visual */}
            <div className="flex-1 relative flex items-center justify-center min-h-0 p-4">
              <div className="absolute top-3 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alignment Map</div>
              <TriangleVisual
                inputs={inputs}
                analyzing={isAnalyzing}
                completed={!!result}
                selectedView={selectedView}
                onSelectView={setSelectedView}
              />
            </div>

            {/* Input Section */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white h-[280px] overflow-hidden">
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

          {/* RIGHT: Result Dashboard */}
          <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-hidden">
            {/* Dashboard Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center gap-2">
                <div className="w-1.5 h-4 bg-black rounded-full"></div>
                Project Dashboard
              </h3>
              {result && (
                <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Activity Log */}
            {logs.length > 0 && (
              <div className="flex-shrink-0 px-6 py-3 border-b border-gray-100 bg-white/80">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Updates</span>
                  {logs.slice(0, 3).map(log => (
                    <div key={log.id} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded border border-gray-100 whitespace-nowrap">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-[10px] font-bold px-1 rounded ${getRoleColor(log.role)}`}>
                        {log.role.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <ResultSection result={result} selectedView={selectedView} logs={logs} prdResult={prdResult} />
            </div>
          </div>
        </div>

        {/* Footer */}
        {hasInitialSynthesis && (
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white flex justify-between items-center">
            <button
              onClick={() => setSelectedView('PRD')}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              PRD 보기
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                나중에 하기
              </button>
              <button
                onClick={() => {
                  onClose();
                  onProceedToBuild?.(prdResult);
                }}
                className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                다음: Build
                <span className="text-[10px] bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded font-bold">BETA</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProjectModal;
