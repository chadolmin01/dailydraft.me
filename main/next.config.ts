import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization with allowed remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prxqjiuibfrmuwwmkhqb.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Type checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig
