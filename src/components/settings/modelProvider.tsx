import { useTranslation } from 'react-i18next'
import { Listbox } from '@headlessui/react'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { ServiceLogo } from './modelProvider/ServiceLogo'
import { GenericAIServiceConfig } from './modelProvider/GenericAIServiceConfig'
import { OpenAIConfig } from './modelProvider/OpenAIConfig'
import { GoogleConfig } from './modelProvider/GoogleConfig'
import { AzureConfig } from './modelProvider/AzureConfig'
import { OpenRouterConfig } from './modelProvider/OpenRouterConfig'
import { MultiModalToggle } from './modelProvider/MultiModalToggle'
import { useModelProviderState } from './modelProvider/hooks/useModelProviderState'
import { useAIServiceHandlers } from './modelProvider/hooks/useAIServiceHandlers'
import {
  aiServiceOptions,
  getServiceConfigByKey,
} from './modelProvider/utils/aiServiceConfigs'
import { AIService } from '@/features/constants/settings'

const ModelProvider = () => {
  const { t } = useTranslation()
  const state = useModelProviderState()
  const { updateMultiModalModeForModel, handleAIServiceChange } =
    useAIServiceHandlers()

  if (state.externalLinkageMode) return null

  const selectedServiceOption = aiServiceOptions.find(
    (option) => option.value === state.selectAIService
  )

  const serviceConfigs = getServiceConfigByKey(t)

  const renderServiceConfiguration = () => {
    const { selectAIService } = state

    switch (selectAIService) {
      case 'openai':
        return (
          <OpenAIConfig
            openaiKey={state.openaiKey}
            realtimeAPIMode={state.realtimeAPIMode}
            audioMode={state.audioMode}
            realtimeAPIModeContentType={state.realtimeAPIModeContentType}
            realtimeAPIModeVoice={state.realtimeAPIModeVoice}
            audioModeInputType={state.audioModeInputType}
            audioModeVoice={state.audioModeVoice}
            selectAIModel={state.selectAIModel}
            customModel={state.customModel}
            enableMultiModal={state.enableMultiModal}
            multiModalMode={state.multiModalMode}
            updateMultiModalModeForModel={updateMultiModalModeForModel}
          />
        )

      case 'google':
        return (
          <GoogleConfig
            googleKey={state.googleKey}
            selectAIModel={state.selectAIModel}
            customModel={state.customModel}
            enableMultiModal={state.enableMultiModal}
            useSearchGrounding={state.useSearchGrounding}
            dynamicRetrievalThreshold={state.dynamicRetrievalThreshold}
            updateMultiModalModeForModel={updateMultiModalModeForModel}
          />
        )

      case 'azure':
        return (
          <AzureConfig
            azureKey={state.azureKey}
            azureEndpoint={state.azureEndpoint}
            realtimeAPIMode={state.realtimeAPIMode}
            realtimeAPIModeContentType={state.realtimeAPIModeContentType}
            realtimeAPIModeVoice={state.realtimeAPIModeVoice}
            enableMultiModal={state.enableMultiModal}
          />
        )

      case 'openrouter':
        return (
          <OpenRouterConfig
            openrouterKey={state.openrouterKey}
            selectAIModel={state.selectAIModel}
            enableMultiModal={state.enableMultiModal}
          />
        )

      case 'lmstudio':
      case 'ollama':
        return (
          <>
            <div className="my-6">
              <div className="my-4">{t('LocalLLMInfo')}</div>
              <div className="my-4 text-xl font-bold">{t('EnterURL')}</div>
              <div className="my-4">
                {t('LocalLLMInfo2')}
                <br />
                {selectAIService === 'ollama' && (
                  <>
                    ex. http://localhost:11434/api
                    <br />
                  </>
                )}
                {selectAIService === 'lmstudio' && (
                  <>ex. http://localhost:1234/v1</>
                )}
              </div>
              <input
                className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                type="text"
                placeholder="..."
                value={state.localLlmUrl}
                onChange={(e) =>
                  settingsStore.setState({ localLlmUrl: e.target.value })
                }
              />
            </div>
            <div className="my-6">
              <div className="my-4 text-xl font-bold">{t('SelectModel')}</div>
              <input
                className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                type="text"
                placeholder="..."
                value={state.selectAIModel}
                onChange={(e) =>
                  settingsStore.setState({ selectAIModel: e.target.value })
                }
              />
            </div>
            <MultiModalToggle
              enabled={state.enableMultiModal}
              onToggle={() =>
                settingsStore.setState({
                  enableMultiModal: !state.enableMultiModal,
                })
              }
            />
          </>
        )

      case 'dify':
        return (
          <>
            <div className="my-6">
              <div className="my-4">{t('DifyInfo')}</div>
              <div className="my-4 text-xl font-bold">
                {t('DifyAPIKeyLabel')}
              </div>
              <input
                className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                type="password"
                placeholder="..."
                value={state.difyKey}
                onChange={(e) =>
                  settingsStore.setState({ difyKey: e.target.value })
                }
              />
            </div>
            <div className="my-6">
              <div className="my-4 text-xl font-bold">{t('EnterURL')}</div>
              <div className="my-4">{t('DifyInfo3')}</div>
              <input
                className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                type="text"
                placeholder="..."
                value={state.difyUrl}
                onChange={(e) =>
                  settingsStore.setState({ difyUrl: e.target.value })
                }
              />
            </div>
          </>
        )

      case 'custom-api':
        return (
          <>
            <div className="my-6">
              <div className="my-4 text-xl font-bold">
                {t('CustomAPIEndpoint')}
              </div>
              <div className="my-4">{t('CustomAPIEndpointInfo')}</div>
              <input
                className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                type="text"
                placeholder="https://example.com/api/chat"
                value={state.customApiUrl}
                onChange={(e) =>
                  settingsStore.setState({ customApiUrl: e.target.value })
                }
              />
            </div>
            <div className="my-6">
              <div className="my-4 text-xl font-bold">
                {t('CustomAPIStream')}
              </div>
              <div className="">{t('CustomAPIStreamForced')}</div>
              <div className="my-2">
                <TextButton
                  onClick={() =>
                    settingsStore.setState({ customApiStream: true })
                  }
                  disabled={true}
                >
                  {t('StatusOn')}
                </TextButton>
              </div>
            </div>
            <div className="my-6">
              <div className="my-4 text-xl font-bold">
                {t('CustomAPIHeaders')}
              </div>
              <div className="my-4">{t('CustomAPIHeadersInfo')}</div>
              <textarea
                className="text-ellipsis px-4 py-2 w-full h-32 bg-white hover:bg-white-hover rounded-lg"
                placeholder={`{\\n  \"Authorization\": \"Bearer YOUR_TOKEN\",\\n  \"Content-Type\": \"application/json\"\\n}`}
                value={state.customApiHeaders}
                onChange={(e) =>
                  settingsStore.setState({ customApiHeaders: e.target.value })
                }
              />
            </div>
            <div className="my-6">
              <div className="my-4 text-xl font-bold">{t('CustomAPIBody')}</div>
              <div className="my-4">{t('CustomAPIBodyInfo')}</div>
              <textarea
                className="text-ellipsis px-4 py-2 w-full h-32 bg-white hover:bg-white-hover rounded-lg"
                placeholder={`{\\n  \"model\": \"your-model\",\\n  \"temperature\": 0.7,\\n  \"max_tokens\": 2000\\n}`}
                value={state.customApiBody}
                onChange={(e) =>
                  settingsStore.setState({ customApiBody: e.target.value })
                }
              />
            </div>
            <div className="my-6">
              <div className="my-4 text-sm">{t('CustomAPIDescription')}</div>
            </div>
            <div className="my-6">
              <div className="my-4 text-xl font-bold">
                {t('IncludeSystemMessages')}
              </div>
              <div className="my-2">
                <TextButton
                  onClick={() =>
                    settingsStore.setState({
                      includeSystemMessagesInCustomApi:
                        !state.includeSystemMessagesInCustomApi,
                    })
                  }
                >
                  {state.includeSystemMessagesInCustomApi
                    ? t('StatusOn')
                    : t('StatusOff')}
                </TextButton>
              </div>
            </div>
            <MultiModalToggle
              enabled={state.enableMultiModal}
              onToggle={() =>
                settingsStore.setState({
                  enableMultiModal: !state.enableMultiModal,
                })
              }
            />
            {state.enableMultiModal && (
              <div className="my-6">
                <div className="my-4 text-xl font-bold">
                  {t('CustomApiIncludeMimeType')}
                </div>
                <div className="my-2 text-sm">
                  {t('CustomApiIncludeMimeTypeDescription')}
                </div>
                <div className="my-2">
                  <TextButton
                    onClick={() =>
                      settingsStore.setState({
                        customApiIncludeMimeType:
                          !state.customApiIncludeMimeType,
                      })
                    }
                  >
                    {state.customApiIncludeMimeType
                      ? t('StatusOn')
                      : t('StatusOff')}
                  </TextButton>
                </div>
              </div>
            )}
          </>
        )

      default:
        const config = serviceConfigs[selectAIService]
        if (!config) return null

        const apiKeyMap: Record<string, string> = {
          anthropic: state.anthropicKey,
          xai: state.xaiKey,
          groq: state.groqKey,
          cohere: state.cohereKey,
          mistralai: state.mistralaiKey,
          perplexity: state.perplexityKey,
          fireworks: state.fireworksKey,
          deepseek: state.deepseekKey,
        }

        return (
          <GenericAIServiceConfig
            service={selectAIService}
            apiKey={apiKeyMap[selectAIService] || ''}
            selectAIModel={state.selectAIModel}
            customModel={state.customModel}
            enableMultiModal={state.enableMultiModal}
            updateMultiModalModeForModel={updateMultiModalModeForModel}
            config={config}
          />
        )
    }
  }

  return (
    <div className="mt-6">
      <div className="my-4 text-xl font-bold">{t('SelectAIService')}</div>
      <div className="my-2">
        <Listbox
          value={state.selectAIService}
          onChange={(value) => handleAIServiceChange(value as AIService)}
        >
          <div className="relative inline-block min-w-[240px]">
            <Listbox.Button className="w-full px-4 py-2 bg-white hover:bg-white-hover rounded-lg flex items-center cursor-pointer">
              <ServiceLogo service={state.selectAIService as any} />
              <span>{selectedServiceOption?.label}</span>
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 top-[-170px] w-auto min-w-full overflow-auto rounded-lg bg-white py-2 shadow-lg focus:outline-none">
              {aiServiceOptions.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 px-4 whitespace-nowrap ${
                      active ? 'bg-white-hover' : ''
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center">
                      <ServiceLogo service={option.value as any} />
                      <span
                        className={selected ? 'font-medium' : 'font-normal'}
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
      </div>

      {renderServiceConfiguration()}

      {state.selectAIService !== 'dify' && (
        <>
          <div className="my-6">
            <div className="my-4 text-xl font-bold">{t('MaxPastMessages')}</div>
            <div className="my-2">
              <input
                type="number"
                min="1"
                max="9999"
                className="px-4 py-2 w-24 bg-white hover:bg-white-hover rounded-lg"
                value={state.maxPastMessages}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (!Number.isNaN(value) && value >= 1 && value <= 9999) {
                    settingsStore.setState({ maxPastMessages: value })
                  }
                }}
              />
            </div>
          </div>

          {!state.realtimeAPIMode &&
            !state.audioMode &&
            state.selectAIService !== 'custom-api' && (
              <>
                <div className="my-6">
                  <div className="my-4 text-xl font-bold">
                    {t('Temperature')}: {state.temperature.toFixed(2)}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.01}
                    value={state.temperature}
                    className="mt-2 mb-4 input-range"
                    onChange={(e) =>
                      settingsStore.setState({
                        temperature: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="my-6">
                  <div className="my-4 text-xl font-bold">{t('MaxTokens')}</div>
                  <div className="my-2 text-sm ">{t('MaxTokensInfo')}</div>
                  <div className="my-2">
                    <input
                      type="number"
                      min="1"
                      className="px-4 py-2 w-140 bg-white hover:bg-white-hover rounded-lg"
                      value={state.maxTokens}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (!Number.isNaN(value) && value >= 1) {
                          settingsStore.setState({ maxTokens: value })
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}

          {state.isMultiModalSupported && (
            <div className="my-6">
              <div className="my-4 text-xl font-bold">
                {t('MultiModalMode')}
              </div>
              <div className="my-4 text-sm">
                {t('MultiModalModeDescription')}
              </div>
              <div className="my-2">
                <select
                  className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
                  value={state.multiModalMode}
                  onChange={(e) =>
                    settingsStore.setState({
                      multiModalMode: e.target.value as
                        | 'ai-decide'
                        | 'always'
                        | 'never',
                    })
                  }
                >
                  {state.selectAIService !== 'custom-api' && (
                    <option value="ai-decide">
                      {t('MultiModalModeAIDecide')}
                    </option>
                  )}
                  <option value="always">{t('MultiModalModeAlways')}</option>
                  <option value="never">{t('MultiModalModeNever')}</option>
                </select>
              </div>
              {state.multiModalMode === 'ai-decide' &&
                state.selectAIService !== 'custom-api' && (
                  <div className="my-4">
                    <div className="my-2 text-sm font-medium">
                      {t('MultiModalAIDecisionPrompt')}
                    </div>
                    <textarea
                      className="w-full px-4 py-2 bg-white hover:bg-white-hover rounded-lg text-sm"
                      rows={3}
                      value={state.multiModalAiDecisionPrompt}
                      onChange={(e) => {
                        settingsStore.setState({
                          multiModalAiDecisionPrompt: e.target.value,
                        })
                      }}
                      placeholder={t('MultiModalAIDecisionPromptPlaceholder')}
                    />
                  </div>
                )}
            </div>
          )}

          {(state.realtimeAPIMode || state.audioMode) && (
            <div className="my-6 p-4 bg-white rounded-lg text-sm ">
              {t('CannotUseParameters')}
            </div>
          )}
        </>
      )}

      {state.isMultiModalSupported && (
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('ImageDisplayPosition')}
          </div>
          <div className="my-4 text-sm">
            {t('ImageDisplayPositionDescription')}
          </div>
          <div className="my-2">
            <select
              className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
              value={state.imageDisplayPosition}
              onChange={(e) =>
                settingsStore.setState({
                  imageDisplayPosition: e.target.value as
                    | 'input'
                    | 'side'
                    | 'icon',
                })
              }
            >
              <option value="input">{t('InputArea')}</option>
              <option value="side">{t('SideArea')}</option>
              <option value="icon">{t('NoDisplay')}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelProvider
