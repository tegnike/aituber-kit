/** @type {import('next').NextConfig} */
const isRestrictedMode = process.env.NEXT_PUBLIC_RESTRICTED_MODE === 'true'

const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.BASE_PATH || '',
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
  ...(!isRestrictedMode && {
    outputFileTracingRoot: __dirname,
  }),
  // Cloudflare Workers向け
  ...(isRestrictedMode && {
    serverExternalPackages: ['openai', 'xxhash-wasm'],
    // canvasネイティブモジュールをファイルトレースから除外
    outputFileTracingExcludes: {
      '*': ['./node_modules/canvas/**/*'],
    },
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || '',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
      }
    }
    // Cloudflare Workers向け: ネイティブモジュールを空モジュールに置換
    if (isServer && isRestrictedMode) {
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        canvas: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
