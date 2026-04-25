import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { detectAssetType } from '@/src/lib/assets/url-parser'

// ============================================
// Local row types — Supabase types regen 전 임시 정의
// (permissions/route.ts 와 동일 패턴)
// ============================================
type ClubAssetRow = {
  id: string
  club_id: string
  asset_type: string
  name: string
  url: string
  owner_user_id: string | null
  owner_display_name: string | null
  owner_role_label: string | null
  credential_location: string | null
  notes: string | null
  needs_handover: boolean
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

type ClubRow = { id: string }

// ============================================
// Wire format
// ============================================
export type AssetResponse = {
  id: string
  asset_type: string
  name: string
  url: string
  owner: {
    user_id: string | null
    display_name: string | null
    role_label: string | null
    avatar_url: string | null
  }
  credential_location: string | null
  notes: string | null
  needs_handover: boolean
  display_order: number
  updated_at: string
}

const PostBodySchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().min(1).max(2000),
  asset_type: z.string().optional(),
  owner_user_id: z.string().uuid().nullable().optional(),
  owner_display_name: z.string().max(80).nullable().optional(),
  owner_role_label: z.string().max(80).nullable().optional(),
  credential_location: z.string().max(300).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

// ============================================
// 클럽 admin 게이트 — 운영진만 CRUD
// ============================================
async function getClubAndCheckAdmin(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: ApiResponse.unauthorized() }

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle<ClubRow>()

  if (!club) return { ok: false as const, response: ApiResponse.notFound('클럽을 찾을 수 없습니다') }

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (!membership) return { ok: false as const, response: ApiResponse.forbidden('운영진만 접근할 수 있습니다') }

  return { ok: true as const, supabase, user, club }
}

// ============================================
// GET — 클럽 자산 목록
// ============================================
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  const guard = await getClubAndCheckAdmin(slug)
  if (!guard.ok) return guard.response
  const { supabase, club } = guard

  const { data: assets, error: fetchError } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('club_assets' as any)
    .select('*')
    .eq('club_id', club.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<ClubAssetRow[]>()

  if (fetchError) return ApiResponse.internalError('자산 목록 조회 실패', { detail: fetchError.message })

  // owner profile 조회 — 자산 카드에 아바타 표시용
  const ownerIds = Array.from(new Set((assets ?? []).map(a => a.owner_user_id).filter(Boolean) as string[]))
  const ownersById = new Map<string, { display_name: string | null; avatar_url: string | null }>()
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .in('user_id', ownerIds)
      .returns<{ user_id: string; nickname: string | null; avatar_url: string | null }[]>()
    profiles?.forEach(p => {
      ownersById.set(p.user_id, { display_name: p.nickname, avatar_url: p.avatar_url })
    })
  }

  const items: AssetResponse[] = (assets ?? []).map(a => {
    const ownerProfile = a.owner_user_id ? ownersById.get(a.owner_user_id) : undefined
    return {
      id: a.id,
      asset_type: a.asset_type,
      name: a.name,
      url: a.url,
      owner: {
        user_id: a.owner_user_id,
        display_name: a.owner_display_name ?? ownerProfile?.display_name ?? null,
        role_label: a.owner_role_label,
        avatar_url: ownerProfile?.avatar_url ?? null,
      },
      credential_location: a.credential_location,
      notes: a.notes,
      needs_handover: a.needs_handover,
      display_order: a.display_order,
      updated_at: a.updated_at,
    }
  })

  return ApiResponse.ok({ items })
}

// ============================================
// POST — 자산 추가
// ============================================
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  const guard = await getClubAndCheckAdmin(slug)
  if (!guard.ok) return guard.response
  const { supabase, user, club } = guard

  const json = await req.json().catch(() => null)
  const parsed = PostBodySchema.safeParse(json)
  if (!parsed.success) {
    return ApiResponse.validationError('잘못된 요청 형식입니다', parsed.error.flatten())
  }

  // asset_type 미지정 시 URL 패턴으로 자동 추론
  const assetType = parsed.data.asset_type ?? detectAssetType(parsed.data.url)

  const { data: inserted, error: insertError } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('club_assets' as any)
    .insert({
      club_id: club.id,
      asset_type: assetType,
      name: parsed.data.name,
      url: parsed.data.url,
      owner_user_id: parsed.data.owner_user_id ?? user.id,
      owner_display_name: parsed.data.owner_display_name ?? null,
      owner_role_label: parsed.data.owner_role_label ?? null,
      credential_location: parsed.data.credential_location ?? null,
      notes: parsed.data.notes ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError) {
    return ApiResponse.internalError('자산 추가 실패', { detail: insertError.message })
  }

  const insertedRow = inserted as unknown as { id: string } | null
  return ApiResponse.created({ id: insertedRow!.id })
}
