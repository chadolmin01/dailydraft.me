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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.list(opportunityId) })
      const previous = queryClient.getQueryData<Comment[]>(commentKeys.list(opportunityId))
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        opportunity_id: opportunityId,
        nickname: data.nickname,
        school: data.school || null,
        content: data.content,
        helpful_count: 0,
        user_id: null,
        is_hidden: false,
        report_count: 0,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<Comment[]>(commentKeys.list(opportunityId), (old) =>
        [optimistic, ...(old ?? [])]
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentKeys.list(opportunityId), context.previous)
      }
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

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      if (deleteError) throw deleteError
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.list(opportunityId) })
      const previous = queryClient.getQueryData<Comment[]>(commentKeys.list(opportunityId))
      queryClient.setQueryData<Comment[]>(commentKeys.list(opportunityId), (old) =>
        (old ?? []).filter(c => c.id !== commentId)
      )
      return { previous }
    },
    onError: (_err, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentKeys.list(opportunityId), context.previous)
      }
    },
  })

  // 기존 인터페이스 호환 래퍼
  const addComment = useCallback(async (data: { nickname: string; school?: string; content: string }) => {
    try {
      await addCommentMutation.mutateAsync(data)
      return true
    } catch (err) {
      console.error('[useComments] addComment failed:', err)
      return false
    }
  }, [addCommentMutation])

  const voteHelpful = useCallback(async (commentId: string, voterIdentifier: string) => {
    try {
      return await voteHelpfulMutation.mutateAsync({ commentId, voterIdentifier })
    } catch (err) {
      console.error('[useComments] voteHelpful failed:', err)
      return false
    }
  }, [voteHelpfulMutation])

  const reportComment = useCallback(async (commentId: string, reporterIdentifier: string, reason?: string) => {
    try {
      return await reportCommentMutation.mutateAsync({ commentId, reporterIdentifier, reason })
    } catch (err) {
      console.error('[useComments] reportComment failed:', err)
      return false
    }
  }, [reportCommentMutation])

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync(commentId)
      return true
    } catch (err) {
      console.error('[useComments] deleteComment failed:', err)
      return false
    }
  }, [deleteCommentMutation])

  return {
    comments,
    loading,
    error: error?.message ?? null,
    addComment,
    voteHelpful,
    reportComment,
    deleteComment,
    refetch: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(opportunityId) }),
  }
}
