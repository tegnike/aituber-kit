#!/usr/bin/env node
/**
 * scripts.json のページ番号シフトツール
 *
 * 使い方:
 *   node shift-pages.js <開始ページ> [シフト量]
 *
 * 例:
 *   node shift-pages.js 44      # page 44以降を +1
 *   node shift-pages.js 44 3    # page 44以降を +3
 *   node shift-pages.js 44 -1   # page 44以降を -1 (削除時)
 */

const fs = require('fs')
const path = require('path')

const scriptsPath = path.join(__dirname, 'scripts.json')

function shiftPages(startPage, shiftAmount = 1) {
  // scripts.json を読み込み
  const scripts = JSON.parse(fs.readFileSync(scriptsPath, 'utf8'))

  let shiftedCount = 0

  // 指定ページ以降のページ番号をシフト
  scripts.forEach((entry) => {
    if (entry.page >= startPage) {
      entry.page += shiftAmount
      shiftedCount++
    }
  })

  // ページ番号でソート
  scripts.sort((a, b) => a.page - b.page)

  // 書き込み
  fs.writeFileSync(scriptsPath, JSON.stringify(scripts, null, 2) + '\n', 'utf8')

  console.log(
    `✅ page ${startPage} 以降を ${shiftAmount > 0 ? '+' : ''}${shiftAmount} シフトしました`
  )
  console.log(`   ${shiftedCount} 件のエントリを更新`)
  console.log(
    `   総ページ数: ${scripts.length} (0-${scripts[scripts.length - 1].page})`
  )
}

// コマンドライン引数の処理
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('使い方: node shift-pages.js <開始ページ> [シフト量]')
  console.log('')
  console.log('例:')
  console.log('  node shift-pages.js 44      # page 44以降を +1')
  console.log('  node shift-pages.js 44 3    # page 44以降を +3')
  console.log('  node shift-pages.js 44 -1   # page 44以降を -1')
  process.exit(1)
}

const startPage = parseInt(args[0], 10)
const shiftAmount = args[1] ? parseInt(args[1], 10) : 1

if (isNaN(startPage)) {
  console.error('❌ エラー: 開始ページは数値で指定してください')
  process.exit(1)
}

if (isNaN(shiftAmount)) {
  console.error('❌ エラー: シフト量は数値で指定してください')
  process.exit(1)
}

shiftPages(startPage, shiftAmount)
