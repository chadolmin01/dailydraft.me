import Image from 'next/image'
import { MapPin, Building2, Sparkles } from 'lucide-react'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { SITUATION_LABELS, AFFILIATION_LABELS, type MatchData } from './types'
import { positionLabel } from '@/src/constants/roles'

export function ProfileHeader({
  profile,
  coverUrl,
  affiliationType,
  matchData,
}: {
  profile: {
    nickname: string
    desired_position: string | null
    current_situation: string | null
    university: string | null
    major: string | null
    location: string | null
    avatar_url: string | null
    interest_tags: string[] | null
  }
  coverUrl: string | null | undefined
  affiliationType: string | null | undefined
  matchData?: MatchData | null
}) {
  return (
    <div className="px-5 sm:px-8 pt-2 pb-4">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 bg-[#3182F6] rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden">
          {cleanNickname(profile.nickname).substring(0, 2)}
          {profile.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.nickname}
              width={64}
              height={64}
              className="absolute inset-0 w-16 h-16 object-cover"
              quality={85}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[22px] font-bold text-txt-primary">
              {cleanNickname(profile.nickname)}
            </h2>
            {matchData && matchData.match_score > 0 && (
              <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                matchData.match_score >= 80 ? 'bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759]'
                : matchData.match_score >= 60 ? 'bg-[#EBF4FF] dark:bg-[#1A2A42] text-[#3182F6]'
                : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-tertiary'
              }`}>
                {matchData.match_score}% 매치
              </span>
            )}
          </div>
          <p className="text-[14px] text-txt-secondary">
            {positionLabel(profile.desired_position || '') || 'Explorer'}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[13px] text-txt-tertiary">
            {profile.current_situation && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759] text-[12px] font-semibold rounded-full">
                {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
              </span>
            )}
            {affiliationType && AFFILIATION_LABELS[affiliationType] && (
              <span className="px-2.5 py-1 bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary text-[12px] font-medium rounded-full">
                {AFFILIATION_LABELS[affiliationType]}
              </span>
            )}
            {profile.university && (
              <span className="flex items-center gap-1">
                <Building2 size={13} />
                {profile.university}{profile.major ? ` · ${profile.major}` : ''}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {profile.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Match Reason */}
      {matchData && matchData.match_reason && (
        <div className="mt-4 flex items-start gap-2 bg-[#EBF4FF] dark:bg-[#1A2A42] rounded-2xl px-4 py-3">
          <Sparkles size={14} className="text-[#3182F6] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#3182F6] font-medium leading-relaxed">{matchData.match_reason}</p>
        </div>
      )}

      {/* Interest Tags */}
      {profile.interest_tags && profile.interest_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {profile.interest_tags.map((tag) => (
            <span key={tag} className="px-3 py-1.5 bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary text-[13px] font-medium rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
