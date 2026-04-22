'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Check, Link2, MessageSquare, Briefcase, Hash } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  clubName: string
  cohort: string | null
  memberCount: number
  url: string
}

function buildTemplates({ clubName, cohort, memberCount, url }: Props) {
  const cohortLine = cohort ? ` · ${cohort}기 운영 중` : ''
  return {
    kakao: [
      `${clubName}${cohortLine} 소개입니다.`,
      `현재 멤버 ${memberCount}명이 함께하고 있습니다.`,
      `활동 기록은 Draft 에서 확인하실 수 있습니다 👇`,
      url,
    ].join('\n'),
    linkedin: [
      `${clubName}${cohortLine}`,
      '',
      '우리 클럽의 기수별 프로젝트·주간 기록·알럼나이 이력을 Draft에서 관리하고 있습니다.',
      `멤버 ${memberCount}명의 활동을 확인해보세요.`,
      url,
    ].join('\n'),
    discord: [
      `📣 ${clubName}${cohortLine}`,
      `멤버 ${memberCount}명이 활동 중입니다.`,
      `📎 ${url}`,
    ].join('\n'),
  }
}

export function ClubShareMenu(props: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const templates = buildTemplates(props)

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
      toast.success('공유 문구를 복사했습니다', {
        description: '카톡·Slack·Discord 등에 바로 붙여넣기 하시면 링크 미리보기가 자동으로 표시됩니다.',
      })
    } catch {
      toast.error('복사에 실패했습니다', {
        description: '브라우저 권한 또는 HTTPS 여부를 확인해 주세요.',
      })
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
      >
        <Share2 size={14} />
        공유
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-card border border-border rounded-xl shadow-lg p-1.5 z-50">
          <button
            onClick={() => copyText(props.url, 'url')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
          >
            <Link2 size={14} className="text-txt-tertiary" />
            <span className="flex-1">링크만 복사</span>
            {copied === 'url' && <Check size={12} className="text-status-success-text" />}
          </button>
          <button
            onClick={() => copyText(templates.kakao, 'kakao')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
          >
            <MessageSquare size={14} className="text-txt-tertiary" />
            <span className="flex-1">카톡·문자용 메시지</span>
            {copied === 'kakao' && <Check size={12} className="text-status-success-text" />}
          </button>
          <button
            onClick={() => copyText(templates.linkedin, 'linkedin')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
          >
            <Briefcase size={14} className="text-txt-tertiary" />
            <span className="flex-1">LinkedIn용 메시지</span>
            {copied === 'linkedin' && <Check size={12} className="text-status-success-text" />}
          </button>
          <button
            onClick={() => copyText(templates.discord, 'discord')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
          >
            <Hash size={14} className="text-txt-tertiary" />
            <span className="flex-1">Discord용 메시지</span>
            {copied === 'discord' && <Check size={12} className="text-status-success-text" />}
          </button>
        </div>
      )}
    </div>
  )
}
