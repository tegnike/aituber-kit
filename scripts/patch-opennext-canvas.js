/**
 * @opennextjs/cloudflare の esbuild 設定にcanvasをexternalとして追加するパッチ。
 * canvasはネイティブ.nodeバイナリを含むため、Cloudflare Workersではバンドルできない。
 * Restricted Modeではcanvasを使用するAPIルートは無効化されるため、問題なし。
 */
const fs = require('fs')
const path = require('path')

const bundleServerPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@opennextjs',
  'cloudflare',
  'dist',
  'cli',
  'build',
  'bundle-server.js'
)

const content = fs.readFileSync(bundleServerPath, 'utf8')

// canvasが既に追加済みかチェック
if (content.includes('"canvas"')) {
  console.log('patch-opennext-canvas: canvas already in external list, skipping.')
  process.exit(0)
}

// external配列に"canvas"を追加
const patched = content.replace(
  'external: [\n            "./middleware/handler.mjs",',
  'external: [\n            "./middleware/handler.mjs",\n            "canvas",'
)

if (patched === content) {
  console.error('patch-opennext-canvas: Could not find the expected external array pattern.')
  console.error('The @opennextjs/cloudflare version may have changed. Please update this patch.')
  process.exit(1)
}

fs.writeFileSync(bundleServerPath, patched)
console.log('patch-opennext-canvas: Added "canvas" to esbuild external list.')
