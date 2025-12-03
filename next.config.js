/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds to avoid configuration issues
    // ESLint can still be run manually with `npm run lint`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking during builds
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
