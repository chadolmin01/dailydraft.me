'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/src/lib/supabase/client'

export interface Comment {
  id: string
  opportunity_id: string
  nickname: string
  school: string | null
  content: string
  helpful_count: number
  user_id: string | null
  is_hidden: boolean
  report_count: number
  created_at: string
}

interface UseCommentsOptions {
  opportunityId: string
}

interface UseCommentsReturn {
  comments: Comment[]
  loading: boolean
  error: string | null
  addComment: (data: { nickname: string; school?: string; content: string }) => Promise<boolean>
  voteHelpful: (commentId: string, voterIdentifier: string) => Promise<boolean>
  reportComment: (commentId: string, reporterIdentifier: string, reason?: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useComments({ opportunityId }: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('is_hidden', false)
        .order('helpful_count', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setComments((data as Comment[]) || [])
    } catch (err) {
      console.error('Failed to fetch comments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }, [opportunityId])

  useEffect(() => {
    if (opportunityId) {
      fetchComments()
    }
  }, [opportunityId, fetchComments])

  const addComment = async (data: { nickname: string; school?: string; content: string }): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      const { error: insertError } = await supabase.from('comments').insert({
        opportunity_id: opportunityId,
        nickname: data.nickname,
        school: data.school || null,
        content: data.content,
        user_id: userData?.user?.id || null,
      })

      if (insertError) throw insertError

      await fetchComments()
      return true
    } catch (err) {
      console.error('Failed to add comment:', err)
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      return false
    }
  }

  const voteHelpful = async (commentId: string, voterIdentifier: string): Promise<boolean> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('vote_helpful', {
        p_comment_id: commentId,
        p_voter_identifier: voterIdentifier,
      })

      if (rpcError) throw rpcError

      if (data) {
        // Optimistically update the UI
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, helpful_count: c.helpful_count + 1 } : c
          )
        )
      }

      return data as boolean
    } catch (err) {
      console.error('Failed to vote helpful:', err)
      setError(err instanceof Error ? err.message : 'Failed to vote')
      return false
    }
  }

  const reportComment = async (
    commentId: string,
    reporterIdentifier: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('report_comment', {
        p_comment_id: commentId,
        p_reporter_identifier: reporterIdentifier,
        p_reason: reason || null,
      })

      if (rpcError) throw rpcError

      // Refetch to handle auto-hide
      await fetchComments()

      return data as boolean
    } catch (err) {
      console.error('Failed to report comment:', err)
      setError(err instanceof Error ? err.message : 'Failed to report')
      return false
    }
  }

  return {
    comments,
    loading,
    error,
    addComment,
    voteHelpful,
    reportComment,
    refetch: fetchComments,
  }
}
