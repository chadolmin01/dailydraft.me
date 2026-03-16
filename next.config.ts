import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Disable image optimization for external images if needed
  images: {
    unoptimized: true,
  },
}

export default nextConfig
