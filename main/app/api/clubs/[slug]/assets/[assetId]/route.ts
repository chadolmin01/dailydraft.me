import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { detectAssetType } from '@/src/lib/assets/url-parser'

type ClubRow = { id: string }

const PatchBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().min(1).max(2000).optional(),
  asset_type: z.string().optional(),
  owner_user_id: z.string().uuid().nullable().optional(),
  owner_display_name: z.string().max(80).nullable().optional(),
  owner_role_label: z.string().max(80).nullable().optional(),
  credential_location: z.string().max(300).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  needs_handover: z.boolean().optional(),
  display_order: z.number().int().optional(),
})

async function gate(slug: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: ApiResponse.unauthorized() }

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle<ClubRow>()
  if (!club) return { ok: false as const, response: ApiResponse.notFound() }

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()
  if (!membership) return { ok: false as const, response: ApiResponse.forbidden() }

  return { ok: true as const, supabase, club }
}

// ============================================
// PATCH — 자산 수정
// ============================================
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string; assetId: string }> },
) {
  const { slug, assetId } = await ctx.params
  const guard = await gate(slug)
  if (!guard.ok) return guard.response
  const { supabase, club } = guard

  const json = await req.json().catch(() => null)
  const parsed = PatchBodySchema.safeParse(json)
  if (!parsed.success) {
    return ApiResponse.validationError('잘못된 요청 형식입니다', parsed.error.flatten())
  }

  // URL 변경 시 asset_type 도 미지정이면 재인식
  const updates: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.url && !parsed.data.asset_type) {
    updates.asset_type = detectAssetType(parsed.data.url)
  }

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('club_assets' as any)
    .update(updates)
    .eq('id', assetId)
    .eq('club_id', club.id)

  if (error) return ApiResponse.internalError('자산 수정 실패', { detail: error.message })
  return ApiResponse.noContent()
}

// ============================================
// DELETE — 자산 삭제
// ============================================
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string; assetId: string }> },
) {
  const { slug, assetId } = await ctx.params
  const guard = await gate(slug)
  if (!guard.ok) return guard.response
  const { supabase, club } = guard

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('club_assets' as any)
    .delete()
    .eq('id', assetId)
    .eq('club_id', club.id)

  if (error) return ApiResponse.internalError('자산 삭제 실패', { detail: error.message })
  return ApiResponse.noContent()
}
