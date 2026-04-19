'use client'

import { useState } from 'react'
import { Code, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { APP_URL } from '@/src/constants'

export function ClubEmbedSnippet({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const embedUrl = `${APP_URL}/embed/clubs/${slug}`
  const snippet = `<iframe
  src="${embedUrl}"
  width="560"
  height="120"
  frameborder="0"
  style="border: none; max-width: 100%;"
  title="Draft 클럽 위젯"
></iframe>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success('임베드 코드를 복사했습니다')
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <Code size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-txt-primary">홈페이지 위젯</h2>
          <p className="text-[11px] text-txt-tertiary">
            동아리 홈페이지·노션·블로그에 Draft 카드를 임베드하세요
          </p>
        </div>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[12px] text-txt-tertiary hover:text-brand flex items-center gap-1 transition-colors"
        >
          <ExternalLink size={12} />
          미리보기
        </a>
      </div>

      <pre className="text-[11px] text-txt-secondary bg-surface-bg border border-border rounded-xl p-3 whitespace-pre-wrap break-all font-mono max-h-32 overflow-y-auto">
        {snippet}
      </pre>

      <button
        onClick={handleCopy}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 transition-all"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? '복사 완료' : '임베드 코드 복사'}
      </button>
    </section>
  )
}
