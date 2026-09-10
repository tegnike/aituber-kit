import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { Language } from '@/features/constants/settings'
import { IconButton, InlineOutlineIcon } from '../../iconButton'
import { languageOptions } from '@/components/settings/languageOptions'
import { TabKey } from './tabConfig'

type HeaderProps = {
  onClickClose: () => void
}

export const Header = ({ onClickClose }: HeaderProps) => {
  const { i18n, t } = useTranslation()
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectVoice = settingsStore((s) => s.selectVoice)
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const settingsSearchQuery = menuStore((state) => state.settingsSearchQuery)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const youtubeMode = settingsStore((s) => s.youtubeMode)
  const liveMode = settingsStore((s) => s.liveMode)
  const liveVoice = settingsStore((s) => s.liveVoice)
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
    { label: 'GPT-Live', active: liveMode, tab: 'ai' },
    { label: t('SettingsModeYoutube'), active: youtubeMode, tab: 'youtube' },
    {
      label: t('SettingsModeRealtimeAPI'),
      active: realtimeAPIMode,
      tab: 'ai',
    },
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
          value={
            liveMode
              ? `GPT-Live (${liveVoice})`
              : formatStatusValue(selectVoice)
          }
          onClick={() => openHeaderTab(liveMode ? 'ai' : 'voice')}
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
  const summaryLabel =
    activeItems.length === 0 ? t('SettingsModeAllOff') : t('SettingsModeOn')
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
                {item.active ? t('SettingsModeOn') : t('SettingsModeOff')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  )
}
