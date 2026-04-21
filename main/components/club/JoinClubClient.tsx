'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Users, CheckCircle2, Loader2 } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { toast } from 'sonner'
import { toastErrorWithRetry } from '@/src/lib/toast-helpers'

interface ClubMeta {
  name: string
  description: string | null
  logo_url: string | null
  category: string | null
  member_count: number
}

export default function JoinClubClient({ slug, initialCode, club }: {
  slug: string
  initialCode: string
  club: ClubMeta
}) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.error('초대 코드를 입력해주세요')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const body = await res.json().catch(() => ({})) as { error?: { message?: string }; data?: { already_member?: boolean } }

      if (!res.ok) {
        toast.error(body?.error?.message ?? '가입에 실패했습니다')
        return
      }

      if (body.data?.already_member) {
        toast.info('이미 이 클럽의 멤버입니다')
      } else {
        toast.success(`${club.name}에 가입되었습니다`)
      }
      router.push(`/clubs/${slug}`)
    } catch {
      toastErrorWithRetry('네트워크 오류가 발생했습니다', () => {
        handleJoin(new Event('submit') as unknown as React.FormEvent)
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="narrow" className="pt-12 pb-16">
        <div className="mb-8 text-center">
          {club.logo_url ? (
            <Image
              src={club.logo_url}
              alt={club.name}
              width={72}
              height={72}
              className="rounded-2xl mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-2xl bg-brand-bg flex items-center justify-center text-2xl font-extrabold text-brand mx-auto mb-4">
              {club.name[0]}
            </div>
          )}
          <h1 className="text-[24px] font-bold text-txt-primary">{club.name}</h1>
          {club.category && (
            <span className="inline-block text-[12px] font-semibold text-brand bg-brand-bg px-2.5 py-0.5 rounded-full mt-1">
              {club.category}
            </span>
          )}
          {club.description && (
            <p className="text-[14px] text-txt-secondary mt-3 leading-relaxed">{club.description}</p>
          )}
          <p className="text-[13px] text-txt-tertiary mt-3 flex items-center justify-center gap-1.5">
            <Users size={13} />
            멤버 {club.member_count}명
          </p>
        </div>

        <form onSubmit={handleJoin} className="bg-surface-card border border-border rounded-2xl p-6">
          <label className="block">
            <span className="text-[13px] font-semibold text-txt-primary">초대 코드</span>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 30))}
              placeholder="XXXXXXXX"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full mt-2 px-4 py-3 text-[18px] tracking-wider tabular-nums font-bold bg-surface-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <p className="text-[11px] text-txt-tertiary mt-2">
              운영진에게 받은 8자리 코드를 입력해주세요
            </p>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="w-full mt-5 flex items-center justify-center gap-1.5 py-3 text-[15px] font-semibold bg-brand text-white rounded-xl hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            {isSubmitting ? '가입 처리 중' : '가입하기'}
          </button>

          <Link
            href={`/clubs/${slug}`}
            className="block mt-3 text-center text-[12px] text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            클럽 페이지 먼저 둘러보기 <ArrowRight size={11} className="inline" />
          </Link>
        </form>
      </PageContainer>
    </div>
  )
}
