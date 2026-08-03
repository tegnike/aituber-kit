const fs = require('fs')
const path = require('path')
const { normalizeAppVersion } = require('../src/constants/appVersion')

const root = path.resolve(__dirname, '..')

const formatVersion = (version) => {
  const normalizedVersion = normalizeAppVersion(version)
  return normalizedVersion ? `v${normalizedVersion}` : null
}

const readVersionFile = (filePath) => {
  try {
    const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return formatVersion(contents.version)
  } catch {
    return null
  }
}

const readAppVersion = (rootDir = root) =>
  readVersionFile(path.join(rootDir, 'src/constants/appVersion.json'))

const readPackageVersion = (rootDir = root) =>
  readVersionFile(path.join(rootDir, 'package.json'))

const getVersion = (rootDir = root) =>
  readAppVersion(rootDir) || readPackageVersion(rootDir) || 'version unknown'

const main = async () => {
  const { render } = await import('oh-my-logo')
  const logo = await render('AITuberKit', {
    palette: 'ocean',
    font: 'ANSI Shadow',
    direction: 'horizontal',
  })

  console.log('')
  console.log(logo.trimEnd())
  console.log(`\nAITuberKit ${getVersion()}\n`)
}

if (require.main === module && process.env.AITUBERKIT_NO_LOGO !== '1') {
  main().catch((error) => {
    console.error('[startup-logo] failed to render logo')
    console.error(error)
    process.exit(0)
  })
}

module.exports = { getVersion, readAppVersion, readPackageVersion }
