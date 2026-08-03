const VERSION_PATTERN = /^\d+\.\d+\.\d+$/

const normalizeAppVersion = (version) =>
  typeof version === 'string' && VERSION_PATTERN.test(version) ? version : null

const readBundledAppVersion = () => {
  try {
    return require('./appVersion.json').version
  } catch {
    return null
  }
}

const APP_VERSION =
  normalizeAppVersion(readBundledAppVersion()) || 'version unknown'

module.exports = { APP_VERSION, normalizeAppVersion }
