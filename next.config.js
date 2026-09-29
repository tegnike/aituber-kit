/** @type {import('next').NextConfig} */
const isRestrictedMode = process.env.NEXT_PUBLIC_RESTRICTED_MODE === 'true'

const nextConfig = {
  reactStrictMode: true,
  // 本番コードの型検査を維持し、Jest専用コードは個別の検証対象にする。
  typescript: { tsconfigPath: 'tsconfig.build.json' },
  assetPrefix: process.env.BASE_PATH || '',
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
  ...(!isRestrictedMode && {
    outputFileTracingRoot: __dirname,
  }),
  // Cloudflare Workers向け
  ...(isRestrictedMode && {
    serverExternalPackages: ['openai', 'xxhash-wasm'],
    // Cloudflare Workers向け: 不要ファイルをファイルトレースから除外
    outputFileTracingExcludes: {
      '*': [
        './node_modules/canvas/**/*',
        './public/**/*',
        './scripts/**/*',
        './logs/**/*',
        './reports/**/*',
        './coverage/**/*',
      ],
    },
    outputFileTracingIncludes: {
      '*': [
        './node_modules/@posthog/core/dist/logs/**/*',
        './node_modules/unist-util-visit-parents/lib/color*.js',
        './node_modules/vfile/lib/min*.js',
      ],
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
