import type { MetadataRoute } from 'next'
import { APP_URL } from '@/src/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = APP_URL

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    // 인증 필요 페이지는 제외 (explore, profile, projects 등)
  ]
}
