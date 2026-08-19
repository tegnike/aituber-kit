import { logger } from '@/lib/logger'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { ReactNode, useEffect, useState } from 'react'
import { Listbox } from '@headlessui/react'
import settingsStore from '@/features/stores/settings'
import menuStore from '@/features/stores/menu'
import {
  AIService,
  AIVoice,
  Language,
  OpenAITTSModel,
  OpenAITTSVoice,
} from '@/features/constants/settings'
import { getOpenAITTSModels } from '@/features/constants/aiModels'
import { ModelSelector } from '@/components/settings/modelProvider/ModelSelector'
import { ApiKeyInput } from '@/components/settings/modelProvider/ApiKeyInput'
import { ServiceLogo } from '@/components/settings/modelProvider/ServiceLogo'
import {
  aiServiceOptions,
  getServiceConfigByKey,
} from '@/components/settings/modelProvider/utils/aiServiceConfigs'
import { useAIServiceHandlers } from '@/components/settings/modelProvider/hooks/useAIServiceHandlers'
import { useModelProviderState } from '@/components/settings/modelProvider/hooks/useModelProviderState'
import { ToggleSwitch } from '@/components/toggleSwitch'
import { languageOptions } from '@/components/settings/languageOptions'
import speakers from '@/components/speakers.json'
import { settingsFieldWidth } from '@/components/settings/formStyles'

type SpeakerOption = {
  id: number | string
  speaker: string
}

const inputClassName =
  'theme-surface-control w-full rounded-lg border px-4 py-2 text-theme-default outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

const selectButtonClassName =
  'theme-surface-control flex w-full cursor-pointer items-center justify-between rounded-lg border px-4 py-2 text-left shadow-sm transition hover:border-primary/40 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'

const choiceControlClassName = settingsFieldWidth.medium

const quickGridClassName = 'mt-4 grid gap-4 sm:grid-cols-2'

const openAITTSVoiceOptions: OpenAITTSVoice[] = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
]

type QuickStartDestination =
  | 'based'
  | 'character'
  | 'ai'
  | 'memory'
  | 'voice'
  | 'speechInput'
  | 'youtube'
  | 'idle'
  | 'other'

const isSpeakerOption = (value: unknown): value is SpeakerOption => {
  if (typeof value !== 'object' || value === null) return false

  const speakerOption = value as {
    id?: unknown
    speaker?: unknown
  }

  return (
    (typeof speakerOption.id === 'number' ||
      typeof speakerOption.id === 'string') &&
    typeof speakerOption.speaker === 'string'
  )
}

const QuickStart = () => {
  const { t } = useTranslation()
  const modelState = useModelProviderState()
  const { handleAIServiceChange, updateMultiModalModeForModel } =
    useAIServiceHandlers()
  const serviceConfig =
    getServiceConfigByKey(t)[modelState.selectAIService as AIService]
  const selectedServiceOption = aiServiceOptions.find(
    (option) => option.value === modelState.selectAIService
  )

  const characterName = settingsStore((s) => s.characterName)
  const userDisplayName = settingsStore((s) => s.userDisplayName)
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const selectVoice = settingsStore((s) => s.selectVoice)
  const showAssistantText = settingsStore((s) => s.showAssistantText)
  const showCharacterName = settingsStore((s) => s.showCharacterName)
  const koeiromapKey = settingsStore((s) => s.koeiromapKey)
  const googleTtsType = settingsStore((s) => s.googleTtsType)
  const voicevoxSpeaker = settingsStore((s) => s.voicevoxSpeaker)
  const voicevoxServerUrl = settingsStore((s) => s.voicevoxServerUrl)
  const aivisSpeechSpeaker = settingsStore((s) => s.aivisSpeechSpeaker)
  const aivisSpeechServerUrl = settingsStore((s) => s.aivisSpeechServerUrl)
  const aivisCloudApiKey = settingsStore((s) => s.aivisCloudApiKey)
  const aivisCloudModelUuid = settingsStore((s) => s.aivisCloudModelUuid)
  const aivisCloudStyleId = settingsStore((s) => s.aivisCloudStyleId)
  const aivisCloudStyleName = settingsStore((s) => s.aivisCloudStyleName)
  const aivisCloudUseStyleName = settingsStore((s) => s.aivisCloudUseStyleName)
  const stylebertvits2ServerUrl = settingsStore(
    (s) => s.stylebertvits2ServerUrl
  )
  const stylebertvits2ApiKey = settingsStore((s) => s.stylebertvits2ApiKey)
  const stylebertvits2ModelId = settingsStore((s) => s.stylebertvits2ModelId)
  const stylebertvits2Style = settingsStore((s) => s.stylebertvits2Style)
  const gsviTtsServerUrl = settingsStore((s) => s.gsviTtsServerUrl)
  const gsviTtsModelId = settingsStore((s) => s.gsviTtsModelId)
  const elevenlabsApiKey = settingsStore((s) => s.elevenlabsApiKey)
  const elevenlabsVoiceId = settingsStore((s) => s.elevenlabsVoiceId)
  const cartesiaApiKey = settingsStore((s) => s.cartesiaApiKey)
  const cartesiaVoiceId = settingsStore((s) => s.cartesiaVoiceId)
  const openaiTTSVoice = settingsStore((s) => s.openaiTTSVoice)
  const openaiTTSModel = settingsStore((s) => s.openaiTTSModel)
  const azureTTSKey = settingsStore((s) => s.azureTTSKey)
  const azureTTSEndpoint = settingsStore((s) => s.azureTTSEndpoint)
  const [aivisSpeakers, setAivisSpeakers] = useState<SpeakerOption[]>([])

  useEffect(() => {
    if (selectVoice !== 'aivis_speech') return

    const fetchAivisSpeakers = async () => {
      try {
        const response = await fetch('/speakers_aivis.json')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: unknown = await response.json()
        setAivisSpeakers(
          Array.isArray(data) ? data.filter(isSpeakerOption) : []
        )
      } catch (error) {
        logger.error('Failed to fetch AIVIS speakers:', error)
        setAivisSpeakers([])
      }
    }

    fetchAivisSpeakers()
  }, [selectVoice])

  const goTo = (tab: QuickStartDestination) => {
    menuStore.setState({
      activeSettingsTab: tab,
      settingsSearchQuery: '',
    })
  }

  const getSelectedServiceApiKey = () => {
    switch (modelState.selectAIService) {
      case 'openai':
        return modelState.openaiKey
      case 'anthropic':
        return modelState.anthropicKey
      case 'google':
        return modelState.googleKey
      case 'azure':
        return modelState.azureKey
      case 'xai':
        return modelState.xaiKey
      case 'groq':
        return modelState.groqKey
      case 'cohere':
        return modelState.cohereKey
      case 'mistralai':
        return modelState.mistralaiKey
      case 'perplexity':
        return modelState.perplexityKey
      case 'fireworks':
        return modelState.fireworksKey
      case 'deepseek':
        return modelState.deepseekKey
      case 'openrouter':
        return modelState.openrouterKey
      case 'orcarouter':
        return modelState.orcarouterKey
      case 'dify':
        return modelState.difyKey
      default:
        return ''
    }
  }

  const updateSelectedServiceApiKey = (value: string) => {
    switch (modelState.selectAIService) {
      case 'openai':
        settingsStore.setState({ openaiKey: value })
        break
      case 'anthropic':
        settingsStore.setState({ anthropicKey: value })
        break
      case 'google':
        settingsStore.setState({ googleKey: value })
        break
      case 'azure':
        settingsStore.setState({ azureKey: value })
        break
      case 'xai':
        settingsStore.setState({ xaiKey: value })
        break
      case 'groq':
        settingsStore.setState({ groqKey: value })
        break
      case 'cohere':
        settingsStore.setState({ cohereKey: value })
        break
      case 'mistralai':
        settingsStore.setState({ mistralaiKey: value })
        break
      case 'perplexity':
        settingsStore.setState({ perplexityKey: value })
        break
      case 'fireworks':
        settingsStore.setState({ fireworksKey: value })
        break
      case 'deepseek':
        settingsStore.setState({ deepseekKey: value })
        break
      case 'openrouter':
        settingsStore.setState({ openrouterKey: value })
        break
      case 'orcarouter':
        settingsStore.setState({ orcarouterKey: value })
        break
      case 'dify':
        settingsStore.setState({ difyKey: value })
        break
    }
  }

  const handleModelChange = (model: string) => {
    settingsStore.setState({ selectAIModel: model })
    updateMultiModalModeForModel(modelState.selectAIService as AIService, model)
  }

  const renderQuickAIServiceSettings = () => {
    switch (modelState.selectAIService) {
      case 'azure':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('AzureEndpoint')}>
              <input
                className={inputClassName}
                value={modelState.azureEndpoint}
                onChange={(e) =>
                  settingsStore.setState({ azureEndpoint: e.target.value })
                }
                placeholder="https://resource.openai.azure.com/openai/deployments/deployment/chat/completions?api-version=2024-10-21"
              />
            </LabeledField>
          </div>
        )
      case 'dify':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('EnterURL')}>
              <input
                className={inputClassName}
                value={modelState.difyUrl}
                onChange={(e) =>
                  settingsStore.setState({ difyUrl: e.target.value })
                }
                placeholder="https://api.dify.ai/v1/chat-messages"
              />
            </LabeledField>
          </div>
        )
      case 'lmstudio':
      case 'ollama':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('EnterURL')}>
              <input
                className={inputClassName}
                value={modelState.localLlmUrl}
                onChange={(e) =>
                  settingsStore.setState({ localLlmUrl: e.target.value })
                }
                placeholder={
                  modelState.selectAIService === 'ollama'
                    ? 'http://localhost:11434'
                    : 'http://localhost:1234/v1'
                }
              />
            </LabeledField>
            <LabeledField label={t('SelectModel')}>
              <input
                className={inputClassName}
                value={modelState.selectAIModel}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder="model-name"
              />
            </LabeledField>
          </div>
        )
      case 'openrouter':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('SelectModel')}>
              <input
                className={inputClassName}
                value={modelState.selectAIModel}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder="openai/gpt-4o"
              />
            </LabeledField>
          </div>
        )
      case 'orcarouter':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('SelectModel')}>
              <input
                className={inputClassName}
                value={modelState.selectAIModel}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder="openai/gpt-4o-mini"
              />
            </LabeledField>
          </div>
        )
      case 'custom-api':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('CustomAPIEndpoint')}>
              <input
                className={inputClassName}
                value={modelState.customApiUrl}
                onChange={(e) =>
                  settingsStore.setState({ customApiUrl: e.target.value })
                }
                placeholder="https://example.com/api/chat"
              />
            </LabeledField>
          </div>
        )
      default:
        return (
          <div className="-my-2">
            <ModelSelector
              aiService={modelState.selectAIService as AIService}
              selectedModel={modelState.selectAIModel}
              customModel={modelState.customModel}
              onModelChange={handleModelChange}
              onCustomModelToggle={() =>
                settingsStore.setState({ customModel: !modelState.customModel })
              }
            />
          </div>
        )
    }
  }

  const renderQuickVoiceSettings = () => {
    switch (selectVoice) {
      case 'koeiromap':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('APIKey')}>
              <input
                className={inputClassName}
                type="password"
                value={koeiromapKey}
                onChange={(e) =>
                  settingsStore.setState({ koeiromapKey: e.target.value })
                }
                placeholder="..."
              />
            </LabeledField>
          </div>
        )
      case 'voicevox':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('VoicevoxServerUrl')}>
              <input
                className={inputClassName}
                value={voicevoxServerUrl}
                onChange={(e) =>
                  settingsStore.setState({ voicevoxServerUrl: e.target.value })
                }
                placeholder="http://localhost:50021"
              />
            </LabeledField>
            <LabeledField label={t('SpeakerSelection')}>
              <select
                className={inputClassName}
                value={voicevoxSpeaker}
                onChange={(e) =>
                  settingsStore.setState({ voicevoxSpeaker: e.target.value })
                }
              >
                <option value="">{t('Select')}</option>
                {(speakers as SpeakerOption[]).map((speaker) => (
                  <option key={speaker.id} value={speaker.id}>
                    {speaker.speaker}
                  </option>
                ))}
              </select>
            </LabeledField>
          </div>
        )
      case 'google':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('LanguageChoice')}>
              <input
                className={inputClassName}
                value={googleTtsType}
                onChange={(e) =>
                  settingsStore.setState({ googleTtsType: e.target.value })
                }
                placeholder="ja-JP-Neural2-B"
              />
            </LabeledField>
          </div>
        )
      case 'stylebertvits2':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('StyleBeatVITS2ServerURL')}>
              <input
                className={inputClassName}
                value={stylebertvits2ServerUrl}
                onChange={(e) =>
                  settingsStore.setState({
                    stylebertvits2ServerUrl: e.target.value,
                  })
                }
                placeholder="http://localhost:5000"
              />
            </LabeledField>
            <LabeledField label={t('APIKey')}>
              <input
                className={inputClassName}
                type="password"
                value={stylebertvits2ApiKey}
                onChange={(e) =>
                  settingsStore.setState({
                    stylebertvits2ApiKey: e.target.value,
                  })
                }
                placeholder="..."
              />
            </LabeledField>
            <LabeledField label={t('StyleBeatVITS2ModelID')}>
              <input
                className={inputClassName}
                value={stylebertvits2ModelId}
                onChange={(e) =>
                  settingsStore.setState({
                    stylebertvits2ModelId: e.target.value,
                  })
                }
                placeholder="0"
              />
            </LabeledField>
            <LabeledField label={t('StyleBeatVITS2Style')}>
              <input
                className={inputClassName}
                value={stylebertvits2Style}
                onChange={(e) =>
                  settingsStore.setState({
                    stylebertvits2Style: e.target.value,
                  })
                }
                placeholder="Neutral"
              />
            </LabeledField>
          </div>
        )
      case 'aivis_speech':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('AivisSpeechServerUrl')}>
              <input
                className={inputClassName}
                value={aivisSpeechServerUrl}
                onChange={(e) =>
                  settingsStore.setState({
                    aivisSpeechServerUrl: e.target.value,
                  })
                }
                placeholder="http://localhost:10101"
              />
            </LabeledField>
            <LabeledField label={t('SpeakerSelection')}>
              <select
                className={inputClassName}
                value={aivisSpeechSpeaker}
                onChange={(e) =>
                  settingsStore.setState({
                    aivisSpeechSpeaker: e.target.value,
                  })
                }
              >
                <option value="">{t('Select')}</option>
                {aivisSpeakers.map((speaker) => (
                  <option key={speaker.id} value={speaker.id}>
                    {speaker.speaker}
                  </option>
                ))}
              </select>
            </LabeledField>
          </div>
        )
      case 'aivis_cloud_api':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('APIKey')}>
              <input
                className={inputClassName}
                type="password"
                value={aivisCloudApiKey}
                onChange={(e) =>
                  settingsStore.setState({
                    aivisCloudApiKey: e.target.value,
                  })
                }
                placeholder="..."
              />
            </LabeledField>
            <LabeledField label={t('ModelUUID')}>
              <input
                className={inputClassName}
                value={aivisCloudModelUuid}
                onChange={(e) =>
                  settingsStore.setState({
                    aivisCloudModelUuid: e.target.value,
                  })
                }
                placeholder="..."
              />
            </LabeledField>
            <div className="sm:col-span-2">
              <InlineToggle
                label={t('UseStyleName')}
                enabled={aivisCloudUseStyleName}
                onChange={(value) =>
                  settingsStore.setState({
                    aivisCloudUseStyleName: value,
                  })
                }
              />
            </div>
            {aivisCloudUseStyleName ? (
              <LabeledField label={t('StyleName')}>
                <input
                  className={inputClassName}
                  value={aivisCloudStyleName}
                  onChange={(e) =>
                    settingsStore.setState({
                      aivisCloudStyleName: e.target.value,
                    })
                  }
                  placeholder={t('StyleNamePlaceholder')}
                />
              </LabeledField>
            ) : (
              <LabeledField label={t('StyleID')}>
                <input
                  className={inputClassName}
                  type="number"
                  value={aivisCloudStyleId}
                  onChange={(e) => {
                    const styleId = Number.parseInt(e.target.value, 10)
                    settingsStore.setState({
                      aivisCloudStyleId: Number.isNaN(styleId) ? 0 : styleId,
                    })
                  }}
                  placeholder="0"
                />
              </LabeledField>
            )}
          </div>
        )
      case 'gsvitts':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('GSVITTSServerUrl')}>
              <input
                className={inputClassName}
                value={gsviTtsServerUrl}
                onChange={(e) =>
                  settingsStore.setState({ gsviTtsServerUrl: e.target.value })
                }
                placeholder="http://127.0.0.1:5000/tts"
              />
            </LabeledField>
            <LabeledField label={t('GSVITTSModelID')}>
              <input
                className={inputClassName}
                value={gsviTtsModelId}
                onChange={(e) =>
                  settingsStore.setState({ gsviTtsModelId: e.target.value })
                }
                placeholder="0"
              />
            </LabeledField>
          </div>
        )
      case 'elevenlabs':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('APIKey')}>
              <input
                className={inputClassName}
                type="password"
                value={elevenlabsApiKey}
                onChange={(e) =>
                  settingsStore.setState({ elevenlabsApiKey: e.target.value })
                }
                placeholder="..."
              />
            </LabeledField>
            <LabeledField label={t('ElevenLabsVoiceId')}>
              <input
                className={inputClassName}
                value={elevenlabsVoiceId}
                onChange={(e) =>
                  settingsStore.setState({ elevenlabsVoiceId: e.target.value })
                }
                placeholder="..."
              />
            </LabeledField>
          </div>
        )
      case 'cartesia':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('APIKey')}>
              <input
                className={inputClassName}
                type="password"
                value={cartesiaApiKey}
                onChange={(e) =>
                  settingsStore.setState({ cartesiaApiKey: e.target.value })
                }
                placeholder="..."
              />
            </LabeledField>
            <LabeledField label={t('CartesiaVoiceId')}>
              <input
                className={inputClassName}
                value={cartesiaVoiceId}
                onChange={(e) =>
                  settingsStore.setState({ cartesiaVoiceId: e.target.value })
                }
                placeholder="..."
              />
            </LabeledField>
          </div>
        )
      case 'openai':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('OpenAIAPIKeyLabel')}>
              <input
                className={inputClassName}
                type="password"
                value={modelState.openaiKey}
                onChange={(e) =>
                  settingsStore.setState({ openaiKey: e.target.value })
                }
                placeholder="sk-..."
              />
            </LabeledField>
            <LabeledField label={t('OpenAITTSVoice')}>
              <select
                className={inputClassName}
                value={openaiTTSVoice}
                onChange={(e) =>
                  settingsStore.setState({
                    openaiTTSVoice: e.target.value as OpenAITTSVoice,
                  })
                }
              >
                {openAITTSVoiceOptions.map((voice) => (
                  <option key={voice} value={voice}>
                    {voice}
                  </option>
                ))}
              </select>
            </LabeledField>
            <LabeledField label={t('OpenAITTSModel')}>
              <select
                className={inputClassName}
                value={openaiTTSModel}
                onChange={(e) =>
                  settingsStore.setState({
                    openaiTTSModel: e.target.value as OpenAITTSModel,
                  })
                }
              >
                {getOpenAITTSModels().map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </LabeledField>
          </div>
        )
      case 'azure':
        return (
          <div className={quickGridClassName}>
            <LabeledField label={t('AzureAPIKeyLabel')}>
              <input
                className={inputClassName}
                type="password"
                value={azureTTSKey}
                onChange={(e) =>
                  settingsStore.setState({ azureTTSKey: e.target.value })
                }
                placeholder="..."
              />
            </LabeledField>
            <LabeledField label={t('AzureEndpoint')}>
              <input
                className={inputClassName}
                value={azureTTSEndpoint}
                onChange={(e) =>
                  settingsStore.setState({ azureTTSEndpoint: e.target.value })
                }
                placeholder="https://resource.openai.azure.com/openai/deployments/deployment/audio/speech?api-version=2024-05-01-preview"
              />
            </LabeledField>
            <LabeledField label={t('OpenAITTSVoice')}>
              <select
                className={inputClassName}
                value={openaiTTSVoice}
                onChange={(e) =>
                  settingsStore.setState({
                    openaiTTSVoice: e.target.value as OpenAITTSVoice,
                  })
                }
              >
                {openAITTSVoiceOptions.map((voice) => (
                  <option key={voice} value={voice}>
                    {voice}
                  </option>
                ))}
              </select>
            </LabeledField>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-theme">
            1
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold">{t('QuickStartTitle')}</div>
            <p className="mt-1 text-sm leading-6 text-text-primary">
              {t('QuickStartDescription')}
            </p>
          </div>
        </div>
      </div>

      <QuickSection
        title={t('QuickStartBasicsTitle')}
        description={t('QuickStartBasicsDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledField label={t('CharacterName')}>
            <input
              className="w-full rounded-lg bg-white px-4 py-2 hover:bg-white-hover"
              value={characterName}
              onChange={(e) =>
                settingsStore.setState({ characterName: e.target.value })
              }
            />
          </LabeledField>
          <LabeledField label={t('UserDisplayName')}>
            <input
              className="w-full rounded-lg bg-white px-4 py-2 hover:bg-white-hover"
              value={userDisplayName}
              onChange={(e) =>
                settingsStore.setState({ userDisplayName: e.target.value })
              }
            />
          </LabeledField>
          <LabeledField label={t('Language')}>
            <select
              className="w-full rounded-lg bg-white px-4 py-2 hover:bg-white-hover"
              value={selectLanguage}
              onChange={(e) => {
                const language = e.target.value as Language
                settingsStore.setState({ selectLanguage: language })
                i18n.changeLanguage(language)
              }}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </LabeledField>
        </div>
        <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-3">
          <InlineToggle
            label={t('ShowAssistantText')}
            enabled={showAssistantText}
            onChange={(value) =>
              settingsStore.setState({ showAssistantText: value })
            }
          />
          <InlineToggle
            label={t('ShowCharacterName')}
            enabled={showCharacterName}
            onChange={(value) =>
              settingsStore.setState({ showCharacterName: value })
            }
          />
        </div>
        <div className="mt-4">
          <DetailLink
            label={t('QuickStartDetailedDisplaySettings')}
            onClick={() => goTo('based')}
          />
        </div>
      </QuickSection>

      <QuickSection
        title={t('QuickStartAIConversationTitle')}
        description={t('QuickStartAIConversationDescription')}
      >
        <LabeledField label={t('SelectAIService')}>
          <Listbox
            value={modelState.selectAIService}
            onChange={(value) => handleAIServiceChange(value as AIService)}
          >
            <div className={`relative ${choiceControlClassName}`}>
              <Listbox.Button className={selectButtonClassName}>
                <span className="flex min-w-0 items-center">
                  <ServiceLogo service={modelState.selectAIService} />
                  <span className="truncate">
                    {selectedServiceOption?.label}
                  </span>
                </span>
                <span className="ml-3 text-secondary">⌄</span>
              </Listbox.Button>
              <Listbox.Options className="theme-surface-popover absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-primary/20 py-2 shadow-lg focus:outline-none">
                {aiServiceOptions.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `relative cursor-pointer select-none px-4 py-2 ${
                        active ? 'bg-white-hover' : ''
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex min-w-0 items-center">
                        <ServiceLogo service={option.value} />
                        <span
                          className={`truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {option.label}
                        </span>
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </LabeledField>
        {serviceConfig?.keyLabel && (
          <ApiKeyInput
            label={serviceConfig.keyLabel}
            value={getSelectedServiceApiKey()}
            onChange={updateSelectedServiceApiKey}
            placeholder={serviceConfig.keyPlaceholder}
            linkUrl={serviceConfig.linkUrl}
            linkLabel={serviceConfig.linkLabel}
            description={serviceConfig.description}
          />
        )}
        {renderQuickAIServiceSettings()}
        <div className="mt-3 flex flex-wrap gap-3">
          <DetailLink
            label={t('QuickStartDetailedAISettings')}
            onClick={() => goTo('ai')}
          />
          <DetailLink
            label={t('QuickStartDetailedMemorySettings')}
            onClick={() => goTo('memory')}
          />
        </div>
      </QuickSection>

      <QuickSection
        title={t('QuickStartVoiceTitle')}
        description={t('QuickStartVoiceDescription')}
      >
        <LabeledField label={t('SyntheticVoiceEngineChoice')}>
          <select
            value={selectVoice}
            onChange={(e) =>
              settingsStore.setState({
                selectVoice: e.target.value as AIVoice,
              })
            }
            className={`${inputClassName} ${choiceControlClassName}`}
          >
            <option value="voicevox">{t('UsingVoiceVox')}</option>
            <option value="koeiromap">{t('UsingKoeiromap')}</option>
            <option value="google">{t('UsingGoogleTTS')}</option>
            <option value="stylebertvits2">{t('UsingStyleBertVITS2')}</option>
            <option value="aivis_speech">{t('UsingAivisSpeech')}</option>
            <option value="aivis_cloud_api">{t('UsingAivisCloudAPI')}</option>
            <option value="gsvitts">{t('UsingGSVITTS')}</option>
            <option value="elevenlabs">{t('UsingElevenLabs')}</option>
            <option value="cartesia">{t('UsingCartesia')}</option>
            <option value="openai">{t('UsingOpenAITTS')}</option>
            <option value="azure">{t('UsingAzureTTS')}</option>
          </select>
        </LabeledField>
        {renderQuickVoiceSettings()}
        <div className="mt-3 flex flex-wrap gap-3">
          <DetailLink
            label={t('QuickStartDetailedVoiceSettings')}
            onClick={() => goTo('voice')}
          />
          <DetailLink
            label={t('QuickStartSpeechInputSettings')}
            onClick={() => goTo('speechInput')}
          />
        </div>
      </QuickSection>

      <QuickSection
        title={t('QuickStartOptionalFeaturesTitle')}
        description={t('QuickStartOptionalFeaturesDescription')}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLink
            label={t('CharacterSettings')}
            onClick={() => goTo('character')}
          />
          <DetailLink
            label={t('YoutubeSettings')}
            onClick={() => goTo('youtube')}
          />
          <DetailLink label={t('IdleSettings')} onClick={() => goTo('idle')} />
          <DetailLink
            label={t('OtherSettings')}
            onClick={() => goTo('other')}
          />
        </div>
      </QuickSection>
    </div>
  )
}

const QuickSection = ({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) => (
  <section className="pt-0">
    <h2 className="text-xl font-bold">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
    <div className="mt-4">{children}</div>
  </section>
)

const LabeledField = ({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-primary">
      {label}
    </span>
    {children}
  </label>
)

const InlineToggle = ({
  enabled,
  label,
  onChange,
}: {
  enabled: boolean
  label: string
  onChange: (value: boolean) => void
}) => (
  <div className="flex min-h-[32px] items-center gap-2">
    <ToggleSwitch enabled={enabled} onChange={onChange} />
    <span className="text-sm font-bold">{label}</span>
  </div>
)

const DetailLink = ({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) => (
  <button
    className="inline-flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-white/70 px-3 py-2 text-left text-sm font-bold text-text1 shadow-sm transition hover:border-primary hover:bg-primary/10 hover:text-primary"
    onClick={onClick}
  >
    <span>{label}</span>
    <span className="text-secondary">→</span>
  </button>
)

export default QuickStart
