/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },

  env: {
    NEXT_PUBLIC_PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED || 'false',
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            // Automatically upgrades all http:// requests to https://
            // This fixes the SDK's internal DELETE calls using http:// on Vercel
            key: 'Content-Security-Policy',
            value: 'upgrade-insecure-requests',
          },
        ],
      },
    ]
  },

  // ── NEW: Proxy all /scope-api calls to the actual Daydream Scope server port ──
  async rewrites() {
    return [
      {
        source: '/scope-api/:path*',
        destination: 'http://localhost:52178/:path*',  // ← Change 52178 to match your current Scope port
      },
    ]
  },
}

module.exports = nextConfig