/**
 * React 18にはreact-dom/server.edgeが存在しないため、
 * server.browserを再エクスポートするシムファイルを作成するパッチ。
 *
 * @opennextjs/cloudflare はreact-dom/server.edgeをオプショナル依存として扱い、
 * 見つからない場合はthrowに置き換えるが、Next.js 15.5のSSRコードが
 * 実際にこのモジュールをimportするため、初回リクエストで500エラーになる。
 *
 * このパッチはreact-dom/server.edge.jsを作成し、server.browserを
 * 再エクスポートすることで問題を回避する。
 */
const fs = require('fs')
const path = require('path')

const serverEdgePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-dom',
  'server.edge.js'
)

if (fs.existsSync(serverEdgePath)) {
  console.log(
    'patch-react-dom-server-edge: server.edge.js already exists, skipping.'
  )
  process.exit(0)
}

fs.writeFileSync(
  serverEdgePath,
  "'use strict';\nmodule.exports = require('./server.browser');\n"
)
console.log(
  'patch-react-dom-server-edge: Created react-dom/server.edge.js shim.'
)
