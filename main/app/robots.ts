import type { MetadataRoute } from 'next'
import { APP_URL } from '@/src/constants'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/onboarding/', '/dev/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
