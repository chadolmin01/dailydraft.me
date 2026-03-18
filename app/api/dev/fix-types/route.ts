// @ts-nocheck — dev-only route, blocked by middleware in production
import { createAdminClient } from '@/src/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return ApiResponse.forbidden('Not available in production')
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, type, status')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('dev/fix-types GET error:', error.message)
      return ApiResponse.internalError()
    }

    return NextResponse.json({ count: data?.length, opportunities: data })
  } catch (err) {
    console.error('dev/fix-types GET error:', err)
    return ApiResponse.internalError()
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return ApiResponse.forbidden('Not available in production')
  }

  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // 배치 업데이트: [{ id, type?, demo_images?, ... }] 배열
    if (body.batch && Array.isArray(body.batch)) {
      const results = []
      for (const item of body.batch) {
        const { id, ...updates } = item
        const { data, error } = await supabase
          .from('opportunities')
          .update(updates)
          .eq('id', id)
          .select('id, title, type, demo_images')
          .single()

        if (error) {
          results.push({ id: item.id, error: error.message })
        } else {
          results.push(data)
        }
      }
      return NextResponse.json({ updated: results })
    }

    // 새 프로젝트 생성
    if (body.create && Array.isArray(body.create)) {
      const results = []
      for (const item of body.create) {
        const { data, error } = await supabase
          .from('opportunities')
          .insert(item)
          .select('id, title, type')
          .single()

        if (error) {
          results.push({ title: item.title, error: error.message })
        } else {
          results.push(data)
        }
      }
      return NextResponse.json({ created: results })
    }

    return ApiResponse.badRequest('Provide batch or create array')
  } catch (err) {
    console.error('dev/fix-types POST error:', err)
    return ApiResponse.internalError()
  }
}
