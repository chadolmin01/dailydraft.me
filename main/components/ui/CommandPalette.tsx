'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, Compass, FolderKanban, Users, HelpCircle, Shield, Sparkles, FileText, BookOpen } from 'lucide-react'

/**
 * 전역 커맨드 팔레트 — Cmd/Ctrl+K 로 어디서든 호출.
 *
 * 기본 navigation actions 을 항상 노출하고, 입력값이 있으면 프로젝트·사람·클럽
 * 3 카테고리 병렬 fetch. 각 카테고리 최대 3 결과 + "전체 보기" 링크.
 *
 * Dependencies: cmdk (pavlon, open-source) — 표준 a11y·keyboard nav 포함.
 */

interface SearchGroup {
  title: string
  items: Array<{ id: string; label: string; sub?: string; href: string }>
  viewAllHref: string
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchGroup[]>([])

  // Cmd/Ctrl+K 단축키 + '/' 단일 키 (일반 유저 발견용)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // 입력 변화 → 300ms 디바운스 후 검색
  useEffect(() => {
    if (!open) return
    const q = input.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      void runSearch(q).then((r) => {
        setResults(r)
        setLoading(false)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [input, open])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      setInput('')
      router.push(href)
    },
    [router],
  )

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="전역 검색"
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <Command
        className="relative w-full max-w-xl bg-surface-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        shouldFilter={false}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-txt-tertiary shrink-0" aria-hidden="true" />
          <Command.Input
            value={input}
            onValueChange={setInput}
            placeholder="프로젝트·사람·클럽 검색하거나 이동할 곳 입력"
            className="flex-1 bg-transparent outline-none text-[14px] text-txt-primary placeholder:text-txt-disabled"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto py-2">
          {loading && (
            <div className="px-4 py-3 text-[12px] text-txt-tertiary">검색 중...</div>
          )}

          {!loading && input.length < 2 && (
            <>
              <Command.Group heading="탐색" className="px-2 pb-2">
                <PaletteItem icon={Compass}   label="탐색"         onSelect={() => go('/explore')} />
                <PaletteItem icon={FolderKanban} label="프로젝트"   onSelect={() => go('/projects')} />
                <PaletteItem icon={Users}     label="사람"         onSelect={() => go('/network')} />
                <PaletteItem icon={BookOpen}  label="피드"         onSelect={() => go('/feed')} />
              </Command.Group>
              <div className="my-1 h-px bg-border mx-2" aria-hidden="true" />
              <Command.Group heading="공개 문서" className="px-2 pb-2">
                <PaletteItem icon={HelpCircle} label="자주 묻는 질문"  onSelect={() => go('/help')} />
                <PaletteItem icon={Sparkles}   label="릴리스 노트"     onSelect={() => go('/changelog')} />
                <PaletteItem icon={FileText}   label="로드맵"         onSelect={() => go('/roadmap')} />
                <PaletteItem icon={Shield}     label="신뢰 센터"       onSelect={() => go('/trust')} />
              </Command.Group>
            </>
          )}

          {!loading && input.length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-txt-tertiary">
              검색 결과 없음. <button onClick={() => go(`/explore?q=${encodeURIComponent(input)}`)} className="text-brand underline">/explore 에서 다시 검색</button>
            </div>
          )}

          {!loading && input.length >= 2 && results.map((g) =>
            g.items.length === 0 ? null : (
              <Command.Group key={g.title} heading={g.title} className="px-2 pb-2">
                {g.items.map((item) => (
                  <PaletteItem
                    key={item.id}
                    label={item.label}
                    sub={item.sub}
                    onSelect={() => go(item.href)}
                  />
                ))}
                <PaletteItem
                  label={`${g.title} 전체 보기`}
                  className="text-brand"
                  onSelect={() => go(g.viewAllHref)}
                />
              </Command.Group>
            ),
          )}
        </Command.List>
      </Command>
    </div>
  )
}

function PaletteItem({
  icon: Icon,
  label,
  sub,
  onSelect,
  className = '',
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  label: string
  sub?: string
  onSelect: () => void
  className?: string
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-lg cursor-pointer aria-selected:bg-surface-sunken ${className}`}
    >
      {Icon && <Icon size={14} className="text-txt-tertiary shrink-0" aria-hidden="true" />}
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {sub && <span className="text-[11px] text-txt-tertiary shrink-0 truncate">{sub}</span>}
    </Command.Item>
  )
}

/**
 * 3 카테고리 병렬 fetch. 각 호출 실패해도 나머지는 반환 (Promise.allSettled).
 */
async function runSearch(q: string): Promise<SearchGroup[]> {
  const qLower = q.toLowerCase()
  const [oppsRes, profilesRes, clubsRes] = await Promise.allSettled([
    fetch(`/api/opportunities/search?q=${encodeURIComponent(q)}&limit=3`).then((r) => (r.ok ? r.json() : { items: [] })),
    fetch(`/api/profiles/public?q=${encodeURIComponent(q)}&limit=3`).then((r) => (r.ok ? r.json() : { items: [] })),
    fetch(`/api/clubs?q=${encodeURIComponent(q)}&limit=3`).then((r) => (r.ok ? r.json() : { items: [] })),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oppItems = (oppsRes.status === 'fulfilled' ? (oppsRes.value as any)?.items ?? [] : [])
    .slice(0, 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((o: any) => ({
      id: o.id,
      label: o.title,
      sub: o.status ?? undefined,
      href: `/p/${o.id}`,
    }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profItems = (profilesRes.status === 'fulfilled' ? (profilesRes.value as any)?.items ?? [] : [])
    .slice(0, 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      id: p.id,
      label: p.nickname || '프로필',
      sub: p.university ?? p.desired_position ?? undefined,
      href: `/u/${p.id}`,
    }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clubItems = (clubsRes.status === 'fulfilled' ? (clubsRes.value as any)?.items ?? [] : [])
    .slice(0, 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((c: any) => (c.name ?? '').toLowerCase().includes(qLower) || (c.description ?? '').toLowerCase().includes(qLower))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({
      id: c.id,
      label: c.name,
      sub: c.category ?? undefined,
      href: `/clubs/${c.slug}`,
    }))

  return [
    { title: '프로젝트', items: oppItems, viewAllHref: `/explore?q=${encodeURIComponent(q)}&tab=projects` },
    { title: '사람', items: profItems, viewAllHref: `/network?q=${encodeURIComponent(q)}` },
    { title: '클럽', items: clubItems, viewAllHref: `/clubs?q=${encodeURIComponent(q)}` },
  ]
}
