import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import settingsStore, { SettingsState } from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import useImagesStore from '@/features/stores/images'

const CharacterPresetMenu = () => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'presets' | 'layers'>('presets')
  const store = settingsStore()
  const selectedPresetIndex = store.selectedPresetIndex
  const showQuickMenu = store.showQuickMenu

  const { placedImages, reorderAllLayers, getAllLayerItems } = useImagesStore()

  // コンポーネントが非表示設定の場合は何も表示しない
  if (!showQuickMenu) {
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return
    }

    const startIndex = result.source.index
    const endIndex = result.destination.index

    if (startIndex !== endIndex) {
      reorderAllLayers(startIndex, endIndex)
    }
  }

  const layerItems = getAllLayerItems()

  return (
    <div className="fixed bottom-3.5 right-4 z-30 sm:bottom-8">
      {/* メインボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="aurora-glass-popover flex h-11 w-11 items-center justify-center rounded-xl text-primary transition-colors hover:border-secondary hover:text-secondary"
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

      {/* プリセット・レイヤーメニュー */}
      {isOpen && (
        <div
          className="aurora-glass-popover absolute bottom-14 right-0 w-72 rounded-xl p-2 text-theme-default"
          id="preset-menu"
          role="menu"
        >
          {/* タブナビゲーション */}
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-primary/5 p-1">
            <button
              onClick={() => setActiveTab('presets')}
              className={`rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === 'presets'
                  ? 'bg-primary text-theme shadow-sm'
                  : 'text-text-primary hover:bg-primary/10 hover:text-text1'
              }`}
            >
              {t('Presets')}
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === 'layers'
                  ? 'bg-primary text-theme shadow-sm'
                  : 'text-text-primary hover:bg-primary/10 hover:text-text1'
              }`}
            >
              {t('LayerOrder')}
            </button>
          </div>

          {/* プリセットタブの内容 */}
          {activeTab === 'presets' && (
            <div>
              <div className="mb-2 px-2 text-sm font-bold text-text1">
                {t('CharacterSettingsPrompt')}
              </div>
              {characterPresets.map(({ key, value, customName }, index) => {
                const isSelected = selectedPresetIndex === index

                return (
                  <button
                    key={key}
                    onClick={() =>
                      handlePresetClick(key, value, customName, index)
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, key, value, customName, index)
                    }
                    role="menuitem"
                    tabIndex={0}
                    aria-current={isSelected ? 'true' : 'false'}
                    className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${
                      isSelected
                        ? 'bg-primary text-theme shadow-sm'
                        : 'text-theme-default hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {isSelected && <span className="mr-1">▶ </span>}
                    {customName}
                  </button>
                )
              })}
            </div>
          )}

          {/* レイヤータブの内容 */}
          {activeTab === 'layers' && (
            <div>
              {layerItems.length === 1 ? (
                <div className="py-4 text-center text-xs text-text-primary">
                  {t('NoPlacedImages')}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {/* 最前面ラベル */}
                  <div className="mb-2 border-b border-dashed border-primary/20 py-1 text-center text-xs text-text-primary">
                    {t('BottomLayer')}
                  </div>

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="preset-layers">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {layerItems.map((item, index) => (
                            <Draggable
                              key={item.id}
                              draggableId={item.id}
                              index={index}
                              isDragDisabled={false}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center space-x-2 rounded-lg border p-2 text-xs transition-all duration-200 ${
                                    snapshot.isDragging
                                      ? 'border-primary bg-primary/10 shadow-md'
                                      : item.type === 'character'
                                        ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                                        : 'border-primary/15 bg-[color-mix(in_srgb,var(--color-text-base)_90%,transparent)] hover:bg-primary/5'
                                  }`}
                                >
                                  {/* ドラッグハンドル */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex-shrink-0 cursor-grab text-text-primary active:cursor-grabbing"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      {item.type === 'character' ? (
                                        <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z" />
                                      ) : (
                                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                                      )}
                                    </svg>
                                  </div>

                                  {/* サムネイル */}
                                  <div
                                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                                      item.type === 'character'
                                        ? 'bg-primary'
                                        : 'overflow-hidden bg-white/80'
                                    }`}
                                  >
                                    {item.type === 'character' ? (
                                      <svg
                                        className="w-4 h-4 text-theme"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                      </svg>
                                    ) : (
                                      <img
                                        src={item.path}
                                        alt={item.filename}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>

                                  {/* 名前と順序 */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-medium truncate">
                                        {item.type === 'character'
                                          ? t('CharacterLayer')
                                          : item.filename}
                                      </p>
                                      <span className="text-xs opacity-70 ml-1">
                                        #{index + 1}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {/* 最背面ラベル */}
                  <div className="mt-2 border-t border-dashed border-primary/20 py-1 text-center text-xs text-text-primary">
                    {t('TopLayer')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CharacterPresetMenu
