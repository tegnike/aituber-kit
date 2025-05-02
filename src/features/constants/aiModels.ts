export const defaultModels = {
  openai: 'gpt-4o-2024-11-20',
  anthropic: 'claude-3-5-sonnet-20241022',
  google: 'gemini-1.5-flash-latest',
  azure: '',
  groq: 'gemma2-9b-it',
  cohere: 'command-r-plus',
  mistralai: 'mistral-large-latest',
  perplexity: 'llama-3-sonar-large-32k-online',
  fireworks: 'accounts/fireworks/models/firefunction-v2',
  deepseek: 'deepseek-chat',
  lmstudio: '',
  ollama: '',
  dify: '',
  'custom-api': '',
}

export const openaiModels = [
  'chatgpt-4o-latest',
  'gpt-4o-mini-2024-07-18',
  'gpt-4o-2024-11-20',
  'gpt-4.5-preview-2025-02-27',
]

export const openaiRealtimeModels = [
  'gpt-4o-realtime-preview-2024-10-01',
  'gpt-4o-realtime-preview-2024-12-17',
  'gpt-4o-mini-realtime-preview-2024-12-17',
]

export const openaiAudioModels = [
  'gpt-4o-audio-preview-2024-10-01',
  'gpt-4o-audio-preview-2024-12-17',
  'gpt-4o-mini-audio-preview-2024-12-17',
]

export const anthropicModels = [
  'claude-3-opus-20240229',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
]

export const googleModels = [
  'gemini-2.0-flash-001',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.5-pro-latest',
]

export const googleSearchGroundingModels = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-2.0-flash-001',
]

export const groqModels = [
  'gemma2-9b-it',
  'llama-3.3-70b-versatile',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
]

export const cohereModels = [
  'command-light',
  'command-light-nightly',
  'command-nightly',
  'command-r',
  'command-r-08-2024',
  'command-r-plus',
  'command-r-plus-08-2024',
]

export const mistralaiModels = [
  'mistral-large-latest',
  'open-mistral-nemo',
  'codestral-latest',
  'mistral-embed',
]

export const perplexityModels = [
  'llama-3.1-sonar-small-128k-online',
  'llama-3.1-sonar-large-128k-online',
  'llama-3.1-sonar-huge-128k-online',
  'llama-3.1-sonar-small-128k-chat',
  'llama-3.1-sonar-large-128k-chat',
]

export const fireworksModels = [
  'accounts/fireworks/models/llama-v3p1-405b-instruct',
  'accounts/fireworks/models/llama-v3p1-70b-instruct',
  'accounts/fireworks/models/llama-v3p1-8b-instruct',
  'accounts/fireworks/models/llama-v3-70b-instruct',
  'accounts/fireworks/models/mixtral-8x22b-instruct',
  'accounts/fireworks/models/mixtral-8x7b-instruct',
  'accounts/fireworks/models/firefunction-v2',
]

export const deepseekModels = ['deepseek-chat', 'deepseek-reasoner']

export const multiModalAIServices = ['openai', 'anthropic', 'google', 'azure']
