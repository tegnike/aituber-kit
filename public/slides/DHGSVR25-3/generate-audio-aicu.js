#!/usr/bin/env node
/**
 * scripts.json から AICU API で MP3 音声ファイルを一括生成するツール
 *
 * 使い方:
 *   node generate-audio-aicu.js [オプション]
 *
 * オプション:
 *   --all           全ページを生成（既存ファイルも上書き）
 *   --missing       存在しないページのみ生成（デフォルト）
 *   --page N        指定ページのみ生成
 *   --range N-M     指定範囲のページを生成
 *   --dry-run       実際には生成せず、対象ページを表示
 *
 * 環境変数:
 *   AICU_API_KEY    AICU API キー (aicu_ent_xxx or aicu_live_xxx)
 *   AICU_SLUG       キャラクターslug (default: luc4)
 *
 * 例:
 *   AICU_API_KEY=aicu_ent_xxx node generate-audio-aicu.js --missing
 *   AICU_API_KEY=aicu_ent_xxx AICU_SLUG=luc4 node generate-audio-aicu.js --page 0
 *   AICU_API_KEY=aicu_ent_xxx node generate-audio-aicu.js --range 40-50
 *   node generate-audio-aicu.js --all --dry-run
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// 設定
const SCRIPTS_PATH = path.join(__dirname, 'scripts.json')
const AUDIO_DIR = path.join(__dirname, 'audio')
const API_HOST = 'api.aicu.ai'
const API_PATH = '/api/v1/tts/generate'

// 感情タグを除去してテキストのみ抽出
function extractText(line) {
  return line
    .replace(/\[(neutral|happy|sad|angry|surprised|relaxed)\]/g, '')
    .trim()
}

// AICU TTS API を呼び出して音声を生成
async function synthesizeSpeech(text, apiKey, slug) {
  const requestBody = JSON.stringify({
    text,
    slug: slug || 'luc4',
    format: 'mp3',
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: API_PATH,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        if (res.statusCode === 200) {
          const audioBuffer = Buffer.concat(chunks)
          const creditsUsed = res.headers['x-credits-used'] || '?'
          const creditsRemaining = res.headers['x-credits-remaining'] || '?'
          resolve({ audioBuffer, creditsUsed, creditsRemaining })
        } else {
          const errorBody = Buffer.concat(chunks).toString()
          reject(new Error(`API Error ${res.statusCode}: ${errorBody}`))
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
        targetPages = Array.from(
          { length: end - start + 1 },
          (_, i) => start + i
        )
        break
      case '--dry-run':
        dryRun = true
        break
      case '--help':
        console.log(
          fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1]
        )
        process.exit(0)
    }
  }

  // 環境変数
  const apiKey = process.env.AICU_API_KEY
  const slug = process.env.AICU_SLUG || 'luc4'

  if (!apiKey && !dryRun) {
    console.error('❌ エラー: AICU_API_KEY 環境変数を設定してください')
    console.error('   export AICU_API_KEY="aicu_ent_xxx"')
    console.error('')
    console.error(
      '   APIキーは https://api.aicu.ai/dashboard/keys で発行できます'
    )
    process.exit(1)
  }

  // scripts.json 読み込み
  const scripts = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'))
  console.log(`📖 scripts.json: ${scripts.length} ページ`)
  console.log(`🎤 Character: ${slug}`)

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
  let totalCredits = 0

  for (const script of pagesToGenerate) {
    const text = extractText(script.line)
    const audioPath = getAudioPath(script.page)

    process.stdout.write(`  page ${script.page}: `)

    try {
      const { audioBuffer, creditsUsed, creditsRemaining } =
        await synthesizeSpeech(text, apiKey, slug)
      fs.writeFileSync(audioPath, audioBuffer)
      const sizeKB = (audioBuffer.length / 1024).toFixed(1)
      console.log(
        `✅ ${sizeKB} KB (${creditsUsed} AP used, ${creditsRemaining} remaining)`
      )
      successCount++
      totalCredits += parseInt(creditsUsed, 10) || 0

      // API レート制限対策（少し待機）
      // Enterprise キーはレート制限なしだが、念のため
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.log(`❌ ${error.message}`)
      errorCount++

      // 402 (クレジット不足) の場合は中断
      if (error.message.includes('402')) {
        console.error('\n⚠️  クレジット不足のため処理を中断しました')
        console.error(
          '   https://api.aicu.ai/dashboard でクレジットを追加してください'
        )
        break
      }
    }
  }

  console.log(`\n📊 結果: 成功 ${successCount}, 失敗 ${errorCount}`)
  if (totalCredits > 0) {
    console.log(`💰 消費 AP: ${totalCredits}`)
  }
}

main().catch(console.error)
