'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { extractDriveFolderId, extractSheetId } from '@/src/lib/parsers/google-url'
import { DrivePickerButton } from './DrivePickerButton'
import { ChatPanel } from './ChatPanel'
import { FolderBrowser } from './FolderBrowser'

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

interface MatrixCell {
  team: string
  week: number
  status: 'done' | 'empty'
  files: Array<{ id: string; name: string; modifiedTime: string }>
}

interface MatrixResponse {
  folder: { id: string; name: string; program: string | null }
  matrix: {
    teams: string[]
    weeks: number[]
    cells: MatrixCell[]
    source: { teamSource: 'roster' | 'derived'; rosterSize?: number; fileCount: number }
  }
  unmatched: string[]
  rosterError?: string
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

  const matrixQuery = useQuery({
    queryKey: ['folder-matrix', selectedFolderId],
    enabled: !!selectedFolderId,
    queryFn: async (): Promise<MatrixResponse> => {
      const res = await fetch(`/api/folders/${selectedFolderId}/matrix`)
      if (!res.ok) throw new Error('매트릭스 조회 실패')
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

        <ChatPanel folderId={selectedFolderId} />
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

          {selectedFolder?.drive_folder_id ? (
            <FolderTabs
              folderName={selectedFolder.name}
              rootDriveFolderId={selectedFolder.drive_folder_id}
              matrixQuery={matrixQuery}
            />
          ) : null}
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
      {/* Picker (셋업되면 표시) + 검색 — 두 가지 방법 제공 */}
      <div className="space-y-3">
        <DrivePickerButton
          type="folder"
          onPick={(item) => {
            setForm({
              ...form,
              drive_folder_id: item.id,
              name: form.name || item.name,
            })
          }}
        />
        <Field label="폴더 검색" hint="이름 일부 입력 → 본인 Drive 에서 일치하는 폴더 표시">
          <input
            type="text"
            value={folderQuery}
            onChange={(e) => setFolderQuery(e.target.value)}
            placeholder="예: FLIP"
            className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
          />
        </Field>
      </div>

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

      {/* Sheets — Picker + 검색 + 직접 입력 */}
      <div className="space-y-3">
        <DrivePickerButton
          type="sheet"
          onPick={(item) => setForm({ ...form, sheet_id: item.id })}
        />
        <Field label="Sheets 검색 (선택)" hint="명단 시트 이름 일부">
          <input
            type="text"
            value={sheetQuery}
            onChange={(e) => setSheetQuery(e.target.value)}
            placeholder="예: 팀명단"
            className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
          />
        </Field>
      </div>

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

function FolderTabs({
  folderName,
  rootDriveFolderId,
  matrixQuery,
}: {
  folderName: string
  rootDriveFolderId: string
  matrixQuery: ReturnType<typeof useQuery<MatrixResponse, Error>>
}) {
  const [tab, setTab] = useState<'folder' | 'matrix'>('folder')
  const matrix = matrixQuery.data?.matrix
  const hasMatrixData = !!matrix && matrix.source.fileCount > 0

  return (
    <section className="space-y-4 border-t border-hairline pt-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-display-sm text-ink">{folderName}</h2>
        <div className="flex items-center gap-1 border-b border-hairline -mb-px">
          <TabButton active={tab === 'folder'} onClick={() => setTab('folder')}>폴더</TabButton>
          <TabButton active={tab === 'matrix'} onClick={() => setTab('matrix')} disabled={!hasMatrixData} hint={!hasMatrixData ? '데이터 없음' : undefined}>진행도</TabButton>
        </div>
      </div>

      {tab === 'folder' ? (
        <FolderBrowser rootDriveFolderId={rootDriveFolderId} rootName={folderName} />
      ) : null}

      {tab === 'matrix' && hasMatrixData && matrix ? (
        <div className="space-y-3">
          <p className="text-body-sm text-muted">
            팀 {matrix.teams.length}개 · 주차 {matrix.weeks.length}개 ·
            파일 {matrix.source.fileCount}개
            {matrix.source.teamSource === 'derived'
              ? ' · 명단 시트 미연결 (파일에서 추출)'
              : ' · 명단 시트 기반'}
          </p>

          {matrixQuery.data?.rosterError ? (
            <p className="text-body-sm text-muted">명단 시트 읽기 실패: {matrixQuery.data.rosterError}</p>
          ) : null}

          <ProgressGrid teams={matrix.teams} weeks={matrix.weeks} cells={matrix.cells} />
        </div>
      ) : null}

      {tab === 'matrix' && matrixQuery.isLoading ? (
        <p className="text-body-sm text-muted">계산 중…</p>
      ) : null}
      {tab === 'matrix' && matrixQuery.isError ? (
        <p className="text-body-sm text-muted">{matrixQuery.error.message}</p>
      ) : null}
    </section>
  )
}

function TabButton({
  active,
  onClick,
  disabled,
  hint,
  children,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`relative px-4 py-2.5 text-body-sm transition-colors -mb-px border-b-2 ${
        active
          ? 'text-ink border-ink font-medium'
          : disabled
            ? 'text-muted-soft border-transparent cursor-not-allowed'
            : 'text-muted border-transparent hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function ProgressGrid({
  teams,
  weeks,
  cells,
}: {
  teams: string[]
  weeks: number[]
  cells: MatrixCell[]
}) {
  // team × week 빠른 조회용 인덱스
  const cellMap = new Map<string, MatrixCell>()
  for (const c of cells) cellMap.set(`${c.team}|${c.week}`, c)

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-surface-soft">
            <th className="text-left px-4 py-2 text-title-sm text-ink sticky left-0 bg-surface-soft">팀</th>
            {weeks.map(w => (
              <th key={w} className="px-2 py-2 text-title-sm text-ink text-center tabular">
                {w}주차
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team} className="border-t border-hairline-soft">
              <td className="px-4 py-2 text-body-sm text-ink sticky left-0 bg-canvas">{team}</td>
              {weeks.map(w => {
                const cell = cellMap.get(`${team}|${w}`)
                return (
                  <td key={w} className="px-2 py-2 text-center">
                    <Cell cell={cell} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Cell({ cell }: { cell?: MatrixCell }) {
  if (!cell) return <span className="progress-cell progress-cell--empty" aria-label="empty">○</span>
  if (cell.status === 'done') {
    const title = cell.files.map(f => f.name).join('\n')
    return (
      <span className="progress-cell progress-cell--done" title={title} aria-label={`done (${cell.files.length})`}>
        ●
      </span>
    )
  }
  return <span className="progress-cell progress-cell--empty" aria-label="empty">○</span>
}

