'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Check, Link2, MessageSquare, Briefcase, Hash } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  projectTitle: string
  projectType: string | null
  neededRoles: string[]
  url: string
}

const TYPE_LABEL: Record<string, string> = {
  side_project: '사이드 프로젝트',
  startup: '창업 팀',
  study: '스터디',
}

function buildTemplates(args: Props) {
  const typeLabel = args.projectType ? TYPE_LABEL[args.projectType] ?? '프로젝트' : '프로젝트'
  const rolesLine = args.neededRoles.length > 0
    ? `찾는 역할: ${args.neededRoles.slice(0, 4).join(', ')}`
    : null
  return {
    kakao: [
      `${args.projectTitle} 팀원을 찾고 있습니다.`,
      rolesLine,
      `자세한 내용은 아래 링크에서 확인하실 수 있습니다 👇`,
      args.url,
    ].filter(Boolean).join('\n'),
    linkedin: [
      `${args.projectTitle} · ${typeLabel}`,
      '',
      rolesLine ? `${rolesLine}.` : null,
      '관심 있는 분들은 Draft에서 자세한 정보를 확인하실 수 있습니다.',
      args.url,
    ].filter(Boolean).join('\n'),
    discord: [
      `@everyone ${args.projectTitle} 팀원 모집합니다.`,
      rolesLine ? `🎯 ${rolesLine}` : null,
      `📎 ${args.url}`,
    ].filter(Boolean).join('\n'),
  }
}

export function ProjectShareMenu(props: Props) {
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
      toast.success('복사했습니다', {
        description: '카톡·Slack·Discord 등에 바로 붙여넣으시면 링크 미리보기가 자동으로 표시됩니다.',
      })
    } catch {
      toast.error('복사 실패')
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors"
      >
        <Share2 size={16} />
        공유
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface-card border border-border rounded-xl shadow-lg p-1.5 z-50">
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
