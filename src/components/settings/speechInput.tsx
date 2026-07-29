import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { settingsControlClass } from '@/components/settings/formStyles'
import { ToggleSwitch } from '../toggleSwitch'
import Image from 'next/image'
import { WhisperTranscriptionModel } from '@/features/constants/settings'
import { Link } from '../link'
import { getOpenAIWhisperModels } from '@/features/constants/aiModels'

const SpeechInput = () => {
  const noSpeechTimeout = settingsStore((s) => s.noSpeechTimeout)
  const showSilenceProgressBar = settingsStore((s) => s.showSilenceProgressBar)
  const speechRecognitionMode = settingsStore((s) => s.speechRecognitionMode)
  const whisperTranscriptionModel = settingsStore(
    (s) => s.whisperTranscriptionModel
  )
  const openaiKey = settingsStore((s) => s.openaiKey)
  const continuousMicListeningMode = settingsStore(
    (s) => s.continuousMicListeningMode
  )
  const initialSpeechTimeout = settingsStore((s) => s.initialSpeechTimeout)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const audioMode = settingsStore((s) => s.audioMode)

  const { t } = useTranslation()

  const whisperModels: { value: WhisperTranscriptionModel; label: string }[] =
    getOpenAIWhisperModels().map((m) => ({
      value: m as WhisperTranscriptionModel,
      label: m,
    }))

  // realtimeAPIモードかaudioモードがオンの場合は音声認識方式を固定
  const isLiveTranscriptionMode = speechRecognitionMode === 'live-transcription'
  const supportsSpeechTimeouts =
    speechRecognitionMode === 'browser' || isLiveTranscriptionMode
  const isSpeechModeSwitchDisabled = realtimeAPIMode || audioMode

  return (
    <div className="mb-10">
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/microphone-settings.svg"
          alt="Microphone Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('SpeechInputSettings')}</h2>
      </div>
      <div className="my-6">
        <div className="my-4 text-xl font-bold">
          {t('SpeechRecognitionMode')}
        </div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('SpeechRecognitionModeInfo')}
        </div>
        {isSpeechModeSwitchDisabled && (
          <div className="my-4 text-sm text-orange-500 whitespace-pre-line">
            {t('SpeechRecognitionModeDisabledInfo')}
          </div>
        )}
        <div className="mt-4">
          <select
            id="speech-recognition-mode-select"
            className={settingsControlClass.medium}
            value={speechRecognitionMode}
            onChange={(e) =>
              settingsStore.setState({
                speechRecognitionMode: e.target.value as
                  | 'browser'
                  | 'whisper'
                  | 'live-transcription',
              })
            }
            disabled={isSpeechModeSwitchDisabled}
            data-testid="speech-recognition-mode-select"
          >
            <option value="browser">{t('BrowserSpeechRecognition')}</option>
            <option value="whisper">{t('WhisperSpeechRecognition')}</option>
            <option value="live-transcription">
              {t('LiveTranscriptionSpeechRecognition')}
            </option>
          </select>
        </div>
        {isLiveTranscriptionMode && (
          <div className="my-4 text-sm whitespace-pre-wrap">
            {t('LiveTranscriptionInfo')}
          </div>
        )}
      </div>
      {(speechRecognitionMode === 'whisper' || isLiveTranscriptionMode) && (
        <>
          <div className="my-6">
            <div className="my-4 text-xl font-bold">
              {t('OpenAIAPIKeyLabel')}
            </div>
            <div className="my-4">
              {t('APIKeyInstruction')}
              <br />
              <Link
                url="https://platform.openai.com/account/api-keys"
                label="OpenAI Platform"
              />
            </div>
            <input
              className={settingsControlClass.long}
              type="text"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) =>
                settingsStore.setState({ openaiKey: e.target.value })
              }
            />
          </div>
          {speechRecognitionMode === 'whisper' && (
            <div className="mt-6">
              <div className="mb-4 text-xl font-bold">
                {t('WhisperTranscriptionModel')}
              </div>
              <div className="my-2 text-sm whitespace-pre-wrap">
                {t('WhisperTranscriptionModelInfo')}
              </div>
              <select
                id="whisper-model-select"
                className={settingsControlClass.medium}
                value={whisperTranscriptionModel}
                onChange={(e) =>
                  settingsStore.setState({
                    whisperTranscriptionModel: e.target
                      .value as WhisperTranscriptionModel,
                  })
                }
              >
                {whisperModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      {supportsSpeechTimeouts && !realtimeAPIMode && (
        <>
          <div className="my-6">
            <div className="my-4 text-xl font-bold">
              {t('InitialSpeechTimeout')}
            </div>
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('InitialSpeechTimeoutInfo')}
            </div>
            <div className="mt-6 font-bold">
              <div className="select-none">
                {t('InitialSpeechTimeout')}: {initialSpeechTimeout.toFixed(1)}秒
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="0.5"
                value={initialSpeechTimeout}
                onChange={(e) =>
                  settingsStore.setState({
                    initialSpeechTimeout: parseFloat(e.target.value),
                  })
                }
                data-testid="initial-speech-timeout-input"
                className="mt-2 mb-4 input-range"
              />
            </div>
          </div>
          <div className="my-6">
            <div className="my-4 text-xl font-bold">{t('NoSpeechTimeout')}</div>
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('NoSpeechTimeoutInfo')}
            </div>
            <div className="mt-6 font-bold">
              <div className="select-none">
                {t('NoSpeechTimeout')}: {noSpeechTimeout.toFixed(1)}秒
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={noSpeechTimeout}
                onChange={(e) =>
                  settingsStore.setState({
                    noSpeechTimeout: parseFloat(e.target.value),
                  })
                }
                data-testid="no-speech-timeout-input"
                className="mt-2 mb-4 input-range"
              />
            </div>
            <div className="mt-6">
              <div className="font-bold mb-2">
                {t('ShowSilenceProgressBar')}
              </div>
              <ToggleSwitch
                enabled={showSilenceProgressBar}
                onChange={(v) =>
                  settingsStore.setState({ showSilenceProgressBar: v })
                }
                testId="show-silence-progress-bar-toggle"
              />
            </div>
          </div>
          {speechRecognitionMode === 'browser' && (
            <div className="my-6">
              <div className="my-4 text-xl font-bold">{t('ContinuousMic')}</div>
              <div className="my-2 text-sm whitespace-pre-wrap">
                {t('ContinuousMicInfo')}
              </div>
              <ToggleSwitch
                enabled={continuousMicListeningMode}
                onChange={(v) =>
                  settingsStore.setState({ continuousMicListeningMode: v })
                }
                testId="continuous-mic-listening-toggle"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SpeechInput
