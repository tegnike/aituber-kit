import { buildUrl } from '@/utils/buildUrl'

describe('buildUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_BASE_PATH
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return path as-is when no BASE_PATH is set', () => {
    expect(buildUrl('/images/logo.png')).toBe('/images/logo.png')
  })

  it('should prepend BASE_PATH when set', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/aituber-kit'
    expect(buildUrl('/images/logo.png')).toBe('/aituber-kit/images/logo.png')
  })

  it('should encode special characters in path segments', () => {
    expect(buildUrl('/images/my file.png')).toBe('/images/my%20file.png')
  })

  it('should not double-encode already encoded segments', () => {
    expect(buildUrl('/images/my%20file.png')).toBe('/images/my%20file.png')
  })

  it('should preserve path separators', () => {
    expect(buildUrl('/a/b/c/d.png')).toBe('/a/b/c/d.png')
  })

  it('should handle empty path', () => {
    expect(buildUrl('')).toBe('')
  })

  it('should handle path with Japanese characters', () => {
    const result = buildUrl('/models/character.vrm')
    expect(result).toBe('/models/character.vrm')
  })

  it('should encode Japanese characters in segments', () => {
    const result = buildUrl('/models/test model.vrm')
    expect(result).toContain('%20')
  })
})
