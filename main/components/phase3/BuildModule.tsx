'use client';

import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskType, IntegrationState, PRDData } from '@/types';
import { TaskCard } from './TaskCard';
import { RoleFilter } from './RoleFilter';
import { AnalysisPanel } from './AnalysisPanel';
import { INITIAL_TASKS, EMPTY_PRD } from './constants';
import { Plus, Layout, AlertCircle, RefreshCw, Share2, PanelLeft, FileText, Cpu, ArrowRight, FlaskConical } from 'lucide-react';
import type { PRDResult } from '@/src/lib/api/prd';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: '할 일' },
  { id: 'IN_PROGRESS', label: '진행 중' },
  { id: 'REVIEW', label: '검토' },
  { id: 'DONE', label: '완료' }
];

interface BuildModuleProps {
  prdData?: PRDResult | null;
}

export const BuildModule: React.FC<BuildModuleProps> = ({ prdData }) => {
  const prd: PRDData = prdData ? {
    title: prdData.elevator_pitch.slice(0, 50) + '...',
    summary: prdData.elevator_pitch,
    features: prdData.core_features.map(f => f.feature_name),
    techStack: prdData.role_perspectives.tech.expected_stack
  } : EMPTY_PRD;
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [viewState, setViewState] = useState<'PRD' | 'KANBAN'>('PRD');
  const [activeRoleFilter, setActiveRoleFilter] = useState<TaskType | 'ALL'>('ALL');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analysisReasoning, setAnalysisReasoning] = useState<string>("초기 분석 데이터가 없습니다. PRD에서 작업을 생성해주세요.");
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);

  const [integrations] = useState<IntegrationState>({ jira: false, linear: false });
  const [isSyncing, setIsSyncing] = useState(false);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Mock task generation (simulated)
  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockGeneratedTasks: Task[] = [
        {
          id: `TKT-${Math.floor(Math.random() * 1000) + 1000}`,
          title: 'API 엔드포인트 설계',
          description: 'RESTful API 구조 및 엔드포인트 명세 작성',
          status: 'TODO',
          type: 'ARCHITECTURE',
          estimate: '4h',
          priority: 'HIGH',
          comments: []
        },
        {
          id: `TKT-${Math.floor(Math.random() * 1000) + 1000}`,
          title: '사용자 인증 구현',
          description: 'JWT 기반 로그인/회원가입 API 구현',
          status: 'TODO',
          type: 'BACKEND',
          estimate: '8h',
          priority: 'HIGH',
          comments: []
        },
        {
          id: `TKT-${Math.floor(Math.random() * 1000) + 1000}`,
          title: '대시보드 UI 컴포넌트',
          description: '메인 대시보드 레이아웃 및 차트 컴포넌트 개발',
          status: 'TODO',
          type: 'FRONTEND',
          estimate: '6h',
          priority: 'MEDIUM',
          comments: []
        },
        {
          id: `TKT-${Math.floor(Math.random() * 1000) + 1000}`,
          title: '디자인 시스템 구축',
          description: '색상, 타이포그래피, 컴포넌트 가이드라인 정의',
          status: 'TODO',
          type: 'DESIGN',
          estimate: '4h',
          priority: 'MEDIUM',
          comments: []
        }
      ];

      setTasks(prev => [...prev, ...mockGeneratedTasks]);
      setAnalysisReasoning("PRD 분석 결과, MVP 개발을 위해 백엔드 인증 → API 설계 → 프론트엔드 UI 순서로 진행하는 것이 효율적입니다. 디자인 시스템은 병렬로 진행 가능합니다.");
      setViewState('KANBAN');
      setShowAnalysisPanel(true);
    } catch {
      setError("작업을 생성하지 못했습니다. API 키를 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (activeRoleFilter === 'ALL') return tasks;
    return tasks.filter(t => t.type === activeRoleFilter);
  }, [tasks, activeRoleFilter]);

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    handleUpdateTask(taskId, { status });
  };

  const handleSync = async () => {
    if (!integrations.jira && !integrations.linear) return;
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSyncing(false);
  };

  return (
    <div className="flex h-full bg-surface-card rounded-xl border border-border overflow-hidden">
      {/* Analysis Panel (Left) */}
      {viewState === 'KANBAN' && (
        <AnalysisPanel
          isOpen={showAnalysisPanel}
          onToggle={() => setShowAnalysisPanel(!showAnalysisPanel)}
          reasoning={analysisReasoning}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-surface-card px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {viewState === 'KANBAN' && (
              <button
                onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                className={`p-1.5 hover:bg-surface-sunken transition-colors ${showAnalysisPanel ? 'text-indigo-600 bg-indigo-50' : 'text-txt-disabled'}`}
                title="AI 분석 패널 토글"
                aria-label="AI 분석 패널 토글"
                aria-pressed={showAnalysisPanel}
              >
                <PanelLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-txt-primary font-bold">{prd.title}</span>
              {viewState === 'KANBAN' && (
                <span className="bg-surface-sunken text-txt-secondary px-1.5 py-0.5 text-[10px] font-bold border border-border">
                  SPRINT-1
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewState === 'KANBAN' && (integrations.jira || integrations.linear) && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-2 py-1 bg-surface-card rounded-lg border border-border text-xs font-medium text-txt-secondary hover:bg-black hover:text-white flex items-center gap-1.5 transition-all"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-status-danger-bg text-status-danger-text px-3 py-1.5 shadow-md border border-status-danger-text/20 flex items-center gap-2 z-50 text-xs">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {viewState === 'PRD' ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                {/* PRD Viewer */}
                <div className="bg-surface-card rounded-xl border border-border p-6 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-status-success-bg text-status-success-text text-xs font-mono font-medium border border-status-success-text/20">PHASE 2 완료</span>
                        <span className="text-xs text-txt-disabled font-mono">v1.2 FINAL</span>
                      </div>
                      <h2 className="text-xl font-bold text-txt-primary">{prd.title}</h2>
                    </div>
                    <div className="p-2 bg-surface-sunken rounded-xl border border-border-subtle">
                      <FileText className="text-txt-disabled" size={20} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[10px] font-medium text-txt-primary mb-1">요약</h3>
                      <p className="text-txt-secondary leading-relaxed text-sm">{prd.summary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-[10px] font-medium text-txt-primary mb-1">핵심 기능</h3>
                        <ul className="list-disc list-inside space-y-0.5">
                          {prd.features.map((f, i) => (
                            <li key={i} className="text-sm text-txt-secondary">{f}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-medium text-txt-primary mb-1">기술 스택</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {prd.techStack.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-xs border border-border font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 flex items-center justify-center">
                        <Cpu size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-txt-primary">Phase 3를 시작할까요?</p>
                        <p className="text-xs text-txt-tertiary">AI가 이 문서를 실행 가능한 티켓으로 분해합니다.</p>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateTasks}
                      disabled={isGenerating}
                      className={`
                        group relative px-4 py-2 font-medium text-sm text-white flex items-center gap-2 overflow-hidden transition-all
                        ${isGenerating ? 'bg-txt-disabled cursor-not-allowed' : 'bg-black hover:opacity-90 active:scale-[0.97]'}
                      `}
                    >
                      {isGenerating && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      )}
                      {isGenerating ? (
                        <>아키텍처 분석 중...</>
                      ) : (
                        <>
                          <span>작업 분해 시작</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col p-4">
              {/* Control Bar */}
              <div className="flex flex-col gap-3 mb-3 flex-shrink-0">
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <RoleFilter
                      tasks={tasks}
                      currentFilter={activeRoleFilter}
                      onFilterChange={setActiveRoleFilter}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 bg-surface-sunken border border-surface-card flex items-center justify-center text-[10px] font-bold text-txt-secondary z-30">LS</div>
                      <div className="w-6 h-6 bg-surface-sunken border border-surface-card flex items-center justify-center text-[10px] font-bold text-txt-secondary z-20">DK</div>
                      <div className="w-6 h-6 bg-indigo-100 border border-surface-card flex items-center justify-center text-[10px] font-bold text-indigo-700 z-10">AI</div>
                    </div>
                    <button className="w-6 h-6 border border-border flex items-center justify-center text-txt-disabled hover:border-border hover:text-txt-secondary transition-colors rounded-lg">
                      <Share2 size={12} />
                    </button>
                    <button className="bg-surface-inverse text-txt-inverse px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-all ml-1 rounded-lg">
                      <Plus size={12} /> 추가
                    </button>
                  </div>
                </div>
              </div>

              {/* Kanban Board */}
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-3 overflow-x-auto pb-4 items-start h-full">
                  {COLUMNS.map(column => (
                    <div
                      key={column.id}
                      className="flex-1 min-w-[15rem] max-w-xs flex flex-col h-full bg-surface-sunken rounded-xl border border-border hover:bg-surface-sunken/80 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                      <div className="p-2.5 flex items-center justify-between sticky top-0 bg-inherit z-10">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[10px] font-medium text-txt-secondary">{column.label}</h3>
                          <span className="bg-surface-sunken text-txt-secondary px-1.5 py-0.5 text-[10px] font-mono border border-border">
                            {filteredTasks.filter(t => t.status === column.id).length}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 pt-0 overflow-y-auto flex-1 space-y-2">
                        {filteredTasks.filter(t => t.status === column.id).map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onDragStart={handleDragStart}
                            onClick={setActiveTask}
                          />
                        ))}
                        {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                          <div className="h-20 border border-border flex flex-col items-center justify-center text-txt-disabled text-xs gap-1">
                            <span className="opacity-50">Empty</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
