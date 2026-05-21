import { z } from 'zod'

// ── Helpers ──

/** 0-100 점수: AI가 범위 밖 값을 줘도 클램핑 */
const score100 = () =>
  z.number().default(50).transform(v => Math.max(0, Math.min(100, Math.round(v))))

/** 1-5 점수: 성향 점수용 */
const score5 = () =>
  z.number().default(3).transform(v => Math.max(1, Math.min(5, Math.round(v))))

/**
 * Zod v4 호환 nested object default 헬퍼.
 * 필드가 없거나 undefined면 inner schema의 .default() 값들로 채운 기본 객체 반환.
 */
function defaultedObject<T extends z.ZodRawShape>(shape: T) {
  const inner = z.object(shape)
  type Output = z.infer<typeof inner>
  return z.unknown().transform((val): Output =>
    inner.parse(typeof val === 'object' && val !== null ? val : {})
  )
}

const FOUNDER_TYPES = [
  'Blitz Builder', 'Market Sniper', 'Tech Pioneer', 'Community Builder',
] as const

// ── 1. Idea Validator: Analyze ──

export const IdeaAnalyzeSchema = z.object({
  responses: z.array(z.object({
    role: z.string().default('Developer'),
    name: z.string().default('분석가'),
    content: z.string().default('분석 중입니다.'),
    tone: z.string().default('Analytical'),
    suggestedActions: z.array(z.string()).default([]),
  })).default([]),
  metrics: defaultedObject({
    score: score100(),
    developerScore: score100(),
    designerScore: score100(),
    vcScore: score100(),
    keyRisks: z.array(z.string()).default([]),
    keyStrengths: z.array(z.string()).default([]),
    summary: z.string().default('분석 중'),
  }),
})

// ── 2. Idea Validator: Generate Artifacts ──

export const GenerateArtifactsSchema = z.object({
  prd: defaultedObject({
    projectName: z.string().default('프로젝트명'),
    version: z.string().default('0.1'),
    tagline: z.string().default(''),
    overview: z.string().default(''),
    targetAudience: z.array(z.string()).default([]),
    coreFeatures: z.array(z.object({
      name: z.string().default(''),
      description: z.string().default(''),
      priority: z.string().default('Medium'),
      effort: z.string().default('Medium'),
    })).default([]),
    techStack: z.array(z.string()).default([]),
    successMetrics: z.array(z.string()).default([]),
    userFlow: z.string().default(''),
  }),
  jd: defaultedObject({
    roleTitle: z.string().default(''),
    department: z.string().default(''),
    companyIntro: z.string().default(''),
    responsibilities: z.array(z.string()).default([]),
    qualifications: z.array(z.string()).default([]),
    preferred: z.array(z.string()).default([]),
    benefits: z.array(z.string()).default([]),
  }),
  score: score100(),
  ideaSummary: z.string().default(''),
  personaScores: defaultedObject({
    developer: score100(),
    designer: score100(),
    vc: score100(),
  }),
  actionPlan: defaultedObject({
    developer: z.array(z.string()).default([]),
    designer: z.array(z.string()).default([]),
    vc: z.array(z.string()).default([]),
  }),
})

// ── 3. PRD: Analysis (Stage 1) ──

export const PrdAnalysisSchema = z.object({
  domain: z.string().default(''),
  product_type: z.string().default('웹'),
  pm_intent: defaultedObject({
    core_idea: z.string().default(''),
    business_model: z.string().default(''),
    priority_features: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
  }),
  designer_intent: defaultedObject({
    mood: z.string().default(''),
    references: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
  }),
  developer_intent: defaultedObject({
    suggested_stack: z.array(z.string()).default([]),
    platforms: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
  }),
  conflicts: z.array(z.object({
    type: z.string().default(''),
    description: z.string().default(''),
    roles: z.array(z.string()).default([]),
  })).default([]),
  missing_info: z.array(z.string()).default([]),
})

// ── 4. PRD: Generation (Stage 2) ──

export const PrdGenerationSchema = z.object({
  elevator_pitch: z.string().default(''),
  problem_and_target: defaultedObject({
    persona: z.string().default(''),
    pain_point: z.string().default(''),
    current_alternative: z.string().default(''),
  }),
  core_features: z.array(z.object({
    feature_name: z.string().default(''),
    user_story: z.string().default(''),
    priority: z.string().default('P1'),
  })).default([]),
  role_perspectives: defaultedObject({
    business: defaultedObject({
      monetization: z.string().default(''),
      key_metrics: z.string().default(''),
    }),
    design: defaultedObject({
      mood_keywords: z.array(z.string()).default([]),
      references: z.array(z.string()).default([]),
    }),
    tech: defaultedObject({
      expected_stack: z.array(z.string()).default([]),
      technical_risks: z.string().default(''),
    }),
  }),
  open_questions: z.array(z.object({
    issue: z.string().default(''),
    involved_roles: z.array(z.string()).default([]),
    ai_suggestion: z.string().default(''),
  })).default([]),
  next_steps: defaultedObject({
    immediate_action: z.string().default(''),
    mvp_scope: z.array(z.string()).default([]),
    skip_for_now: z.array(z.string()).default([]),
    decision_needed: z.string().default(''),
  }),
})

// ── 5. Profile Analyzer ──

export const ProfileAnalysisSchema = z.object({
  scores: defaultedObject({
    market_fit: score100(),
    execution_power: score100(),
    technical_depth: score100(),
    team_synergy: score100(),
    founder_readiness: score100(),
  }),
  recommended_fields: z.array(z.object({
    name: z.string().default('미분류'),
    score: score100(),
    reason: z.string().default('').transform(v => v.slice(0, 30)),
  })).default([{ name: '일반 스타트업', score: 50, reason: '분석 중' }])
    .transform(v => v.slice(0, 3)),
  strengths: z.array(z.string()).default(['분석 중']).transform(v => v.slice(0, 3)),
  growth_areas: z.array(z.string()).default(['분석 중']).transform(v => v.slice(0, 3)),
  founder_type: z.string().default('Blitz Builder').transform(v =>
    (FOUNDER_TYPES as readonly string[]).includes(v) ? v as typeof FOUNDER_TYPES[number] : 'Blitz Builder'
  ),
  one_liner: z.string().default('프로필 분석 완료'),
})

// ── 6. User Matcher: Match Reasons ──

export const MatchReasonsSchema = z.record(z.string(), z.string())

// ── 7. Profile Extraction ──

export const ProfileExtractionSchema = z.object({
  role: z.string().default(''),
  experience_level: z.string().nullable().default(null),
  preferred_market: z.string().nullable().default(null),
  decision_style: z.string().nullable().default(null),
  skills: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  personality_tags: z.array(z.string()).default([]),
  collaboration_preference: z.string().nullable().default(null),
})

// ── 8. Onboarding: Summarize ──

export const OnboardingSummarySchema = z.object({
  personality: defaultedObject({
    risk: score5(),
    time: score5(),
    communication: score5(),
    decision: score5(),
  }),
  work_style: defaultedObject({
    collaboration: score5(),
    planning: score5(),
    perfectionism: score5(),
  }),
  availability: defaultedObject({
    hours_per_week: z.number().nullable().default(null),
    prefer_online: z.boolean().default(true),
    semester_available: z.boolean().default(true),
  }),
  team_preference: defaultedObject({
    role: z.string().default('유연').transform(v =>
      ['리더', '팔로워', '유연'].includes(v) ? v : '유연'
    ),
    preferred_size: z.string().nullable().default(null),
    atmosphere: z.string().default('균형').transform(v =>
      ['실무형', '캐주얼', '균형'].includes(v) ? v : '균형'
    ),
  }),
  goals: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  wants_from_team: z.array(z.string()).default([]),
  project_interests: z.array(z.string()).default([]),
  summary: z.string().default(''),
  bio: z.string().default(''),
})

// ── 9. Onboarding: Parse (skills/interests) ──

export const OnboardingParseSchema = z.array(z.string()).default([])

// ── 10. Startup Korea Analyzer ──

export const StartupKoreaSchema = z.object({
  korean_summary: z.string().default('분석 결과를 확인해주세요.'),
  problem: z.string().default('정보 없음'),
  business_model: z.string().default('정보 없음'),
  korea_exists: z.boolean().default(false),
  korea_competitors: z.array(z.string()).default([]).transform(v => v.slice(0, 3)),
  korea_fit_score: score100(),
  korea_fit_reason: z.string().default('분석 결과를 확인해주세요.'),
  suggested_localization: z.string().default('추가 분석이 필요합니다.'),
  target_founder_type: z.array(z.string()).default(['Blitz Builder']).transform(v =>
    v.filter(t => (FOUNDER_TYPES as readonly string[]).includes(t)).slice(0, 2)
  ).transform(v => v.length > 0 ? v : ['Blitz Builder']),
  difficulty: z.string().default('medium').transform(v =>
    ['easy', 'medium', 'hard'].includes(v) ? v as 'easy' | 'medium' | 'hard' : 'medium'
  ),
  tags: z.array(z.string()).default([]).transform(v => v.slice(0, 5)),
})

// ── 11. Event Tag Classifier ──

export const EventTagsSchema = z.array(z.string()).default([])

// ── 12/13. Startup Tag Classifier ──

export const StartupTagsSchema = z.array(z.string()).default([])
export const StartupCategorySchema = z.array(z.string()).default([])

// ── 14. PDF Structure ──

export const PdfStructureSchema = z.object({
  problem: z.string().default('내용 없음'),
  solution: z.string().default('내용 없음'),
  target: z.string().default('내용 없음'),
})
