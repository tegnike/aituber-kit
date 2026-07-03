import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { Language } from '@/features/constants/settings'

import { IconButton, InlineOutlineIcon } from '../iconButton'
import Image from 'next/image'
import Description from './description'
import Based from './based'
import Character from './character'
import AI from './ai'
import Voice from './voice'
import YouTube from './youtube'
import Slide from './slide'
import Other from './other'
import SpeechInput from './speechInput'
import Images from './images'
import MemorySettings from './memorySettings'
import PresenceSettings from './presenceSettings'
import IdleSettings from './idleSettings'
import GameCommentarySettings from './gameCommentarySettings'
import KioskSettings from './kioskSettings'
import QuickStart from './quickStart'
import { languageOptions } from '@/components/settings/languageOptions'

type Props = {
  onClickClose: () => void
}

const tabsWithRedundantPanelTitle = new Set([
  'character',
  'ai',
  'memory',
  'voice',
  'speechInput',
  'youtube',
  'gameCommentary',
  'slide',
  'images',
  'presence',
  'idle',
  'kiosk',
  'based',
  'other',
])

const Settings = (props: Props) => {
  return (
    <div className="theme-settings-backdrop absolute z-40 h-full w-full overflow-hidden">
      <div className="theme-settings-shell mx-auto flex h-full w-full max-w-[1280px] flex-col overflow-hidden border-x shadow-xl backdrop-blur-sm md:my-5 md:h-[calc(100%-2.5rem)] md:w-[calc(100%-3rem)] md:rounded-xl md:border">
        <Header {...props} />
        <Main />
        <Footer />
      </div>
    </div>
  )
}
export default Settings

const Header = ({ onClickClose }: Pick<Props, 'onClickClose'>) => {
  const { i18n, t } = useTranslation()
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectVoice = settingsStore((s) => s.selectVoice)
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const settingsSearchQuery = menuStore((state) => state.settingsSearchQuery)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const youtubeMode = settingsStore((s) => s.youtubeMode)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const audioMode = settingsStore((s) => s.audioMode)
  const slideMode = settingsStore((s) => s.slideMode)
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)
  const presenceDetectionEnabled = settingsStore(
    (s) => s.presenceDetectionEnabled
  )
  const idleModeEnabled = settingsStore((s) => s.idleModeEnabled)
  const kioskModeEnabled = settingsStore((s) => s.kioskModeEnabled)
  const gameCommentaryEnabled = settingsStore((s) => s.gameCommentaryEnabled)
  const modeItems: ModeStatusItem[] = [
    { label: 'YouTube', active: youtubeMode, tab: 'youtube' },
    { label: 'Realtime API', active: realtimeAPIMode, tab: 'ai' },
    { label: t('SettingsModeVoiceChat'), active: audioMode, tab: 'ai' },
    { label: t('SettingsModeSlides'), active: slideMode, tab: 'slide' },
    {
      label: t('SettingsModeExternal'),
      active: externalLinkageMode,
      tab: 'ai',
    },
    {
      label: t('SettingsModePresence'),
      active: presenceDetectionEnabled,
      tab: 'presence',
    },
    { label: t('SettingsModeIdle'), active: idleModeEnabled, tab: 'idle' },
    { label: t('SettingsModeKiosk'), active: kioskModeEnabled, tab: 'kiosk' },
    {
      label: t('SettingsModeGame'),
      active: gameCommentaryEnabled,
      tab: 'gameCommentary',
    },
  ]
  const openHeaderTab = (tab: TabKey) => {
    menuStore.setState({
      activeSettingsTab: tab,
      settingsSearchQuery: '',
    })
  }

  return (
    <header className="theme-surface-popover relative z-30 grid shrink-0 grid-cols-[auto_auto_minmax(0,1fr)_minmax(6.75rem,8rem)_auto] items-center gap-2 border-b border-primary/20 px-3 py-3 sm:grid-cols-[auto_auto_auto_minmax(10rem,14rem)_1fr_auto] sm:gap-3 sm:px-4">
      <div className="z-15">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          aria-label={t('SettingsClose')}
          onClick={onClickClose}
          data-testid="close-settings-button"
          backgroundColor="bg-transparent hover:bg-primary/10 active:bg-primary/15 disabled:bg-transparent"
          iconColor="text-text1"
          className="border border-primary/15 shadow-sm"
        ></IconButton>
      </div>
      <span
        className="h-7 w-7 shrink-0 bg-primary opacity-90"
        style={{
          WebkitMask:
            'url(/images/setting-icons/logo2-2favicon.svg) center / contain no-repeat',
          mask: 'url(/images/setting-icons/logo2-2favicon.svg) center / contain no-repeat',
        }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <h1 className="text-lg font-bold leading-tight text-text1">
          {t('Settings')}
        </h1>
        <div className="hidden text-xs text-text-primary/80 sm:block">
          AITuberKit
        </div>
      </div>
      <label className="theme-surface-control flex h-10 min-w-0 items-center rounded-lg border px-2 text-sm text-text1 sm:order-none sm:col-span-1 sm:px-3">
        <select
          aria-label={t('SettingsDisplayLanguage')}
          className="min-w-0 flex-1 bg-transparent font-bold outline-none"
          value={selectLanguage}
          onChange={(event) => {
            const language = event.target.value as Language
            settingsStore.setState({ selectLanguage: language })
            i18n.changeLanguage(language)
          }}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={`theme-surface-control flex h-10 w-10 items-center justify-center rounded-lg border text-text-primary transition-colors hover:border-primary/35 hover:text-text1 sm:hidden ${
          showMobileSearch || settingsSearchQuery ? 'border-primary/35' : ''
        }`}
        aria-label={t('SettingsSearch')}
        aria-expanded={showMobileSearch || !!settingsSearchQuery}
        onClick={() => setShowMobileSearch((value) => !value)}
      >
        <InlineOutlineIcon name="24/Search" />
      </button>
      <div
        className={`order-6 col-span-5 sm:order-none sm:col-span-1 sm:block ${
          showMobileSearch || settingsSearchQuery ? 'block' : 'hidden'
        }`}
      >
        <SettingsSearch />
      </div>
      <div className="hidden items-center gap-2 lg:flex">
        <StatusChip
          label="AI"
          value={formatStatusValue(selectAIService)}
          onClick={() => openHeaderTab('ai')}
        />
        <StatusChip
          label={t('SettingsVoice')}
          value={formatStatusValue(selectVoice)}
          onClick={() => openHeaderTab('voice')}
        />
        <ModeStatusSummary items={modeItems} onSelect={openHeaderTab} />
        <a
          className="theme-surface-contrast flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-bold shadow-sm transition-colors"
          draggable={false}
          href="https://github.com/tegnike/aituber-kit"
          rel="noopener noreferrer"
          target="_blank"
        >
          <Image
            alt="GitHub Repository Link"
            height={18}
            width={18}
            src="/github-mark-white.svg"
          />
          GitHub
        </a>
      </div>
    </header>
  )
}

type ModeStatusItem = {
  label: string
  active: boolean
  tab: TabKey
}

// タブの定義
type TabKey =
  | 'quickStart'
  | 'description'
  | 'based'
  | 'character'
  | 'ai'
  | 'voice'
  | 'youtube'
  | 'slide'
  | 'images'
  | 'memory'
  | 'presence'
  | 'idle'
  | 'gameCommentary'
  | 'kiosk'
  | 'other'
  | 'speechInput'

// アイコンのパスマッピング
const tabIconMapping: Record<TabKey, string> = {
  quickStart: '/images/setting-icons/basic-settings.svg',
  description: '/images/setting-icons/description.svg',
  based: '/images/setting-icons/basic-settings.svg',
  character: '/images/setting-icons/character-settings.svg',
  ai: '/images/setting-icons/ai-settings.svg',
  voice: '/images/setting-icons/voice-settings.svg',
  youtube: '/images/setting-icons/youtube-settings.svg',
  slide: '/images/setting-icons/slide-settings.svg',
  images: '/images/setting-icons/image-settings.svg',
  memory: '/images/setting-icons/memory-settings.svg',
  presence: '/images/setting-icons/presence-settings.svg',
  idle: '/images/setting-icons/idle-settings.svg',
  gameCommentary: '/images/setting-icons/gamecommentary-settings.svg',
  kiosk: '/images/setting-icons/kiosk-settings.svg',
  other: '/images/setting-icons/other-settings.svg',
  speechInput: '/images/setting-icons/microphone-settings.svg',
}

type TabConfig = {
  key: TabKey
  label: string
  keywords?: string[]
}

type TabGroup = {
  key: string
  label: string
  tabs: TabConfig[]
}

const SettingsSearch = () => {
  const { t } = useTranslation()
  const searchQuery = menuStore((state) => state.settingsSearchQuery)
  const searchLabel = t('SettingsSearch')
  const clearLabel = t('SettingsSearchClear')

  return (
    <div className="relative block">
      <span className="pointer-events-none absolute left-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-text-primary">
        <InlineOutlineIcon name="24/Search" />
      </span>
      <input
        className="theme-surface-control h-10 w-full rounded-lg border py-2 pl-9 pr-11 text-sm text-text1 outline-none transition"
        placeholder={searchLabel}
        value={searchQuery}
        aria-label={searchLabel}
        data-testid="settings-search-input"
        onChange={(event) =>
          menuStore.setState({
            settingsSearchQuery: event.target.value,
          })
        }
      />
      {searchQuery && (
        <button
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-primary/10 hover:text-text1 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
          onClick={() =>
            menuStore.setState({
              settingsSearchQuery: '',
            })
          }
        >
          <InlineOutlineIcon name="24/Close" />
        </button>
      )}
    </div>
  )
}

const formatStatusValue = (value: string) =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const StatusChip = ({
  label,
  value,
  emphasized = false,
  onClick,
}: {
  label: string
  value: string
  emphasized?: boolean
  onClick?: () => void
}) => {
  const className = `inline-flex h-8 max-w-44 items-center gap-1 rounded-full border px-3 text-xs ${
    emphasized
      ? 'theme-surface-soft text-primary'
      : 'theme-surface-control text-text-primary'
  }`
  const content = (
    <>
      <span className="shrink-0">{label}</span>
      <strong className="truncate text-text1">{value}</strong>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={`${className} transition-colors hover:border-primary/35 hover:text-text1`}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}

const ModeStatusSummary = ({
  items,
  onSelect,
}: {
  items: ModeStatusItem[]
  onSelect: (tab: TabKey) => void
}) => {
  const { t } = useTranslation()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const activeItems = items.filter((item) => item.active)
  const summaryLabel = activeItems.length === 0 ? t('SettingsModeAllOff') : 'ON'
  const modeLabel = t('SettingsModeModes')
  const detailLabel =
    activeItems.length === 0
      ? t('SettingsModeNoActiveModes')
      : activeItems.map((item) => item.label).join(' / ')
  const accessibleLabel = `${modeLabel}: ${detailLabel}`

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        className="theme-surface-control inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 text-xs text-text-primary transition-colors hover:border-primary/35 hover:text-text1 [&::-webkit-details-marker]:hidden"
        aria-label={accessibleLabel}
        title={accessibleLabel}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            activeItems.length > 0 ? 'bg-primary' : 'bg-text-primary/25'
          }`}
          aria-hidden="true"
        />
        <span className="shrink-0">{modeLabel}</span>
        <strong className="text-text1">{summaryLabel}</strong>
      </summary>
      <div className="theme-surface-popover absolute right-0 top-10 z-50 hidden max-h-[calc(100vh-6rem)] w-64 overflow-y-auto rounded-xl border border-primary/20 p-3 text-xs shadow-xl group-open:block">
        <div className="mb-2 font-bold text-text1">{accessibleLabel}</div>
        <div className="space-y-1.5">
          {items.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/10 ${
                item.active
                  ? 'border-primary/30 bg-primary/10 text-text1'
                  : 'border-primary/10 bg-white/45 text-text-primary'
              }`}
              onClick={() => {
                onSelect(item.tab)
                detailsRef.current?.removeAttribute('open')
              }}
            >
              <span className="truncate font-bold">{item.label}</span>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  item.active
                    ? 'bg-primary text-theme'
                    : 'bg-text-primary/10 text-text-primary'
                }`}
              >
                {item.active ? 'ON' : 'OFF'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  )
}

const getTabGroups = (t: (key: string) => string): TabGroup[] => [
  {
    key: 'start',
    label: t('SettingsGroupStart'),
    tabs: [
      {
        key: 'quickStart',
        label: t('SettingsEasySetup'),
        keywords: [
          'start',
          'easy',
          'beginner',
          'setup',
          'quick',
          'first',
          'character',
          'ai',
          'voice',
          'message',
          '初心者',
          'かんたん',
          '簡単',
          '最初',
          'はじめ',
          'セットアップ',
          'キャラクター',
          '音声',
          'メッセージ',
        ],
      },
      {
        key: 'character',
        label: t('CharacterSettings'),
        keywords: [
          'character',
          'prompt',
          'vrm',
          'live2d',
          'pngtuber',
          'キャラクター',
          'プロンプト',
          'モデル',
          '見た目',
          '名前',
        ],
      },
    ],
  },
  {
    key: 'conversation',
    label: t('SettingsGroupConversation'),
    tabs: [
      {
        key: 'ai',
        label: t('AISettings'),
        keywords: [
          t('SelectModel'),
          t('MaxTokens'),
          t('MaxPastMessages'),
          t('ConversationHistory'),
          'ai',
          'llm',
          'model',
          'token',
          'message',
          'messages',
          'history',
          'chat',
          'モデル',
          'トークン',
          'メッセージ',
          '履歴',
        ],
      },
      {
        key: 'memory',
        label: t('MemorySettings'),
        keywords: [
          t('MaxPastMessages'),
          t('ConversationHistory'),
          'memory',
          'embedding',
          'message',
          'messages',
          'history',
          'chat',
          '記憶',
          'メッセージ',
          '履歴',
          '会話',
        ],
      },
    ],
  },
  {
    key: 'voiceInput',
    label: t('SettingsGroupVoiceInput'),
    tabs: [
      {
        key: 'voice',
        label: t('VoiceSettings'),
        keywords: ['voice', 'tts', 'speaker', '音声', '話者', '読み上げ', '声'],
      },
      {
        key: 'speechInput',
        label: t('SpeechInputSettings'),
        keywords: [
          'speech',
          'input',
          'stt',
          'microphone',
          '音声',
          '入力',
          'マイク',
          '聞く',
        ],
      },
    ],
  },
  {
    key: 'streaming',
    label: t('SettingsGroupStreamingView'),
    tabs: [
      {
        key: 'based',
        label: t('SettingsDisplaySettings'),
        keywords: [
          'display',
          'basic',
          'language',
          'theme',
          'background',
          'assistant text',
          'control panel',
          '表示',
          '基本',
          '言語',
          'テーマ',
          '背景',
          'アシスタントテキスト',
          'コントロールパネル',
        ],
      },
      {
        key: 'youtube',
        label: t('YoutubeSettings'),
        keywords: ['youtube', 'comment', 'stream', '配信', 'コメント'],
      },
      {
        key: 'gameCommentary',
        label: t('GameCommentarySettings'),
        keywords: ['game', 'commentary', '実況', 'ゲーム', 'コメント'],
      },
      {
        key: 'slide',
        label: t('SlideSettings'),
        keywords: ['slide', 'presentation', 'スライド', 'プレゼン'],
      },
      {
        key: 'images',
        label: t('ImageSettings'),
        keywords: ['image', 'layer', '画像', 'レイヤー'],
      },
    ],
  },
  {
    key: 'automation',
    label: t('SettingsGroupAutomation'),
    tabs: [
      {
        key: 'presence',
        label: t('PresenceSettings'),
        keywords: ['presence', 'camera', 'face', '人感', 'カメラ', '顔検出'],
      },
      {
        key: 'idle',
        label: t('IdleSettings'),
        keywords: [
          t('IdlePhraseText'),
          'idle',
          'message',
          'phrase',
          'メッセージ',
          'フレーズ',
        ],
      },
      {
        key: 'kiosk',
        label: t('KioskSettings'),
        keywords: ['kiosk', 'demo', 'passcode', 'デモ', '端末', 'パスコード'],
      },
    ],
  },
  {
    key: 'system',
    label: t('OtherSettings'),
    tabs: [
      {
        key: 'other',
        label: t('SettingsAdvancedSettings'),
        keywords: ['system', 'debug', 'other', 'その他', 'システム', '詳細'],
      },
      {
        key: 'description',
        label: t('Description'),
        keywords: ['about', 'app', 'license', 'github', 'アプリ', '説明'],
      },
    ],
  },
]

const Main = () => {
  const { t } = useTranslation()
  const activeTab = menuStore((state) => state.activeSettingsTab)
  const searchQuery = menuStore((state) => state.settingsSearchQuery)
  const [activeMobileGroup, setActiveMobileGroup] = useState('start')
  const contentScrollRef = useRef<HTMLElement>(null)
  const settingsPanelRef = useRef<HTMLDivElement>(null)

  const setActiveTab = (tab: TabKey) => {
    menuStore.setState({ activeSettingsTab: tab })
  }

  const setActiveGroup = (group: TabGroup) => {
    setActiveMobileGroup(group.key)
    const defaultTab = group.tabs[0]?.key
    if (defaultTab) {
      setActiveTab(defaultTab)
    }
  }

  const groups = useMemo(() => getTabGroups(t), [t])
  const tabs = groups.flatMap((group) => group.tabs)
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const visibleGroups = useMemo(() => {
    if (!normalizedSearchQuery) return groups
    const searchTerms = normalizedSearchQuery.split(/\s+/).filter(Boolean)

    return groups
      .map((group) => ({
        ...group,
        tabs: group.tabs.filter((tab) => {
          const searchText = [tab.label, ...(tab.keywords ?? [])]
            .join(' ')
            .toLowerCase()

          return searchTerms.every((term) => searchText.includes(term))
        }),
      }))
      .filter((group) => group.tabs.length > 0)
  }, [groups, normalizedSearchQuery])
  const activeTabGroup =
    groups.find((group) => group.tabs.some((tab) => tab.key === activeTab))
      ?.key ?? activeMobileGroup
  const selectedMobileGroup = normalizedSearchQuery
    ? activeMobileGroup
    : activeTabGroup

  const visibleMobileTabs = normalizedSearchQuery
    ? visibleGroups.flatMap((group) => group.tabs)
    : (visibleGroups.find((group) => group.key === selectedMobileGroup)?.tabs ??
      visibleGroups[0]?.tabs ??
      [])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'quickStart':
        return <QuickStart />
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
      case 'memory':
        return <MemorySettings />
      case 'presence':
        return <PresenceSettings />
      case 'idle':
        return <IdleSettings />
      case 'gameCommentary':
        return <GameCommentarySettings />
      case 'kiosk':
        return <KioskSettings />
      case 'other':
        return <Other />
      case 'speechInput':
        return <SpeechInput />
    }
  }

  const currentTab = tabs.find((tab) => tab.key === activeTab)

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, left: 0 })
  }, [activeTab])

  useEffect(() => {
    const settingsPanel = settingsPanelRef.current
    if (!settingsPanel) return

    clearSearchHighlights(settingsPanel)

    const searchTerms = searchQuery.trim().split(/\s+/).filter(Boolean)
    if (searchTerms.length === 0) return

    highlightSearchTerms(settingsPanel, searchTerms)

    return () => {
      clearSearchHighlights(settingsPanel)
    }
  }, [activeTab, searchQuery])

  return (
    <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr] text-text1 md:grid-cols-[260px_1fr] md:grid-rows-1">
      <aside className="theme-surface-popover hidden min-h-0 overflow-y-auto border-r border-primary/20 p-3 md:block">
        <nav aria-label="Settings navigation" className="space-y-4">
          {visibleGroups.map((group) => (
            <section key={group.key}>
              <div className="mb-1 px-2 text-xs font-bold text-text-primary/80">
                {group.label}
              </div>
              <ul className="space-y-1">
                {group.tabs.map((tab) => (
                  <li key={tab.key}>
                    <SettingsTabButton
                      active={activeTab === tab.key}
                      label={tab.label}
                      tabKey={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </aside>

      <div className="theme-surface-popover min-w-0 border-b border-primary/20 py-2 md:hidden">
        <div className="scroll-hidden flex gap-2 overflow-x-auto px-3 pb-2">
          {visibleGroups.map((group) => (
            <button
              key={group.key}
              className={`h-9 shrink-0 rounded-lg border px-4 text-sm font-bold shadow-sm ${
                selectedMobileGroup === group.key
                  ? 'border-primary bg-primary text-theme'
                  : 'theme-surface-control text-text1 hover:border-primary/50'
              }`}
              onClick={() => setActiveGroup(group)}
              data-testid={`settings-group-${group.key}`}
            >
              {group.label}
            </button>
          ))}
        </div>
        <div className="scroll-hidden flex gap-2 overflow-x-auto border-t border-primary/10 px-3 pt-2">
          {visibleMobileTabs.map((tab) => (
            <SettingsTabButton
              key={tab.key}
              active={activeTab === tab.key}
              compact
              label={tab.label}
              tabKey={tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>
      </div>

      <section
        ref={contentScrollRef}
        className="min-h-0 min-w-0 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {currentTab && (
                  <div
                    className="h-7 w-7 shrink-0 icon-mask-default"
                    style={{
                      maskImage: `url(${tabIconMapping[currentTab.key]})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
                )}
                <div className="text-2xl font-bold">{currentTab?.label}</div>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-primary/80">
                {t('SettingsIntroDescription')}
              </p>
            </div>
          </div>
          <div
            ref={settingsPanelRef}
            className="theme-surface-elevated rounded-xl border p-4 sm:p-6"
            data-testid="settings-panel"
          >
            <div
              className={
                tabsWithRedundantPanelTitle.has(activeTab)
                  ? 'settings-panel-content settings-panel-content--hide-title'
                  : 'settings-panel-content'
              }
            >
              {renderTabContent()}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

const SettingsTabButton = ({
  active,
  compact = false,
  label,
  onClick,
  tabKey,
}: {
  active: boolean
  compact?: boolean
  label: string
  onClick: () => void
  tabKey: TabKey
}) => {
  return (
    <button
      className={`flex items-center rounded-lg border text-left font-medium transition ${
        compact
          ? 'h-10 shrink-0 px-3 text-sm shadow-sm'
          : 'min-h-[38px] w-full px-3 py-2 text-sm'
      } ${
        active
          ? 'border-primary bg-primary text-theme'
          : 'border-transparent bg-transparent text-text1 hover:border-primary/30 hover:bg-primary/5'
      }`}
      onClick={onClick}
      data-testid={`settings-tab-${tabKey}`}
    >
      <div
        className={`mr-2 h-5 w-5 shrink-0 ${
          active ? 'icon-mask-active' : 'icon-mask-default'
        }`}
        style={{
          maskImage: `url(${tabIconMapping[tabKey]})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
      />
      <span className="truncate">{label}</span>
    </button>
  )
}

const clearSearchHighlights = (root: HTMLElement) => {
  root
    .querySelectorAll('mark[data-settings-search-highlight="true"]')
    .forEach((mark) => {
      const parent = mark.parentNode
      if (!parent) return

      parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark)
      parent.normalize()
    })
}

const highlightSearchTerms = (root: HTMLElement, searchTerms: string[]) => {
  const uniqueTerms = Array.from(
    new Set(searchTerms.map((term) => term.trim()).filter(Boolean))
  )
  if (uniqueTerms.length === 0) return

  const searchPattern = new RegExp(
    `(${uniqueTerms.map(escapeRegExp).join('|')})`,
    'gi'
  )
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const node = walker.currentNode
    const parentElement = node.parentElement
    if (!parentElement || shouldSkipSearchHighlight(parentElement)) continue
    if (!node.textContent || !searchPattern.test(node.textContent)) continue

    textNodes.push(node as Text)
    searchPattern.lastIndex = 0
  }

  textNodes.forEach((node) => {
    const text = node.textContent ?? ''
    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    text.replace(searchPattern, (match, _term, offset: number) => {
      if (offset > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, offset))
        )
      }

      const mark = document.createElement('mark')
      mark.dataset.settingsSearchHighlight = 'true'
      mark.className = 'settings-search-highlight'
      mark.textContent = match
      fragment.appendChild(mark)
      lastIndex = offset + match.length
      return match
    })

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    node.replaceWith(fragment)
    searchPattern.lastIndex = 0
  })
}

const shouldSkipSearchHighlight = (element: Element) =>
  Boolean(
    element.closest(
      'input, textarea, select, option, script, style, mark[data-settings-search-highlight="true"]'
    )
  )

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const Footer = () => {
  return (
    <footer className="theme-surface-contrast shrink-0 border-t border-primary/20 py-1 text-center font-Montserrat text-xs">
      powered by ChatVRM from Pixiv / ver. 2.53.0
    </footer>
  )
}
