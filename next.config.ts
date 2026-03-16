import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Disable image optimization for external images if needed
  images: {
    unoptimized: true,
  },

  // Skip type checking during build — checked during dev
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
