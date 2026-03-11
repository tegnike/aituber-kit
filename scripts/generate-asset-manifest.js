/**
 * ビルド時にpublic/配下のアセットをスキャンし、マニフェストJSONを生成するスクリプト。
 *
 * Restricted Mode（Cloudflare Workers向け）では、ランタイムでfsが使えないため、
 * APIルートがアセット一覧を返せない。このスクリプトがビルド前に実行され、
 * src/constants/assetManifest.json にアセット情報を書き出す。
 *
 * フィルタリングはbuild-cloudflare.jsの退避ロジックと同等:
 * - git追跡ファイルのみ対象
 * - 25MB超のファイルを除外
 * - 非ASCIIファイル名を除外
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')
const manifestPath = path.join(
  projectRoot,
  'src',
  'constants',
  'assetManifest.json'
)

const MAX_SIZE = 25 * 1024 * 1024
// eslint-disable-next-line no-control-regex
const NON_ASCII_RE = /[^\x00-\x7F]/

// --- 共通フィルタリング（build-cloudflare.jsの退避ロジックと同等） ---

function shouldInclude(filePath) {
  const fullPath = path.join(projectRoot, filePath)
  if (!fs.existsSync(fullPath)) return false

  // 非ASCIIチェック（パスの各パーツ）
  const parts = filePath.split('/')
  if (parts.some((part) => NON_ASCII_RE.test(part))) return false

  // サイズチェック
  const stats = fs.statSync(fullPath)
  if (stats.size > MAX_SIZE) return false

  return true
}

function getTrackedFiles(subdir) {
  try {
    const output = execSync(`git ls-files "public/${subdir}/"`, {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    })
    return output
      .split('\n')
      .filter((line) => line && shouldInclude(line))
  } catch (e) {
    console.warn(
      `generate-asset-manifest: Warning: Could not list tracked files for ${subdir}:`,
      e.message
    )
    return []
  }
}

// --- VRM ---

function generateVrmList() {
  const files = getTrackedFiles('vrm')
  return files.filter((f) => f.endsWith('.vrm')).map((f) => path.basename(f))
}

// --- Backgrounds ---

function generateBackgroundList() {
  const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const files = getTrackedFiles('backgrounds')
  return files
    .filter((f) => validExts.includes(path.extname(f).toLowerCase()))
    .map((f) => path.basename(f))
}

// --- Live2D ---

function generateLive2dList() {
  const files = getTrackedFiles('live2d')

  // フォルダごとにグループ化
  const folders = new Map()
  for (const file of files) {
    const relative = file.replace('public/live2d/', '')
    const folderName = relative.split('/')[0]
    if (!folders.has(folderName)) folders.set(folderName, [])
    folders.get(folderName).push(relative)
  }

  const results = []
  for (const [folderName, folderFiles] of folders) {
    const model3File = folderFiles.find((f) => f.endsWith('.model3.json'))
    if (!model3File) continue

    const model3Path = path.join(publicDir, 'live2d', model3File)
    try {
      const content = fs.readFileSync(model3Path, 'utf-8')
      const modelJson = JSON.parse(content)

      const expressions =
        modelJson.FileReferences.Expressions?.map((exp) => exp.Name) || []
      const motions = Object.keys(modelJson.FileReferences.Motions || {})

      results.push({
        path: `/live2d/${folderName}/${path.basename(model3File)}`,
        name: folderName,
        expressions,
        motions,
      })
    } catch (e) {
      console.warn(
        `generate-asset-manifest: Warning: Could not parse ${model3Path}:`,
        e.message
      )
    }
  }
  return results
}

// --- PNGTuber ---

function generatePngtuberList() {
  const files = getTrackedFiles('pngtuber')

  // フォルダごとにグループ化
  const folders = new Map()
  for (const file of files) {
    const relative = file.replace('public/pngtuber/', '')
    const folderName = relative.split('/')[0]
    if (!folders.has(folderName)) folders.set(folderName, [])
    folders.get(folderName).push(relative)
  }

  const results = []
  for (const [folderName, folderFiles] of folders) {
    // フォルダ名を除いたファイル名リスト
    const fileNames = folderFiles.map((f) => f.split('/').slice(1).join('/'))

    // 動画ファイル検索（get-pngtuber-list.tsと同じロジック）
    const videoFile =
      fileNames.find(
        (f) =>
          f.toLowerCase().includes('mouthless') &&
          f.toLowerCase().includes('h264') &&
          f.toLowerCase().endsWith('.mp4')
      ) ||
      fileNames.find(
        (f) =>
          f.toLowerCase().includes('mouthless') &&
          f.toLowerCase().endsWith('.mp4')
      )

    const mouthTrackFile = fileNames.find(
      (f) => f.toLowerCase() === 'mouth_track.json'
    )

    // mouth/ ディレクトリ内のファイル
    const mouthFiles = fileNames.filter((f) => f.startsWith('mouth/'))
    const closedSprite = mouthFiles.find(
      (f) => path.basename(f).toLowerCase() === 'closed.png'
    )
    const openSprite = mouthFiles.find(
      (f) => path.basename(f).toLowerCase() === 'open.png'
    )

    // 必須ファイルが揃っていない場合はスキップ
    if (!videoFile || !mouthTrackFile || !closedSprite || !openSprite) continue

    // オプショナルスプライト
    const halfSprite = mouthFiles.find(
      (f) => path.basename(f).toLowerCase() === 'half.png'
    )
    const eSprite = mouthFiles.find(
      (f) => path.basename(f).toLowerCase() === 'e.png'
    )
    const uSprite = mouthFiles.find(
      (f) => path.basename(f).toLowerCase() === 'u.png'
    )

    results.push({
      path: `/pngtuber/${folderName}`,
      name: folderName,
      videoFile: path.basename(videoFile),
      mouthTrack: path.basename(mouthTrackFile),
      mouthSprites: {
        closed: path.basename(closedSprite),
        open: path.basename(openSprite),
        ...(halfSprite && { half: path.basename(halfSprite) }),
        ...(eSprite && { e: path.basename(eSprite) }),
        ...(uSprite && { u: path.basename(uSprite) }),
      },
    })
  }
  return results
}

// --- Slides ---

function generateSlides() {
  const files = getTrackedFiles('slides')

  // フォルダごとにグループ化
  const folders = new Map()
  for (const file of files) {
    const relative = file.replace('public/slides/', '')
    const parts = relative.split('/')
    if (parts.length < 2) continue // ルート直下のファイルはスキップ
    const folderName = parts[0]
    if (!folders.has(folderName)) folders.set(folderName, [])
    folders.get(folderName).push(relative)
  }

  const validFolders = []
  const supplements = {}
  const rendered = {}

  for (const [folderName, folderFiles] of folders) {
    const fileNames = folderFiles.map((f) => f.split('/').slice(1).join('/'))
    const hasSlidesFile = fileNames.includes('slides.md')
    const hasScriptsFile = fileNames.includes('scripts.json')
    if (!hasSlidesFile || !hasScriptsFile) continue

    validFolders.push(folderName)

    // supplement.txt を読み取り
    const supplementPath = path.join(
      publicDir,
      'slides',
      folderName,
      'supplement.txt'
    )
    try {
      supplements[folderName] = fs.readFileSync(supplementPath, 'utf-8')
    } catch {
      supplements[folderName] = ''
    }

    // slides.md + theme.css → Marpit変換
    const slidesPath = path.join(
      publicDir,
      'slides',
      folderName,
      'slides.md'
    )
    const themePath = path.join(
      publicDir,
      'slides',
      folderName,
      'theme.css'
    )
    try {
      const { Marpit } = require('@marp-team/marpit')
      const markdown = fs.readFileSync(slidesPath, 'utf-8')
      let css = ''
      try {
        css = fs.readFileSync(themePath, 'utf-8')
      } catch {
        // theme.cssが存在しない場合は空
      }

      const marpit = new Marpit({ inlineSVG: true })
      if (css) {
        marpit.themeSet.default = marpit.themeSet.add(css)
      }
      const result = marpit.render(markdown)
      rendered[folderName] = { html: result.html, css: result.css }
    } catch (e) {
      console.warn(
        `generate-asset-manifest: Warning: Could not render slides for ${folderName}:`,
        e.message
      )
      rendered[folderName] = { html: '', css: '' }
    }
  }

  return { folders: validFolders, supplements, rendered }
}

// --- メイン ---

const manifest = {
  vrm: generateVrmList(),
  backgrounds: generateBackgroundList(),
  live2d: generateLive2dList(),
  pngtuber: generatePngtuberList(),
  slides: generateSlides(),
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

console.log('generate-asset-manifest: Generated asset manifest:')
console.log(`  vrm: ${manifest.vrm.length} files`)
console.log(`  backgrounds: ${manifest.backgrounds.length} files`)
console.log(`  live2d: ${manifest.live2d.length} models`)
console.log(`  pngtuber: ${manifest.pngtuber.length} models`)
console.log(`  slides: ${manifest.slides.folders.length} folders`)
