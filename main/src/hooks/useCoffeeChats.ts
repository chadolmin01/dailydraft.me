'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import type { Database } from '@/src/types/database'

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
  created_at: string
  updated_at: string
}

interface UseCoffeeChatsOptions {
  opportunityId?: string
  asOwner?: boolean // If true, fetch chats where user is the owner
}

interface UseCoffeeChatsReturn {
  chats: CoffeeChat[]
  loading: boolean
  error: string | null
  requestChat: (data: {
    opportunityId: string
    email: string
    name: string
    message?: string
  }) => Promise<string | null>
  acceptChat: (chatId: string, contactInfo: string) => Promise<boolean>
  declineChat: (chatId: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useCoffeeChats(options: UseCoffeeChatsOptions = {}): UseCoffeeChatsReturn {
  const { opportunityId, asOwner = false } = options
  const [chats, setChats] = useState<CoffeeChat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        setChats([])
        return
      }

      let query = supabase.from('coffee_chats').select('*')

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId)
      }

      if (asOwner) {
        query = query.eq('owner_user_id', userData.user.id)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setChats((data as CoffeeChat[]) || [])
    } catch (err) {
      console.error('Failed to fetch coffee chats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch coffee chats')
    } finally {
      setLoading(false)
    }
  }, [opportunityId, asOwner, supabase])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const requestChat = async (data: {
    opportunityId: string
    email: string
    name: string
    message?: string
  }): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      const { data: result, error: rpcError } = await supabase.rpc('request_coffee_chat', {
        p_opportunity_id: data.opportunityId,
        p_requester_email: data.email,
        p_requester_name: data.name,
        p_message: data.message || null,
        p_requester_user_id: userData?.user?.id || null,
      })

      if (rpcError) throw rpcError

      await fetchChats()

      // Fire-and-forget email notification
      if (result) {
        fetch('/api/coffee-chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'request', chatId: result }),
        }).catch(() => {})
      }

      return result as string
    } catch (err) {
      console.error('Failed to request coffee chat:', err)
      setError(err instanceof Error ? err.message : 'Failed to request coffee chat')
      return null
    }
  }

  const acceptChat = async (chatId: string, contactInfo: string): Promise<boolean> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('accept_coffee_chat', {
        p_chat_id: chatId,
        p_contact_info: contactInfo,
      })

      if (rpcError) throw rpcError

      if (data) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId ? { ...c, status: 'accepted', contact_info: contactInfo } : c
          )
        )
        // Fire-and-forget email notification
        fetch('/api/coffee-chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'accepted', chatId }),
        }).catch(() => {})
      }

      return data as boolean
    } catch (err) {
      console.error('Failed to accept coffee chat:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept')
      return false
    }
  }

  const declineChat = async (chatId: string): Promise<boolean> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('decline_coffee_chat', {
        p_chat_id: chatId,
      })

      if (rpcError) throw rpcError

      if (data) {
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, status: 'declined' } : c))
        )
        // Fire-and-forget email notification
        fetch('/api/coffee-chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'declined', chatId }),
        }).catch(() => {})
      }

      return data as boolean
    } catch (err) {
      console.error('Failed to decline coffee chat:', err)
      setError(err instanceof Error ? err.message : 'Failed to decline')
      return false
    }
  }

  return {
    chats,
    loading,
    error,
    requestChat,
    acceptChat,
    declineChat,
    refetch: fetchChats,
  }
}
