import React from 'react'
import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import { GitHubLink } from '../githubLink'
import { IconButton } from '../iconButton'
import AdvancedSettings from './advancedSettings'
import Character from './character'
import Environment from './environment'
import LanguageSetting from './language'
import Log from './log'
import ModelProvider from './modelProvider'
import Voice from './voice'
import WebSocket from './websocket'
import YouTube from './youtube'
import Slide from './slide'
import MessageReceiverSetting from './messageReceiver' // 追加

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

        <div className="my-40">
          {/* 言語設定 */}
          <LanguageSetting />

          {/* キャラクター設定 */}
          <Character />

          {/* 背景画像の設定 */}
          <Environment />
        </div>

        <div className="my-24 typography-32 font-bold">{t('AISettings')}</div>

        <div className="my-40">
          {/* 外部接続モードの設定 */}
          <WebSocket />

          {/* AI設定 */}
          <ModelProvider />
        </div>

        <div className="my-24 typography-32 font-bold">
          {t('YoutubeSettings')}
        </div>

        <div className="my-40">
          {/* YouTube設定 */}
          <YouTube />
        </div>

        <div className="my-24 typography-32 font-bold">
          {t('VoiceSettings')}
        </div>

        <div className="my-40">
          {/* 音声エンジンの選択 */}
          <Voice />
        </div>

        <div className="my-24 typography-32 font-bold">
          {t('SlideSettings')}
        </div>

        <div className="my-40">
          {/* スライド設定 */}
          <Slide />
        </div>

        <div className="my-24 typography-32 font-bold">
          {t('OtherSettings')}
        </div>

        <AdvancedSettings />

        {/* MessageReceiver設定を追加 */}
        <MessageReceiverSetting />

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
