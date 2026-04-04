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
  hideCta?: boolean
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

export const UPDATE_TYPE_CONFIG: Record<string, {
  label: string
  dotColor: string
  badgeColor: string
}> = {
  ideation: { label: '고민', dotColor: 'bg-indicator-premium', badgeColor: 'bg-status-warning-bg text-status-warning-text border-status-warning-text/20' },
  design:   { label: '설계', dotColor: 'bg-status-info-text', badgeColor: 'bg-status-info-bg text-status-info-text border-status-info-text/20' },
  development: { label: '구현', dotColor: 'bg-indicator-online', badgeColor: 'bg-status-success-bg text-status-success-text border-status-success-text/20' },
  launch:   { label: '런칭', dotColor: 'bg-purple-500', badgeColor: 'bg-purple-100 text-purple-700 border-purple-200' },
  general:  { label: '일반', dotColor: 'bg-txt-disabled', badgeColor: 'bg-surface-sunken text-txt-secondary border-border' },
}

export const linkIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  github: Github,
  notion: FileText,
  website: Globe,
  other: ExternalLink,
}
