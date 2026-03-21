import React from 'react'
import { ExternalLink, Github, FileText, Globe } from 'lucide-react'
import { OpportunityWithCreator } from '@/src/hooks/useOpportunities'
import { CreatorProfile } from '@/src/hooks/usePublicProfiles'
import { ProjectUpdate } from '@/src/hooks/useProjectUpdates'
import { CoffeeChat } from '@/src/hooks/useCoffeeChats'

export interface ProjectHeaderProps {
  opportunity: OpportunityWithCreator
  creator: CreatorProfile | null | undefined
  isOwner: boolean
  matchScore: number | null
  daysAgo: number
  hasInterested: boolean
  interestLoading: boolean
  handleInterest: () => void
}

export interface ProjectContentProps {
  opportunity: OpportunityWithCreator
  updates: ProjectUpdate[]
  isOwner: boolean
  setShowWriteUpdate: (v: boolean) => void
  handleSignup: () => void
  updateOpportunity: {
    mutate: (args: { id: string; updates: Record<string, unknown> }) => void
  }
}

export interface TeamMemberPublic {
  id: string
  nickname: string
  role: string | null
}

export interface ProjectSidebarProps {
  opportunity: OpportunityWithCreator
  creator: CreatorProfile | null | undefined
  isOwner: boolean
  existingChat: CoffeeChat | null
  hasInterested: boolean
  handleAction: (role?: string) => void
  onClose: () => void
  router: { push: (url: string) => void }
  teamMembers?: TeamMemberPublic[]
}

export interface ProjectOverlaysProps {
  opportunity: OpportunityWithCreator
  showCoffeeChatForm: boolean
  setShowCoffeeChatForm: (v: boolean) => void
  selectedRole: string | undefined
  setSelectedRole: (v: string | undefined) => void
  showWriteUpdate: boolean
  setShowWriteUpdate: (v: boolean) => void
  showCta: boolean
  setShowCta: (v: boolean) => void
  handleSignup: () => void
}

export const updateTypeColors: Record<string, string> = {
  ideation: 'bg-indicator-premium',
  design: 'bg-status-info-text',
  development: 'bg-indicator-online',
  launch: 'bg-purple-500',
  general: 'bg-txt-disabled',
}

export const updateTypeLabels: Record<string, string> = {
  ideation: '고민',
  design: '설계',
  development: '구현',
  launch: '런칭',
  general: '일반',
}

export const linkIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  github: Github,
  notion: FileText,
  website: Globe,
  other: ExternalLink,
}
