import fs from 'fs'
import { execSync } from 'child_process'

jest.mock('fs')
jest.mock('child_process')

const {
  generateManifest,
} = require('../../../scripts/generate-asset-manifest.js')

describe('素材一覧のポーズ再生成', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(fs.existsSync).mockReturnValue(true)
    jest.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats)
    jest
      .mocked(execSync)
      .mockImplementation((command) =>
        String(command).includes('public/poses/')
          ? [
              'public/poses/wave.json',
              'public/poses/bow.json',
              'public/poses/invalid.json',
              'public/poses/readme.txt',
            ].join('\n')
          : ''
      )
    jest.mocked(fs.readFileSync).mockImplementation((file) => {
      if (String(file).endsWith('wave.json'))
        return JSON.stringify({ specVersion: '1.0', bones: {} })
      if (String(file).endsWith('bow.json'))
        return JSON.stringify({ version: 1, pose: {} })
      return JSON.stringify({ unrelated: true })
    })
  })

  it('再生成しても有効な既存ポーズを一覧から落とさない', () => {
    expect(generateManifest().poses).toEqual([
      { name: 'wave', path: '/poses/wave.json' },
      { name: 'bow', path: '/poses/bow.json' },
    ])
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })

  it('不正JSONは除外してほかの素材の生成を継続する', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.mocked(fs.readFileSync).mockReturnValue('invalid JSON')
    expect(generateManifest().poses).toEqual([])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
