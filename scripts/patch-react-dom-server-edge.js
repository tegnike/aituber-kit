/**
 * React 18にはreact-dom/server.edgeが存在しないため、
 * server.browserを再エクスポートするシムファイルを作成するパッチ。
 *
 * @opennextjs/cloudflare はreact-dom/server.edgeをオプショナル依存として扱い、
 * 見つからない場合はthrowに置き換えるが、Next.js 15.5のSSRコードが
 * 実際にこのモジュールをimportするため、初回リクエストで500エラーになる。
 *
 * このパッチは以下の2つを行う:
 * 1. react-dom/server.edge.js シムファイルを作成（server.browserを再エクスポート）
 * 2. react-dom/package.json の exports に ./server.edge を追加
 *    （esbuildがexportsマップを参照するため、ファイルだけでは不十分）
 */
const fs = require('fs')
const path = require('path')

const reactDomDir = path.join(__dirname, '..', 'node_modules', 'react-dom')
const serverEdgePath = path.join(reactDomDir, 'server.edge.js')
const packageJsonPath = path.join(reactDomDir, 'package.json')

// 1. シムファイルを作成
if (!fs.existsSync(serverEdgePath)) {
  fs.writeFileSync(
    serverEdgePath,
    "'use strict';\nmodule.exports = require('./server.browser');\n"
  )
  console.log(
    'patch-react-dom-server-edge: Created react-dom/server.edge.js shim.'
  )
} else {
  console.log(
    'patch-react-dom-server-edge: server.edge.js already exists, skipping file creation.'
  )
}

// 2. package.json の exports に ./server.edge を追加
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
if (packageJson.exports && !packageJson.exports['./server.edge']) {
  packageJson.exports['./server.edge'] = './server.edge.js'
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
  console.log(
    'patch-react-dom-server-edge: Added ./server.edge to react-dom exports map.'
  )
} else {
  console.log(
    'patch-react-dom-server-edge: exports already includes ./server.edge, skipping.'
  )
}
