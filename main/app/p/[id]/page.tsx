import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ProjectDetailClient } from './client'

interface Props {
  params: Promise<{ id: string }>
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('title, description, interest_tags, type')
      .eq('id', id)
      .single()

    if (!opportunity) {
      return {
        title: '프로젝트를 찾을 수 없습니다 | Draft',
      }
    }

    const title = `${opportunity.title} | Draft`
    const description = opportunity.description?.slice(0, 160) || '대학생 프로젝트 공유 플랫폼 Draft'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

    return {
      title,
      description,
      openGraph: {
        title: opportunity.title,
        description,
        type: 'website',
        url: `${appUrl}/p/${id}`,
        images: [
          {
            url: `${appUrl}/api/og/project/${id}`,
            width: 1200,
            height: 630,
            alt: opportunity.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: opportunity.title,
        description,
        images: [`${appUrl}/api/og/project/${id}`],
      },
    }
  } catch {
    return {
      title: 'Draft',
      description: '대학생 프로젝트 공유 플랫폼',
    }
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  return <ProjectDetailClient id={id} />
}
