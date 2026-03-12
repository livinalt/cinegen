/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED || 'false',
  },

  // Proxy /scope-api/* → Daydream Scope at localhost:8000
  // This avoids CORS issues when calling Scope's REST endpoints from the browser.
  // WebRTC signalling (offer/ICE) goes through here.
  // The actual WebRTC video stream is peer-to-peer — it bypasses this proxy entirely.
  async rewrites() {
    const SCOPE_URL = process.env.SCOPE_URL || 'http://localhost:8000'
    return [
      {
        source: '/scope-api/:path*',
        destination: `${SCOPE_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
