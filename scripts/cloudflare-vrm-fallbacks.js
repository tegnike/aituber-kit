/** Keep oversized, committed VRMs available without changing the model bytes. */
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

function prepareVrmFallbacks(projectRoot, stashed) {
  const vrms = stashed.filter(
    (entry) =>
      entry.reason.startsWith('oversized (') &&
      /^vrm\/[^/]+\.vrm$/.test(entry.path)
  )
  if (vrms.length === 0) return ''

  const git = (...args) =>
    execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' }).trim()
  const origin = git('remote', 'get-url', 'origin')
  const match = origin.match(
    /^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?$/
  )
  if (!match) throw new Error('Oversized VRMs require a GitHub origin')
  const revision = git('rev-parse', 'HEAD')
  const manifestPath = path.join(projectRoot, 'src/constants/assetManifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const redirects = []

  for (const entry of vrms) {
    const source = path.join(projectRoot, '.public-stash', entry.path)
    const committedHash = git('rev-parse', `${revision}:public/${entry.path}`)
    if (git('hash-object', source) !== committedHash) {
      throw new Error(`Commit VRM changes before deploying: ${entry.path}`)
    }
    const assetPath = entry.path.split('/').map(encodeURIComponent).join('/')
    redirects.push(
      `/${assetPath} https://raw.githubusercontent.com/${match[1]}/${revision}/public/${assetPath} 302`
    )
    manifest.vrm.push(path.basename(entry.path))
  }
  manifest.vrm = [...new Set(manifest.vrm)].sort()
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  return redirects.join('\n') + '\n'
}

module.exports = { prepareVrmFallbacks }
