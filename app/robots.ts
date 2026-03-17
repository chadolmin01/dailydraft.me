import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/dev/', '/profile/', '/projects/'],
    },
    sitemap: 'https://dailydraft.me/sitemap.xml',
  }
}
