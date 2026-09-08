const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { prepareVrmFallbacks } = require('../../../scripts/cloudflare-vrm-fallbacks')

test('oversized VRMs retain their list entries and redirect to exact committed bytes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vrm-fallback-'))
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  try {
    fs.mkdirSync(path.join(root, 'public/vrm'), { recursive: true })
    fs.mkdirSync(path.join(root, '.public-stash/vrm'), { recursive: true })
    fs.mkdirSync(path.join(root, 'src/constants'), { recursive: true })
    fs.writeFileSync(path.join(root, 'public/vrm/model.vrm'), 'original VRM bytes')
    git('init')
    git('add', 'public')
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'fixture')
    git('remote', 'add', 'origin', 'https://github.com/tegnike/aituber-kit.git')
    const revision = git('rev-parse', 'HEAD')
    fs.renameSync(path.join(root, 'public/vrm/model.vrm'), path.join(root, '.public-stash/vrm/model.vrm'))
    const manifestPath = path.join(root, 'src/constants/assetManifest.json')
    fs.writeFileSync(manifestPath, JSON.stringify({ vrm: ['small.vrm'], backgrounds: ['bg.png'] }))
    const stashed = [
      { path: 'vrm/model.vrm', reason: 'oversized (39.4MB)' },
      { path: 'vrm/private.vrm', reason: 'gitignored' },
      { path: 'video/large.mp4', reason: 'oversized (40.0MB)' },
    ]
    const expected = `/vrm/model.vrm https://raw.githubusercontent.com/tegnike/aituber-kit/${revision}/public/vrm/model.vrm 302\n`
    assert.equal(prepareVrmFallbacks(root, stashed), expected)
    assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath)), { vrm: ['model.vrm', 'small.vrm'], backgrounds: ['bg.png'] })
    git('remote', 'set-url', 'origin', 'git@github.com:tegnike/aituber-kit.git')
    assert.equal(prepareVrmFallbacks(root, stashed), expected)
    fs.appendFileSync(path.join(root, '.public-stash/vrm/model.vrm'), 'uncommitted')
    assert.throws(() => prepareVrmFallbacks(root, stashed), /Commit VRM changes/)
    assert.equal(prepareVrmFallbacks(root, [{ path: 'vrm/private.vrm', reason: 'gitignored' }]), '')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
