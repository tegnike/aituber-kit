import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import Image from 'next/image'
import { useEffect } from 'react'
import { WhisperTranscriptionModel } from '@/features/constants/settings'
import { Link } from '../link'

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

  // whisperモードの場合、自動的にnoSpeechTimeoutを0に、showSilenceProgressBarをfalseに設定
  useEffect(() => {
    if (speechRecognitionMode === 'whisper') {
      settingsStore.setState({
        initialSpeechTimeout: 0,
        noSpeechTimeout: 0,
        showSilenceProgressBar: false,
        continuousMicListeningMode: false,
      })
    }
  }, [speechRecognitionMode])

  // realtimeAPIモードかaudioモードがオンの場合、強制的にbrowserモードに設定
  useEffect(() => {
    if (realtimeAPIMode || audioMode) {
      settingsStore.setState({
        speechRecognitionMode: 'browser',
      })
    }
  }, [realtimeAPIMode, audioMode])

  const whisperModels: { value: WhisperTranscriptionModel; label: string }[] = [
    { value: 'whisper-1', label: 'whisper-1' },
    { value: 'gpt-4o-transcribe', label: 'gpt-4o-transcribe' },
    { value: 'gpt-4o-mini-transcribe', label: 'gpt-4o-mini-transcribe' },
  ]

  // realtimeAPIモードかaudioモードがオンの場合はボタンを無効化
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
        <div className="my-4 text-base whitespace-pre-line">
          {t('SpeechRecognitionModeInfo')}
        </div>
        {isSpeechModeSwitchDisabled && (
          <div className="my-4 text-sm text-orange-500 whitespace-pre-line">
            {t('SpeechRecognitionModeDisabledInfo')}
          </div>
        )}
        <div className="mt-2">
          <TextButton
            onClick={() =>
              settingsStore.setState({
                speechRecognitionMode:
                  speechRecognitionMode === 'browser' ? 'whisper' : 'browser',
              })
            }
            disabled={isSpeechModeSwitchDisabled}
          >
            {speechRecognitionMode === 'browser'
              ? t('BrowserSpeechRecognition')
              : t('WhisperSpeechRecognition')}
          </TextButton>
        </div>
      </div>
      {speechRecognitionMode === 'whisper' && (
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
                label="OpenAI"
              />
            </div>
            <input
              className="text-ellipsis px-4 py-2 w-full md:w-1/2 bg-white hover:bg-white-hover rounded-lg"
              type="text"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) =>
                settingsStore.setState({ openaiKey: e.target.value })
              }
            />
          </div>
          <div className="mt-6">
            <div className="mb-4 text-xl font-bold">
              {t('WhisperTranscriptionModel')}
            </div>
            <div className="mb-4 text-base whitespace-pre-line">
              {t('WhisperTranscriptionModelInfo')}
            </div>
            <select
              id="whisper-model-select"
              className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg w-full md:w-1/2"
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
        </>
      )}
      {speechRecognitionMode === 'browser' && !realtimeAPIMode && (
        <>
          <div className="my-6">
            <div className="my-4 text-xl font-bold">
              {t('InitialSpeechTimeout')}
            </div>
            <div className="my-4 text-base whitespace-pre-line">
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
                className="mt-2 mb-4 input-range"
              />
            </div>
          </div>
          <div className="my-6">
            <div className="my-4 text-xl font-bold">{t('NoSpeechTimeout')}</div>
            <div className="my-4 text-base whitespace-pre-line">
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
                className="mt-2 mb-4 input-range"
              />
            </div>
            <div className="mt-6">
              <div className="font-bold mb-2">
                {t('ShowSilenceProgressBar')}
              </div>
              <TextButton
                onClick={() =>
                  settingsStore.setState({
                    showSilenceProgressBar: !showSilenceProgressBar,
                  })
                }
              >
                {showSilenceProgressBar ? t('StatusOn') : t('StatusOff')}
              </TextButton>
            </div>
          </div>
          <div className="my-6">
            <div className="my-4 text-xl font-bold">{t('ContinuousMic')}</div>
            <div className="my-4 text-base whitespace-pre-line">
              {t('ContinuousMicInfo')}
            </div>
            <TextButton
              onClick={() =>
                settingsStore.setState({
                  continuousMicListeningMode: !continuousMicListeningMode,
                })
              }
            >
              {continuousMicListeningMode ? t('StatusOn') : t('StatusOff')}
            </TextButton>
          </div>
        </>
      )}
    </div>
  )
}

export default SpeechInput
