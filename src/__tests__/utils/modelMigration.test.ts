import { migrateOpenAIModelName } from '@/utils/modelMigration'

describe('migrateOpenAIModelName', () => {
  const legacyMappings: [string, string][] = [
    ['gpt-4o-mini-2024-07-18', 'gpt-4o-mini'],
    ['gpt-4o-2024-11-20', 'gpt-4o'],
    ['gpt-4.5-preview-2025-02-27', 'gpt-4.5-preview'],
    ['gpt-4.1-nano-2025-04-14', 'gpt-4.1-nano'],
    ['gpt-4.1-mini-2025-04-14', 'gpt-4.1-mini'],
    ['gpt-4.1-2025-04-14', 'gpt-4.1'],
  ]

  it.each(legacyMappings)('should migrate "%s" to "%s"', (legacy, current) => {
    expect(migrateOpenAIModelName(legacy)).toBe(current)
  })

  it('should return model name unchanged when not in legacy list', () => {
    expect(migrateOpenAIModelName('gpt-4o')).toBe('gpt-4o')
  })

  it('should return custom model name unchanged', () => {
    expect(migrateOpenAIModelName('my-custom-model')).toBe('my-custom-model')
  })

  it('should return empty string unchanged', () => {
    expect(migrateOpenAIModelName('')).toBe('')
  })
})
