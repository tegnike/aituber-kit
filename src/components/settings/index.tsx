import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import menuStore from '@/features/stores/menu'

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
      <div className="absolute m-6">
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
    }
  }

  return (
    <main className="max-h-full overflow-auto">
      <div className="text-text1 max-w-5xl mx-auto px-6 py-16">
        <div className="md:flex mt-4">
          {/* タブナビゲーション */}
          <ul className="flex flex-col space-y-1 text-sm font-medium md:w-[25%] md:me-8 mb-4 md:mb-0">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <button
                  className={`flex py-2 px-4 rounded-lg w-full text-base text-left ${activeTab === tab.key && 'text-white bg-primary'}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

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
      powered by ChatVRM from Pixiv / ver. 2.29.0
    </footer>
  )
}
