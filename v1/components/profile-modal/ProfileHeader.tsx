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
    locations: string[] | null
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
        <div className="relative w-16 h-16 bg-brand rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden">
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
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                matchData.match_score >= 80 ? 'bg-status-success-bg text-status-success-text'
                : matchData.match_score >= 60 ? 'bg-brand-bg text-brand'
                : 'bg-border-subtle text-txt-tertiary'
              }`}>
                {matchData.match_score}% 매치
              </span>
            )}
          </div>
          <p className="text-sm text-txt-secondary">
            {positionLabel(profile.desired_position || '') || 'Explorer'}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[13px] text-txt-tertiary">
            {profile.current_situation && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-status-success-bg text-status-success-text text-xs font-semibold rounded-full">
                {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
              </span>
            )}
            {affiliationType && AFFILIATION_LABELS[affiliationType] && (
              <span className="px-2.5 py-1 bg-border-subtle text-txt-secondary text-xs font-medium rounded-full">
                {AFFILIATION_LABELS[affiliationType]}
              </span>
            )}
            {profile.university && (
              <span className="flex items-center gap-1">
                <Building2 size={13} />
                {profile.university}{profile.major ? ` · ${profile.major}` : ''}
              </span>
            )}
            {(profile.locations?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {profile.locations!.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Match Reason */}
      {matchData && matchData.match_reason && (
        <div className="mt-4 flex items-start gap-2 bg-brand-bg rounded-2xl px-4 py-3">
          <Sparkles size={14} className="text-brand shrink-0 mt-0.5" />
          <p className="text-[13px] text-brand font-medium leading-relaxed">{matchData.match_reason}</p>
        </div>
      )}

      {/* Interest Tags */}
      {profile.interest_tags && profile.interest_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {profile.interest_tags.map((tag) => (
            <span key={tag} className="px-3 py-1.5 bg-border-subtle text-txt-secondary text-[13px] font-medium rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
