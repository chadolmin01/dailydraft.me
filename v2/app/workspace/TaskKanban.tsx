'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, RotateCcw, Trash2, Calendar, ChevronRight } from 'lucide-react'

/**
 * 업무 칸반 — 3 컬럼 (대기 / 진행 중 / 완료) + 신규 추가 폼.
 * 의도: 매니저가 운영 todo 를 가볍게 트래킹 (자동 추출 X, 본인이 직접 적음).
 * 상태 이동은 컬럼 안 카드의 화살표 버튼 (드래그앤드롭 없이 단순 클릭).
 */

interface Task {
  id: string
  folder_id: string | null
  title: string
  description: string | null
  status: 'backlog' | 'in_progress' | 'done'
  due_at: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  position: number
}

const COLUMNS: Array<{ status: Task['status']; label: string }> = [
  { status: 'backlog', label: '대기' },
  { status: 'in_progress', label: '진행 중' },
  { status: 'done', label: '완료' },
]

const NEXT_STATUS: Record<Task['status'], Task['status'] | null> = {
  backlog: 'in_progress',
  in_progress: 'done',
  done: null,
}

const PREV_STATUS: Record<Task['status'], Task['status'] | null> = {
  backlog: null,
  in_progress: 'backlog',
  done: 'in_progress',
}

export function TaskKanban({
  folders,
}: {
  folders: Array<{ id: string; name: string }>
}) {
  const qc = useQueryClient()
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<{ tasks: Task[] }> => {
      const res = await fetch('/api/tasks')
      if (!res.ok) throw new Error('업무 조회 실패')
      return res.json()
    },
    staleTime: 30_000,
  })

  const createTask = useMutation({
    mutationFn: async (input: { title: string; folder_id: string | null; due_at: string | null }) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('업무 생성 실패')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const patchTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: Task['status']; title?: string; due_at?: string | null }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('업무 수정 실패')
      return res.json()
    },
    // Optimistic — 즉시 상태 반영
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueryData<{ tasks: Task[] }>(['tasks'])
      if (prev) {
        qc.setQueryData<{ tasks: Task[] }>(['tasks'], {
          tasks: prev.tasks.map(t => (t.id === id ? { ...t, ...updates } : t)),
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks'], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueryData<{ tasks: Task[] }>(['tasks'])
      if (prev) {
        qc.setQueryData<{ tasks: Task[] }>(['tasks'], {
          tasks: prev.tasks.filter(t => t.id !== id),
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks'], ctx.prev)
    },
  })

  const tasks = tasksQuery.data?.tasks ?? []
  const byStatus = (s: Task['status']) =>
    tasks.filter(t => t.status === s).sort((a, b) => a.position - b.position)

  const folderName = (id: string | null) =>
    folders.find(f => f.id === id)?.name ?? null

  return (
    <section className="space-y-3">
      <NewTaskForm
        folders={folders}
        onCreate={(input) => createTask.mutate(input)}
        pending={createTask.isPending}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const items = byStatus(col.status)
          return (
            <div
              key={col.status}
              className="rounded-lg border border-hairline bg-canvas flex flex-col min-h-[200px]"
            >
              <header className="px-3 py-2 border-b border-hairline-soft flex items-baseline justify-between">
                <h3 className="text-title-sm text-ink">{col.label}</h3>
                <span className="text-caption text-muted-soft tabular">{items.length}</span>
              </header>
              <ul className="p-2 space-y-2 flex-1">
                {items.length === 0 ? (
                  <li className="text-caption text-muted-soft text-center py-6">비어 있음</li>
                ) : null}
                {items.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    folderName={folderName(task.folder_id)}
                    onAdvance={(status) => patchTask.mutate({ id: task.id, status })}
                    onDelete={() => {
                      if (window.confirm(`"${task.title}" 업무를 삭제합니다.`)) {
                        deleteTask.mutate(task.id)
                      }
                    }}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TaskCard({
  task,
  folderName,
  onAdvance,
  onDelete,
}: {
  task: Task
  folderName: string | null
  onAdvance: (status: Task['status']) => void
  onDelete: () => void
}) {
  const next = NEXT_STATUS[task.status]
  const prev = PREV_STATUS[task.status]
  const isOverdue =
    task.due_at &&
    task.status !== 'done' &&
    task.due_at < new Date().toISOString().slice(0, 10)

  return (
    <li className="group rounded-md border border-hairline bg-surface-soft p-2.5 space-y-1.5 hover:border-muted transition-colors">
      <p className={`text-body-sm ${task.status === 'done' ? 'text-muted line-through' : 'text-ink'}`}>
        {task.title}
      </p>
      <div className="flex items-center gap-2 text-caption text-muted-soft tabular">
        {task.due_at ? (
          <span className={`inline-flex items-center gap-1 ${isOverdue ? 'text-ink' : ''}`}>
            <Calendar size={10} />
            {task.due_at}
            {isOverdue ? ' · 지남' : ''}
          </span>
        ) : null}
        {folderName ? <span className="truncate">· {folderName}</span> : null}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {prev ? (
          <button
            type="button"
            onClick={() => onAdvance(prev)}
            title={`${prev === 'backlog' ? '대기' : '진행 중'} 로 되돌리기`}
            className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-soft hover:text-ink hover:bg-canvas"
          >
            <RotateCcw size={11} />
          </button>
        ) : null}
        {next ? (
          <button
            type="button"
            onClick={() => onAdvance(next)}
            title={`${next === 'in_progress' ? '진행 중' : '완료'} 로 이동`}
            className="h-6 inline-flex items-center justify-center gap-0.5 px-2 rounded text-caption text-ink bg-canvas border border-hairline hover:border-muted"
          >
            {next === 'done' ? <Check size={11} /> : <ChevronRight size={11} />}
            <span>{next === 'in_progress' ? '진행' : '완료'}</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          title="삭제"
          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-soft hover:text-ink hover:bg-canvas ml-auto"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </li>
  )
}

function NewTaskForm({
  folders,
  onCreate,
  pending,
}: {
  folders: Array<{ id: string; name: string }>
  onCreate: (input: { title: string; folder_id: string | null; due_at: string | null }) => void
  pending: boolean
}) {
  const [title, setTitle] = useState('')
  const [folderId, setFolderId] = useState<string>('')
  const [dueAt, setDueAt] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onCreate({
      title: trimmed,
      folder_id: folderId || null,
      due_at: dueAt || null,
    })
    setTitle('')
    setDueAt('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-hairline bg-canvas p-3 flex flex-wrap items-center gap-2"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="새 업무 (예: 3팀과 면담 일정 잡기)"
        maxLength={200}
        className="flex-1 min-w-[200px] h-9 px-3 bg-surface-soft border border-hairline rounded-md text-body-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-ink"
      />
      <select
        value={folderId}
        onChange={(e) => setFolderId(e.target.value)}
        className="h-9 px-3 bg-surface-soft border border-hairline rounded-md text-caption text-ink focus:outline-none focus:border-ink"
      >
        <option value="">폴더 미지정</option>
        {folders.map(f => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      <input
        type="date"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="h-9 px-3 bg-surface-soft border border-hairline rounded-md text-caption text-ink focus:outline-none focus:border-ink"
      />
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="h-9 px-3 rounded-full bg-ink text-canvas text-caption font-medium hover:bg-body-strong transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>추가</span>
      </button>
    </form>
  )
}
