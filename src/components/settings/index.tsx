import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import menuStore from '@/features/stores/menu'

import { GitHubLink } from '../githubLink'
import { IconButton } from '../iconButton'
import Image from 'next/image'
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
import Images from './images'

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
  | 'images'
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
  images: '/images/setting-icons/image-settings.svg',
  log: '/images/setting-icons/conversation-history.svg',
  other: '/images/setting-icons/other-settings.svg',
  speechInput: '/images/setting-icons/microphone-settings.svg',
}

const Main = () => {
  const { t } = useTranslation()
  const activeTab = menuStore((state) => state.activeSettingsTab)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const setActiveTab = (tab: TabKey) => {
    menuStore.setState({ activeSettingsTab: tab })
    setIsDropdownOpen(false) // モバイルドロップダウンを閉じる
  }

  // ドロップダウンの外側をクリックした際に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

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
      key: 'images',
      label: t('ImageSettings'),
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
      case 'images':
        return <Images />
      case 'log':
        return <Log />
      case 'other':
        return <Other />
      case 'speechInput':
        return <SpeechInput />
    }
  }

  const currentTab = tabs.find((tab) => tab.key === activeTab)

  return (
    <main className="max-h-full overflow-auto relative">
      <div className="text-text1 max-w-5xl mx-auto px-6 py-20">
        <div className="md:flex">
          {/* デスクトップ版タブナビゲーション */}
          <div className="hidden md:block md:w-[25%] md:me-4 mb-4 md:mb-0 md:sticky md:top-20 md:self-start">
            <ul className="flex flex-col space-y-1 text-sm font-medium">
              {tabs.map((tab) => (
                <li key={tab.key}>
                  <button
                    className={`flex items-center py-2 px-4 rounded-lg w-full text-left ${activeTab === tab.key ? 'text-theme bg-primary' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <div
                      className={`w-5 h-5 mr-2 ${
                        activeTab === tab.key
                          ? 'icon-mask-active'
                          : 'icon-mask-default'
                      }`}
                      style={{
                        maskImage: `url(${tabIconMapping[tab.key]})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                      }}
                    />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* モバイル版ドロップダウンナビゲーション */}
          <div className="md:hidden mb-4 relative" ref={dropdownRef}>
            <button
              className="flex items-center justify-between w-full py-3 px-4 font-medium text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex items-center">
                <div
                  className="w-5 h-5 mr-2 icon-mask-default"
                  style={{
                    maskImage: `url(${tabIconMapping[activeTab]})`,
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
                {currentTab?.label}
              </div>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`flex items-center w-full py-3 px-4 text-left hover:bg-gray-50 ${activeTab === tab.key ? 'bg-primary text-theme' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <div
                      className={`w-5 h-5 mr-2 ${
                        activeTab === tab.key
                          ? 'icon-mask-active'
                          : 'icon-mask-default'
                      }`}
                      style={{
                        maskImage: `url(${tabIconMapping[tab.key]})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                      }}
                    />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
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
    <footer className="absolute py-1 bg-[#413D43] text-center text-theme font-Montserrat bottom-0 w-full">
      powered by ChatVRM from Pixiv / ver. 2.38.0
    </footer>
  )
}
