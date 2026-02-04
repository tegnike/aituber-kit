import {
  aiModels,
  defaultModels,
  multiModalModels,
  getModels,
  getDefaultModel,
  getSpecificDefaultModel,
  getMultiModalModels,
  getOpenAIRealtimeModels,
  getOpenAIAudioModels,
  getOpenAIWhisperModels,
  getOpenAITTSModels,
  isMultiModalModel,
  isMultiModalModelWithToggle,
  isMultiModalAvailable,
  isSearchGroundingModel,
  googleSearchGroundingModels,
  openAIRealtimeModels,
  openAIAudioModels,
  openAIWhisperModels,
  openAITTSModels,
} from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'

describe('aiModels', () => {
  const allServices: AIService[] = [
    'openai',
    'anthropic',
    'google',
    'azure',
    'xai',
    'groq',
    'cohere',
    'mistralai',
    'perplexity',
    'fireworks',
    'deepseek',
    'openrouter',
    'lmstudio',
    'ollama',
    'dify',
    'custom-api',
  ]

  const emptyServices: AIService[] = [
    'azure',
    'openrouter',
    'lmstudio',
    'ollama',
    'dify',
    'custom-api',
  ]

  const servicesWithModels: AIService[] = allServices.filter(
    (s) => !emptyServices.includes(s)
  )

  describe('getModels', () => {
    it.each(servicesWithModels)(
      'should return non-empty model list for %s',
      (service) => {
        const models = getModels(service)
        expect(models.length).toBeGreaterThan(0)
        models.forEach((m) => expect(typeof m).toBe('string'))
      }
    )

    it.each(emptyServices)('should return empty array for %s', (service) => {
      expect(getModels(service)).toEqual([])
    })

    it('should match aiModels record', () => {
      allServices.forEach((service) => {
        expect(getModels(service)).toEqual(aiModels[service])
      })
    })
  })

  describe('getDefaultModel', () => {
    it('should return gpt-4.1-mini for openai', () => {
      expect(getDefaultModel('openai')).toBe('gpt-4.1-mini')
    })

    it('should return claude-sonnet-4-5 for anthropic', () => {
      expect(getDefaultModel('anthropic')).toBe('claude-sonnet-4-5')
    })

    it('should return gemini-2.5-flash for google', () => {
      expect(getDefaultModel('google')).toBe('gemini-2.5-flash')
    })

    it('should return empty string for azure (no predefined models)', () => {
      expect(getDefaultModel('azure')).toBe('')
    })

    it('should return grok-4 for xai', () => {
      expect(getDefaultModel('xai')).toBe('grok-4')
    })

    it('should return llama-3.3-70b-versatile for groq', () => {
      expect(getDefaultModel('groq')).toBe('llama-3.3-70b-versatile')
    })

    it('should return empty string for services without defaults', () => {
      emptyServices.forEach((service) => {
        expect(getDefaultModel(service)).toBe('')
      })
    })

    it('should match defaultModels record', () => {
      allServices.forEach((service) => {
        expect(getDefaultModel(service)).toBe(defaultModels[service])
      })
    })
  })

  describe('getSpecificDefaultModel', () => {
    it('should return tts-1 for openaiAudio', () => {
      expect(getSpecificDefaultModel('openaiAudio')).toBe('tts-1')
    })

    it('should return gpt-realtime for openaiRealtime', () => {
      expect(getSpecificDefaultModel('openaiRealtime')).toBe('gpt-realtime')
    })

    it('should also work for regular AIService', () => {
      expect(getSpecificDefaultModel('openai')).toBe('gpt-4.1-mini')
    })
  })

  describe('getMultiModalModels', () => {
    it('should return only multimodal models for openai', () => {
      const models = getMultiModalModels('openai')
      expect(models.length).toBeGreaterThan(0)
      expect(models).toContain('gpt-4o')
      expect(models).toContain('gpt-4.1')
    })

    it('should return all models for anthropic (all are multimodal)', () => {
      const models = getMultiModalModels('anthropic')
      const allModels = getModels('anthropic')
      expect(models).toEqual(allModels)
    })

    it('should return all models for google (all are multimodal)', () => {
      const models = getMultiModalModels('google')
      const allModels = getModels('google')
      expect(models).toEqual(allModels)
    })

    it('should return subset for xai (some are not multimodal)', () => {
      const models = getMultiModalModels('xai')
      const allModels = getModels('xai')
      expect(models.length).toBeLessThan(allModels.length)
      expect(models).not.toContain('grok-4-fast-non-reasoning')
      expect(models).not.toContain('grok-4-fast-reasoning')
      expect(models).not.toContain('grok-code-fast-1')
      expect(models).toContain('grok-4')
    })

    it('should return subset for groq (most are not multimodal)', () => {
      const models = getMultiModalModels('groq')
      expect(models).toEqual(['meta-llama/llama-4-scout-17b-16e-instruct'])
    })

    it('should return empty array for services with no models', () => {
      emptyServices.forEach((service) => {
        expect(getMultiModalModels(service)).toEqual([])
      })
    })

    it('should match multiModalModels record', () => {
      allServices.forEach((service) => {
        expect(getMultiModalModels(service)).toEqual(multiModalModels[service])
      })
    })
  })

  describe('isMultiModalModel', () => {
    it('should return true for known multimodal models', () => {
      expect(isMultiModalModel('openai', 'gpt-4o')).toBe(true)
      expect(isMultiModalModel('anthropic', 'claude-opus-4-5')).toBe(true)
      expect(isMultiModalModel('google', 'gemini-2.5-flash')).toBe(true)
      expect(isMultiModalModel('mistralai', 'pixtral-large-latest')).toBe(true)
    })

    it('should return false for non-multimodal models', () => {
      expect(isMultiModalModel('groq', 'gemma2-9b-it')).toBe(false)
      expect(isMultiModalModel('cohere', 'command')).toBe(false)
      expect(isMultiModalModel('xai', 'grok-4-fast-non-reasoning')).toBe(false)
      expect(isMultiModalModel('deepseek', 'deepseek-chat')).toBe(false)
    })

    it('should return false for unknown models', () => {
      expect(isMultiModalModel('openai', 'nonexistent-model')).toBe(false)
    })

    it('should return false for services with no models', () => {
      expect(isMultiModalModel('azure', 'gpt-4o')).toBe(false)
      expect(isMultiModalModel('ollama', 'llama3')).toBe(false)
    })
  })

  describe('isMultiModalModelWithToggle', () => {
    const bypassServices: AIService[] = [
      'azure',
      'openrouter',
      'lmstudio',
      'ollama',
      'custom-api',
    ]

    it.each(bypassServices)(
      'should return enableMultiModal directly for bypass service %s',
      (service) => {
        expect(isMultiModalModelWithToggle(service, 'any-model', true)).toBe(
          true
        )
        expect(isMultiModalModelWithToggle(service, 'any-model', false)).toBe(
          false
        )
      }
    )

    it('should return enableMultiModal for custom models', () => {
      expect(
        isMultiModalModelWithToggle('openai', 'custom-model', true, true)
      ).toBe(true)
      expect(
        isMultiModalModelWithToggle('openai', 'custom-model', false, true)
      ).toBe(false)
    })

    it('should delegate to isMultiModalModel for standard services', () => {
      expect(isMultiModalModelWithToggle('openai', 'gpt-4o', false)).toBe(true)
      expect(isMultiModalModelWithToggle('groq', 'gemma2-9b-it', true)).toBe(
        false
      )
    })
  })

  describe('isMultiModalAvailable', () => {
    it('should return false when mode is never', () => {
      expect(isMultiModalAvailable('openai', 'gpt-4o', true, 'never')).toBe(
        false
      )
    })

    it('should delegate to isMultiModalModelWithToggle when mode is always', () => {
      expect(isMultiModalAvailable('openai', 'gpt-4o', true, 'always')).toBe(
        true
      )
      expect(
        isMultiModalAvailable('groq', 'gemma2-9b-it', true, 'always')
      ).toBe(false)
    })

    it('should delegate to isMultiModalModelWithToggle when mode is ai-decide', () => {
      expect(isMultiModalAvailable('openai', 'gpt-4o', true, 'ai-decide')).toBe(
        true
      )
      expect(
        isMultiModalAvailable('groq', 'gemma2-9b-it', true, 'ai-decide')
      ).toBe(false)
    })

    it('should respect enableMultiModal for bypass services', () => {
      expect(isMultiModalAvailable('azure', 'any-model', true, 'always')).toBe(
        true
      )
      expect(isMultiModalAvailable('azure', 'any-model', false, 'always')).toBe(
        false
      )
    })

    it('should respect customModel flag', () => {
      expect(
        isMultiModalAvailable('openai', 'custom-model', true, 'always', true)
      ).toBe(true)
      expect(
        isMultiModalAvailable('openai', 'custom-model', false, 'always', true)
      ).toBe(false)
    })
  })

  describe('isSearchGroundingModel', () => {
    it('should return true for Google search grounding models', () => {
      googleSearchGroundingModels.forEach((model) => {
        expect(isSearchGroundingModel('google', model)).toBe(true)
      })
    })

    it('should return false for Google non-grounding models', () => {
      expect(isSearchGroundingModel('google', 'gemini-2.5-flash')).toBe(false)
      expect(isSearchGroundingModel('google', 'gemini-2.0-flash')).toBe(false)
    })

    it('should return false for non-Google services', () => {
      expect(isSearchGroundingModel('openai', 'gemini-1.5-flash')).toBe(false)
      expect(isSearchGroundingModel('anthropic', 'claude-opus-4-5')).toBe(false)
    })
  })

  describe('OpenAI model list functions', () => {
    it('getOpenAIRealtimeModels should return correct models', () => {
      const models = getOpenAIRealtimeModels()
      expect(models).toEqual([...openAIRealtimeModels])
      expect(models).toContain('gpt-realtime')
      expect(models).toContain('gpt-realtime-mini')
    })

    it('getOpenAIAudioModels should return correct models', () => {
      const models = getOpenAIAudioModels()
      expect(models).toEqual([...openAIAudioModels])
      expect(models).toContain('tts-1')
      expect(models).toContain('tts-1-hd')
    })

    it('getOpenAIWhisperModels should return correct models', () => {
      const models = getOpenAIWhisperModels()
      expect(models).toEqual([...openAIWhisperModels])
      expect(models).toContain('whisper-1')
    })

    it('getOpenAITTSModels should return correct models', () => {
      const models = getOpenAITTSModels()
      expect(models).toEqual([...openAITTSModels])
      expect(models).toContain('tts-1')
    })

    it('should return new array instances (not references)', () => {
      const a = getOpenAIRealtimeModels()
      const b = getOpenAIRealtimeModels()
      expect(a).not.toBe(b)
      expect(a).toEqual(b)
    })
  })
})
