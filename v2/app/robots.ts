import type { MetadataRoute } from 'next'

// robots.txt — 공개 페이지만 인덱싱 허용. 워크스페이스/API 는 차단.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/help', '/privacy', '/terms'],
      disallow: ['/workspace', '/api/'],
    },
    sitemap: 'https://dailydraft.me/sitemap.xml',
  }
}
