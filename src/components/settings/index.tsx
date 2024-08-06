import React from 'react'
import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import { GitHubLink } from '../githubLink'
import { IconButton } from '../iconButton'
import AdvancedSettings from './advanced-settings'
import Character from './character'
import Environment from './environment'
import Language from './language'
import Log from './log'
import ModelProvider from './model-provider'
import Voice from './voice'
import WebSocket from './websocket'
import YouTube from './youtube'

type Props = {
  onClickClose: () => void
}
const Settings = (props: Props) => {
  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <Header {...props} />
      <Main />
      <Footer />
    </div>
  )
}
export default Settings

const Header = ({ onClickClose }: Pick<Props, 'onClickClose'>) => {
  return (
    <>
      <GitHubLink />
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
    </>
  )
}

const Main = () => {
  const { t } = useTranslation()

  return (
    <main className="max-h-full overflow-auto">
      <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
        <div className="my-24 typography-32 font-bold">{t('Settings')}</div>

        <Language />

        {/* キャラクター名表示 */}
        <Character />

        {/* VRMと背景画像の設定 */}
        <Environment />

        {/* 外部接続モードの設定 */}
        <WebSocket />

        {/* 外部連携モードでない時の設定 */}
        <NonWebSocket />

        {/* 音声エンジンの選択 */}
        <Voice />

        <AdvancedSettings />

        {/* チャットログの設定 */}
        <Log />
      </div>
    </main>
  )
}

const Footer = () => {
  return (
    <footer className="absolute py-4 bg-[#413D43] text-center text-white font-Montserrat bottom-0 w-full">
      powered by ChatVRM of Pixiv
    </footer>
  )
}

const NonWebSocket = () => {
  const webSocketMode = settingsStore((s) => s.webSocketMode)

  return webSocketMode ? null : (
    <>
      <ModelProvider />
      <YouTube />
    </>
  )
}
