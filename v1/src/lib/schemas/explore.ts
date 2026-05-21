import { z } from 'zod'

// ============================================================
// Explore Page Zod Schemas
// ============================================================

export const CategoryItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number().default(0),
})

export const TrendingTagSchema = z.object({
  tag: z.string(),
  count: z.number().default(0),
})

export const ExploreProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().default(null),
  needed_roles: z.array(z.string()).default([]),
  interest_tags: z.array(z.string()).default([]),
  status: z.string().default('active'),
  created_at: z.string().nullable().default(null),
})

export const ExploreTalentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  nickname: z.string().nullable().default('Anonymous'),
  desired_position: z.string().nullable().default(null),
  interest_tags: z.array(z.string()).nullable().default([]),
  profile_visibility: z.string().default('public'),
  vision_summary: z.string().nullable().default(null),
})

// ============================================================
// Korea Analysis Zod Schemas
// ============================================================

export const KoreaFitAnalysisSchema = z.object({
  reasoning: z.string().default(''),
  opportunities: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  similar_services: z.array(z.string()).default([]),
  market_gap: z.boolean().default(false),
  recommended_localization: z.array(z.string()).default([]),
})

export const FounderTypeSchema = z.enum([
  'Blitz Builder',
  'Market Sniper',
  'Tech Pioneer',
  'Community Builder',
])

export const StartupKoreaAnalysisSchema = z.object({
  korean_summary: z.string().default(''),
  problem: z.string().default(''),
  business_model: z.string().default(''),
  korea_exists: z.boolean().default(false),
  korea_competitors: z.array(z.string()).default([]),
  korea_fit_score: z.number().min(0).max(100).default(0),
  korea_fit_reason: z.string().default(''),
  suggested_localization: z.string().default(''),
  target_founder_type: z.array(FounderTypeSchema).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.array(z.string()).default([]),
})

// ============================================================
// Startup Idea Schema
// ============================================================

export const StartupIdeaSchema = z.object({
  id: z.string(),
  external_id: z.string(),
  source: z.string().default('producthunt'),
  source_url: z.string(),
  name: z.string(),
  tagline: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  category: z.array(z.string()).default([]),
  logo_url: z.string().nullable().default(null),
  website_url: z.string().nullable().default(null),
  funding_stage: z.string().nullable().default(null),
  total_funding: z.number().nullable().default(null),
  investors: z.array(z.string()).default([]),
  upvotes: z.number().default(0),
  comments_count: z.number().default(0),
  korea_fit_score: z.number().nullable().default(null),
  korea_fit_analysis: KoreaFitAnalysisSchema.nullable().default(null),
  similar_korea_startups: z.array(z.string()).default([]),
  interest_tags: z.array(z.string()).default([]),
  tier: z.number().default(4),
  priority_score: z.number().default(0),
  status: z.string().default('active'),
  korea_deep_analysis: StartupKoreaAnalysisSchema.nullable().default(null),
  final_score: z.number().nullable().default(null),
  collected_at: z.string().nullable().default(null),
  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
})

// Inferred types
export type CategoryItem = z.infer<typeof CategoryItemSchema>
export type TrendingTag = z.infer<typeof TrendingTagSchema>
export type ExploreProject = z.infer<typeof ExploreProjectSchema>
export type ExploreTalent = z.infer<typeof ExploreTalentSchema>
export type StartupIdeaParsed = z.infer<typeof StartupIdeaSchema>
