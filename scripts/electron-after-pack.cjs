const fs = require('fs')
const path = require('path')

module.exports = async function afterPack(context) {
  const sourceDir = path.join(
    context.packager.projectDir,
    'node_modules',
    'three',
    'examples'
  )
  const targetDir = path.join(
    context.appOutDir,
    'resources',
    'app',
    'node_modules',
    'three',
    'examples'
  )

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing three examples directory: ${sourceDir}`)
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true })
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true })
}
