import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 동적 페이지: /p/[id] — 공개 opportunities
  let dynamicPages: MetadataRoute.Sitemap = []

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('id, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(500)

      if (opportunities) {
        dynamicPages = opportunities.map((opp) => ({
          url: `${baseUrl}/p/${opp.id}`,
          lastModified: opp.updated_at ? new Date(opp.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
      }
    }
  } catch (error) {
    console.error('Sitemap: Failed to fetch opportunities:', error)
  }

  return [...staticPages, ...dynamicPages]
}
