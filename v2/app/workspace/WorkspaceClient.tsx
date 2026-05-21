'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { extractDriveFolderId, extractSheetId } from '@/src/lib/parsers/google-url'
import { Trash2 } from 'lucide-react'
import { DrivePickerButton } from './DrivePickerButton'
import { ChatPanel } from './ChatPanel'
import { FolderBrowser } from './FolderBrowser'

interface Folder {
  id: string
  name: string
  drive_folder_id: string | null
  sheet_id: string | null
  program: string | null
  program_start_date: string | null
  created_at: string
}

interface FoldersResponse {
  workspace: { id: string; name: string }
  folders: Folder[]
}

interface MatrixCell {
  team: string
  week: number
  status: 'done' | 'pending' | 'late' | 'empty'
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

  const [googleAuthBroken, setGoogleAuthBroken] = useState(false)

  const foldersQuery = useQuery({
    queryKey: ['folders'],
    queryFn: async (): Promise<FoldersResponse> => {
      const res = await fetch('/api/folders')
      if (!res.ok) {
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}))
          if (data.error?.code === 'GOOGLE_AUTH_REQUIRED') {
            setGoogleAuthBroken(true)
          } else {
            // Supabase 세션이 만료됨 (Google 권한과 무관) — 미들웨어가 /로 보내도록 reload
            if (typeof window !== 'undefined') {
              window.location.href = '/'
            }
          }
        }
        throw new Error('폴더 목록 조회 실패')
      }
      setGoogleAuthBroken(false)
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
    mutationFn: async (input: { name: string; drive_folder_id: string; sheet_id?: string; program?: string; program_start_date?: string }) => {
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

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '폴더 삭제 실패')
      }
    },
    onSuccess: (_data, folderId) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      if (selectedFolderId === folderId) setSelectedFolderId(null)
    },
  })

  const handleDelete = (folder: Folder) => {
    const ok = window.confirm(
      `"${folder.name}" 연결을 해제하시겠습니까?\n\n` +
      `Draft 의 폴더 연결만 끊깁니다. Google Drive 폴더와 그 안의 파일은 그대로 남습니다.\n` +
      `이 폴더와 관련된 대화 기록은 보존되지만 폴더 라벨이 사라집니다.`,
    )
    if (ok) deleteFolder.mutate(folder.id)
  }

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
          {googleAuthBroken ? (
            <div className="rounded-lg border border-hairline bg-surface-soft p-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-title-md text-ink">Google 권한이 끊겼습니다.</p>
                <p className="text-body-sm text-muted mt-1">
                  Google 계정을 다시 연결해야 폴더와 시트를 불러올 수 있습니다.
                </p>
              </div>
              <a
                href="/api/auth/google"
                className="h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors inline-flex items-center shrink-0"
              >
                다시 연결
              </a>
            </div>
          ) : null}

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

          {foldersQuery.isError && !googleAuthBroken ? (
            <div className="rounded-md border border-hairline bg-surface-soft p-4 space-y-1">
              <p className="text-body-sm text-ink">폴더 목록을 불러오지 못했습니다.</p>
              <p className="text-caption text-muted-soft">새로고침하거나 잠시 후 다시 시도해 주세요.</p>
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
                <div
                  key={folder.id}
                  className={`relative group rounded-xl transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-surface-strong'
                      : 'bg-surface-card hover:bg-surface-strong'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                    className="w-full text-left p-5 pr-12"
                  >
                    <p className="text-display-sm text-ink">{folder.name}</p>
                    <p className="text-caption text-muted mt-1">
                      {folder.program ?? 'program 미지정'} · {folder.sheet_id ? 'Sheets 연결됨' : 'Sheets 없음'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(folder)}
                    disabled={deleteFolder.isPending}
                    aria-label={`${folder.name} 연결 해제`}
                    title="연결 해제"
                    className="absolute top-3 right-3 p-1.5 rounded-md text-muted-soft hover:text-ink hover:bg-canvas opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
  onSubmit: (input: { name: string; drive_folder_id: string; sheet_id?: string; program?: string; program_start_date?: string }) => void
  pending: boolean
  error: string | null
}) {
  const [form, setForm] = useState({ name: '', drive_folder_id: '', sheet_id: '', program: '', program_start_date: '' })

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
          program_start_date: form.program_start_date || undefined,
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

      <Field label="프로그램 시작일 (선택)" hint="설정하면 매트릭스가 지나간 주차를 미제출(✕) 로, 이번 주차를 진행 중(◐) 으로 표시">
        <input
          type="date"
          value={form.program_start_date}
          onChange={(e) => setForm({ ...form, program_start_date: e.target.value })}
          className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
        />
      </Field>

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
  const unmatchedCount = matrixQuery.data?.unmatched?.length ?? 0

  // 진행도 탭 비활성 사유 — 파일 자체가 없는지, 파일은 있는데 이름 규칙이 안 맞는지
  const matrixHint = (() => {
    if (matrixQuery.isLoading) return '계산 중…'
    if (hasMatrixData) return undefined
    if (unmatchedCount > 0) return '파일명 규칙에 맞는 파일이 없습니다'
    return '폴더에 파일이 없습니다'
  })()

  return (
    <section className="space-y-4 border-t border-hairline pt-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-display-sm text-ink">{folderName}</h2>
        <div className="flex items-center gap-1 border-b border-hairline -mb-px">
          <TabButton active={tab === 'folder'} onClick={() => setTab('folder')}>폴더</TabButton>
          <TabButton
            active={tab === 'matrix'}
            onClick={() => setTab('matrix')}
            disabled={!hasMatrixData}
            hint={matrixHint}
          >
            진행도
          </TabButton>
        </div>
      </div>

      {tab === 'folder' ? (
        <>
          {unmatchedCount > 0 && !hasMatrixData ? (
            <ConventionHint unmatchedCount={unmatchedCount} />
          ) : null}
          <FolderBrowser rootDriveFolderId={rootDriveFolderId} rootName={folderName} />
        </>
      ) : null}

      {tab === 'matrix' && hasMatrixData && matrix ? (
        <div className="space-y-3">
          <p className="text-body-sm text-muted">
            팀 {matrix.teams.length}개 · 주차 {matrix.weeks.length}개 ·
            파일 {matrix.source.fileCount}개
            {matrix.source.teamSource === 'derived'
              ? ' · 명단 시트 미연결 (파일에서 추출)'
              : ' · 명단 시트 기반'}
            {unmatchedCount > 0 ? ` · 미매칭 ${unmatchedCount}개 (파일 탭에서 확인)` : ''}
          </p>

          {matrixQuery.data?.rosterError ? (
            <p className="text-body-sm text-muted">
              명단 시트를 읽지 못해 파일에서 팀을 추출했습니다.
            </p>
          ) : null}

          <ProgressGrid teams={matrix.teams} weeks={matrix.weeks} cells={matrix.cells} />
        </div>
      ) : null}

      {tab === 'matrix' && matrixQuery.isLoading ? (
        <p className="text-body-sm text-muted">진행도를 계산하고 있습니다…</p>
      ) : null}
      {tab === 'matrix' && matrixQuery.isError ? (
        <p className="text-body-sm text-muted">진행도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : null}
    </section>
  )
}

function ConventionHint({ unmatchedCount }: { unmatchedCount: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-soft p-5 space-y-2">
      <p className="text-title-sm text-ink">진행도를 그리려면 파일명 규칙이 필요합니다.</p>
      <p className="text-body-sm text-muted">
        지금 폴더에 있는 파일 <span className="tabular">{unmatchedCount}</span>개가 모두 규칙에 맞지 않아 진행도 탭이 비활성 상태입니다.
      </p>
      <div className="text-body-sm text-muted">
        <p>규칙: <code className="filename">[프로그램_N주차]_팀명_과제명.확장자</code></p>
        <p className="mt-1">예: <code className="filename">[FLIP1기_3주차]_3팀_MVP기획서.pdf</code></p>
      </div>
    </div>
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
  if (!cell) return <span className="progress-cell progress-cell--empty" aria-label="비어 있음">○</span>
  if (cell.status === 'done') {
    const title = cell.files.map(f => f.name).join('\n')
    return (
      <span className="progress-cell progress-cell--done" title={title} aria-label={`제출 ${cell.files.length}건`}>
        ●
      </span>
    )
  }
  if (cell.status === 'pending') {
    return (
      <span className="progress-cell progress-cell--pending" title="이번 주차 — 아직 미제출" aria-label="진행 중">
        ◐
      </span>
    )
  }
  if (cell.status === 'late') {
    return (
      <span className="progress-cell progress-cell--late" title="지나간 주차 — 미제출" aria-label="미제출">
        ✕
      </span>
    )
  }
  return <span className="progress-cell progress-cell--empty" aria-label="비어 있음">○</span>
}

