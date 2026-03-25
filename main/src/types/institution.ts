export type InstitutionType = 'startup_center' | 'linc_plus' | 'incubator'
export type MemberRole = 'student' | 'mentor' | 'admin'
export type MemberStatus = 'active' | 'inactive'
export type ProgramType = 'hackathon' | 'camp' | 'competition' | 'mentoring' | 'general'
export type ProgramStatus = 'upcoming' | 'active' | 'completed'

export interface Institution {
  id: string
  name: string
  university: string
  type: InstitutionType
  description: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface InstitutionMember {
  id: string
  institution_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  joined_at: string
  notes: string | null
  // Joined fields
  profile?: {
    nickname: string
    university: string | null
    major: string | null
    skills: { name: string; level: string }[]
    interest_tags: string[]
    current_situation: string | null
    onboarding_completed: boolean
    created_at: string
  }
}

export interface InstitutionProgram {
  id: string
  institution_id: string
  name: string
  type: ProgramType
  description: string | null
  start_date: string | null
  end_date: string | null
  max_participants: number | null
  status: ProgramStatus
  created_at: string
}

export interface InstitutionStats {
  totalMembers: number
  activeStudents: number
  mentors: number
  teamsFormed: number
  businessPlans: number
  activeOpportunities: number
  applicationsCount: number
  recentJoins: number
}

export interface InstitutionReport {
  period: string
  generatedAt: string
  institution: Pick<Institution, 'name' | 'university' | 'type'>
  stats: InstitutionStats
  members: {
    name: string
    major: string | null
    skills: string[]
    teamCount: number
    businessPlanCount: number
    joinedAt: string
  }[]
  teams: {
    id: string
    title: string
    creator: string
    memberCount: number
    status: string
    createdAt: string
  }[]
}
