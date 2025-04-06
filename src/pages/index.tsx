import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Form } from '@/components/form'
import MessageReceiver from '@/components/messageReceiver'
import { Introduction } from '@/components/introduction'
import { Menu } from '@/components/menu'
import { Meta } from '@/components/meta'
import ModalImage from '@/components/modalImage'
import VrmViewer from '@/components/vrmViewer'
import Live2DViewer from '@/components/live2DViewer'
import { Toasts } from '@/components/toasts'
import { WebSocketManager } from '@/components/websocketManager'
import CharacterPresetMenu from '@/components/characterPresetMenu'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import '@/lib/i18n'
import { buildUrl } from '@/utils/buildUrl'
import { YoutubeManager } from '@/components/youtubeManager'
import toastStore from '@/features/stores/toast'

const Home = () => {
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const backgroundImageUrl = homeStore((s) => s.backgroundImageUrl)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const bgUrl =
    (webcamStatus || captureStatus) && useVideoAsBackground
      ? ''
      : `url(${buildUrl(backgroundImageUrl)})`
  const messageReceiverEnabled = settingsStore((s) => s.messageReceiverEnabled)
  const modelType = settingsStore((s) => s.modelType)
  const { t } = useTranslation()
  const characterPresets = [
    {
      key: 'characterPreset1',
      value: settingsStore((s) => s.characterPreset1),
    },
    {
      key: 'characterPreset2',
      value: settingsStore((s) => s.characterPreset2),
    },
    {
      key: 'characterPreset3',
      value: settingsStore((s) => s.characterPreset3),
    },
    {
      key: 'characterPreset4',
      value: settingsStore((s) => s.characterPreset4),
    },
    {
      key: 'characterPreset5',
      value: settingsStore((s) => s.characterPreset5),
    },
  ]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        // shiftキーを押しながら数字キーを押すためのマッピング
        const keyMap: { [key: string]: number } = {
          Digit1: 1,
          Digit2: 2,
          Digit3: 3,
          Digit4: 4,
          Digit5: 5,
        }

        const keyNumber = keyMap[event.code]

        if (keyNumber) {
          settingsStore.setState({
            systemPrompt: characterPresets[keyNumber - 1].value,
          })
          toastStore.getState().addToast({
            message: t('Toasts.PresetSwitching', {
              presetName: t(`Characterpreset${keyNumber}`),
            }),
            type: 'info',
            tag: `character-preset-switching`,
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="h-[100svh] bg-cover" style={{ backgroundImage: bgUrl }}>
      <Meta />
      <Introduction />
      {modelType === 'vrm' ? <VrmViewer /> : <Live2DViewer />}
      <Form />
      <Menu />
      <ModalImage />
      {messageReceiverEnabled && <MessageReceiver />}
      <Toasts />
      <WebSocketManager />
      <YoutubeManager />
      <CharacterPresetMenu />
    </div>
  )
}

export default Home
