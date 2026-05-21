'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { extractDriveFolderId, extractSheetId } from '@/src/lib/parsers/google-url'

interface Folder {
  id: string
  name: string
  drive_folder_id: string | null
  sheet_id: string | null
  program: string | null
  created_at: string
}

interface FoldersResponse {
  workspace: { id: string; name: string }
  folders: Folder[]
}

interface FilesResponse {
  folder: { id: string; name: string; program: string | null }
  files: Array<{ id: string; name: string; mimeType: string; modifiedTime: string }>
  parsed: Array<{
    name: string
    parsed: { program: string; week: number; team: string; task: string; ext: string }
  }>
  unmatched: string[]
  summary: { total: number; matched: number; unmatched: number }
}

export function WorkspaceClient({ userEmail }: { userEmail: string | null }) {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: async (): Promise<FoldersResponse> => {
      const res = await fetch('/api/folders')
      if (!res.ok) throw new Error('폴더 목록 조회 실패')
      return res.json()
    },
  })

  const filesQuery = useQuery({
    queryKey: ['folder-files', selectedFolderId],
    enabled: !!selectedFolderId,
    queryFn: async (): Promise<FilesResponse> => {
      const res = await fetch(`/api/folders/${selectedFolderId}/files`)
      if (!res.ok) throw new Error('파일 조회 실패')
      return res.json()
    },
  })

  const addFolder = useMutation({
    mutationFn: async (input: { name: string; drive_folder_id: string; sheet_id?: string; program?: string }) => {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '폴더 생성 실패')
      }
      return res.json() as Promise<Folder>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      setShowAddForm(false)
    },
  })

  const folders = foldersQuery.data?.folders ?? []
  const selectedFolder = folders.find(f => f.id === selectedFolderId)

  return (
    <div className="h-screen grid grid-cols-[var(--layout-chat-width)_1fr] bg-canvas">
      {/* 좌측 — 챗봇 패널 (다크) */}
      <aside className="bg-surface-dark text-on-dark border-r border-hairline-dark flex flex-col">
        <header className="px-5 py-5 border-b border-hairline-dark flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-title-md text-on-dark">Draft</h2>
            <p className="text-caption text-on-dark-soft mt-1 truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-caption text-on-dark-soft hover:text-on-dark transition-colors"
          >
            로그아웃
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-body-sm text-on-dark-soft">
          무엇을 도와드릴까요?
          <p className="text-caption text-on-dark-soft mt-2 opacity-60">
            (챗봇은 Day 3 에서 연결)
          </p>
        </div>

        <form className="px-5 py-4 border-t border-hairline-dark">
          <input
            type="text"
            placeholder="메시지를 입력하세요"
            className="w-full h-10 px-4 bg-surface-dark-elevated border border-hairline-dark rounded-md font-body text-body-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-on-dark"
            disabled
          />
        </form>
      </aside>

      {/* 우측 — 콘텐츠 (cream) */}
      <main className="overflow-y-auto p-6">
        <div className="max-w-layout-content mx-auto space-y-7">
          <header className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-display-md text-ink">폴더</h1>
              <p className="text-body-sm text-muted">
                {foldersQuery.isLoading ? '불러오는 중…' : `${folders.length}개 연결됨`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(v => !v)}
              className="h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors"
            >
              {showAddForm ? '취소' : '폴더 연결'}
            </button>
          </header>

          {showAddForm ? <AddFolderForm onSubmit={(v) => addFolder.mutate(v)} pending={addFolder.isPending} error={addFolder.error?.message ?? null} /> : null}

          {foldersQuery.isError ? (
            <div className="rounded-md border border-hairline bg-surface-soft p-4 text-body-sm text-muted">
              {(foldersQuery.error as Error).message}
            </div>
          ) : null}

          {folders.length === 0 && !foldersQuery.isLoading && !showAddForm ? (
            <div className="rounded-lg border border-hairline bg-surface-soft p-7 text-center text-body-sm text-muted">
              연결된 폴더가 없습니다. 우측 상단 &quot;폴더 연결&quot; 을 눌러주세요.
            </div>
          ) : null}

          {folders.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                  className={`text-left p-5 rounded-xl transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-surface-strong'
                      : 'bg-surface-card hover:bg-surface-strong'
                  }`}
                >
                  <p className="text-display-sm text-ink">{folder.name}</p>
                  <p className="text-caption text-muted mt-1">
                    {folder.program ?? 'program 미지정'} · {folder.sheet_id ? 'Sheets 연결됨' : 'Sheets 없음'}
                  </p>
                </button>
              ))}
            </div>
          ) : null}

          {selectedFolder ? <FolderFilesSection folderName={selectedFolder.name} query={filesQuery} /> : null}
        </div>
      </main>
    </div>
  )
}

interface DriveItem {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
}

function AddFolderForm({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (input: { name: string; drive_folder_id: string; sheet_id?: string; program?: string }) => void
  pending: boolean
  error: string | null
}) {
  const [form, setForm] = useState({ name: '', drive_folder_id: '', sheet_id: '', program: '' })

  // 폴더 검색: 디바운스된 키워드 → /api/google/drive/search 호출.
  // 사용자가 폴더 ID 를 모를 때 이름만 알면 검색해서 찾을 수 있게.
  const [folderQuery, setFolderQuery] = useState('')
  const [debouncedFolderQuery, setDebouncedFolderQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFolderQuery(folderQuery), 300)
    return () => clearTimeout(t)
  }, [folderQuery])

  const folderSearch = useQuery({
    queryKey: ['drive-search', 'folder', debouncedFolderQuery],
    enabled: debouncedFolderQuery.trim().length > 0,
    queryFn: async (): Promise<{ items: DriveItem[] }> => {
      const res = await fetch(`/api/google/drive/search?q=${encodeURIComponent(debouncedFolderQuery)}&type=folder`)
      if (!res.ok) throw new Error('Drive 검색 실패')
      return res.json()
    },
  })

  // Sheets 검색 (선택 필드 — 명단 시트 찾기)
  const [sheetQuery, setSheetQuery] = useState('')
  const [debouncedSheetQuery, setDebouncedSheetQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSheetQuery(sheetQuery), 300)
    return () => clearTimeout(t)
  }, [sheetQuery])

  const sheetSearch = useQuery({
    queryKey: ['drive-search', 'sheet', debouncedSheetQuery],
    enabled: debouncedSheetQuery.trim().length > 0,
    queryFn: async (): Promise<{ items: DriveItem[] }> => {
      const res = await fetch(`/api/google/drive/search?q=${encodeURIComponent(debouncedSheetQuery)}&type=sheet`)
      if (!res.ok) throw new Error('Sheets 검색 실패')
      return res.json()
    },
  })

  const handleDriveIdChange = (raw: string) => {
    const extracted = extractDriveFolderId(raw)
    setForm({ ...form, drive_folder_id: extracted ?? raw })
  }

  const handleSheetIdChange = (raw: string) => {
    const extracted = extractSheetId(raw)
    setForm({ ...form, sheet_id: extracted ?? raw })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          name: form.name.trim(),
          drive_folder_id: form.drive_folder_id.trim(),
          sheet_id: form.sheet_id.trim() || undefined,
          program: form.program.trim() || undefined,
        })
      }}
      className="rounded-lg border border-hairline bg-canvas p-6 space-y-5"
    >
      {/* 검색 */}
      <Field label="폴더 검색" hint="이름 일부 입력 → 본인 Drive 에서 일치하는 폴더 표시">
        <input
          type="text"
          value={folderQuery}
          onChange={(e) => setFolderQuery(e.target.value)}
          placeholder="예: FLIP"
          className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
        />
      </Field>

      {folderQuery.trim() ? (
        <SearchResults
          isLoading={folderSearch.isLoading}
          items={folderSearch.data?.items ?? []}
          selectedId={form.drive_folder_id}
          onSelect={(item) => {
            setForm({
              ...form,
              drive_folder_id: item.id,
              name: form.name || item.name,
            })
          }}
        />
      ) : null}

      <hr className="border-hairline" />

      {/* 수동 입력 / URL 붙여넣기 */}
      <Field label="이름" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          placeholder="예: FLIP 1기"
          className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
        />
      </Field>

      <Field label="Drive 폴더 ID 또는 URL" required hint="URL 붙여넣으면 ID 자동 추출">
        <input
          type="text"
          value={form.drive_folder_id}
          onChange={(e) => handleDriveIdChange(e.target.value)}
          required
          placeholder="ID 또는 https://drive.google.com/drive/folders/..."
          className="w-full h-10 px-3 font-mono text-mono-md bg-canvas border border-hairline rounded-md text-ink focus:outline-none focus:border-ink"
        />
      </Field>

      {/* Sheets — 검색 + 직접 입력 */}
      <Field label="Sheets 검색 (선택)" hint="명단 시트 이름 일부">
        <input
          type="text"
          value={sheetQuery}
          onChange={(e) => setSheetQuery(e.target.value)}
          placeholder="예: 팀명단"
          className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
        />
      </Field>

      {sheetQuery.trim() ? (
        <SearchResults
          isLoading={sheetSearch.isLoading}
          items={sheetSearch.data?.items ?? []}
          selectedId={form.sheet_id}
          onSelect={(item) => setForm({ ...form, sheet_id: item.id })}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Sheets ID 또는 URL (선택)">
          <input
            type="text"
            value={form.sheet_id}
            onChange={(e) => handleSheetIdChange(e.target.value)}
            placeholder="ID 또는 docs.google.com URL"
            className="w-full h-10 px-3 font-mono text-mono-md bg-canvas border border-hairline rounded-md text-ink focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Program (선택)" hint="파일명 컨벤션의 program 부분">
          <input
            type="text"
            value={form.program}
            onChange={(e) => setForm({ ...form, program: e.target.value })}
            placeholder="예: FLIP1기"
            className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
          />
        </Field>
      </div>

      {error ? <p className="text-body-sm text-muted">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? '연결 중…' : '연결'}
      </button>
    </form>
  )
}

function SearchResults({
  isLoading,
  items,
  selectedId,
  onSelect,
}: {
  isLoading: boolean
  items: DriveItem[]
  selectedId: string
  onSelect: (item: DriveItem) => void
}) {
  if (isLoading) return <p className="text-body-sm text-muted">검색 중…</p>
  if (items.length === 0) return <p className="text-body-sm text-muted">결과 없음</p>

  return (
    <ul className="rounded-md border border-hairline divide-y divide-hairline overflow-hidden bg-canvas max-h-60 overflow-y-auto">
      {items.map(item => {
        const selected = item.id === selectedId
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                selected ? 'bg-surface-strong' : 'hover:bg-surface-soft'
              }`}
            >
              <p className="text-body-md text-ink">{item.name}</p>
              <p className="text-caption text-muted-soft mt-0.5 font-mono">{item.id}</p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-title-sm text-ink">
        {label}
        {required ? <span className="text-muted-soft"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-caption text-muted-soft">{hint}</span> : null}
    </label>
  )
}

function FolderFilesSection({
  folderName,
  query,
}: {
  folderName: string
  query: ReturnType<typeof useQuery<FilesResponse, Error>>
}) {
  return (
    <section className="space-y-3 border-t border-hairline pt-7">
      <h2 className="text-display-sm text-ink">{folderName} · 파일</h2>

      {query.isLoading ? <p className="text-body-sm text-muted">불러오는 중…</p> : null}

      {query.isError ? (
        <p className="text-body-sm text-muted">{query.error.message}</p>
      ) : null}

      {query.data ? (
        <div className="space-y-4">
          <p className="text-body-sm text-muted">
            전체 {query.data.summary.total}개 · 매칭 {query.data.summary.matched}개 ·
            미매칭 {query.data.summary.unmatched}개
          </p>

          {query.data.parsed.length > 0 ? (
            <ul className="rounded-lg border border-hairline divide-y divide-hairline overflow-hidden bg-canvas">
              {query.data.parsed.map(({ name, parsed }) => (
                <li key={name} className="px-4 py-3 flex items-center justify-between gap-4">
                  <code className="filename truncate">{name}</code>
                  <span className="text-caption text-muted shrink-0 tabular">
                    {parsed.program} · {parsed.week}주차 · {parsed.team} · {parsed.task}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {query.data.unmatched.length > 0 ? (
            <details className="rounded-lg border border-hairline bg-surface-soft p-4">
              <summary className="text-body-sm text-muted cursor-pointer">
                미매칭 {query.data.unmatched.length}개 펼치기
              </summary>
              <ul className="mt-3 space-y-1">
                {query.data.unmatched.map(name => (
                  <li key={name}><code className="filename">{name}</code></li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
