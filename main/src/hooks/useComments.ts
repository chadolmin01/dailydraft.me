'use client'

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export const commentKeys = {
  all: ['comments'] as const,
  list: (opportunityId: string) => [...commentKeys.all, opportunityId] as const,
}

interface UseCommentsOptions {
  opportunityId: string
  enabled?: boolean
}

export function useComments({ opportunityId, enabled = true }: UseCommentsOptions) {
  const queryClient = useQueryClient()

  const { data: comments = [], isLoading: loading, error } = useQuery({
    queryKey: commentKeys.list(opportunityId),
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('is_hidden', false)
        .order('helpful_count', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return (data as Comment[]) || []
    },
    enabled: !!opportunityId && enabled,
    staleTime: 1000 * 60 * 2,
  })

  const addCommentMutation = useMutation({
    mutationFn: async (data: { nickname: string; school?: string; content: string }) => {
      const { data: userData } = await supabase.auth.getUser()

      const { error: insertError } = await supabase.from('comments').insert({
        opportunity_id: opportunityId,
        nickname: data.nickname,
        school: data.school || null,
        content: data.content,
        user_id: userData?.user?.id || null,
      })

      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(opportunityId) })
    },
  })

  const voteHelpfulMutation = useMutation({
    mutationFn: async ({ commentId, voterIdentifier }: { commentId: string; voterIdentifier: string }) => {
      const { data, error: rpcError } = await supabase.rpc('vote_helpful', {
        p_comment_id: commentId,
        p_voter_identifier: voterIdentifier,
      })
      if (rpcError) throw rpcError
      return data as boolean
    },
    onSuccess: (voted, { commentId }) => {
      if (voted) {
        // Optimistic update
        queryClient.setQueryData<Comment[]>(commentKeys.list(opportunityId), (old) =>
          old?.map(c => c.id === commentId ? { ...c, helpful_count: c.helpful_count + 1 } : c)
        )
      }
    },
  })

  const reportCommentMutation = useMutation({
    mutationFn: async ({ commentId, reporterIdentifier, reason }: { commentId: string; reporterIdentifier: string; reason?: string }) => {
      const { data, error: rpcError } = await supabase.rpc('report_comment', {
        p_comment_id: commentId,
        p_reporter_identifier: reporterIdentifier,
        p_reason: reason || undefined,
      })
      if (rpcError) throw rpcError
      return data as boolean
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(opportunityId) })
    },
  })

  // 기존 인터페이스 호환 래퍼
  const addComment = useCallback(async (data: { nickname: string; school?: string; content: string }) => {
    try {
      await addCommentMutation.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }, [addCommentMutation])

  const voteHelpful = useCallback(async (commentId: string, voterIdentifier: string) => {
    try {
      return await voteHelpfulMutation.mutateAsync({ commentId, voterIdentifier })
    } catch {
      return false
    }
  }, [voteHelpfulMutation])

  const reportComment = useCallback(async (commentId: string, reporterIdentifier: string, reason?: string) => {
    try {
      return await reportCommentMutation.mutateAsync({ commentId, reporterIdentifier, reason })
    } catch {
      return false
    }
  }, [reportCommentMutation])

  return {
    comments,
    loading,
    error: error?.message ?? null,
    addComment,
    voteHelpful,
    reportComment,
    refetch: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(opportunityId) }),
  }
}
