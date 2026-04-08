import type { Profile, Skill, CurrentSituation } from '@/src/types/profile'
import { positionToRole, projectRoleLabel } from '@/src/constants/roles'

type RoleGroup = 'tech' | 'creative' | 'biz'

function toRoleGroup(desiredPosition: string | null): RoleGroup {
  const role = positionToRole(desiredPosition || '')
  if (role === 'developer' || role === 'data') return 'tech'
  if (role === 'designer') return 'creative'
  return 'biz'
}

/** 내 직렬 × 상대 직렬 → { skill, teamfit } (interest 20% + situation 15% 고정) */
const USER_WEIGHT_MATRIX: Record<RoleGroup, Record<RoleGroup, { skill: number; teamfit: number }>> = {
  tech:     { tech: { skill: 0.20, teamfit: 0.45 }, creative: { skill: 0.10, teamfit: 0.55 }, biz: { skill: 0.05, teamfit: 0.60 } },
  creative: { tech: { skill: 0.20, teamfit: 0.45 }, creative: { skill: 0.15, teamfit: 0.50 }, biz: { skill: 0.05, teamfit: 0.60 } },
  biz:      { tech: { skill: 0.30, teamfit: 0.35 }, creative: { skill: 0.15, teamfit: 0.50 }, biz: { skill: 0.05, teamfit: 0.60 } },
}

export interface UserMatchResult {
  userId: string
  score: number
  skillComplementarity: number
  interestOverlap: number
  situationCompatibility: number
  teamFit: number
  reason: string
}

/**
 * Team fit score (0-100)
 * Measures personality & work-style compatibility between two users
 * All personality fields are 1-5 spectrum values
 */
function calculateTeamFit(myProfile: Profile, candidate: Profile): number {
  const checks: number[] = []

  // 1. Leader-follower complementarity (personality.teamRole 1~5)
  const myRole = myProfile.personality?.teamRole
  const theirRole = candidate.personality?.teamRole
  if (myRole != null && theirRole != null) {
    // 리더(4-5) + 팔로워(1-2) = 보완 → 높은 점수
    const sum = myRole + theirRole
    const diff = Math.abs(myRole - theirRole)
    if (diff >= 3) checks.push(100)       // 리더+팔로워 (1+5, 2+5, 1+4)
    else if (diff >= 2) checks.push(80)   // 약간 보완적
    else if (sum >= 5 && sum <= 7) checks.push(70) // 둘 다 중간~유연
    else checks.push(40)                  // 리더+리더 or 팔로워+팔로워
  }

  // 2. Communication style similarity (personality.communication 1~5)
  const myComm = myProfile.personality?.communication
  const theirComm = candidate.personality?.communication
  if (myComm != null && theirComm != null) {
    const diff = Math.abs(myComm - theirComm)
    checks.push(diff <= 1 ? 100 : diff === 2 ? 70 : 40)
  }

  // 3. Planning style compatibility (personality.planning 1~5)
  const myPlanning = myProfile.personality?.planning
  const theirPlanning = candidate.personality?.planning
  if (myPlanning != null && theirPlanning != null) {
    const diff = Math.abs(myPlanning - theirPlanning)
    checks.push(diff <= 1 ? 90 : diff === 2 ? 65 : 45)
  }

  // 4. Risk tolerance similarity (personality.risk 1~5)
  const myRisk = myProfile.personality?.risk
  const theirRisk = candidate.personality?.risk
  if (myRisk != null && theirRisk != null) {
    const diff = Math.abs(myRisk - theirRisk)
    checks.push(diff <= 1 ? 90 : diff === 2 ? 60 : 35)
  }

  // 5. Quality/speed alignment (personality.quality 1~5)
  const myQuality = myProfile.personality?.quality
  const theirQuality = candidate.personality?.quality
  if (myQuality != null && theirQuality != null) {
    const diff = Math.abs(myQuality - theirQuality)
    checks.push(diff <= 1 ? 85 : diff === 2 ? 60 : 40)
  }

  return checks.length > 0 ? checks.reduce((a, b) => a + b, 0) / checks.length : 50
}

export interface CandidateProfile extends Profile {
  extracted_profile?: Record<string, unknown> | null
}

/**
 * Skill complementarity (0-100)
 * Prioritizes people who have skills I DON'T have
 */
function calculateSkillComplementarity(
  mySkills: Skill[],
  theirSkills: Skill[],
  myPosition?: string | null,
  theirPosition?: string | null
): number {
  if (theirSkills.length === 0) {
    // Fallback: use desired_position when skills are empty
    if (myPosition && theirPosition) {
      return myPosition !== theirPosition ? 70 : 30
    }
    return 30
  }

  const mySkillNames = new Set(mySkills.map((s) => s.name))

  let complementScore = 0

  for (const skill of theirSkills) {
    if (!mySkillNames.has(skill.name)) {
      // They have a skill I don't — highly complementary
      complementScore += 1.0
    } else {
      // Shared skill — still useful but less complementary
      complementScore += 0.3
    }
  }

  return Math.min(100, (complementScore / theirSkills.length) * 100)
}

/**
 * Interest tag overlap via Jaccard similarity (0-100)
 */
function calculateInterestOverlap(
  myTags: string[],
  theirTags: string[]
): number {
  if (myTags.length === 0 && theirTags.length === 0) return 50
  if (myTags.length === 0 || theirTags.length === 0) return 20

  const mySet = new Set(myTags)
  const theirSet = new Set(theirTags)

  let intersection = 0
  for (const tag of theirSet) {
    if (mySet.has(tag)) intersection++
  }

  const union = new Set([...myTags, ...theirTags]).size
  return (intersection / union) * 100
}

/**
 * Situation compatibility (0-100)
 */
function calculateSituationCompatibility(
  mySituation: CurrentSituation | null,
  theirSituation: CurrentSituation | null
): number {
  if (!mySituation || !theirSituation) return 50

  const key = `${mySituation}+${theirSituation}`
  const reverseKey = `${theirSituation}+${mySituation}`

  const scores: Record<string, number> = {
    'has_project+want_to_join': 100,
    'want_to_join+has_project': 100,
    'solo+solo': 70,
    'solo+want_to_join': 60,
    'want_to_join+solo': 60,
    'has_project+solo': 50,
    'solo+has_project': 50,
    'want_to_join+want_to_join': 50,
    'has_project+has_project': 40,
  }

  return scores[key] ?? scores[reverseKey] ?? 50
}

/**
 * Generate a natural, single-sentence match reason
 *
 * 설계 원칙:
 *  - 단어 나열(" · " 조인) 대신 1등 차원 하나만 문장으로
 *  - 포지션을 명사로 써서 "~한 B예요" 형태 → 태그 느낌 제거
 *  - 점수 차이가 작으면(±10) 2등 차원을 접속구로 붙여 자연스럽게 결합
 *  - 구체 정보(스킬명·관심사·지역)는 반드시 문장 안에 녹여 정보량 유지
 *  - interest_tags는 카드에서 별도 칩으로 렌더되므로 여기선 중복 방지
 */
function generateUserMatchReason(
  myProfile: Profile,
  candidate: CandidateProfile,
  scores: {
    skillComplementarity: number
    interestOverlap: number
    situationCompatibility: number
    teamFit: number
  }
): string {
  const positionNoun = positionToNoun(candidate.desired_position)
  const cop = copula(positionNoun)  // "예요" or "이에요"

  // 1등/2등 차원 찾기
  type DimKey = 'skill' | 'interest' | 'situation' | 'teamfit'
  const dims: Array<{ key: DimKey; score: number }> = (
    [
      { key: 'skill', score: scores.skillComplementarity },
      { key: 'teamfit', score: scores.teamFit },
      { key: 'interest', score: scores.interestOverlap },
      { key: 'situation', score: scores.situationCompatibility },
    ] as Array<{ key: DimKey; score: number }>
  ).sort((a, b) => b.score - a.score)

  const top = dims[0]
  const second = dims[1]
  const closeSecond = second && top.score - second.score <= 10 && second.score >= 60

  // 차원별 1등 문장 (B = positionNoun)
  const leadByDim = {
    skill: () => {
      const mySkillNames = new Set((myProfile.skills || []).map((s) => s.name))
      const complementary = (candidate.skills || [])
        .filter((s) => !mySkillNames.has(s.name))
        .slice(0, 2)
        .map((s) => s.name)
      if (complementary.length >= 2) return `${complementary.join('·')}을 다루는 ${positionNoun}${cop}`
      if (complementary.length === 1) return `${complementary[0]}이 강점인 ${positionNoun}${cop}`
      return `스킬 조합이 잘 맞는 ${positionNoun}${cop}`
    },
    teamfit: () => {
      const myRole = myProfile.personality?.teamRole
      const theirRole = candidate.personality?.teamRole
      if (myRole != null && theirRole != null && Math.abs(myRole - theirRole) >= 3) {
        return `리더-서포터 조합이 잘 맞는 ${positionNoun}${cop}`
      }
      const commDiff = Math.abs(
        (myProfile.personality?.communication ?? 3) - (candidate.personality?.communication ?? 3)
      )
      if (commDiff <= 1) return `소통 스타일이 잘 맞는 ${positionNoun}${cop}`
      return `작업 방식이 잘 맞는 ${positionNoun}${cop}`
    },
    interest: () => {
      const overlapping = (candidate.interest_tags || []).filter((t) =>
        (myProfile.interest_tags || []).includes(t)
      )
      if (overlapping.length >= 1) {
        return `${overlapping[0]}에 함께 관심 있는 ${positionNoun}${cop}`
      }
      return `관심사가 겹치는 ${positionNoun}${cop}`
    },
    situation: () => {
      if (scores.situationCompatibility >= 90) return `지금 팀원을 찾고 있는 ${positionNoun}${cop}`
      return `함께 시작하기 좋은 ${positionNoun}${cop}`
    },
  }

  // 2등 차원 접속구 (문장에 자연스럽게 붙는 짧은 꼬리)
  const tailByDim = {
    skill: () => {
      const mySkillNames = new Set((myProfile.skills || []).map((s) => s.name))
      const c = (candidate.skills || []).filter((s) => !mySkillNames.has(s.name))[0]
      return c ? `, ${c.name}도 다뤄요` : ''
    },
    teamfit: () => ', 팀핏도 잘 맞아요',
    interest: () => {
      const overlapping = (candidate.interest_tags || []).filter((t) =>
        (myProfile.interest_tags || []).includes(t)
      )
      return overlapping[0] ? `, ${overlapping[0]} 관심사도 겹쳐요` : ''
    },
    situation: () => (scores.situationCompatibility >= 90 ? ', 마침 팀원을 찾고 있어요' : ''),
  }

  const lead = leadByDim[top.key]()

  if (closeSecond) {
    const tail = tailByDim[second.key]()
    if (tail) {
      // 어미를 연결어미로 치환 후 꼬리 연결
      //   "디자이너예요" → "디자이너고" (받침 없음)
      //   "팀원이에요" → "팀원이고" (받침 있음)
      const connector = cop === '예요' ? '고' : '이고'
      return lead.replace(new RegExp(`${cop}$`), connector) + tail
    }
  }

  return lead
}

/** 포지션 slug → 한국어 명사 ("디자이너/개발자/기획자" 등). 매칭 없으면 "팀원" */
function positionToNoun(desiredPosition: string | null | undefined): string {
  if (!desiredPosition) return '팀원'
  const roleGroup = positionToRole(desiredPosition)
  if (roleGroup === 'other') return '팀원'
  const label = projectRoleLabel(roleGroup)
  return label === roleGroup ? '팀원' : label
}

/** 받침 있으면 "이에요", 없으면 "예요" */
function copula(noun: string): string {
  const last = noun.charCodeAt(noun.length - 1)
  if (last >= 0xAC00 && last <= 0xD7A3) {
    const hasFinal = (last - 0xAC00) % 28 !== 0
    return hasFinal ? '이에요' : '예요'
  }
  return '이에요'
}

/**
 * Calculate match score for a single candidate
 * Pure algorithmic — no AI/embedding dependency
 */
function calculateUserMatch(
  myProfile: Profile,
  candidate: CandidateProfile
): UserMatchResult {
  const skill = calculateSkillComplementarity(
    myProfile.skills || [],
    candidate.skills || [],
    myProfile.desired_position,
    candidate.desired_position
  )
  const interest = calculateInterestOverlap(
    myProfile.interest_tags || [],
    candidate.interest_tags || []
  )
  const situation = calculateSituationCompatibility(
    myProfile.current_situation,
    candidate.current_situation
  )
  const teamfit = calculateTeamFit(myProfile, candidate)

  // 내 직렬 × 상대 직렬 → 동적 가중치
  const myGroup = toRoleGroup(myProfile.desired_position)
  const theirGroup = toRoleGroup(candidate.desired_position)
  const w = USER_WEIGHT_MATRIX[myGroup][theirGroup]

  const finalScore =
    skill * w.skill +
    interest * 0.20 +
    situation * 0.15 +
    teamfit * w.teamfit

  const reason = generateUserMatchReason(myProfile, candidate, {
    skillComplementarity: skill,
    interestOverlap: interest,
    situationCompatibility: situation,
    teamFit: teamfit,
  })

  return {
    userId: candidate.user_id,
    score: Math.round(finalScore),
    skillComplementarity: Math.round(skill),
    interestOverlap: Math.round(interest),
    situationCompatibility: Math.round(situation),
    teamFit: Math.round(teamfit),
    reason,
  }
}

/**
 * Rank candidates by match score
 */
export function rankUserMatches(
  myProfile: Profile,
  candidates: CandidateProfile[]
): Array<
  CandidateProfile & {
    match_score: number
    match_reason: string
    match_details: {
      skill: number
      interest: number
      situation: number
      teamfit: number
    }
  }
> {
  return candidates
    .map((candidate) => {
      const match = calculateUserMatch(myProfile, candidate)
      return {
        ...candidate,
        match_score: match.score,
        match_reason: match.reason,
        match_details: {
          skill: match.skillComplementarity,
          interest: match.interestOverlap,
          situation: match.situationCompatibility,
          teamfit: match.teamFit,
        },
      }
    })
    .sort((a, b) => b.match_score - a.match_score)
}
