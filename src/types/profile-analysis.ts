export interface ProfileAnalysisResult {
  scores: {
    market_fit: number       // 시장 적합도
    execution_power: number  // 실행력
    technical_depth: number  // 기술 역량
    team_synergy: number     // 팀 시너지
    founder_readiness: number // 창업 준비도
  }
  recommended_fields: Array<{
    name: string    // 분야명 (e.g. "B2B SaaS")
    score: number   // 0-100
    reason: string  // 30자 이내 이유
  }>
  strengths: string[]     // 2-3개
  growth_areas: string[]  // 2-3개
  founder_type: 'Blitz Builder' | 'Market Sniper' | 'Tech Pioneer' | 'Community Builder'
  one_liner: string       // 한 줄 요약
}
