/**
 * @deprecated MVP 모드 숨김 (access manifest: tier='hidden', middleware 가 /explore 리다이렉트).
 * Workflow / Validated Ideas 기능은 초기 B2C 아이디어 검증 플로우였으나 B2B2C 피봇 이후
 * 핵심 경로에서 빠짐. 코드 보존 — 추후 Phase C 에서 재활용 검토 예정.
 */
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { WorkflowSidebar } from '@/components/workflow/WorkflowSidebar';
import {
  WorkflowStep,
  WorkflowData,
  ValidationLevel,
} from '@/src/types/workflow';
import { useValidatedIdea } from '@/src/hooks/useValidatedIdeas';

// ValidationLevel 런타임 검증
const VALID_LEVELS: readonly string[] = ['SKETCH', 'MVP', 'DEFENSE'];
const toValidationLevel = (value: string | null | undefined): ValidationLevel | undefined => {
  if (value && VALID_LEVELS.includes(value)) {
    return value as ValidationLevel;
  }
  return undefined;
};

// 동적 임포트 (코드 분할) — 새 시스템 사용
const IdeaValidatorPage = dynamic(
  () => import('@/components/idea-validator/IdeaValidatorPage'),
  { loading: () => <LoadingSpinner message="아이디어 검증 모듈 로딩 중..." /> }
);

const BusinessPlanEditor = dynamic(
  () => import('@/components/business-plan/BusinessPlanEditor'),
  { loading: () => <LoadingSpinner message="사업계획서 에디터 로딩 중..." /> }
);

// 로딩 스피너 컴포넌트
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[25rem]">
      <div className="w-12 h-12 border-4 border-border border-t-brand animate-spin mb-4" />
      <p className="text-sm text-txt-tertiary">{message}</p>
    </div>
  );
}

// SessionStorage key for workflow state persistence
const WORKFLOW_STORAGE_KEY = 'draft_workflow_state';

interface PersistedWorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  workflowData: WorkflowData;
  savedAt: number;
}

function WorkflowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터에서 ideaId 가져오기
  const ideaIdParam = searchParams.get('ideaId');

  // 워크플로우 상태
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('validation');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({});
  const [isRestored, setIsRestored] = useState(false);

  // 기존 아이디어 로드 (ideaId가 있는 경우)
  const { data: existingIdea, isLoading: isLoadingIdea } = useValidatedIdea(ideaIdParam ?? undefined);

  // 1. SessionStorage에서 상태 복구 (새로고침 시)
  useEffect(() => {
    // ideaId가 있으면 DB에서 로드하므로 복구 불필요
    if (ideaIdParam) {
      setIsRestored(true);
      return;
    }

    try {
      const saved = sessionStorage.getItem(WORKFLOW_STORAGE_KEY);
      if (saved) {
        const parsed: PersistedWorkflowState = JSON.parse(saved);
        // 24시간 이내 데이터만 복구
        const isRecent = Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000;
        if (isRecent && parsed.workflowData.projectIdea) {
          setCurrentStep(parsed.currentStep);
          setCompletedSteps(parsed.completedSteps);
          setWorkflowData(parsed.workflowData);
        }
      }
    } catch (e) {
      console.error('[Workflow] Failed to restore state:', e);
    }
    setIsRestored(true);
  }, [ideaIdParam]);

  // 2. 상태 변경 시 SessionStorage에 저장
  useEffect(() => {
    // 복구 전이거나 데이터가 없으면 저장하지 않음
    if (!isRestored || !workflowData.projectIdea) return;

    const stateToSave: PersistedWorkflowState = {
      currentStep,
      completedSteps,
      workflowData,
      savedAt: Date.now(),
    };

    try {
      sessionStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('[Workflow] Failed to save state:', e);
    }
  }, [currentStep, completedSteps, workflowData, isRestored]);

  // 3. 페이지 이탈 경고 (작업 중인 경우)
  useEffect(() => {
    const hasUnsavedWork = workflowData.projectIdea && currentStep !== 'validation';

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedWork) {
        e.preventDefault();
        e.returnValue = '작업 중인 내용이 있습니다. 페이지를 떠나시겠습니까?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [workflowData.projectIdea, currentStep]);

  // 단계 완료 마킹 헬퍼 (중복 방지 + 누적)
  // useCallback으로 안정적인 참조 유지 - useEffect 의존성 배열에서 안전하게 사용
  const markStepCompleted = useCallback((step: WorkflowStep) => {
    setCompletedSteps(prev => {
      if (prev.includes(step)) return prev;
      return [...prev, step];
    });
  }, []);

  // 기존 아이디어가 있으면 워크플로우 데이터 초기화
  useEffect(() => {
    if (existingIdea) {
      setWorkflowData({
        validatedIdeaId: existingIdea.id,
        projectIdea: existingIdea.project_idea,
        conversationHistory: existingIdea.conversation_history ?? undefined,
        reflectedAdvice: existingIdea.reflected_advice ?? undefined,
        score: existingIdea.score ?? undefined,
        validationLevel: toValidationLevel(existingIdea.validation_level),
      });

      // 이미 검증이 완료된 경우 PRD 단계로 시작
      if (existingIdea.artifacts) {
        markStepCompleted('validation');
        setCurrentStep('prd');
      }
    }
  }, [existingIdea, markStepCompleted]);

  // 아이디어 검증 완료 핸들러
  const handleValidationComplete = (result: { id: string; projectIdea: string }) => {
    setWorkflowData(prev => ({
      ...prev,
      validatedIdeaId: result.id,
      projectIdea: result.projectIdea,
    }));

    // validation 완료, PRD 단계로 이동
    markStepCompleted('validation');
    setCurrentStep('prd');
  };

  // PRD 확인 완료 핸들러
  const handlePrdComplete = () => {
    // PRD 완료, 사업계획서 단계로 이동
    markStepCompleted('prd');
    setCurrentStep('business-plan');
  };

  // 사업계획서 완료 핸들러
  const handleBusinessPlanComplete = () => {
    markStepCompleted('business-plan');
    // 완료된 워크플로우 상태 클리어
    try {
      sessionStorage.removeItem(WORKFLOW_STORAGE_KEY);
    } catch (e) {
      console.error('[Workflow] Failed to clear state:', e);
    }
    // 완료 페이지로 이동하거나 알림 표시
    router.push('/validated-ideas?completed=true');
  };

  // 단계 클릭 핸들러
  const handleStepClick = (step: WorkflowStep) => {
    // 완료된 단계만 클릭 가능
    if (completedSteps.includes(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  // 로딩 중
  if (ideaIdParam && isLoadingIdea) {
    return (
      <div className="flex h-screen">
        <WorkflowSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="기존 아이디어 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-surface-bg">
      {/* 모바일 상단 진행 표시 */}
      <div className="md:hidden bg-surface-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-txt-primary">
            Step {currentStep === 'validation' ? 1 : currentStep === 'prd' ? 2 : 3} / 3
          </span>
          {workflowData.score !== undefined && (
            <span className="text-sm font-bold text-draft-blue">{workflowData.score}점</span>
          )}
        </div>
        <div className="flex gap-1">
          {(['validation', 'prd', 'business-plan'] as const).map((step) => (
            <div
              key={step}
              className={`flex-1 h-1.5 transition-colors ${
                completedSteps.includes(step)
                  ? 'bg-status-success-text'
                  : currentStep === step
                  ? 'bg-draft-blue'
                  : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 사이드바 (데스크톱만) */}
      <div className="hidden md:block">
        <WorkflowSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          validationScore={workflowData.score}
          onStepClick={handleStepClick}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {/* Step 1: 아이디어 검증 (새 시스템) */}
        {currentStep === 'validation' && (
          <IdeaValidatorPage
            embedded
            onComplete={handleValidationComplete}
          />
        )}

        {/* Step 2: PRD 확인 → 바로 사업계획서로 이동 */}
        {currentStep === 'prd' && (
          <div className="h-full overflow-y-auto p-6">
            {workflowData.projectIdea ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[25rem] text-center">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-txt-primary mb-2">
                  아이디어 검증 완료
                </h3>
                <p className="text-sm text-txt-tertiary mb-6 max-w-md">
                  &quot;{workflowData.projectIdea.slice(0, 80)}{workflowData.projectIdea.length > 80 ? '...' : ''}&quot;
                </p>
                <button
                  type="button"
                  onClick={handlePrdComplete}
                  className="px-6 py-3 bg-txt-primary text-surface-card text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                  사업계획서 작성으로 →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[25rem] text-center">
                <div className="w-16 h-16 bg-status-warning-bg border border-status-warning-text flex items-center justify-center mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-txt-primary mb-2">
                  아이디어 검증이 필요합니다
                </h3>
                <p className="text-sm text-txt-tertiary mb-4 max-w-md">
                  사업계획서를 작성하려면 먼저 아이디어 검증을 완료해주세요.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep('validation')}
                  className="px-4 py-2 bg-brand text-white border border-brand text-sm font-medium hover:bg-brand-hover transition-colors"
                >
                  아이디어 검증으로 돌아가기
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: 사업계획서 작성 */}
        {currentStep === 'business-plan' && (
          <div className="h-full overflow-y-auto">
            <BusinessPlanEditor
              validatedIdeaId={workflowData.validatedIdeaId}
              onComplete={handleBusinessPlanComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="워크플로우 로딩 중..." />}>
      <WorkflowContent />
    </Suspense>
  );
}
