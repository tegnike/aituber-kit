/**
 * Cloudflareデプロイ用ビルドラッパースクリプト。
 *
 * ビルド前にpublic/から非デプロイ対象ファイルを一時退避し、ビルド後に復元する。
 * これにより.open-next/assets/に不要ファイルが含まれることを防ぐ。
 *
 * 退避対象:
 * - .gitignoreでpublic/配下から除外されているファイル
 * - git-trackedだが25MB超のファイル
 * - git-trackedだが非ASCIIファイル名のファイル
 *
 * Usage:
 *   node scripts/build-cloudflare.js            # ビルドのみ
 *   node scripts/build-cloudflare.js --preview   # ビルド + wrangler dev
 *   node scripts/build-cloudflare.js --deploy    # ビルド + wrangler deploy
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')
const stashDir = path.join(projectRoot, '.public-stash')

const MAX_SIZE = 25 * 1024 * 1024
// eslint-disable-next-line no-control-regex
const NON_ASCII_RE = /[^\x00-\x7F]/

// --- ユーティリティ ---

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, {
    cwd: projectRoot,
    stdio: 'inherit',
    ...opts,
  })
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

/**
 * ファイルをsrcからdestに移動（ディレクトリ構造を保持）
 */
function moveFile(src, dest) {
  ensureDir(path.dirname(dest))
  fs.renameSync(src, dest)
}

/**
 * 空になったディレクトリを再帰的に削除
 */
function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      removeEmptyDirs(path.join(dir, entry.name))
    }
  }
  // 再度チェック（子ディレクトリが消えた可能性）
  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir)
  }
}

// --- 退避・復元ロジック ---

let isRestoring = false

/**
 * .public-stash/からpublic/へファイルを復元
 */
function restoreStash() {
  if (isRestoring) return 0
  isRestoring = true
  if (!fs.existsSync(stashDir)) return 0

  let count = 0
  function restore(dir, relBase) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relBase, entry.name)
      if (entry.isDirectory()) {
        restore(fullPath, relPath)
      } else {
        const destPath = path.join(publicDir, relPath)
        ensureDir(path.dirname(destPath))
        fs.renameSync(fullPath, destPath)
        count++
      }
    }
  }

  restore(stashDir, '')
  fs.rmSync(stashDir, { recursive: true, force: true })
  return count
}

/**
 * 非デプロイ対象ファイルを特定して退避
 */
function stashFiles() {
  const stashed = []

  // 1. gitignored ファイル
  try {
    const output = execSync(
      'git ls-files --others --ignored --exclude-standard public/',
      {
        cwd: projectRoot,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      }
    )
    for (const line of output.split('\n')) {
      if (!line) continue
      const fullPath = path.join(projectRoot, line)
      if (!fs.existsSync(fullPath)) continue
      const stat = fs.statSync(fullPath)
      if (!stat.isFile()) continue

      const relPath = path.relative(publicDir, fullPath)
      const destPath = path.join(stashDir, relPath)
      moveFile(fullPath, destPath)
      stashed.push({ path: relPath, reason: 'gitignored' })
    }
  } catch (e) {
    console.warn(
      'Warning: Could not get gitignored files:',
      e.message
    )
  }

  // 2. git-tracked だが問題のあるファイル（25MB超 / 非ASCIIファイル名）
  try {
    const output = execSync('git ls-files public/', {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })
    for (const line of output.split('\n')) {
      if (!line) continue
      const fullPath = path.join(projectRoot, line)
      if (!fs.existsSync(fullPath)) continue
      const stat = fs.statSync(fullPath)
      if (!stat.isFile()) continue

      const relPath = path.relative(publicDir, fullPath)
      const parts = relPath.split(path.sep)

      // 非ASCIIファイル名チェック
      if (parts.some((part) => NON_ASCII_RE.test(part))) {
        const destPath = path.join(stashDir, relPath)
        moveFile(fullPath, destPath)
        stashed.push({ path: relPath, reason: 'non-ASCII filename' })
        continue
      }

      // 25MB超チェック
      if (stat.size > MAX_SIZE) {
        const destPath = path.join(stashDir, relPath)
        moveFile(fullPath, destPath)
        const sizeMB = (stat.size / (1024 * 1024)).toFixed(1)
        stashed.push({
          path: relPath,
          reason: `oversized (${sizeMB}MB)`,
        })
      }
    }
  } catch (e) {
    console.warn(
      'Warning: Could not get tracked files:',
      e.message
    )
  }

  // 空ディレクトリを掃除
  removeEmptyDirs(publicDir)

  return stashed
}

// --- メイン ---

function main() {
  const args = process.argv.slice(2)
  const doPreview = args.includes('--preview')
  const doDeploy = args.includes('--deploy')

  // 前回の異常終了で.public-stash/が残っている場合は復元
  if (fs.existsSync(stashDir)) {
    console.warn(
      'Warning: .public-stash/ exists from a previous run. Restoring files first...'
    )
    const restored = restoreStash()
    console.warn(`Restored ${restored} file(s) from previous stash.`)
  }

  // 退避
  console.log('\n=== Stashing non-deploy files from public/ ===')
  const stashed = stashFiles()

  if (stashed.length === 0) {
    console.log('No files to stash.')
  } else {
    console.log(`\nStashed ${stashed.length} file(s):`)
    for (const entry of stashed) {
      console.log(`  - ${entry.path} (${entry.reason})`)
    }
  }

  // ビルド実行（try/finallyで確実に復元）
  try {
    console.log('\n=== Running build pipeline ===')
    run('node scripts/generate-asset-manifest.js')
    run('node scripts/patch-opennext-canvas.js')
    run('npx @opennextjs/cloudflare build', {
      env: {
        ...process.env,
        NEXT_PUBLIC_RESTRICTED_MODE: 'true',
      },
    })

    // 後続処理
    if (doPreview) {
      run('npx wrangler dev')
    } else if (doDeploy) {
      run('npx wrangler deploy')
    }
  } finally {
    // 復元
    if (stashed.length > 0) {
      console.log('\n=== Restoring stashed files to public/ ===')
      const restored = restoreStash()
      console.log(`Restored ${restored} file(s).`)
    }
  }
}

// シグナルハンドラ: 中断時も確実に復元
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`\nReceived ${sig}. Restoring stashed files...`)
    const restored = restoreStash()
    if (restored > 0) {
      console.log(`Restored ${restored} file(s).`)
    }
    process.exit(1)
  })
}

main()
