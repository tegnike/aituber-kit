import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import menuStore from '@/features/stores/menu'
import { TextButton } from '../textButton'

const Slide = () => {
  const { t } = useTranslation()
  const selectAIService = settingsStore((s) => s.selectAIService)

  const slideMode = settingsStore((s) => s.slideMode)
  const conversationContinuityMode = settingsStore(
    (s) => s.conversationContinuityMode
  )

  const toggleSlideMode = () => {
    const newSlideMode = !slideMode
    settingsStore.setState({
      slideMode: newSlideMode,
      // スライドモードがオンになったら、会話継続モードをオフにする
      conversationContinuityMode: newSlideMode
        ? false
        : conversationContinuityMode,
    })
    if (!newSlideMode) {
      menuStore.setState({ slideVisible: false })
    }
  }

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">{t('SlideMode')}</div>
      <p className="">{t('SlideModeDescription')}</p>
      <div className="my-8">
        <TextButton
          onClick={toggleSlideMode}
          disabled={
            selectAIService !== 'openai' &&
            selectAIService !== 'anthropic' &&
            selectAIService !== 'google'
          }
        >
          {slideMode ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
      {slideMode && (
        <p className="text-sm text-red-600 mt-2">{t('SlideModeWarning')}</p>
      )}
    </div>
  )
}

export default Slide
