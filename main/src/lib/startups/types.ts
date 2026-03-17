// TypeScript types for startup ideas crawling system

// ============================================================
// Database Schema Types
// ============================================================

export interface StartupIdea {
  id: string;
  external_id: string;              // 'producthunt:123', 'ycombinator:company-name'
  source: StartupSource;
  source_url: string;

  // Basic info
  name: string;
  tagline: string | null;
  description: string | null;
  category: string[];
  logo_url: string | null;
  website_url: string | null;

  // Funding/popularity
  funding_stage: FundingStage | null;
  total_funding: number | null;     // USD
  investors: string[];
  upvotes: number;
  comments_count: number;

  // Korea market analysis
  korea_fit_score: number | null;   // 0-100
  korea_fit_analysis: KoreaFitAnalysis | null;
  similar_korea_startups: string[];

  // Classification/tagging
  interest_tags: string[];
  content_embedding: number[] | null;
  tier: 1 | 2 | 3 | 4;
  priority_score: number;           // 0-100

  // Status
  status: 'active' | 'archived' | 'duplicate';

  // Metadata
  raw_data: Record<string, unknown> | null;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface KoreaStartupReference {
  id: string;
  external_id: string | null;
  source: 'disquiet' | 'tips' | 'manual';
  name: string;
  description: string | null;
  category: string[];
  website_url: string | null;
  content_embedding: number[] | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Enum Types
// ============================================================

export type StartupSource =
  | 'producthunt'
  | 'ycombinator'
  | 'betalist'
  | 'crunchbase'
  | 'theresanai'
  | 'indiehackers'
  | 'manual';

export type FundingStage =
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'series_d_plus'
  | 'ipo'
  | 'acquired'
  | 'bootstrapped';

// ============================================================
// Korea Fit Analysis
// ============================================================

export interface KoreaFitAnalysis {
  reasoning: string;
  opportunities: string[];
  challenges: string[];
  similar_services: string[];
  market_gap: boolean;
  recommended_localization: string[];
}

// ============================================================
// Startup Korea Deep Analysis (Gemini AI)
// ============================================================

export type FounderType =
  | 'Blitz Builder'      // 빠른 실행형
  | 'Market Sniper'      // 시장 분석형
  | 'Tech Pioneer'       // 기술 선도형
  | 'Community Builder'; // 커뮤니티 구축형

export interface StartupKoreaAnalysis {
  korean_summary: string;           // 한국어 2줄 요약
  problem: string;                  // 해결하는 문제
  business_model: string;           // 수익 모델 추정
  korea_exists: boolean;            // 한국에 유사 서비스 존재 여부
  korea_competitors: string[];      // 경쟁사 이름들
  korea_fit_score: number;          // 0-100
  korea_fit_reason: string;         // 적합도 이유
  suggested_localization: string;   // 현지화 포인트
  target_founder_type: FounderType[]; // 추천 파운더 유형
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

// Extended StartupIdea with deep analysis
export interface StartupIdeaWithAnalysis extends StartupIdea {
  korea_deep_analysis: StartupKoreaAnalysis | null;
  final_score: number | null;
}

// ============================================================
// Collector Types
// ============================================================

// Raw data from collectors (before transformation)
export interface CollectedStartup {
  externalId: string;
  source: StartupSource;
  sourceUrl: string;
  name: string;
  tagline?: string;
  description?: string;
  category?: string[];
  logoUrl?: string;
  websiteUrl?: string;
  fundingStage?: FundingStage;
  totalFunding?: number;
  investors?: string[];
  upvotes?: number;
  commentsCount?: number;
  rawData?: Record<string, unknown>;
}

// Transformed startup (before DB insert)
export interface TransformedStartup {
  external_id: string;
  source: StartupSource;
  source_url: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string[];
  logo_url: string | null;
  website_url: string | null;
  funding_stage: FundingStage | null;
  total_funding: number | null;
  investors: string[];
  upvotes: number;
  comments_count: number;
  tier: 1 | 2 | 3 | 4;
  raw_data: Record<string, unknown> | null;
}

// ============================================================
// Product Hunt API Types
// ============================================================

export interface ProductHuntPost {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  website?: string; // Raw from GraphQL API
  websiteUrl?: string; // Mapped field
  votesCount: number;
  commentsCount: number;
  thumbnail?: {
    url: string;
  };
  topics: {
    edges: Array<{
      node: {
        name: string;
      };
    }>;
  };
  createdAt: string;
}

export interface ProductHuntResponse {
  data: {
    posts: {
      edges: Array<{
        node: ProductHuntPost;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
    };
  };
}

// ============================================================
// YC API Types (yc-oss)
// ============================================================

export interface YCCompany {
  id: number;
  name: string;
  slug: string;
  former_names: string[];
  small_logo_thumb_url: string;
  website: string;
  all_locations: string;
  long_description: string;
  one_liner: string;
  team_size: number;
  highlight_black: boolean;
  highlight_latinx: boolean;
  highlight_women: boolean;
  industry: string;
  subindustry: string;
  launched_at: number;
  tags: string[];
  tags_highlighted: string[];
  top_company: boolean;
  isHiring: boolean;
  nonprofit: boolean;
  batch: string;
  status: 'Active' | 'Acquired' | 'Inactive' | 'Public';
  industries: string[];
  regions: string[];
  stage: string;
  app_video_public: boolean;
  demo_day_video_public: boolean;
  app_answers: unknown | null;
  question_answers: boolean;
  url: string;
  api: string;
}

export interface YCBatchResponse {
  companies: YCCompany[];
}

// ============================================================
// BetaList RSS Types
// ============================================================

export interface BetaListItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string[];
}

// ============================================================
// Sync Types
// ============================================================

export interface SyncResult {
  source: StartupSource;
  new_startups: number;
  updated_startups: number;
  skipped_startups: number;
  errors: Array<{
    external_id?: string;
    error: string;
  }>;
  duration_ms: number;
}

export interface SyncOptions {
  limit?: number;
  skipExisting?: boolean;
  dryRun?: boolean;
}

// ============================================================
// Collector Interface
// ============================================================

export interface StartupCollector {
  source: StartupSource;
  tier: 1 | 2 | 3 | 4;
  collect(options?: SyncOptions): Promise<CollectedStartup[]>;
}

// ============================================================
// Manual Upload Types
// ============================================================

export interface ManualUploadItem {
  name: string;
  tagline?: string;
  description?: string;
  category?: string[];
  sourceUrl: string;
  websiteUrl?: string;
  fundingStage?: FundingStage;
  totalFunding?: number;
  investors?: string[];
}

export interface ManualUploadRequest {
  source: StartupSource;
  ideas: ManualUploadItem[];
}

// ============================================================
// Tag Classification Types
// ============================================================

export interface TagClassificationResult {
  category: string[];
  interest_tags: string[];
  confidence: number;
}

export const STARTUP_CATEGORIES = [
  'AI/ML',
  'SaaS',
  'Fintech',
  'E-commerce',
  'HealthTech',
  'EdTech',
  'FoodTech',
  'PropTech',
  'LegalTech',
  'HRTech',
  'MarTech',
  'DevTools',
  'Cybersecurity',
  'CleanTech',
  'AgriTech',
  'Mobility',
  'Gaming',
  'Social',
  'Media',
  'B2B',
  'B2C',
  'Marketplace',
  'Hardware',
  'Blockchain',
  'Other'
] as const;

export type StartupCategory = typeof STARTUP_CATEGORIES[number];

export const INTEREST_TAGS = [
  'automation',
  'productivity',
  'collaboration',
  'analytics',
  'payments',
  'subscription',
  'api',
  'no-code',
  'low-code',
  'mobile-first',
  'enterprise',
  'smb',
  'consumer',
  'creator-economy',
  'remote-work',
  'sustainability',
  'personalization',
  'community',
  'platform',
  'vertical-saas'
] as const;

export type InterestTag = typeof INTEREST_TAGS[number];
