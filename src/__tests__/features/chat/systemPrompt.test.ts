import { composeSystemPrompt } from '@/features/chat/systemPrompt'

describe('composeSystemPrompt', () => {
  it('keeps base prompt when no optional values are provided', () => {
    const result = composeSystemPrompt({
      systemPrompt: 'You are a helpful assistant.',
    })
    expect(result).toBe('You are a helpful assistant.')
  })

  it('adds personalization and avatar context', () => {
    const result = composeSystemPrompt({
      systemPrompt: 'Base',
      personalizationPrompt: 'Always speak politely.',
      selectedVrmPath: '/vrm/hero.vrm',
      selectedVrchatModelPath: '/vrchat-models/world_avatar.vrca',
    })

    expect(result).toContain('Base')
    expect(result).toContain('Always speak politely.')
    expect(result).toContain('VRM model: hero.vrm')
    expect(result).toContain('VRChat model asset: world_avatar.vrca')
  })
})
