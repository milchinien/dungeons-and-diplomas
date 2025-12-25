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
  experimental: {
    // Exclude better-sqlite3 from webpack bundling (native module, not available on Vercel)
    // This prevents build errors when the module can't be resolved
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}

module.exports = nextConfig
