'use client';

import { useMutation } from '@tanstack/react-query';

// PRD Types (duplicated from types.ts for client-side usage)
interface PRDProblemAndTarget {
  persona: string;
  pain_point: string;
  current_alternative: string;
}

interface PRDCoreFeature {
  feature_name: string;
  user_story: string;
  priority: 'P0' | 'P1' | 'P2';
}

interface PRDRolePerspectives {
  business: { monetization: string; key_metrics: string };
  design: { mood_keywords: string[]; references: string[] };
  tech: { expected_stack: string[]; technical_risks: string };
}

interface PRDOpenQuestion {
  issue: string;
  involved_roles: string[];
  ai_suggestion: string;
}

interface PRDNextSteps {
  immediate_action: string;
  mvp_scope: string[];
  skip_for_now: string[];
  decision_needed: string;
}

export interface PRDResult {
  elevator_pitch: string;
  problem_and_target: PRDProblemAndTarget;
  core_features: PRDCoreFeature[];
  role_perspectives: PRDRolePerspectives;
  open_questions: PRDOpenQuestion[];
  next_steps: PRDNextSteps;
}

export interface PRDResponse {
  success: boolean;
  data?: PRDResult;
  error?: string;
}

export interface PRDInput {
  pm: string;
  designer: string;
  developer: string;
}

/**
 * Generate PRD from team inputs
 */
export async function generatePRD(input: PRDInput): Promise<PRDResponse> {
  const response = await fetch('/api/prd', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'PRD 생성 실패' }));
    throw new Error(error.error || 'PRD 생성 실패');
  }

  return response.json();
}

/**
 * React Query hook for PRD generation
 */
export function useGeneratePRD() {
  return useMutation({
    mutationFn: generatePRD,
  });
}

/**
 * Extract PRD result from response
 */
export function extractPRDResult(response: PRDResponse): PRDResult | null {
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}
