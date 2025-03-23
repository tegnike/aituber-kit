import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import Image from 'next/image'
const SpeechInput = () => {
  const noSpeechTimeout = settingsStore((s) => s.noSpeechTimeout)
  const showSilenceProgressBar = settingsStore((s) => s.showSilenceProgressBar)
  const speechRecognitionMode = settingsStore((s) => s.speechRecognitionMode)

  const { t } = useTranslation()

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
        <div className="mt-2">
          <TextButton
            onClick={() =>
              settingsStore.setState({
                speechRecognitionMode:
                  speechRecognitionMode === 'browser' ? 'whisper' : 'browser',
              })
            }
          >
            {speechRecognitionMode === 'browser'
              ? t('BrowserSpeechRecognition')
              : t('WhisperSpeechRecognition')}
          </TextButton>
        </div>
        {speechRecognitionMode === 'whisper' && (
          <div className="mt-4 text-sm text-gray-600">
            {t('WhisperAPIKeyInfo')}
          </div>
        )}
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
            max="4"
            step="0.1"
            value={noSpeechTimeout}
            onChange={(e) =>
              settingsStore.setState({
                noSpeechTimeout: parseFloat(e.target.value),
              })
            }
            className="mt-2 mb-4 input-range"
          />
        </div>
        <div className="mt-2">
          <div className="font-bold mb-2">{t('ShowSilenceProgressBar')}</div>
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
    </div>
  )
}

export default SpeechInput
