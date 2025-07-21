import { AIService } from '@/features/constants/settings'

export interface AIServiceConfig {
  value: AIService
  label: string
  keyLabel?: string
  keyPlaceholder?: string
  linkUrl?: string
  linkLabel?: string
  description?: string
  showMultiModalToggle?: boolean
  customModelValidation?: boolean
}

export const aiServiceOptions: AIServiceConfig[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'xai', label: 'xAI' },
  { value: 'groq', label: 'Groq' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'mistralai', label: 'Mistral AI' },
  { value: 'perplexity', label: 'Perplexity' },
  { value: 'fireworks', label: 'Fireworks' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'lmstudio', label: 'LM Studio' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'dify', label: 'Dify' },
  { value: 'custom-api', label: 'Custom API' },
]

export const getServiceConfigByKey = (
  t: any
): Record<AIService, AIServiceConfig> => ({
  openai: {
    value: 'openai',
    label: 'OpenAI',
    keyLabel: t('OpenAIAPIKeyLabel'),
    keyPlaceholder: 'sk-...',
    linkUrl: 'https://platform.openai.com/account/api-keys',
    linkLabel: 'OpenAI',
    showMultiModalToggle: true,
  },
  anthropic: {
    value: 'anthropic',
    label: 'Anthropic',
    keyLabel: t('AnthropicAPIKeyLabel'),
    keyPlaceholder: 'sk-...',
    linkUrl: 'https://console.anthropic.com',
    linkLabel: 'Anthropic',
    showMultiModalToggle: true,
  },
  google: {
    value: 'google',
    label: 'Google Gemini',
    keyLabel: t('GoogleAPIKeyLabel'),
    linkUrl: 'https://aistudio.google.com/app/apikey?hl=ja',
    linkLabel: 'Google AI Studio',
    showMultiModalToggle: true,
  },
  azure: {
    value: 'azure',
    label: 'Azure OpenAI',
    keyLabel: t('AzureAPIKeyLabel'),
    linkUrl:
      'https://portal.azure.com/#view/Microsoft_Azure_AI/AzureOpenAI/keys',
    linkLabel: 'Azure OpenAI',
  },
  xai: {
    value: 'xai',
    label: 'xAI',
    keyLabel: t('XAIAPIKeyLabel'),
    linkUrl: 'https://x.ai/api',
    linkLabel: 'xAI Dashboard',
    showMultiModalToggle: true,
  },
  groq: {
    value: 'groq',
    label: 'Groq',
    keyLabel: t('GroqAPIKeyLabel'),
    keyPlaceholder: 'xai-...',
    linkUrl: 'https://console.groq.com/keys',
    linkLabel: 'Groq Dashboard',
    showMultiModalToggle: true,
  },
  cohere: {
    value: 'cohere',
    label: 'Cohere',
    keyLabel: t('CohereAPIKeyLabel'),
    linkUrl: 'https://dashboard.cohere.com/api-keys',
    linkLabel: 'Cohere Dashboard',
    showMultiModalToggle: true,
  },
  mistralai: {
    value: 'mistralai',
    label: 'Mistral AI',
    keyLabel: t('MistralAIAPIKeyLabel'),
    linkUrl: 'https://console.mistral.ai/api-keys/',
    linkLabel: 'Mistral AI Dashboard',
    showMultiModalToggle: true,
  },
  perplexity: {
    value: 'perplexity',
    label: 'Perplexity',
    keyLabel: t('PerplexityAPIKeyLabel'),
    linkUrl: 'https://www.perplexity.ai/settings/api',
    linkLabel: 'Perplexity Dashboard',
    showMultiModalToggle: true,
  },
  fireworks: {
    value: 'fireworks',
    label: 'Fireworks',
    keyLabel: t('FireworksAPIKeyLabel'),
    linkUrl: 'https://fireworks.ai/account/api-keys',
    linkLabel: 'Fireworks Dashboard',
    showMultiModalToggle: true,
  },
  deepseek: {
    value: 'deepseek',
    label: 'DeepSeek',
    keyLabel: t('DeepSeekAPIKeyLabel'),
    keyPlaceholder: 'sk-...',
    linkUrl: 'https://platform.deepseek.com/api_keys',
    linkLabel: 'DeepSeek',
    showMultiModalToggle: true,
  },
  openrouter: {
    value: 'openrouter',
    label: 'OpenRouter',
    keyLabel: t('OpenRouterAPIKeyLabel'),
    keyPlaceholder: 'sk-...',
    linkUrl: 'https://openrouter.ai/keys',
    linkLabel: t('OpenRouterDashboardLink', 'OpenRouter Dashboard'),
    showMultiModalToggle: true,
    customModelValidation: false,
  },
  lmstudio: {
    value: 'lmstudio',
    label: 'LM Studio',
    showMultiModalToggle: true,
    customModelValidation: false,
  },
  ollama: {
    value: 'ollama',
    label: 'Ollama',
    showMultiModalToggle: true,
    customModelValidation: false,
  },
  dify: {
    value: 'dify',
    label: 'Dify',
    keyLabel: t('DifyAPIKeyLabel'),
  },
  'custom-api': {
    value: 'custom-api',
    label: 'Custom API',
    showMultiModalToggle: true,
  },
})
