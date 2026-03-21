import Image from 'next/image'
import { MapPin, Building2, Target, Sparkles } from 'lucide-react'
import { SITUATION_LABELS, AFFILIATION_LABELS, type MatchData } from './types'

const DETAIL_LABELS = [
  { key: 'vision', label: '비전' },
  { key: 'skill', label: '스킬' },
  { key: 'founder', label: '시너지' },
  { key: 'interest', label: '관심사' },
  { key: 'situation', label: '상황' },
] as const

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
    <>
      {/* Hero Cover */}
      {coverUrl ? (
        <div className="relative h-36 sm:h-44 overflow-hidden">
          <Image
            src={coverUrl}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 768px"
            className="object-cover"
            quality={90}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ) : null}

      {/* Profile Header */}
      <div className={`px-4 sm:px-8 ${coverUrl ? 'pt-0 -mt-10 relative z-10' : 'pt-4 sm:pt-6'} pb-3`}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`relative w-20 h-20 bg-surface-inverse flex items-center justify-center text-2xl font-bold text-txt-inverse shrink-0 shadow-solid-sm border-2 ${coverUrl ? 'border-surface-card' : 'border-border-strong'}`}>
            {profile.nickname.substring(0, 2)}
            {profile.avatar_url && (
              <Image
                src={profile.avatar_url}
                alt={profile.nickname}
                width={80}
                height={80}
                className="absolute inset-0 w-20 h-20 object-cover"
                quality={85}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <h2 className={`text-2xl font-bold ${coverUrl ? 'text-white drop-shadow-sm' : 'text-txt-primary'}`}>
                {profile.nickname}
              </h2>
              {matchData && matchData.match_score > 0 && (
                <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border shrink-0 ${
                  matchData.match_score >= 80 ? 'bg-status-success-bg text-status-success-text border-indicator-online/20'
                  : matchData.match_score >= 60 ? 'bg-brand-bg text-brand border-brand-border'
                  : 'bg-surface-card text-txt-tertiary border-border'
                }`}>
                  {matchData.match_score}% MATCH
                </span>
              )}
            </div>
            <p className={`text-sm ${coverUrl ? 'text-white/80' : 'text-txt-tertiary'}`}>
              {profile.desired_position || 'Explorer'}
            </p>
            {profile.current_situation && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[0.625rem] font-mono font-bold bg-brand/15 text-brand border border-brand/30">
                <Target size={9} /> {SITUATION_LABELS[profile.current_situation] || profile.current_situation}
              </span>
            )}
            <div className={`flex flex-wrap items-center gap-3 mt-1.5 text-xs ${coverUrl ? 'text-white/60' : 'text-txt-tertiary'}`}>
              {affiliationType && AFFILIATION_LABELS[affiliationType] && (
                <span className="px-1.5 py-0.5 bg-surface-inverse/10 border border-border font-medium">
                  {AFFILIATION_LABELS[affiliationType]}
                </span>
              )}
              {profile.university && (
                <span className="flex items-center gap-1">
                  <Building2 size={12} />
                  {profile.university}{profile.major ? ` · ${profile.major}` : ''}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {profile.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Interest Tags below header */}
        {profile.interest_tags && profile.interest_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.interest_tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-white text-tag-default-text text-xs font-medium border border-border-strong">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI 매칭 말풍선 */}
      {matchData && matchData.match_score > 0 && (
        <div className="mx-4 sm:mx-8 mb-3">
          <div className="relative bg-brand-bg border border-brand-border p-4">
            {/* 말풍선 꼬리 */}
            <div className="absolute -top-2 left-8 w-3 h-3 bg-brand-bg border-l border-t border-brand-border rotate-45" />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand border border-brand flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[0.625rem] font-mono font-bold text-brand uppercase tracking-wider">AI MATCH</span>
                  <span className="text-lg font-black font-mono text-brand">{matchData.match_score}%</span>
                </div>
                {(matchData.match_reason_detail || matchData.match_reason) && (
                  <p className="text-sm text-txt-secondary leading-relaxed mb-3">
                    {matchData.match_reason_detail || matchData.match_reason}
                  </p>
                )}
                {/* 세부 점수 바 */}
                <div className="flex gap-1.5 flex-wrap">
                  {DETAIL_LABELS.map(({ key, label }) => {
                    const score = matchData.match_details[key]
                    if (score <= 0) return null
                    return (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-[0.5rem] font-mono text-txt-disabled uppercase">{label}</span>
                        <div className="w-10 h-1.5 bg-white border border-brand-border overflow-hidden">
                          <div className="h-full bg-brand transition-all" style={{ width: `${Math.min(100, score)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-4 sm:mx-8 border-t border-dashed border-border" />
    </>
  )
}
