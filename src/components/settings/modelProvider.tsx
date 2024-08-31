import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants'
import { Link } from '../link'
import { TextButton } from '../textButton'
import { useCallback } from 'react'
import { multiModalAIServices } from '@/features/stores/settings'

const ModelProvider = () => {
  const webSocketMode = settingsStore((s) => s.webSocketMode)

  const openaiKey = settingsStore((s) => s.openaiKey)
  const anthropicKey = settingsStore((s) => s.anthropicKey)
  const googleKey = settingsStore((s) => s.googleKey)
  const azureKey = settingsStore((s) => s.azureKey)
  const groqKey = settingsStore((s) => s.groqKey)
  const cohereKey = settingsStore((s) => s.cohereKey)
  const mistralaiKey = settingsStore((s) => s.mistralaiKey)
  const perplexityKey = settingsStore((s) => s.perplexityKey)
  const fireworksKey = settingsStore((s) => s.fireworksKey)
  const difyKey = settingsStore((s) => s.difyKey)

  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const localLlmUrl = settingsStore((s) => s.localLlmUrl)
  const systemPrompt = settingsStore((s) => s.systemPrompt)

  const difyUrl = settingsStore((s) => s.difyUrl)

  const { t } = useTranslation()

  // オブジェクトを定義して、各AIサービスのデフォルトモデルを保存する
  // ローカルLLMが選択された場合、AIモデルを空文字に設定
  const defaultModels = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20240620',
    google: 'gemini-1.5-pro',
    azure: '',
    groq: 'gemma-7b-it',
    cohere: 'command-r-plus',
    mistralai: 'mistral-large-latest',
    perplexity: 'llama-3-sonar-large-32k-online',
    fireworks: 'accounts/fireworks/models/firefunction-v2',
    localLlm: '',
    dify: '',
  }

  const handleAIServiceChange = useCallback(
    (newService: keyof typeof defaultModels) => {
      settingsStore.setState({
        selectAIService: newService,
        selectAIModel: defaultModels[newService],
      })

      if (!multiModalAIServices.includes(newService as any)) {
        homeStore.setState({ modalImage: '' })
        menuStore.setState({ showWebcam: false })

        settingsStore.setState({
          conversationContinuityMode: false,
          slideMode: false,
        })
        slideStore.setState({
          isPlaying: false,
        })
      }
    },
    []
  )

  return webSocketMode ? null : (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">
        {t('SelectAIService')}
      </div>
      <div className="my-8">
        <select
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
          value={selectAIService}
          onChange={(e) =>
            handleAIServiceChange(e.target.value as keyof typeof defaultModels)
          }
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google Gemini</option>
          <option value="azure">Azure OpenAI</option>
          <option value="groq">Groq</option>
          <option value="cohere">Cohere</option>
          <option value="mistralai">Mistral AI</option>
          <option value="perplexity">Perplexity</option>
          <option value="fireworks">Fireworks</option>
          <option value="localLlm">{t('LocalLLM')}</option>
          <option value="dify">Dify</option>
        </select>
      </div>

      {(() => {
        if (selectAIService === 'openai') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('OpenAIAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://platform.openai.com/account/api-keys"
                    label="OpenAI"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) =>
                    settingsStore.setState({ openaiKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) => {
                    const model = e.target.value
                    settingsStore.setState({ selectAIModel: model })

                    if (
                      model !== 'gpt-4-turbo' &&
                      model !== 'gpt-4-o' &&
                      model !== 'gpt-4-o-mini'
                    ) {
                      homeStore.setState({ modalImage: '' })
                      menuStore.setState({ showWebcam: false })
                    }
                  }}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="chatgpt-4o-latest">chatgpt-4o-latest</option>
                  <option value="gpt-4o-2024-08-06">gpt-4o-2024-08-06</option>
                  <option value="gpt-4o">gpt-4o(2024-05-13)</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'anthropic') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('AnthropicAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link url="https://console.anthropic.com" label="Anthropic" />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={anthropicKey}
                  onChange={(e) =>
                    settingsStore.setState({ anthropicKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="claude-3-opus-20240229">
                    claude-3-opus-20240229
                  </option>
                  <option value="claude-3-5-sonnet-20240620">
                    claude-3.5-sonnet-20240620
                  </option>
                  <option value="claude-3-sonnet-20240229">
                    claude-3-sonnet-20240229
                  </option>
                  <option value="claude-3-haiku-20240307">
                    claude-3-haiku-20240307
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'google') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('GoogleAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://aistudio.google.com/app/apikey?hl=ja"
                    label="Google AI Studio"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={googleKey}
                  onChange={(e) =>
                    settingsStore.setState({ googleKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="gemini-1.5-flash-exp-0827">
                    gemini-1.5-flash-exp-0827
                  </option>
                  <option value="gemini-1.5-pro-exp-0827">
                    gemini-1.5-pro-exp-0827
                  </option>
                  <option value="gemini-1.5-flash-8b-exp-0827">
                    gemini-1.5-flash-8b-exp-0827
                  </option>
                  <option value="gemini-1.5-pro-latest">
                    gemini-1.5-pro-latest
                  </option>
                  <option value="gemini-1.5-flash-latest">
                    gemini-1.5-flash-latest
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'azure') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('AzureAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://portal.azure.com/#view/Microsoft_Azure_AI/AzureOpenAI/keys"
                    label="Azure OpenAI"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={azureKey}
                  onChange={(e) =>
                    settingsStore.setState({ azureKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('AzureAPIURL')}
                </div>
                <div className="my-16">
                  ex.
                  https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/completions?api-version=2024-06-01
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({ selectAIModel: e.target.value })
                  }
                />
              </div>
            </>
          )
        } else if (selectAIService === 'groq') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('GroqAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://console.groq.com/keys"
                    label="Groq Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={groqKey}
                  onChange={(e) =>
                    settingsStore.setState({ groqKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="gemma-7b-it">gemma-7b-it</option>
                  <option value="llama3-70b-8192">llama3-70b-8192</option>
                  <option value="llama3-8b-8192">llama3-8b-8192</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'cohere') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('CohereAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://dashboard.cohere.com/api-keys"
                    label="Cohere Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={cohereKey}
                  onChange={(e) =>
                    settingsStore.setState({ cohereKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="command-light">command-light</option>
                  <option value="command-light-nightly">
                    command-light-nightly
                  </option>
                  <option value="command-nightly">command-nightly</option>
                  <option value="command-r">command-r</option>
                  <option value="command-r-08-2024">command-r-08-2024</option>
                  <option value="command-r-plus">command-r-plus</option>
                  <option value="command-r-plus-08-2024">
                    command-r-plus-08-2024
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'mistralai') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('MistralAIAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://console.mistral.ai/api-keys/"
                    label="Mistral AI Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={mistralaiKey}
                  onChange={(e) =>
                    settingsStore.setState({ mistralaiKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="mistral-large-latest">
                    mistral-large-latest
                  </option>
                  <option value="open-mistral-nemo">open-mistral-nemo</option>
                  <option value="codestral-latest">codestral-latest</option>
                  <option value="mistral-embed">mistral-embed</option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'perplexity') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('PerplexityAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://www.perplexity.ai/settings/api"
                    label="Perplexity Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={perplexityKey}
                  onChange={(e) =>
                    settingsStore.setState({ perplexityKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="llama-3.1-sonar-small-128k-online">
                    llama-3.1-sonar-small-128k-online
                  </option>
                  <option value="llama-3.1-sonar-large-128k-online">
                    llama-3.1-sonar-large-128k-online
                  </option>
                  <option value="llama-3.1-sonar-huge-128k-online">
                    llama-3.1-sonar-huge-128k-online
                  </option>
                  <option value="llama-3.1-sonar-small-128k-chat">
                    llama-3.1-sonar-small-128k-chat
                  </option>
                  <option value="llama-3.1-sonar-large-128k-chat">
                    llama-3.1-sonar-large-128k-chat
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'fireworks') {
          return (
            <>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('FireworksAPIKeyLabel')}
                </div>
                <div className="my-16">
                  {t('APIKeyInstruction')}
                  <br />
                  <Link
                    url="https://fireworks.ai/account/api-keys"
                    label="Fireworks Dashboard"
                  />
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={fireworksKey}
                  onChange={(e) =>
                    settingsStore.setState({ fireworksKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <select
                  className="px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                >
                  <option value="accounts/fireworks/models/llama-v3p1-405b-instruct">
                    llama-v3p1-405b-instruct
                  </option>
                  <option value="accounts/fireworks/models/llama-v3p1-70b-instruct">
                    llama-v3p1-70b-instruct
                  </option>
                  <option value="accounts/fireworks/models/llama-v3p1-8b-instruct">
                    llama-v3p1-8b-instruct
                  </option>
                  <option value="accounts/fireworks/models/llama-v3-70b-instruct">
                    llama-v3-70b-instruct
                  </option>
                  <option value="accounts/fireworks/models/mixtral-8x22b-instruct">
                    mixtral-8x22b-instruct
                  </option>
                  <option value="accounts/fireworks/models/mixtral-8x7b-instruct">
                    mixtral-8x7b-instruct
                  </option>
                  <option value="accounts/fireworks/models/firefunction-v2">
                    firefunction-v2
                  </option>
                </select>
              </div>
            </>
          )
        } else if (selectAIService === 'localLlm') {
          return (
            <>
              <div className="my-24">
                <div className="my-16">
                  {t('LocalLLMInfo')}
                  <br />
                  ex. Ollama:{' '}
                  <Link
                    url="https://note.com/schroneko/n/n8b1a5bbc740b"
                    label="https://note.com/schroneko/n/n8b1a5bbc740b"
                  />
                </div>
                <div className="my-16">
                  {t('LocalLLMInfo2')}
                  <br />
                  ex. Ollama: http://localhost:11434/v1/chat/completions
                </div>
                <div className="my-16 typography-20 font-bold">
                  {t('EnterURL')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={localLlmUrl}
                  onChange={(e) =>
                    settingsStore.setState({ localLlmUrl: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('SelectModel')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={selectAIModel}
                  onChange={(e) =>
                    settingsStore.setState({
                      selectAIModel: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )
        } else if (selectAIService === 'dify') {
          return (
            <>
              <div className="my-24">
                <div className="my-16">{t('DifyInfo')}</div>
                <div className="my-16 typography-20 font-bold">
                  {t('DifyAPIKeyLabel')}
                </div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={difyKey}
                  onChange={(e) =>
                    settingsStore.setState({ difyKey: e.target.value })
                  }
                />
              </div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">
                  {t('EnterURL')}
                </div>
                <div className="my-16">{t('DifyInfo3')}</div>
                <input
                  className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                  type="text"
                  placeholder="..."
                  value={difyUrl}
                  onChange={(e) =>
                    settingsStore.setState({ difyUrl: e.target.value })
                  }
                />
              </div>
            </>
          )
        }
      })()}

      <div className="my-40">
        <div className="my-8">
          <div className="my-16 typography-20 font-bold">
            {t('CharacterSettingsPrompt')}
          </div>
          {selectAIService === 'dify' && (
            <div className="my-16">{t('DifyInstruction')}</div>
          )}
          <TextButton
            onClick={() =>
              settingsStore.setState({ systemPrompt: SYSTEM_PROMPT })
            }
          >
            {t('CharacterSettingsReset')}
          </TextButton>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) =>
            settingsStore.setState({ systemPrompt: e.target.value })
          }
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
        ></textarea>
      </div>
    </div>
  )
}
export default ModelProvider
