'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FragmentList } from '@/components/fragments'
import { Archive, ChevronLeft } from 'lucide-react'
import type { Fragment } from '@/types/database'

type StatusFilter = 'active' | 'archived'

export default function InboxPage() {
  const router = useRouter()
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  const fetchFragments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/fragments?status=${statusFilter}`)
      if (response.ok) {
        const data = await response.json()
        setFragments(data.fragments)
      }
    } catch (error) {
      console.error('Failed to fetch fragments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchFragments()
  }, [fetchFragments])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/fragments/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setFragments((prev) => prev.filter((f) => f.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete fragment:', error)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/fragments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      if (response.ok) {
        setFragments((prev) => prev.filter((f) => f.id !== id))
      }
    } catch (error) {
      console.error('Failed to archive fragment:', error)
    }
  }

  return (
    <div className="min-h-screen pb-8 safe-area-top bg-black">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-800"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">인박스</h1>
          </div>
          <span className="text-sm text-zinc-500">{fragments.length}장</span>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            최근
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'archived'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <Archive className="w-4 h-4" />
            보관됨
          </button>
        </div>
      </header>

      {/* Fragment list */}
      <FragmentList
        fragments={fragments}
        isLoading={isLoading}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />
    </div>
  )
}
