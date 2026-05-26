import type { NextConfig } from 'next'

// v3 = 로컬 SQLite + Next 15. v2 의 Supabase / Sentry / pdf-parse 의존 X (단순화).
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @libsql/client 는 prebuilt — 번들 OK 이지만 server-only.
  serverExternalPackages: ['@libsql/client'],
  experimental: {
    optimizePackageImports: ['recharts'],
  },
}

export default nextConfig
