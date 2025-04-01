import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import menuStore from '@/features/stores/menu'
import Image from 'next/image'

import { GitHubLink } from '../githubLink'
import { IconButton } from '../iconButton'
import Description from './description'
import Based from './based'
import Character from './character'
import AI from './ai'
import Voice from './voice'
import YouTube from './youtube'
import Slide from './slide'
import Log from './log'
import Other from './other'
import SpeechInput from './speechInput'

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
      <div className="absolute m-6 z-15">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
    </>
  )
}

// タブの定義
type TabKey =
  | 'description'
  | 'based'
  | 'character'
  | 'ai'
  | 'voice'
  | 'youtube'
  | 'slide'
  | 'log'
  | 'other'
  | 'speechInput'

// アイコンのパスマッピング
const tabIconMapping: Record<TabKey, string> = {
  description: '/images/setting-icons/description.svg',
  based: '/images/setting-icons/basic-settings.svg',
  character: '/images/setting-icons/character-settings.svg',
  ai: '/images/setting-icons/ai-settings.svg',
  voice: '/images/setting-icons/voice-settings.svg',
  youtube: '/images/setting-icons/youtube-settings.svg',
  slide: '/images/setting-icons/slide-settings.svg',
  log: '/images/setting-icons/conversation-history.svg',
  other: '/images/setting-icons/other-settings.svg',
  speechInput: '/images/setting-icons/microphone-settings.svg',
}

const Main = () => {
  const { t } = useTranslation()
  const activeTab = menuStore((state) => state.activeSettingsTab)
  const setActiveTab = (tab: TabKey) => {
    menuStore.setState({ activeSettingsTab: tab })
  }

  const tabs: { key: TabKey; label: string }[] = [
    {
      key: 'description',
      label: t('Description'),
    },
    {
      key: 'based',
      label: t('BasedSettings'),
    },
    {
      key: 'character',
      label: t('CharacterSettings'),
    },
    {
      key: 'ai',
      label: t('AISettings'),
    },
    {
      key: 'voice',
      label: t('VoiceSettings'),
    },
    {
      key: 'speechInput',
      label: t('SpeechInputSettings'),
    },
    {
      key: 'youtube',
      label: t('YoutubeSettings'),
    },
    {
      key: 'slide',
      label: t('SlideSettings'),
    },
    {
      key: 'log',
      label: t('LogSettings'),
    },
    {
      key: 'other',
      label: t('OtherSettings'),
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return <Description />
      case 'based':
        return <Based />
      case 'character':
        return <Character />
      case 'ai':
        return <AI />
      case 'voice':
        return <Voice />
      case 'youtube':
        return <YouTube />
      case 'slide':
        return <Slide />
      case 'log':
        return <Log />
      case 'other':
        return <Other />
      case 'speechInput':
        return <SpeechInput />
    }
  }

  return (
    <main className="max-h-full overflow-auto relative">
      <div className="text-text1 max-w-5xl mx-auto px-6 py-20">
        <div className="md:flex">
          {/* タブナビゲーション */}
          <div className="md:w-[25%] md:me-4 mb-4 md:mb-0 md:sticky md:top-20 md:self-start">
            <ul className="flex flex-col space-y-1 text-sm font-medium">
              {tabs.map((tab) => (
                <li key={tab.key}>
                  <button
                    className={`flex items-center py-2 px-4 rounded-lg w-full text-base text-left ${activeTab === tab.key && 'text-white bg-primary'}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <img
                      src={tabIconMapping[tab.key]}
                      alt={`${tab.label} icon`}
                      className={`w-5 h-5 mr-2 ${activeTab === tab.key ? 'brightness-0 invert' : ''}`}
                    />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6 bg-gray-400 bg-opacity-20 text-medium rounded-lg w-full">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </main>
  )
}

const Footer = () => {
  return (
    <footer className="absolute py-1 bg-[#413D43] text-center text-white font-Montserrat bottom-0 w-full">
      powered by ChatVRM from Pixiv / ver. 2.30.0
    </footer>
  )
}
