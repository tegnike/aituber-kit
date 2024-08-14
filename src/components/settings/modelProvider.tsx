import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants'
import { Link } from '../link'
import { TextButton } from '../textButton'
import { useCallback } from 'react'

const ModelProvider = () => {
  const webSocketMode = settingsStore((s) => s.webSocketMode)

  const openAiKey = settingsStore((s) => s.openAiKey)
  const anthropicKey = settingsStore((s) => s.anthropicKey)
  const googleKey = settingsStore((s) => s.googleKey)
  const groqKey = settingsStore((s) => s.groqKey)
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
    anthropic: 'claude-3.5-sonnet-20240620',
    google: 'gemini-1.5-pro',
    groq: 'gemma-7b-it',
    localLlm: '',
    dify: '',
  }

  const handleAIServiceChange = useCallback(
    (newService: keyof typeof defaultModels) => {
      settingsStore.setState({
        selectAIService: newService,
        selectAIModel: defaultModels[newService],
      })

      if (newService !== 'openai') {
        homeStore.setState({ modalImage: '' })
        menuStore.setState({ showWebcam: false })

        if (newService !== 'anthropic') {
          settingsStore.setState({
            conversationContinuityMode: false,
          })
        }

        if (newService !== 'anthropic' && newService !== 'google') {
          settingsStore.setState({
            slideMode: false,
          })
          slideStore.setState({
            isPlaying: false,
          })
        }
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
          <option value="groq">Groq</option>
          <option value="localLlm">{t('LocalLLM')}</option>
          <option value="dify">Dify</option>
        </select>
      </div>

      {(() => {
        if (selectAIService === 'openai') {
          return (
            <div className="my-24">
              <div className="my-16 typography-20 font-bold">
                {t('OpenAIAPIKeyLabel')}
              </div>
              <input
                className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
                type="text"
                placeholder="sk-..."
                value={openAiKey}
                onChange={(e) =>
                  settingsStore.setState({ openAiKey: e.target.value })
                }
              />
              <div className="my-16">
                {t('APIKeyInstruction')}
                <br />
                <Link
                  url="https://platform.openai.com/account/api-keys"
                  label="OpenAI"
                />
              </div>
              <div className="my-16">{t('ChatGPTInfo')}</div>
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
            </div>
          )
        } else if (selectAIService === 'anthropic') {
          return (
            <div className="my-24">
              <div className="my-16 typography-20 font-bold">
                {t('AnthropicAPIKeyLabel')}
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
              <div className="my-16">
                {t('APIKeyInstruction')}
                <br />
                <Link url="https://console.anthropic.com" label="Anthropic" />
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
            </div>
          )
        } else if (selectAIService === 'google') {
          return (
            <div className="my-24">
              <div className="my-16 typography-20 font-bold">
                {t('GoogleAPIKeyLabel')}
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
              <div className="my-16">
                {t('APIKeyInstruction')}
                <br />
                <Link
                  url="https://aistudio.google.com/app/apikey?hl=ja"
                  label="Google AI Studio"
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
                  <option value="gemini-1.5-pro-latest">
                    gemini-1.5-pro-latest
                  </option>
                  <option value="gemini-1.5-flash-latest">
                    gemini-1.5-flash-latest
                  </option>
                </select>
              </div>
            </div>
          )
        } else if (selectAIService === 'groq') {
          return (
            <div className="my-24">
              <div className="my-16 typography-20 font-bold">
                {t('GroqAPIKeyLabel')}
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
              <div className="my-16">
                {t('APIKeyInstruction')}
                <br />
                <Link
                  url="https://console.groq.com/keys"
                  label="Groq Dashboard"
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
            </div>
          )
        } else if (selectAIService === 'localLlm') {
          return (
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
          )
        } else if (selectAIService === 'dify') {
          return (
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
            </div>
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
