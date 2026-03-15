'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'

export type CoffeeChatOutcome = 'team_formed' | 'pending' | 'no_match'

export interface CoffeeChat {
  id: string
  opportunity_id: string
  requester_email: string
  requester_user_id: string | null
  requester_name: string | null
  owner_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  contact_info: string | null
  message: string | null
  outcome: CoffeeChatOutcome | null
  created_at: string
  updated_at: string
}

export const coffeeChatKeys = {
  all: ['coffee_chats'] as const,
  owner: () => [...coffeeChatKeys.all, 'owner'] as const,
  requester: () => [...coffeeChatKeys.all, 'requester'] as const,
  byOpportunity: (id: string) => [...coffeeChatKeys.all, 'opportunity', id] as const,
}

interface UseCoffeeChatsOptions {
  opportunityId?: string
  asOwner?: boolean
  enabled?: boolean
}

// ── Query: fetch coffee chats ──
export function useCoffeeChats(options: UseCoffeeChatsOptions = {}) {
  const { opportunityId, asOwner = false, enabled = true } = options

  return useQuery({
    queryKey: opportunityId
      ? coffeeChatKeys.byOpportunity(opportunityId)
      : asOwner
        ? coffeeChatKeys.owner()
        : coffeeChatKeys.requester(),
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return []

      let query = supabase.from('coffee_chats').select('*')

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId)
      }

      if (asOwner) {
        query = query.eq('owner_user_id', userData.user.id)
      } else {
        query = query.eq('requester_user_id', userData.user.id)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      return (data as CoffeeChat[]) || []
    },
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

// ── Mutation: request a coffee chat ──
export function useRequestCoffeeChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      opportunityId: string
      email: string
      name: string
      message?: string
    }) => {
      const { data: userData } = await supabase.auth.getUser()

      // Duplicate check
      if (userData?.user) {
        const { data: existing } = await supabase
          .from('coffee_chats')
          .select('id')
          .eq('opportunity_id', data.opportunityId)
          .eq('requester_user_id', userData.user.id)
          .eq('status', 'pending')
          .maybeSingle()

        if (existing) {
          throw new Error('이미 커피챗을 신청한 프로젝트입니다')
        }
      }

      const { data: result, error } = await supabase.rpc('request_coffee_chat', {
        p_opportunity_id: data.opportunityId,
        p_requester_email: data.email,
        p_requester_name: data.name,
        p_message: data.message || null,
        p_requester_user_id: userData?.user?.id || null,
      })

      if (error) throw error
      return result as string
    },
    onSuccess: (chatId) => {
      if (chatId) {
        fetch('/api/coffee-chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'request', chatId }),
        }).catch((err) => console.warn('[CoffeeChat] notify email failed:', err))
      }
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}

// ── Mutation: accept a coffee chat ──
export function useAcceptCoffeeChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, contactInfo }: { chatId: string; contactInfo: string }) => {
      const { data, error } = await supabase.rpc('accept_coffee_chat', {
        p_chat_id: chatId,
        p_contact_info: contactInfo,
      })

      if (error) throw error
      if (!data) throw new Error('수락에 실패했습니다')
      return data as boolean
    },
    onSuccess: (_, variables) => {
      fetch('/api/coffee-chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'accepted', chatId: variables.chatId }),
      }).catch((err) => console.warn('[CoffeeChat] notify email failed:', err))
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}

// ── Mutation: update coffee chat outcome ──
export function useUpdateChatOutcome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, outcome }: { chatId: string; outcome: CoffeeChatOutcome }) => {
      const { error } = await supabase
        .from('coffee_chats')
        .update({ outcome })
        .eq('id', chatId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}

// ── Mutation: decline a coffee chat ──
export function useDeclineCoffeeChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chatId: string) => {
      const { data, error } = await supabase.rpc('decline_coffee_chat', {
        p_chat_id: chatId,
      })

      if (error) throw error
      if (!data) throw new Error('거절에 실패했습니다')
      return data as boolean
    },
    onSuccess: (_, chatId) => {
      fetch('/api/coffee-chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'declined', chatId }),
      }).catch((err) => console.warn('[CoffeeChat] notify email failed:', err))
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}
