import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore, { SettingsState } from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'

const CharacterPresetMenu = () => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const store = settingsStore()
  const selectedPresetIndex = store.selectedPresetIndex
  const showCharacterPresetMenu = store.showCharacterPresetMenu

  // コンポーネントが非表示設定の場合は何も表示しない
  if (!showCharacterPresetMenu) {
    return null
  }

  const characterPresets = [
    {
      key: 'characterPreset1',
      value: store.characterPreset1,
      nameKey: 'customPresetName1',
      customName: store.customPresetName1,
    },
    {
      key: 'characterPreset2',
      value: store.characterPreset2,
      nameKey: 'customPresetName2',
      customName: store.customPresetName2,
    },
    {
      key: 'characterPreset3',
      value: store.characterPreset3,
      nameKey: 'customPresetName3',
      customName: store.customPresetName3,
    },
    {
      key: 'characterPreset4',
      value: store.characterPreset4,
      nameKey: 'customPresetName4',
      customName: store.customPresetName4,
    },
    {
      key: 'characterPreset5',
      value: store.characterPreset5,
      nameKey: 'customPresetName5',
      customName: store.customPresetName5,
    },
  ]

  const handlePresetClick = (
    key: string,
    value: string,
    customName: string,
    index: number
  ) => {
    settingsStore.setState({
      systemPrompt: value,
      selectedPresetIndex: index,
    })

    toastStore.getState().addToast({
      message: t('Toasts.PresetSwitching', {
        presetName: customName,
      }),
      type: 'info',
      tag: `character-preset-switching`,
    })
    setIsOpen(false)
  }

  // キーボードイベントハンドラを追加
  const handleKeyDown = (
    e: React.KeyboardEvent,
    key: string,
    value: string,
    customName: string,
    index: number
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handlePresetClick(key, value, customName, index)
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-30">
      {/* メインボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
        aria-label={t('CharacterSettingsPrompt')}
        aria-expanded={isOpen}
        aria-controls="preset-menu"
      >
        {isOpen ? (
          // 上向き矢印（メニューオープン時）
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        ) : (
          // 下向き矢印（メニュークローズ時）
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* プリセットメニュー */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-2 w-48"
          id="preset-menu"
          role="menu"
        >
          <div className="text-sm font-bold mb-2 text-center text-gray-700">
            {t('CharacterSettingsPrompt')}
          </div>
          {characterPresets.map(({ key, value, customName }, index) => {
            const isSelected = selectedPresetIndex === index

            return (
              <button
                key={key}
                onClick={() => handlePresetClick(key, value, customName, index)}
                onKeyDown={(e) =>
                  handleKeyDown(e, key, value, customName, index)
                }
                role="menuitem"
                tabIndex={0}
                aria-current={isSelected ? 'true' : 'false'}
                className={`w-full text-left px-4 py-2 rounded-md mb-1 text-sm ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                {isSelected && <span className="mr-1">▶ </span>}
                {customName}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CharacterPresetMenu
