'use client'

import { POSITIONS } from '@/src/constants/roles'
import { chipClass } from '../parts/chipClass'

// position 선택 후 노출되는 스킬 후보. position 과 강하게 결합되어 있어
// 여기 로컬로 둠 — 다른 곳에서 재사용되지 않음.
const SKILLS_BY_POSITION: Record<string, string[]> = {
  frontend:  ['React', 'Next.js', 'TypeScript', 'Vue', 'HTML/CSS', 'Tailwind'],
  backend:   ['Node.js', 'Python', 'Java', 'Go', 'SQL', 'Spring'],
  fullstack: ['React', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'SQL'],
  design:    ['Figma', 'Sketch', 'Photoshop', 'Illustrator', 'Framer', 'Protopie'],
  pm:        ['Notion', 'Figma', 'Jira', 'SQL', 'GA', 'Slack'],
  marketing: ['GA', 'SQL', 'Meta Ads', 'SEO', 'Notion', 'Canva'],
  data:      ['Python', 'SQL', 'R', 'Pandas', 'Tableau', 'Spark'],
  other:     ['Notion', 'Figma', 'Slack', 'Git', 'Excel'],
}

interface PositionStepProps {
  position: string
  skills: string[]
  attempted: boolean
  onSelectPosition: (slug: string) => void
  onToggleSkill: (skill: string) => void
}

export function PositionStep({ position, skills, attempted, onSelectPosition, onToggleSkill }: PositionStepProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {POSITIONS.map((pos) => (
          <button
            key={pos.slug}
            onClick={() => onSelectPosition(pos.slug)}
            className={chipClass(position === pos.slug, 'md', attempted && !position)}
          >
            {pos.label}
          </button>
        ))}
      </div>

      {/* Skills — revealed after position selection */}
      {position && SKILLS_BY_POSITION[position] && (
        <div
          className="mt-6"
          style={{ animation: 'ob-reveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <label className="text-[11px] font-medium text-txt-tertiary mb-2 block">
            사용하는 기술이 있다면? (선택)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS_BY_POSITION[position].map((skill) => (
              <button
                key={skill}
                onClick={() => onToggleSkill(skill)}
                className={chipClass(skills.includes(skill), 'sm')}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
