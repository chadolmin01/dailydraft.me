import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dailydraft.me'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/explore', '/p/*'],
      disallow: ['/admin/', '/api/', '/onboarding/', '/dev/', '/project/build', '/project/ideate'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
