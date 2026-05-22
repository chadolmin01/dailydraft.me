'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '@/src/context/AuthContext'
import { extractDriveFolderId, extractSheetId } from '@/src/lib/parsers/google-url'
import {
  Trash2,
  Folder as FolderIcon,
  Search,
  Plus,
  HelpCircle,
  Settings,
  LogOut,
  Download,
  Search as SearchIcon,
} from 'lucide-react'
import { DrivePickerButton } from './DrivePickerButton'
import { ChatPanel } from './ChatPanel'
import { FolderBrowser } from './FolderBrowser'
import { OverflowMenu, type MenuItem } from './chat/OverflowMenu'

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
  files: Array<{
    id: string
    name: string
    modifiedTime: string
    path: string[]
    /** week Atom + team Atom 평균 confidence (M6 v1.1) */
    confidence: number
    /** 출처 요약 — 'filename' | 'path' | 'mixed' */
    provenance_summary: 'filename' | 'path' | 'mixed'
  }>
}

interface UnmatchedFile {
  id: string
  name: string
  path: string[]
  missing: string[]
}

interface MatrixResponse {
  folder: { id: string; name: string; program: string | null }
  matrix: {
    teams: string[]
    weeks: number[]
    cells: MatrixCell[]
    source: { teamSource: 'roster' | 'derived'; rosterSize?: number; fileCount: number; unmatchedCount: number }
  }
  unmatched_files: UnmatchedFile[]
  scan: { truncated: boolean; nodes_scanned: number; max_depth_reached: number }
  rosterError?: string
}

type FolderTab = 'recent' | 'all'

export function WorkspaceClient({ userEmail }: { userEmail: string | null }) {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [folderTab, setFolderTab] = useState<FolderTab>('recent')
  const [folderSearch, setFolderSearch] = useState('')

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
    // 폴더 전환 시 이전 매트릭스를 잠깐 유지 → 우측 영역 점멸 방지.
    placeholderData: keepPreviousData,
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

  const updateFolder = useMutation({
    mutationFn: async (input: { id: string; updates: Partial<Pick<Folder, 'name' | 'sheet_id' | 'program' | 'program_start_date'>> }) => {
      const res = await fetch(`/api/folders/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.updates),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? '폴더 수정 실패')
      }
      return res.json() as Promise<Folder>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['folder-matrix'] })
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
    // Optimistic update — 즉각 사라지고, 실패 시 롤백
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: ['folders'] })
      const prev = queryClient.getQueryData<FoldersResponse>(['folders'])
      if (prev) {
        queryClient.setQueryData<FoldersResponse>(['folders'], {
          ...prev,
          folders: prev.folders.filter(f => f.id !== folderId),
        })
      }
      if (selectedFolderId === folderId) setSelectedFolderId(null)
      return { prev }
    },
    onError: (_err, _folderId, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['folders'], context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
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

  // 검색 + 탭 필터 — 클라이언트에서. recent 는 React Query 캐시에서 latest_modified 읽음.
  const filteredFolders = (() => {
    let list = folders
    if (folderSearch.trim()) {
      const q = folderSearch.toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.program?.toLowerCase().includes(q) ?? false),
      )
    }
    if (folderTab === 'recent') {
      list = [...list].sort((a, b) => {
        const aStats = queryClient.getQueryData<{ latest_modified: string | null }>(['folder-stats', a.id])
        const bStats = queryClient.getQueryData<{ latest_modified: string | null }>(['folder-stats', b.id])
        const aT = aStats?.latest_modified ?? a.created_at
        const bT = bStats?.latest_modified ?? b.created_at
        return bT.localeCompare(aT)
      })
    }
    return list
  })()

  // chat-history 캐시를 헤더에서도 구독 — overflow menu 가 내보내기/지우기 표시 여부 판단.
  // ChatPanel 과 같은 queryKey 로 dedupe (네트워크 호출은 1회). queryFn 은 필수라 같이 정의.
  const chatHistory = useQuery({
    queryKey: ['chat-history'],
    queryFn: async (): Promise<{ rows: unknown[] }> => {
      const res = await fetch('/api/chat')
      if (!res.ok) throw new Error('대화 기록 조회 실패')
      return res.json()
    },
  })
  const chatRowCount = chatHistory.data?.rows.length ?? 0

  const menuItems: MenuItem[] = [
    { kind: 'label', label: userEmail ?? '로그인됨', hint: '계정' },
    { kind: 'divider' },
    {
      label: '도움말',
      icon: <HelpCircle size={14} />,
      onClick: () => { window.location.href = '/help' },
    },
    {
      label: '설정',
      icon: <Settings size={14} />,
      onClick: () => { window.location.href = '/settings' },
    },
  ]

  if (chatRowCount >= 5) {
    menuItems.push({
      label: '대화 내 검색',
      icon: <SearchIcon size={14} />,
      onClick: () => window.dispatchEvent(new Event('draft:chat-search')),
    })
  }
  if (chatRowCount > 0) {
    menuItems.push(
      {
        label: '대화 내보내기',
        icon: <Download size={14} />,
        onClick: () => window.dispatchEvent(new Event('draft:chat-export')),
      },
      {
        label: '대화 지우기',
        icon: <Trash2 size={14} />,
        onClick: () => window.dispatchEvent(new Event('draft:chat-clear')),
        danger: true,
      },
    )
  }
  menuItems.push(
    { kind: 'divider' },
    {
      label: '로그아웃',
      icon: <LogOut size={14} />,
      onClick: () => signOut(),
      danger: true,
    },
  )

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:grid md:grid-cols-[var(--layout-chat-width)_1fr] bg-canvas">
      <a href="#workspace-main" className="sr-only focus:not-sr-only">
        본문으로 건너뛰기
      </a>
      {/* 좌측 (모바일에서는 상단) — 챗봇 패널 (라이트, 우측과 동일 톤) */}
      <aside
        className="bg-canvas text-ink border-b md:border-b-0 md:border-r border-hairline flex flex-col md:h-screen max-h-[60vh] md:max-h-none"
        aria-label="챗봇"
      >
        <header className="px-4 py-3 border-b border-hairline flex items-center justify-between gap-2">
          <h2 className="text-title-md text-ink truncate min-w-0">
            {foldersQuery.data?.workspace.name ?? 'Draft'}
          </h2>
          <OverflowMenu label="계정과 대화 메뉴" items={menuItems} />
        </header>

        <ChatPanel folderId={selectedFolderId} folderName={selectedFolder?.name} />
      </aside>

      {/* 우측 (모바일에서는 하단) — 콘텐츠 (cream) */}
      <main id="workspace-main" className="overflow-y-auto p-4 md:p-6 md:h-screen" aria-label="폴더와 진행도">
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

          {folders.length > 0 && !foldersQuery.isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              <TodaysActivity folderIds={folders.map(f => f.id)} folderNames={Object.fromEntries(folders.map(f => [f.id, f.name]))} />
              <UpcomingDeadlines folderNames={Object.fromEntries(folders.map(f => [f.id, f.name]))} />
            </div>
          ) : null}

          {/* 탭 + 검색 + 연결 — 상단 컨트롤 바 */}
          <div className="flex items-center justify-between gap-4 flex-wrap border-b border-hairline">
            <div role="tablist" aria-label="폴더 보기" className="flex items-center gap-1 -mb-px">
              <FolderTabHead active={folderTab === 'recent'} onClick={() => setFolderTab('recent')}>
                최근
              </FolderTabHead>
              <FolderTabHead active={folderTab === 'all'} onClick={() => setFolderTab('all')}>
                모든 폴더
              </FolderTabHead>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-soft pointer-events-none" />
                <input
                  type="search"
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  placeholder="폴더 검색"
                  className="h-9 pl-8 pr-3 rounded-full bg-surface-soft border border-hairline text-body-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ink w-44 md:w-56 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(v => !v)}
                className="h-9 px-3 rounded-full bg-ink text-canvas text-caption font-medium hover:bg-body-strong transition-colors inline-flex items-center gap-1.5"
                aria-label="폴더 연결"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>연결</span>
              </button>
            </div>
          </div>

          {showAddForm ? <AddFolderForm onSubmit={(v) => addFolder.mutate(v)} pending={addFolder.isPending} error={addFolder.error?.message ?? null} /> : null}

          {foldersQuery.isError && !googleAuthBroken ? (
            <div className="rounded-md border border-hairline bg-surface-soft p-4 space-y-1">
              <p className="text-body-sm text-ink">폴더 목록을 불러오지 못했습니다.</p>
              <p className="text-caption text-muted-soft">새로고침하거나 잠시 후 다시 시도해 주세요.</p>
            </div>
          ) : null}

          {foldersQuery.isLoading && folders.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => (
                <FolderCardSkeleton key={i} />
              ))}
            </div>
          ) : null}

          {folders.length === 0 && !foldersQuery.isLoading && !showAddForm ? (
            <div className="rounded-lg border border-hairline bg-surface-soft p-8 text-center space-y-5">
              <div className="space-y-2">
                <h3 className="text-display-sm text-ink">시작하기 전 한 가지</h3>
                <p className="text-body-md text-muted">
                  운영 중인 Google Drive 폴더 하나만 연결하면 됩니다.
                </p>
              </div>
              <ol className="text-body-sm text-body space-y-1.5 max-w-md mx-auto text-left list-decimal list-inside">
                <li>FLIP 1기 같은 운영 단위의 Drive 폴더를 준비합니다.</li>
                <li>(선택) 팀 명단이 적힌 Sheets 도 함께.</li>
                <li>아래 버튼으로 연결하면 즉시 매트릭스가 그려집니다.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="h-10 px-5 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors"
              >
                폴더 연결하기
              </button>
              <p className="text-caption text-muted-soft">
                사용법이 궁금하시면 <a href="/help" className="underline underline-offset-2 hover:text-ink">도움말</a> 을 먼저 보세요.
              </p>
            </div>
          ) : null}

          {folders.length > 0 && filteredFolders.length === 0 ? (
            <div className="rounded-lg border border-hairline bg-surface-soft p-6 text-center text-body-sm text-muted">
              {folderSearch.trim()
                ? `"${folderSearch}" 와 일치하는 폴더가 없습니다.`
                : '이 탭에 보여줄 폴더가 없습니다.'}
            </div>
          ) : null}

          {filteredFolders.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFolders.map(folder => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  selected={selectedFolderId === folder.id}
                  onSelect={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                  onDelete={() => handleDelete(folder)}
                  deleting={deleteFolder.isPending}
                />
              ))}
            </div>
          ) : null}

          {selectedFolder?.drive_folder_id ? (
            <FolderTabs
              folder={selectedFolder}
              matrixQuery={matrixQuery}
              onUpdate={(updates) => updateFolder.mutate({ id: selectedFolder.id, updates })}
              updating={updateFolder.isPending}
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
        <FolderIdPreview
          id={form.drive_folder_id}
          onResolved={(name) => {
            if (!form.name && name) setForm((f) => ({ ...f, name }))
          }}
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

function FolderIdPreview({ id, onResolved }: { id: string; onResolved: (name: string) => void }) {
  const [debouncedId, setDebouncedId] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedId(id.trim()), 600)
    return () => clearTimeout(t)
  }, [id])

  const query = useQuery({
    queryKey: ['folder-meta', debouncedId],
    enabled: debouncedId.length >= 20,  // Drive ID 는 보통 25+ chars
    queryFn: async () => {
      const res = await fetch(`/api/google/drive/folder-meta?id=${encodeURIComponent(debouncedId)}`)
      if (!res.ok) throw new Error('not found')
      return res.json() as Promise<{ id: string; name: string; mimeType: string }>
    },
    retry: false,
  })

  useEffect(() => {
    if (query.data?.name) onResolved(query.data.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.name])

  if (!debouncedId || debouncedId.length < 20) return null
  if (query.isLoading) {
    return <p className="text-caption text-muted-soft mt-1">확인 중…</p>
  }
  if (query.isError) {
    return <p className="text-caption text-muted-soft mt-1">폴더를 찾지 못했거나 접근 권한이 없습니다.</p>
  }
  if (query.data) {
    const isFolder = query.data.mimeType === 'application/vnd.google-apps.folder'
    return (
      <p className="text-caption mt-1 truncate">
        {isFolder ? (
          <span className="text-ink">✓ {query.data.name}</span>
        ) : (
          <span className="text-muted">이건 폴더가 아닙니다 ({query.data.name})</span>
        )}
      </p>
    )
  }
  return null
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

function TodaysActivity({ folderIds, folderNames }: { folderIds: string[]; folderNames: Record<string, string> }) {
  // 각 폴더 stats 를 React Query 캐시에서 읽기 (FolderCardStats 가 이미 fetch 하므로 재요청 X)
  const qc = useQueryClient()
  const recent: Array<{ folderId: string; folderName: string; latest: string; latestName: string }> = []
  for (const fid of folderIds) {
    const data = qc.getQueryData<{ file_count: number; latest_modified: string | null; latest_name: string | null }>(['folder-stats', fid])
    if (data?.latest_modified && data.latest_name) {
      const ms = Date.now() - new Date(data.latest_modified).getTime()
      if (ms < 24 * 60 * 60 * 1000) {
        recent.push({ folderId: fid, folderName: folderNames[fid], latest: data.latest_modified, latestName: data.latest_name })
      }
    }
  }

  if (recent.length === 0) return null

  return (
    <section className="rounded-lg border border-hairline bg-canvas p-4 space-y-2">
      <h3 className="text-title-sm text-ink flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink" />
        오늘의 활동
      </h3>
      <ul className="space-y-1.5">
        {recent.map(r => (
          <li key={r.folderId} className="text-body-sm text-body flex items-baseline gap-2">
            <span className="text-muted shrink-0">{r.folderName}</span>
            <span className="text-muted-soft">·</span>
            <span className="truncate">{r.latestName}</span>
            <span className="text-caption text-muted-soft tabular shrink-0 ml-auto">{formatRelative(r.latest)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FolderTabHead({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-3 text-body-sm border-b-2 transition-colors -mb-px ${
        active
          ? 'text-ink border-ink font-medium'
          : 'text-muted border-transparent hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function FolderCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-hairline bg-canvas animate-pulse">
      <div className="aspect-[5/3] bg-surface-card opacity-60" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-24 bg-surface-card rounded opacity-60" />
        <div className="h-3 w-32 bg-surface-card rounded opacity-40" />
      </div>
    </div>
  )
}

function FolderCard({
  folder,
  selected,
  onSelect,
  onDelete,
  deleting,
}: {
  folder: Folder
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const stats = useQuery({
    queryKey: ['folder-stats', folder.id],
    staleTime: 60_000,
    // 점멸 방지: 폴더 재선택/리스트 재정렬 시 직전 stats 를 유지하다 부드럽게 교체.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await fetch(`/api/folders/${folder.id}/stats`)
      if (!res.ok) throw new Error('stats')
      return res.json() as Promise<{ file_count: number; latest_modified: string | null; latest_name: string | null }>
    },
  })

  const isRecent = stats.data?.latest_modified
    && (Date.now() - new Date(stats.data.latest_modified).getTime() < 24 * 60 * 60 * 1000)

  return (
    <div
      className={`relative group rounded-xl overflow-hidden border transition-all ${
        selected
          ? 'border-ink shadow-md'
          : 'border-hairline hover:border-muted-soft hover:shadow-sm'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        {/* 폴더 아이콘 영역 — OS Finder 느낌 */}
        <div className={`relative aspect-[5/3] flex items-center justify-center transition-colors ${
          selected ? 'bg-surface-strong' : 'bg-surface-card group-hover:bg-surface-strong'
        }`}>
          <FolderIcon
            className="w-12 h-12 text-muted"
            strokeWidth={1.2}
            fill="currentColor"
            fillOpacity={0.15}
          />
          {/* 우상단 라벨 — Sheets 연결, design system 식 작은 뱃지 */}
          {folder.sheet_id ? (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-canvas/80 backdrop-blur text-caption text-muted-soft">
              명단 연결됨
            </span>
          ) : null}
          {/* 최근 활동 dot */}
          {isRecent ? (
            <span
              className="absolute top-3 right-3 w-2 h-2 rounded-full bg-ink"
              title="오늘 활동 있음"
              aria-label="오늘 활동 있음"
            />
          ) : null}
        </div>
        {/* 메타 정보 영역 — 점멸 방지: stats 가 없는 동안 텍스트 대신 동일 폭의 스켈레톤 바 */}
        <div className="bg-canvas p-4 space-y-1">
          <p className="text-body-md text-ink font-medium truncate">{folder.name}</p>
          {stats.data ? (
            <p className="text-caption text-muted-soft tabular truncate">
              파일 {stats.data.file_count}개
              {stats.data.latest_modified ? ` · ${formatRelative(stats.data.latest_modified)}` : ''}
            </p>
          ) : (
            <span
              className="block h-3 w-28 rounded bg-surface-card opacity-60"
              aria-hidden
            />
          )}
        </div>
      </button>
      {/* 휴지통 — 호버 시 우상단 (라벨 위) */}
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`${folder.name} 연결 해제`}
        title="연결 해제"
        className="absolute bottom-3 right-3 p-1.5 rounded-md bg-canvas/80 backdrop-blur text-muted-soft hover:text-ink opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function FolderCardStats({ folderId }: { folderId: string }) {
  const query = useQuery({
    queryKey: ['folder-stats', folderId],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/folders/${folderId}/stats`)
      if (!res.ok) throw new Error('stats fail')
      return res.json() as Promise<{ file_count: number; latest_modified: string | null; latest_name: string | null }>
    },
  })

  if (query.isLoading || query.isError || !query.data) {
    return <span className="inline-block h-3 w-24 rounded bg-surface-card opacity-60" aria-hidden />
  }

  const { file_count, latest_modified } = query.data
  // 24시간 이내 활동 = "활발함" 표시
  const isRecent = latest_modified && (Date.now() - new Date(latest_modified).getTime() < 24 * 60 * 60 * 1000)

  return (
    <p className="text-caption text-muted-soft tabular flex items-center gap-1.5">
      {isRecent ? (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-ink"
          aria-label="오늘 활동 있음"
          title="오늘 활동 있음"
        />
      ) : null}
      <span>
        파일 {file_count}개
        {latest_modified ? ` · ${formatRelative(latest_modified)}` : ''}
      </span>
    </p>
  )
}

function formatRelative(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return '오늘'
  if (diff < 2 * day) return '어제'
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`
  if (diff < 30 * day) return `${Math.floor(diff / (7 * day))}주 전`
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}달 전`
  return `${Math.floor(diff / (365 * day))}년 전`
}

function FolderTabs({
  folder,
  matrixQuery,
  onUpdate,
  updating,
}: {
  folder: Folder
  matrixQuery: ReturnType<typeof useQuery<MatrixResponse, Error>>
  onUpdate: (updates: Partial<Pick<Folder, 'name' | 'sheet_id' | 'program' | 'program_start_date'>>) => void
  updating: boolean
}) {
  const folderName = folder.name
  const rootDriveFolderId = folder.drive_folder_id!
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'folder' | 'matrix' | 'atoms'>('folder')
  const matrix = matrixQuery.data?.matrix
  const hasMatrixData = !!matrix && matrix.source.fileCount > 0
  const unmatchedCount = matrixQuery.data?.matrix.source.unmatchedCount ?? 0
  const unmatchedFiles = matrixQuery.data?.unmatched_files ?? []

  // 진행도 탭 비활성 사유 — 파일 자체가 없는지, 파일은 있는데 이름 규칙이 안 맞는지
  const matrixHint = (() => {
    if (matrixQuery.isLoading) return '계산 중…'
    if (hasMatrixData) return undefined
    if (unmatchedCount > 0) return '파일명 규칙에 맞는 파일이 없습니다'
    return '폴더에 파일이 없습니다'
  })()

  return (
    <section className="space-y-4 border-t border-hairline pt-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h2 className="text-display-sm text-ink">{folderName}</h2>
          <button
            type="button"
            onClick={() => setEditing(v => !v)}
            className="text-caption text-muted hover:text-ink transition-colors"
          >
            {editing ? '편집 닫기' : '설정 수정'}
          </button>
        </div>
        <div role="tablist" aria-label="폴더 보기" className="flex items-center gap-1 border-b border-hairline -mb-px">
          <TabButton active={tab === 'folder'} onClick={() => setTab('folder')}>폴더</TabButton>
          <TabButton
            active={tab === 'matrix'}
            onClick={() => setTab('matrix')}
            disabled={!hasMatrixData}
            hint={matrixHint}
          >
            진행도
          </TabButton>
          <TabButton active={tab === 'atoms'} onClick={() => setTab('atoms')}>
            내용 요약
          </TabButton>
        </div>
      </div>

      {editing ? (
        <FolderEditForm
          folder={folder}
          pending={updating}
          onSave={(updates) => {
            onUpdate(updates)
            setEditing(false)
          }}
        />
      ) : null}

      {tab === 'folder' ? (
        <div role="tabpanel" className="space-y-3">
          {unmatchedCount > 0 && !hasMatrixData ? (
            <ConventionHint unmatchedCount={unmatchedCount} unmatchedFiles={unmatchedFiles} />
          ) : null}
          <FolderBrowser folderId={folder.id} rootDriveFolderId={rootDriveFolderId} rootName={folderName} />
        </div>
      ) : null}

      {tab === 'matrix' && hasMatrixData && matrix ? (
        <div role="tabpanel" className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-body-sm text-muted">
              팀 {matrix.teams.length}개 · 주차 {matrix.weeks.length}개 ·
              파일 {matrix.source.fileCount}개
              {matrix.source.teamSource === 'derived'
                ? ' · 명단 시트 미연결 (파일에서 추출)'
                : ' · 명단 시트 기반'}
              {unmatchedCount > 0 ? ` · 미매칭 ${unmatchedCount}개 (파일 탭에서 확인)` : ''}
            </p>
            <div className="flex items-center gap-3">
              {matrixQuery.dataUpdatedAt ? (
                <span className="text-caption text-muted-soft tabular" title={new Date(matrixQuery.dataUpdatedAt).toLocaleString('ko-KR')}>
                  {formatRelative(new Date(matrixQuery.dataUpdatedAt).toISOString())} 기준
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => matrixQuery.refetch()}
                disabled={matrixQuery.isFetching}
                className="text-caption text-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                {matrixQuery.isFetching ? '갱신 중…' : '새로고침'}
              </button>
              <button
                type="button"
                onClick={() => downloadMatrixCsv(folder.name, matrix.teams, matrix.weeks, matrix.cells)}
                className="text-caption text-muted hover:text-ink transition-colors"
              >
                CSV 다운로드
              </button>
            </div>
          </div>

          {matrixQuery.data?.rosterError ? (
            <p className="text-body-sm text-muted">
              명단 시트를 읽지 못해 파일에서 팀을 추출했습니다.
            </p>
          ) : null}

          <MatrixSummaryBar cells={matrix.cells} />

          <ProgressGrid teams={matrix.teams} weeks={matrix.weeks} cells={matrix.cells} />
        </div>
      ) : null}

      {tab === 'matrix' && matrixQuery.isLoading ? <MatrixSkeleton /> : null}
      {tab === 'matrix' && matrixQuery.isError ? (
        <p className="text-body-sm text-muted">진행도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : null}

      {tab === 'atoms' ? (
        <div role="tabpanel">
          <AtomDigest folderId={folder.id} folderName={folder.name} />
        </div>
      ) : null}
    </section>
  )
}

function ConventionHint({ unmatchedCount, unmatchedFiles }: { unmatchedCount: number; unmatchedFiles: UnmatchedFile[] }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-soft p-5 space-y-3">
      <p className="text-title-sm text-ink">진행도를 그리려면 주차와 팀 정보가 필요합니다.</p>
      <p className="text-body-sm text-muted">
        지금 폴더에 있는 파일 <span className="tabular">{unmatchedCount}</span>개에서 주차/팀을 인식하지 못했습니다.
      </p>
      <div className="text-body-sm text-muted space-y-2">
        <p>Draft 가 인식하는 방식 (둘 중 하나만 맞으면 됩니다):</p>
        <ul className="list-disc list-inside pl-2 space-y-1">
          <li>파일명: <code className="filename">[FLIP1기_3주차]_3팀_MVP기획서.pdf</code></li>
          <li>폴더 구조: <code className="filename">3주차 / 3팀 / 임의이름.pdf</code></li>
        </ul>
        <p className="text-caption text-muted-soft">
          폴더 이름에 "3주차" "Week 3" "3팀" "Team 3" "3조" 등이 있어도 자동 인식.
        </p>
      </div>
      {unmatchedFiles.length > 0 ? (
        <details className="text-caption">
          <summary className="text-muted cursor-pointer">미매칭 파일 {unmatchedFiles.length}개 보기</summary>
          <ul className="mt-2 space-y-1">
            {unmatchedFiles.slice(0, 10).map(f => (
              <li key={f.id} className="text-muted-soft">
                <code className="filename">{f.path.length > 0 ? f.path.join(' / ') + ' / ' : ''}{f.name}</code>
                <span className="ml-2">({f.missing.join(' · ')} 모름)</span>
              </li>
            ))}
            {unmatchedFiles.length > 10 ? (
              <li className="text-muted-soft">… 외 {unmatchedFiles.length - 10}개</li>
            ) : null}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

function downloadMatrixCsv(
  folderName: string,
  teams: string[],
  weeks: number[],
  cells: MatrixCell[],
) {
  const cellMap = new Map<string, MatrixCell>()
  for (const c of cells) cellMap.set(`${c.team}|${c.week}`, c)

  const STATUS: Record<MatrixCell['status'], string> = {
    done: '제출',
    pending: '진행',
    late: '미제출',
    empty: '예정',
  }

  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

  const header = ['팀', ...weeks.map(w => `${w}주차`), '제출률']
  const rows = teams.map(team => {
    const cols = weeks.map(w => {
      const cell = cellMap.get(`${team}|${w}`)
      return STATUS[cell?.status ?? 'empty']
    })
    const done = cols.filter(s => s === '제출').length
    const rate = weeks.length > 0 ? `${Math.round((done / weeks.length) * 100)}%` : '—'
    return [team, ...cols, rate]
  })

  const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
  // Excel 한글 깨짐 방지 — BOM 추가
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  a.download = `${folderName}_진행도_${dateStr}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function FolderEditForm({
  folder,
  pending,
  onSave,
}: {
  folder: Folder
  pending: boolean
  onSave: (updates: Partial<Pick<Folder, 'name' | 'sheet_id' | 'program' | 'program_start_date'>>) => void
}) {
  const [name, setName] = useState(folder.name)
  const [program, setProgram] = useState(folder.program ?? '')
  const [sheetId, setSheetId] = useState(folder.sheet_id ?? '')
  const [startDate, setStartDate] = useState(folder.program_start_date ?? '')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          name: name.trim() !== folder.name ? name.trim() : undefined,
          program: (program.trim() || null) !== folder.program ? (program.trim() || null) : undefined,
          sheet_id: (sheetId.trim() || null) !== folder.sheet_id ? (sheetId.trim() || null) : undefined,
          program_start_date: (startDate || null) !== folder.program_start_date ? (startDate || null) : undefined,
        })
      }}
      className="rounded-lg border border-hairline bg-canvas p-5 space-y-4"
    >
      <Field label="이름" required>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Program" hint="파일명 컨벤션의 program 부분">
          <input
            type="text"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="예: FLIP1기"
            className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="프로그램 시작일">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-10 px-3 bg-canvas border border-hairline rounded-md text-body-md text-ink focus:outline-none focus:border-ink"
          />
        </Field>
      </div>
      <Field label="Sheets ID 또는 URL">
        <input
          type="text"
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
          placeholder="비우면 명단 연결 해제"
          className="w-full h-10 px-3 font-mono text-mono-md bg-canvas border border-hairline rounded-md text-ink focus:outline-none focus:border-ink"
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="h-10 px-4 rounded-md bg-ink text-canvas text-button font-medium hover:bg-body-strong transition-colors disabled:opacity-50"
      >
        {pending ? '저장 중…' : '저장'}
      </button>
    </form>
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
      role="tab"
      aria-selected={active}
      aria-disabled={disabled}
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

function MatrixSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-72 bg-surface-card rounded animate-pulse opacity-60" />
      <div className="rounded-lg border border-hairline bg-surface-soft p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1">
            <div className="h-7 w-12 mx-auto bg-canvas rounded animate-pulse opacity-60" />
            <div className="h-3 w-10 mx-auto bg-canvas rounded animate-pulse opacity-40" />
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
        <div className="p-3 space-y-2">
          {[0, 1, 2, 3, 4].map(r => (
            <div key={r} className="flex gap-2">
              <div className="h-7 w-16 bg-surface-card rounded animate-pulse opacity-60" />
              {[0, 1, 2, 3, 4, 5].map(c => (
                <div key={c} className="h-7 w-8 bg-surface-card rounded animate-pulse opacity-40" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MatrixSummaryBar({ cells }: { cells: MatrixCell[] }) {
  const total = cells.length
  const done = cells.filter(c => c.status === 'done').length
  const pending = cells.filter(c => c.status === 'pending').length
  const late = cells.filter(c => c.status === 'late').length
  const empty = cells.filter(c => c.status === 'empty').length
  const rate = total > 0 ? Math.round((done / total) * 100) : 0

  // late 와 pending 의 팀+주차 (메일 prefill 용)
  const lateTeams = Array.from(new Set(cells.filter(c => c.status === 'late').map(c => c.team)))
  const pendingTeams = Array.from(new Set(cells.filter(c => c.status === 'pending').map(c => c.team)))

  const triggerEmailForLate = () => {
    if (lateTeams.length === 0) return
    const msg = `미제출 팀 ${lateTeams.join(', ')} 에게 보낼 정중한 리마인드 메일 초안을 만들어주세요. 마감과 제출 위치를 명확히 적어주시고, 본문은 모바일 한 화면 안에 들어가게 부탁드립니다.`
    window.dispatchEvent(new CustomEvent('draft:chat', { detail: msg }))
  }

  const triggerEmailForPending = () => {
    if (pendingTeams.length === 0) return
    const msg = `이번 주차에 아직 제출 없는 팀 ${pendingTeams.join(', ')} 에게 가벼운 안내 메일 초안을 만들어주세요. 압박하지 말고 일정만 짚어주시기 바랍니다.`
    window.dispatchEvent(new CustomEvent('draft:chat', { detail: msg }))
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-hairline bg-surface-soft p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
        <Stat label="제출률" value={`${rate}%`} accent />
        <Stat label="제출" value={String(done)} icon="●" />
        <Stat label="진행" value={String(pending)} icon="◐" />
        <Stat label="미제출" value={String(late)} icon="✕" />
        <Stat label="예정" value={String(empty)} icon="○" />
      </div>
      {(late > 0 || pending > 0) ? (
        <div className="flex gap-2 flex-wrap">
          {late > 0 ? (
            <button
              type="button"
              onClick={triggerEmailForLate}
              className="text-caption text-ink border border-hairline px-3 py-1.5 rounded-full hover:bg-surface-soft transition-colors"
            >
              미제출 팀 {lateTeams.length}개에 메일 초안 →
            </button>
          ) : null}
          {pending > 0 ? (
            <button
              type="button"
              onClick={triggerEmailForPending}
              className="text-caption text-muted border border-hairline px-3 py-1.5 rounded-full hover:bg-surface-soft transition-colors"
            >
              이번 주차 안내 메일 초안 →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value, icon, accent }: { label: string; value: string; icon?: string; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <div className={`text-display-sm tabular ${accent ? 'text-ink' : 'text-body'}`}>
        {icon ? <span className="text-muted mr-1">{icon}</span> : null}
        {value}
      </div>
      <div className="text-caption text-muted-soft">{label}</div>
    </div>
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
  const [selected, setSelected] = useState<MatrixCell | null>(null)
  const [filter, setFilter] = useState<MatrixCell['status'] | 'all'>('all')

  // team × week 빠른 조회용 인덱스
  const cellMap = new Map<string, MatrixCell>()
  for (const c of cells) cellMap.set(`${c.team}|${c.week}`, c)

  // 필터 적용: 필터 active 일 때 해당 status 없는 팀 행 숨김
  const visibleTeams = filter === 'all'
    ? teams
    : teams.filter(team => weeks.some(w => cellMap.get(`${team}|${w}`)?.status === filter))

  const visibleWeeks = filter === 'all'
    ? weeks
    : weeks.filter(w => teams.some(team => cellMap.get(`${team}|${w}`)?.status === filter))

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-caption text-muted-soft mr-1">필터</span>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>전체</FilterChip>
        <FilterChip active={filter === 'done'} onClick={() => setFilter('done')}>제출</FilterChip>
        <FilterChip active={filter === 'pending'} onClick={() => setFilter('pending')}>진행</FilterChip>
        <FilterChip active={filter === 'late'} onClick={() => setFilter('late')}>미제출</FilterChip>
        <FilterChip active={filter === 'empty'} onClick={() => setFilter('empty')}>예정</FilterChip>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline bg-canvas">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="bg-surface-soft">
              <th className="text-left px-4 py-2 text-title-sm text-ink sticky left-0 bg-surface-soft">팀</th>
              {visibleWeeks.map(w => (
                <th key={w} className="px-2 py-2 text-title-sm text-ink text-center tabular">
                  {w}주차
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTeams.map(team => (
              <tr key={team} className="border-t border-hairline-soft">
                <td className="px-4 py-2 text-body-sm text-ink sticky left-0 bg-canvas">{team}</td>
                {visibleWeeks.map(w => {
                  const cell = cellMap.get(`${team}|${w}`)
                  return (
                    <td key={w} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => cell && setSelected(cell)}
                        className="cursor-pointer"
                        aria-label={`${team} ${w}주차 상세`}
                      >
                        <Cell cell={cell} />
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
            {visibleTeams.length === 0 ? (
              <tr>
                <td colSpan={visibleWeeks.length + 1} className="px-4 py-6 text-center text-body-sm text-muted">
                  해당 상태의 셀이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? <CellDetail cell={selected} onClose={() => setSelected(null)} /> : null}
    </>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-caption px-3 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-ink text-canvas border-ink'
          : 'text-muted border-hairline hover:text-ink hover:border-muted'
      }`}
    >
      {children}
    </button>
  )
}

function labelProvenance(p: 'filename' | 'path' | 'mixed'): string {
  // M6 Glossary 의 Provenance UI 라벨 = "출처"
  if (p === 'filename') return '파일명에서 인식'
  if (p === 'path') return '폴더 경로에서 인식'
  return '파일명 + 폴더 경로'
}

function CellDetail({ cell, onClose }: { cell: MatrixCell; onClose: () => void }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${cell.team} ${cell.week}주차 상세`}
      onClick={onClose}
      className="fixed inset-0 bg-ink/30 flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-canvas rounded-lg border border-hairline p-6 space-y-4"
      >
        <header className="flex items-center justify-between">
          <h3 className="text-title-lg text-ink">
            {cell.team} · {cell.week}주차
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-caption text-muted hover:text-ink transition-colors"
          >
            닫기
          </button>
        </header>

        <p className="text-body-sm text-muted">
          {cell.status === 'done' && `제출됨 — 파일 ${cell.files.length}개`}
          {cell.status === 'pending' && '이번 주차 — 아직 제출 없음'}
          {cell.status === 'late' && '지나간 주차 — 미제출'}
          {cell.status === 'empty' && '비어 있음'}
        </p>

        {cell.files.length > 0 ? (
          <ul className="space-y-2">
            {cell.files.map(f => (
              <li key={f.id} className="rounded-md border border-hairline bg-surface-soft p-3 space-y-1">
                <a
                  href={`https://drive.google.com/file/d/${f.id}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-body-sm text-ink hover:underline underline-offset-2 truncate block"
                >
                  {f.name}
                </a>
                {f.path.length > 0 ? (
                  <p className="text-caption text-muted-soft truncate">
                    경로: {f.path.join(' / ')}
                  </p>
                ) : null}
                <p className="text-caption text-muted-soft tabular flex items-center gap-2 flex-wrap">
                  <span>{new Date(f.modifiedTime).toLocaleString('ko-KR')}</span>
                  <span aria-hidden>·</span>
                  <span title={`출처: ${labelProvenance(f.provenance_summary)} · 신뢰도 ${Math.round(f.confidence * 100)}%`}>
                    {labelProvenance(f.provenance_summary)} ({Math.round(f.confidence * 100)}%)
                  </span>
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
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

// ── Atom 요약 탭 ──────────────────────────────────────────────────────────
// 의도: 매니저가 폴더 안의 처리된 파일들에서 추출된 핵심 항목 (마감/결정/요구사항/수치)
// 을 클릭 없이 한 화면에 보기. 파일 하나하나 안 열고도 운영 흐름 파악.

interface AtomRow {
  id: string
  local_id: string
  type: string
  content: string
  attributes: Record<string, unknown>
  provenance: { source?: { raw_text?: string; location?: string } }
  confidence: number
  processed_file_id: string
  processed_files: { id: string; filename: string; folder_id: string }
}

interface AtomDigestResponse {
  count: number
  filter: { type: string | null; keyword: string | null; folder_id: string | null }
  atoms: Array<{
    local_id: string
    type: string
    content: string
    confidence: number
    attributes: Record<string, unknown>
    raw_text: string | null
    location: string | null
    from_file: { processed_file_id: string; filename: string; folder_id: string }
  }>
}

const ATOM_LABEL: Record<string, string> = {
  Requirement: '요구사항', Deadline: '마감', Constraint: '제약',
  Deliverable: '산출물', Metric: '수치', Narrative: '서술',
  Event: '이벤트', Question: '질문', Decision: '결정',
  Reference: '참조', Definition: '정의', Entity: '주체',
}

function useFolderAtoms(folderId: string, type: string | null, keyword: string) {
  const trimmed = keyword.trim()
  return useQuery({
    queryKey: ['folder-atoms', folderId, type, trimmed],
    queryFn: async (): Promise<AtomDigestResponse> => {
      const params = new URLSearchParams({ folder_id: folderId, limit: '100' })
      if (type) params.set('type', type)
      if (trimmed) params.set('keyword', trimmed)
      const res = await fetch(`/api/atoms/search?${params}`)
      if (!res.ok) throw new Error('atom 조회 실패')
      return res.json()
    },
    staleTime: 30_000,
  })
}

function AtomDigest({ folderId, folderName }: { folderId: string; folderName: string }) {
  const qc = useQueryClient()
  const [filterType, setFilterType] = useState<string | null>(null)
  const [rawKeyword, setRawKeyword] = useState('')
  const [keyword, setKeyword] = useState('')

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['folder-atoms', folderId] })
    qc.invalidateQueries({ queryKey: ['folder-atom-counts', folderId] })
  }

  // 300ms 디바운스 — 매니저가 타이핑 중에 매 keystroke 페치 방지.
  useEffect(() => {
    const t = setTimeout(() => setKeyword(rawKeyword), 300)
    return () => clearTimeout(t)
  }, [rawKeyword])

  const q = useFolderAtoms(folderId, filterType, keyword)

  // Deadline 필터일 때 attributes.due_at 으로 정렬 (다가오는 마감 먼저).
  // 의도: 매니저가 가장 흔하게 묻는 "다음 마감" 질문에 즉답.
  const sortedAtoms = (() => {
    const atoms = q.data?.atoms ?? []
    if (filterType !== 'Deadline') return atoms
    return [...atoms].sort((a, b) => {
      const aDue = typeof a.attributes?.due_at === 'string' ? a.attributes.due_at : ''
      const bDue = typeof b.attributes?.due_at === 'string' ? b.attributes.due_at : ''
      if (!aDue && !bDue) return 0
      if (!aDue) return 1
      if (!bDue) return -1
      return aDue.localeCompare(bDue)
    })
  })()

  const counts = useQuery({
    queryKey: ['folder-atom-counts', folderId],
    queryFn: async (): Promise<{ counts: Record<string, number>; total: number; processed_files: number }> => {
      const res = await fetch(`/api/atoms/counts?folder_id=${folderId}`)
      if (!res.ok) throw new Error('카운트 조회 실패')
      return res.json()
    },
    staleTime: 30_000,
  })

  if (counts.data?.processed_files === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface-soft p-6 text-center space-y-2">
        <p className="text-body-md text-ink">아직 처리된 파일이 없습니다.</p>
        <p className="text-body-sm text-muted">
          폴더 탭에서 파일 옆 <span className="text-ink">[✨ 처리]</span> 버튼을 누르거나
          <span className="text-ink"> [안 된 N개 모두 처리]</span> 로 일괄 추출하세요.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-body-sm text-muted">
          {folderName} · 처리된 파일 {counts.data?.processed_files ?? '…'}개 ·
          총 {counts.data?.total ?? '…'} 항목
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={q.isFetching}
            className="text-caption text-muted hover:text-ink transition-colors disabled:opacity-50"
          >
            {q.isFetching ? '갱신 중…' : '새로고침'}
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-soft pointer-events-none" />
            <input
              type="search"
              value={rawKeyword}
              onChange={(e) => setRawKeyword(e.target.value)}
              placeholder="내용 검색"
              className="h-8 pl-8 pr-3 rounded-full bg-surface-soft border border-hairline text-caption text-ink placeholder:text-muted-soft focus:outline-none focus:border-ink w-44 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 타입별 카운트 chip — 클릭하면 필터 */}
      <div className="flex flex-wrap gap-1.5">
        <AtomChip active={filterType === null} onClick={() => setFilterType(null)}>
          전체 {counts.data?.total ?? 0}
        </AtomChip>
        {counts.data
          ? Object.entries(counts.data.counts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, n]) => (
                <AtomChip
                  key={type}
                  active={filterType === type}
                  onClick={() => setFilterType(filterType === type ? null : type)}
                >
                  {ATOM_LABEL[type] ?? type} {n}
                </AtomChip>
              ))
          : null}
      </div>

      {/* Deadline 필터일 때 정렬 힌트 */}
      {filterType === 'Deadline' ? (
        <p className="text-caption text-muted-soft">
          due_at 오름차순 정렬 — 가까운 마감 먼저.
        </p>
      ) : null}

      {/* 항목 리스트 */}
      {q.isLoading ? (
        <p className="text-body-sm text-muted-soft">불러오는 중…</p>
      ) : null}

      {q.data && sortedAtoms.length === 0 ? (
        <p className="text-body-sm text-muted">해당 조건의 항목이 없습니다.</p>
      ) : null}

      <ul className="divide-y divide-hairline-soft rounded-lg border border-hairline bg-canvas">
        {sortedAtoms.map((a) => {
          const dueAt = typeof a.attributes?.due_at === 'string' ? a.attributes.due_at : null
          return (
            <li key={`${a.from_file.processed_file_id}-${a.local_id}`} className="px-4 py-3 space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-caption text-muted-soft tabular shrink-0">
                  {ATOM_LABEL[a.type] ?? a.type}
                </span>
                <span className="text-body-sm text-ink flex-1 min-w-0">{a.content}</span>
                {dueAt ? (
                  <span className="text-caption text-ink tabular shrink-0 border border-hairline rounded px-1.5 py-0.5">
                    {dueAt}
                  </span>
                ) : null}
                <span className="text-caption text-muted-soft tabular shrink-0">
                  {Math.round(a.confidence * 100)}%
                </span>
              </div>
              <p className="text-caption text-muted-soft truncate">
                {a.from_file.filename}
                {a.location ? ` · ${a.location}` : ''}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// 워크스페이스 전체 다가오는 마감 — Deadline AtomType 만 추출 + due_at 정렬.
// 의도: 매니저가 우측 상단에서 다음 일정 즉시 보기. 폴더 안 들어가도.
function UpcomingDeadlines({ folderNames }: { folderNames: Record<string, string> }) {
  const q = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: async (): Promise<AtomDigestResponse> => {
      const res = await fetch('/api/atoms/search?type=Deadline&limit=50')
      if (!res.ok) throw new Error('마감 조회 실패')
      return res.json()
    },
    staleTime: 60_000,
  })

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (q.data?.atoms ?? [])
    .map((a) => {
      const due = typeof a.attributes?.due_at === 'string' ? a.attributes.due_at : null
      return { ...a, due }
    })
    .filter((a) => a.due && a.due >= today)
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
    .slice(0, 5)

  if (q.isLoading) {
    return (
      <section className="rounded-lg border border-hairline bg-canvas p-4 space-y-2">
        <h3 className="text-title-sm text-ink">다가오는 마감</h3>
        <p className="text-caption text-muted-soft">불러오는 중…</p>
      </section>
    )
  }

  if (upcoming.length === 0) {
    return (
      <section className="rounded-lg border border-hairline bg-canvas p-4 space-y-2">
        <h3 className="text-title-sm text-ink">다가오는 마감</h3>
        <p className="text-caption text-muted-soft">
          {q.data && q.data.atoms.length === 0
            ? '처리된 파일에서 마감 정보가 발견되지 않았습니다.'
            : '예정된 마감이 없습니다.'}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-hairline bg-canvas p-4 space-y-2">
      <h3 className="text-title-sm text-ink flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink" />
        다가오는 마감
      </h3>
      <ul className="space-y-1.5">
        {upcoming.map((a) => {
          const folderLabel = folderNames[a.from_file.folder_id] ?? ''
          return (
            <li
              key={`${a.from_file.processed_file_id}-${a.local_id}`}
              className="text-body-sm text-body flex items-baseline gap-2"
            >
              <span className="text-ink tabular shrink-0">{a.due}</span>
              <span className="text-muted-soft">·</span>
              <span className="truncate flex-1">{a.content}</span>
              {folderLabel ? (
                <span className="text-caption text-muted-soft shrink-0">{folderLabel}</span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function AtomChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-caption px-2.5 py-1 rounded-full border transition-colors tabular ${
        active
          ? 'bg-ink text-canvas border-ink'
          : 'text-muted border-hairline hover:text-ink hover:border-muted hover:bg-surface-soft'
      }`}
    >
      {children}
    </button>
  )
}

