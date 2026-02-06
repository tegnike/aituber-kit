#!/usr/bin/env node
/**
 * Test script for Cloudflare Workers TTS API compatibility
 *
 * Compares Vercel (api.aicu.ai) vs Workers (aicu-api.aki-2c0.workers.dev)
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const SCRIPTS_PATH = path.join(__dirname, 'scripts.json')
const WORKERS_HOST = 'aicu-api.aki-2c0.workers.dev'
const WORKERS_PATH = '/v1/tts/generate'

// Test texts of varying lengths
const TEST_CASES = [
  { name: 'short', text: 'こんにちは' },
  { name: 'medium', text: 'やあ、みんな！はじめまして！白井博士の助手、全力肯定彼氏くん LuC4 です！' },
  { name: 'long', text: '今日はみんなに、メタバースとバーチャルリアリティの世界について、わかりやすく解説していくよ！一緒に楽しく学んでいこうね！' },
]

async function testTTS(host, apiPath, text, slug = 'luc4') {
  const requestBody = JSON.stringify({ text, slug, format: 'mp3' })
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      path: apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const latency = Date.now() - startTime
        const audioBuffer = Buffer.concat(chunks)

        resolve({
          statusCode: res.statusCode,
          latency,
          size: audioBuffer.length,
          cacheHit: res.headers['x-cache-hit'],
          xLatency: res.headers['x-latency-ms'],
          ttsLatency: res.headers['x-tts-latency-ms'],
          slug: res.headers['x-slug'],
          charId: res.headers['x-char-id'],
          contentType: res.headers['content-type'],
        })
      })
    })

    req.on('error', reject)
    req.setTimeout(30000, () => reject(new Error('Timeout')))
    req.write(requestBody)
    req.end()
  })
}

async function runBenchmark(testCase, iterations = 3) {
  console.log(`\n=== Testing: ${testCase.name} (${testCase.text.length} chars) ===`)
  console.log(`Text: ${testCase.text.substring(0, 50)}...`)

  const results = []

  for (let i = 0; i < iterations; i++) {
    console.log(`  Run ${i + 1}:`)
    try {
      const result = await testTTS(WORKERS_HOST, WORKERS_PATH, testCase.text)
      results.push(result)

      const cacheStatus = result.cacheHit === 'true' ? 'HIT' : 'MISS'
      console.log(`    Status: ${result.statusCode}, Cache: ${cacheStatus}`)
      console.log(`    Latency: ${result.latency}ms (X-Latency: ${result.xLatency}ms)`)
      console.log(`    Size: ${(result.size / 1024).toFixed(1)} KB`)
      console.log(`    Content-Type: ${result.contentType}`)

      if (result.ttsLatency) {
        console.log(`    TTS Latency: ${result.ttsLatency}ms`)
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 500))
    } catch (error) {
      console.log(`    Error: ${error.message}`)
    }
  }

  return results
}

async function testAllPages() {
  console.log('\n=== Testing All 98 Pages (Cache HIT expected) ===')

  const scripts = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'))
  console.log(`Total pages: ${scripts.length}`)

  const startTime = Date.now()
  let successCount = 0
  let errorCount = 0
  let totalLatency = 0
  let cacheHits = 0

  for (const script of scripts) {
    const text = script.line.replace(/\[(neutral|happy|sad|angry|surprised|relaxed)\]/g, '').trim()

    try {
      const result = await testTTS(WORKERS_HOST, WORKERS_PATH, text)

      if (result.statusCode === 200) {
        successCount++
        totalLatency += result.latency
        if (result.cacheHit === 'true') cacheHits++

        process.stdout.write(`  Page ${script.page}: ${result.latency}ms ${result.cacheHit === 'true' ? '(HIT)' : '(MISS)'}\r`)
      } else {
        errorCount++
        console.log(`  Page ${script.page}: Error ${result.statusCode}`)
      }

      // Minimal delay
      await new Promise(r => setTimeout(r, 50))
    } catch (error) {
      errorCount++
      console.log(`  Page ${script.page}: ${error.message}`)
    }
  }

  const totalTime = Date.now() - startTime

  console.log('\n')
  console.log('=== Summary ===')
  console.log(`Total pages: ${scripts.length}`)
  console.log(`Success: ${successCount}, Errors: ${errorCount}`)
  console.log(`Cache hits: ${cacheHits}/${successCount} (${(cacheHits/successCount*100).toFixed(1)}%)`)
  console.log(`Total time: ${(totalTime/1000).toFixed(1)}s`)
  console.log(`Average latency: ${(totalLatency/successCount).toFixed(0)}ms`)
  console.log(`Throughput: ${(successCount/(totalTime/1000)).toFixed(1)} req/s`)
}

async function main() {
  const args = process.argv.slice(2)

  console.log('Cloudflare Workers TTS API Compatibility Test')
  console.log(`Target: https://${WORKERS_HOST}${WORKERS_PATH}`)
  console.log('---')

  // Health check first
  try {
    const healthRes = await new Promise((resolve, reject) => {
      https.get(`https://${WORKERS_HOST}/health`, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => resolve({ status: res.statusCode, data }))
      }).on('error', reject)
    })
    console.log(`Health check: ${healthRes.status} - ${healthRes.data}`)
  } catch (e) {
    console.log(`Health check failed: ${e.message}`)
    process.exit(1)
  }

  if (args.includes('--all')) {
    // Test all 98 pages
    await testAllPages()
  } else {
    // Quick benchmark with test cases
    for (const testCase of TEST_CASES) {
      await runBenchmark(testCase, 2)
    }
  }
}

main().catch(console.error)
