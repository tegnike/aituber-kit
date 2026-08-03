const fs = require('fs')
const os = require('os')
const path = require('path')
const {
  getVersion,
  readAppVersion,
} = require('../../../scripts/print-startup-logo.js')

describe('print-startup-logo version', () => {
  let fixtureRoot: string

  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aituber-kit-version-'))
    fs.mkdirSync(path.join(fixtureRoot, 'src/constants'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true })
  })

  it('reads the shared app version used by the settings footer', () => {
    fs.writeFileSync(
      path.join(fixtureRoot, 'src/constants/appVersion.json'),
      JSON.stringify({ version: '2.65.0' })
    )
    expect(readAppVersion(fixtureRoot)).toBe('v2.65.0')
    expect(getVersion(fixtureRoot)).toBe('v2.65.0')
  })

  it('reports an unknown version when the shared version is unavailable', () => {
    expect(getVersion(fixtureRoot)).toBe('version unknown')
  })

  it('does not print an invalid app version', () => {
    fs.writeFileSync(
      path.join(fixtureRoot, 'src/constants/appVersion.json'),
      JSON.stringify({ version: 'latest' })
    )

    expect(getVersion(fixtureRoot)).toBe('version unknown')
  })
})
