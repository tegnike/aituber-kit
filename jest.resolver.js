const path = require('path')
const os = require('os')

module.exports = function (request, options) {
  // canvasモジュールをモックにリダイレクト
  if (request === 'canvas' || request.startsWith('canvas/')) {
    return path.resolve(__dirname, 'src/__mocks__/node-canvas.js')
  }

  // デフォルトのリゾルバーを使用
  return options.defaultResolver(request, {
    ...options,
    // ホームディレクトリのnode_modulesを無視
    paths: (options.paths || []).filter((p) => {
      const homeDir = os.homedir()
      return !p.startsWith(homeDir) || p.startsWith(__dirname)
    }),
    packageFilter: (pkg) => {
      // ESMモジュールをCommonJSとして扱う
      if (pkg.exports && pkg.exports['.']) {
        const exp = pkg.exports['.']
        if (typeof exp === 'object' && exp.require) {
          pkg.main = exp.require
        }
      }
      return pkg
    },
  })
}
