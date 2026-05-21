/**
 * 워크플로우 타입 정의
 * 아이디어 검증 → PRD → 사업계획서 3단계 워크플로우
 */

import type { ValidationLevel } from '@/src/hooks/useValidatedIdeas';

export type WorkflowStep = 'validation' | 'prd' | 'business-plan';

// Re-export for convenience
export type { ValidationLevel };

export interface WorkflowStepInfo {
  id: WorkflowStep;
  label: string;
  description: string;
  order: number;
}

export const WORKFLOW_STEPS: WorkflowStepInfo[] = [
  {
    id: 'validation',
    label: '아이디어 검증',
    description: '전문가 시뮬레이션으로 아이디어 검증',
    order: 1,
  },
  {
    id: 'prd',
    label: 'PRD & JD 확인',
    description: 'AI가 생성한 제품 정의서와 채용 공고 확인',
    order: 2,
  },
  {
    id: 'business-plan',
    label: '사업계획서 작성',
    description: '정부 지원사업 양식에 맞춰 사업계획서 작성',
    order: 3,
  },
];

export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  validatedIdeaId?: string;
  validationScore?: number;
  businessPlanId?: string;
}

export interface WorkflowData {
  validatedIdeaId?: string;
  projectIdea?: string;
  conversationHistory?: string;
  reflectedAdvice?: string[];
  artifacts?: {
    prd?: string;
    jd?: string;
  };
  score?: number;
  personaScores?: {
    developer?: number;
    designer?: number;
    vc?: number;
  };
  actionPlan?: {
    developer?: string[];
    designer?: string[];
    vc?: string[];
  };
  validationLevel?: ValidationLevel;
}

/**
 * 워크플로우 진행률 계산
 */
export function calculateProgress(completedSteps: WorkflowStep[]): number {
  return Math.round((completedSteps.length / WORKFLOW_STEPS.length) * 100);
}

/**
 * 다음 단계 가져오기
 */
export function getNextStep(currentStep: WorkflowStep): WorkflowStep | null {
  const currentOrder = WORKFLOW_STEPS.find(s => s.id === currentStep)?.order ?? 0;
  const nextStep = WORKFLOW_STEPS.find(s => s.order === currentOrder + 1);
  return nextStep?.id ?? null;
}

/**
 * 이전 단계 가져오기
 */
export function getPrevStep(currentStep: WorkflowStep): WorkflowStep | null {
  const currentOrder = WORKFLOW_STEPS.find(s => s.id === currentStep)?.order ?? 0;
  const prevStep = WORKFLOW_STEPS.find(s => s.order === currentOrder - 1);
  return prevStep?.id ?? null;
}
