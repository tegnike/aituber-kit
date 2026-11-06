const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const nextBuildDir = path.join(root, '.next')
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const port = process.env.E2E_PORT || '3100'
const log = (message) => console.error(message)

log('[e2e-server] starting Next.js dev server')
log(`[e2e-server] cwd: ${root}`)
log(`[e2e-server] node execPath: ${process.execPath}`)
log(`[e2e-server] node version: ${process.version}`)
log(`[e2e-server] platform: ${process.platform} ${process.arch}`)
log(`[e2e-server] next bin: ${nextBin}`)
log(`[e2e-server] port: ${port}`)
log(`[e2e-server] NEXT_TEST_WASM: ${process.env.NEXT_TEST_WASM || '(unset)'}`)
log(`[e2e-server] npm user agent: ${process.env.npm_config_user_agent || '(unset)'}`)

fs.rmSync(nextBuildDir, { recursive: true, force: true })
log(`[e2e-server] removed stale Next.js build dir: ${nextBuildDir}`)

const child = spawn(process.execPath, [nextBin, 'dev', '--webpack', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_SHOW_INTRODUCTION: 'false',
    NEXT_PUBLIC_MODEL_TYPE: 'pngtuber',
    NEXT_PUBLIC_SELECTED_PNGTUBER_PATH: '/pngtuber/nike01',
    // .env.localでデモモードが有効だとテスト時にUIが応答不能になるため強制無効化
    NEXT_PUBLIC_DEMO_MODE: 'false',
  },
})

const shutdown = (signal) => {
  child.kill(signal)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

child.on('error', (error) => {
  console.error('[e2e-server] failed to start Next.js dev server')
  console.error(error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
