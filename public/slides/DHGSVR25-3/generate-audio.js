#!/usr/bin/env node
/**
 * scripts.json から MP3 音声ファイルを一括生成するツール
 *
 * 使い方:
 *   node generate-audio.js [オプション]
 *
 * オプション:
 *   --all           全ページを生成（既存ファイルも上書き）
 *   --missing       存在しないページのみ生成（デフォルト）
 *   --page N        指定ページのみ生成
 *   --range N-M     指定範囲のページを生成
 *   --dry-run       実際には生成せず、対象ページを表示
 *
 * 環境変数:
 *   GOOGLE_TTS_KEY  Google Cloud TTS API キー
 *
 * 例:
 *   node generate-audio.js --missing
 *   node generate-audio.js --page 0
 *   node generate-audio.js --range 40-50
 *   node generate-audio.js --all --dry-run
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// 設定
const SCRIPTS_PATH = path.join(__dirname, 'scripts.json')
const AUDIO_DIR = path.join(__dirname, 'audio')
const API_ENDPOINT = 'texttospeech.googleapis.com'

// Google TTS 設定
const TTS_CONFIG = {
  voice: {
    languageCode: 'ja-JP',
    name: 'ja-JP-Chirp3-HD-Puck' // 男性声 (Kore は女性)
  },
  audioConfig: {
    audioEncoding: 'MP3',
    speakingRate: 1.0,
    pitch: 0
  }
}

// 感情タグを除去してテキストのみ抽出
function extractText(line) {
  return line.replace(/\[(neutral|happy|sad|angry|surprised|relaxed)\]/g, '').trim()
}

// Google TTS API を呼び出して音声を生成
async function synthesizeSpeech(text, apiKey) {
  const requestBody = JSON.stringify({
    input: { text },
    voice: TTS_CONFIG.voice,
    audioConfig: TTS_CONFIG.audioConfig
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_ENDPOINT,
      port: 443,
      path: `/v1/text:synthesize?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data)
          resolve(Buffer.from(response.audioContent, 'base64'))
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(requestBody)
    req.end()
  })
}

// MP3 ファイルパスを取得
function getAudioPath(page) {
  return path.join(AUDIO_DIR, `page${page}.mp3`)
}

// ファイルが存在するか確認
function audioExists(page) {
  return fs.existsSync(getAudioPath(page))
}

// メイン処理
async function main() {
  const args = process.argv.slice(2)

  // オプション解析
  let mode = 'missing'
  let targetPages = null
  let dryRun = false

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--all':
        mode = 'all'
        break
      case '--missing':
        mode = 'missing'
        break
      case '--page':
        mode = 'single'
        targetPages = [parseInt(args[++i], 10)]
        break
      case '--range':
        mode = 'range'
        const [start, end] = args[++i].split('-').map(Number)
        targetPages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
        break
      case '--dry-run':
        dryRun = true
        break
      case '--help':
        console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1])
        process.exit(0)
    }
  }

  // API キー確認
  const apiKey = process.env.GOOGLE_TTS_KEY
  if (!apiKey && !dryRun) {
    console.error('❌ エラー: GOOGLE_TTS_KEY 環境変数を設定してください')
    console.error('   export GOOGLE_TTS_KEY="your-api-key"')
    process.exit(1)
  }

  // scripts.json 読み込み
  const scripts = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'))
  console.log(`📖 scripts.json: ${scripts.length} ページ`)

  // audio ディレクトリ作成
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true })
    console.log(`📁 audio/ ディレクトリを作成しました`)
  }

  // 対象ページを決定
  let pagesToGenerate = []

  if (targetPages) {
    pagesToGenerate = scripts.filter((s) => targetPages.includes(s.page))
  } else if (mode === 'all') {
    pagesToGenerate = scripts
  } else if (mode === 'missing') {
    pagesToGenerate = scripts.filter((s) => !audioExists(s.page))
  }

  if (pagesToGenerate.length === 0) {
    console.log('✅ 生成対象のページがありません')
    return
  }

  console.log(`\n🎯 生成対象: ${pagesToGenerate.length} ページ`)

  if (dryRun) {
    console.log('\n[Dry Run] 以下のページが生成されます:')
    pagesToGenerate.forEach((s) => {
      const text = extractText(s.line)
      console.log(`  page ${s.page}: ${text.substring(0, 50)}...`)
    })
    return
  }

  // 音声生成
  let successCount = 0
  let errorCount = 0

  for (const script of pagesToGenerate) {
    const text = extractText(script.line)
    const audioPath = getAudioPath(script.page)

    process.stdout.write(`  page ${script.page}: `)

    try {
      const audioBuffer = await synthesizeSpeech(text, apiKey)
      fs.writeFileSync(audioPath, audioBuffer)
      console.log(`✅ ${(audioBuffer.length / 1024).toFixed(1)} KB`)
      successCount++

      // API レート制限対策（少し待機）
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      console.log(`❌ ${error.message}`)
      errorCount++
    }
  }

  console.log(`\n📊 結果: 成功 ${successCount}, 失敗 ${errorCount}`)
}

main().catch(console.error)
