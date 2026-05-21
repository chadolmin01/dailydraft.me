import type { Area } from 'react-easy-crop'

export interface EditPhotosProps {
  profile: { avatar_url?: string | null; cover_image_url?: string | null; nickname?: string | null } | null | undefined
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  coverInputRef: React.RefObject<HTMLInputElement | null>
  uploadingAvatar: boolean
  uploadingCover: boolean
  handleFileSelect: (file: File, type: 'avatar' | 'cover') => void
}

export interface EditBasicInfoProps {
  nickname: string
  setNickname: (v: string) => void
  vision: string
  setVision: (v: string) => void
  currentSituation: string
  setCurrentSituation: (v: string) => void
}

export interface EditAffiliationProps {
  affiliationType: string
  setAffiliationType: (v: string) => void
  position: string
  setPosition: (v: string) => void
  university: string
  setUniversity: (v: string) => void
  major: string
  setMajor: (v: string) => void
  location: string
  setLocation: (v: string) => void
  uniVerified: boolean
  setUniVerified: (v: boolean) => void
  verifyEmail: string
  setVerifyEmail: (v: string) => void
  verifyCode: string
  setVerifyCode: (v: string) => void
  verifyStep: 'idle' | 'sent' | 'verifying'
  setVerifyStep: (v: 'idle' | 'sent' | 'verifying') => void
  verifyError: string
  setVerifyError: (v: string) => void
  verifySending: boolean
  setVerifySending: (v: boolean) => void
}

export interface EditSkillsProps {
  skills: Array<{ name: string }>
  setSkills: React.Dispatch<React.SetStateAction<Array<{ name: string }>>>
  newSkillName: string
  setNewSkillName: (v: string) => void
  addSkill: (name?: string) => void
  removeSkill: (name: string) => void
}

export interface EditContactProps {
  contactEmail: string
  setContactEmail: (v: string) => void
  userEmail?: string
}

export interface EditSocialLinksProps {
  portfolioUrl: string
  setPortfolioUrl: (v: string) => void
  githubUrl: string
  setGithubUrl: (v: string) => void
  githubUsername: string
  setGithubUsername: (v: string) => void
  linkedinUrl: string
  setLinkedinUrl: (v: string) => void
}

export interface EditInterestsProps {
  interestTags: string[]
  setInterestTags: React.Dispatch<React.SetStateAction<string[]>>
  customTag: string
  setCustomTag: (v: string) => void
  toggleTag: (tag: string) => void
  addCustomTag: () => void
}

export interface EditAIProfileProps {
  personality: Record<string, number>
  setPersonality: React.Dispatch<React.SetStateAction<Record<string, number>>>
  workStyle: Record<string, number>
  setWorkStyle: React.Dispatch<React.SetStateAction<Record<string, number>>>
  workStyleTraits: Record<string, string>
  setWorkStyleTraits: React.Dispatch<React.SetStateAction<Record<string, string>>>
  hoursPerWeek: string
  setHoursPerWeek: (v: string) => void
  preferOnline: boolean
  setPreferOnline: (v: boolean) => void
  goals: string[]
  setGoals: (v: string[]) => void
  strengths: string[]
  setStrengths: (v: string[]) => void
}

export interface CropModalProps {
  cropImage: string | null
  setCropImage: (v: string | null) => void
  cropType: 'avatar' | 'cover'
  crop: { x: number; y: number }
  setCrop: (v: { x: number; y: number }) => void
  zoom: number
  setZoom: (v: number) => void
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void
  handleCropConfirm: () => void
}
