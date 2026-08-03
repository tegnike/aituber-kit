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
    fs.writeFileSync(
      path.join(fixtureRoot, 'package.json'),
      JSON.stringify({ version: '0.1.0' })
    )

    expect(readAppVersion(fixtureRoot)).toBe('v2.65.0')
    expect(getVersion(fixtureRoot)).toBe('v2.65.0')
  })

  it('falls back to package.json when the app version is unavailable', () => {
    fs.writeFileSync(
      path.join(fixtureRoot, 'package.json'),
      JSON.stringify({ version: '0.1.0' })
    )

    expect(getVersion(fixtureRoot)).toBe('v0.1.0')
  })

  it('does not print an invalid app version', () => {
    fs.writeFileSync(
      path.join(fixtureRoot, 'src/constants/appVersion.json'),
      JSON.stringify({ version: 'latest' })
    )

    expect(getVersion(fixtureRoot)).toBe('version unknown')
  })
})
