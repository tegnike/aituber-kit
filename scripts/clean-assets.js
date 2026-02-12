/**
 * Cloudflareデプロイ前に.open-next/assets/から問題のあるファイルを削除するスクリプト。
 *
 * 削除対象:
 * - .gitignoreでpublic/配下から除外されているファイル
 * - 25MBを超えるファイル（Cloudflare Workersのアセットサイズ制限）
 * - 非ASCIIファイル名（wranglerのマニフェストエンコードエラー回避）
 *
 * .open-next/はビルドのたびに再生成されるため、元のpublic/には影響しない。
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const assetsDir = path.join(projectRoot, '.open-next', 'assets')

if (!fs.existsSync(assetsDir)) {
  console.error('clean-assets: .open-next/assets/ directory not found.')
  console.error('Run the OpenNext build first.')
  process.exit(1)
}

let deletedCount = 0

function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath)
    deletedCount++
  } catch (e) {
    // ファイルが既に存在しない場合は無視
  }
}

function deleteDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
    deletedCount++
  }
}

// --- 1. .gitignoreで除外されているpublic/配下のファイルを削除 ---
let gitIgnoredCount = 0
try {
  const output = execSync('git ls-files --others --ignored --exclude-standard public/', {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  for (const line of output.split('\n')) {
    if (!line) continue
    const assetPath = line.replace(/^public\//, '')
    const fullPath = path.join(assetsDir, assetPath)
    if (fs.existsSync(fullPath)) {
      deleteFile(fullPath)
      gitIgnoredCount++
    }
  }
} catch (e) {
  console.warn('clean-assets: Warning: Could not get gitignored files:', e.message)
}

// --- 2. 25MB超ファイル / 非ASCIIファイル名を削除 ---
const MAX_SIZE = 25 * 1024 * 1024
let problemCount = 0

// eslint-disable-next-line no-control-regex
const NON_ASCII_RE = /[^\x00-\x7F]/

function scanAndClean(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (NON_ASCII_RE.test(entry.name)) {
        deleteDir(fullPath)
        problemCount++
        continue
      }
      scanAndClean(fullPath)
      // 空ディレクトリを削除
      try {
        const remaining = fs.readdirSync(fullPath)
        if (remaining.length === 0) {
          fs.rmdirSync(fullPath)
        }
      } catch (e) {
        // ignore
      }
    } else if (entry.isFile()) {
      if (NON_ASCII_RE.test(entry.name)) {
        deleteFile(fullPath)
        problemCount++
        continue
      }
      const stats = fs.statSync(fullPath)
      if (stats.size > MAX_SIZE) {
        deleteFile(fullPath)
        problemCount++
      }
    }
  }
}

scanAndClean(assetsDir)

console.log(`clean-assets: Removed ${gitIgnoredCount + problemCount} file(s) from .open-next/assets/:`)
console.log(`  - ${gitIgnoredCount} gitignored`)
console.log(`  - ${problemCount} oversized/non-ASCII`)
