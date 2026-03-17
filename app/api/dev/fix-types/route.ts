// @ts-nocheck — dev-only route, blocked by middleware in production
import { createAdminClient } from '@/src/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, type, status')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: data?.length, opportunities: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
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

    return NextResponse.json({ error: 'Provide batch or create array' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
