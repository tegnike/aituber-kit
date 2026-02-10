/**
 * IdleSettings Component
 *
 * アイドルモード機能の設定UIを提供
 * Requirements: 1.1, 3.1-3.3, 4.1-4.4, 7.2-7.3, 8.2-8.3
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { ToggleSwitch } from '../toggleSwitch'
import {
  IdlePhrase,
  IdlePlaybackMode,
  EmotionType,
  createIdlePhrase,
  clampIdleInterval,
  IDLE_INTERVAL_MIN,
  IDLE_INTERVAL_MAX,
} from '@/features/idle/idleTypes'

const EMOTION_OPTIONS: EmotionType[] = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'relaxed',
  'surprised',
]

const IdleSettings = () => {
  const { t } = useTranslation()

  // Settings store state
  const idleModeEnabled = settingsStore((s) => s.idleModeEnabled)
  const idlePhrases = settingsStore((s) => s.idlePhrases)
  const idlePlaybackMode = settingsStore((s) => s.idlePlaybackMode)
  const idleInterval = settingsStore((s) => s.idleInterval)
  const idleTimePeriodEnabled = settingsStore((s) => s.idleTimePeriodEnabled)
  const idleTimePeriodMorning = settingsStore((s) => s.idleTimePeriodMorning)
  const idleTimePeriodMorningEmotion = settingsStore(
    (s) => s.idleTimePeriodMorningEmotion
  )
  const idleTimePeriodAfternoon = settingsStore(
    (s) => s.idleTimePeriodAfternoon
  )
  const idleTimePeriodAfternoonEmotion = settingsStore(
    (s) => s.idleTimePeriodAfternoonEmotion
  )
  const idleTimePeriodEvening = settingsStore((s) => s.idleTimePeriodEvening)
  const idleTimePeriodEveningEmotion = settingsStore(
    (s) => s.idleTimePeriodEveningEmotion
  )
  const idleAiGenerationEnabled = settingsStore(
    (s) => s.idleAiGenerationEnabled
  )
  const idleAiPromptTemplate = settingsStore((s) => s.idleAiPromptTemplate)

  // 排他制御による無効化判定
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const audioMode = settingsStore((s) => s.audioMode)
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)
  const slideMode = settingsStore((s) => s.slideMode)
  const isIdleModeDisabled =
    realtimeAPIMode || audioMode || externalLinkageMode || slideMode

  // Local state for new phrase input
  const [newPhraseText, setNewPhraseText] = useState('')
  const [newPhraseEmotion, setNewPhraseEmotion] =
    useState<EmotionType>('neutral')

  // Handlers
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ idleInterval: value })
    }
  }

  const handleIntervalBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ idleInterval: clampIdleInterval(value) })
    }
  }

  const handlePlaybackModeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    settingsStore.setState({
      idlePlaybackMode: e.target.value as IdlePlaybackMode,
    })
  }

  const handleAddPhrase = () => {
    if (!newPhraseText.trim()) return

    const newPhrase = createIdlePhrase(
      newPhraseText.trim(),
      newPhraseEmotion,
      idlePhrases.length
    )
    settingsStore.setState({
      idlePhrases: [...idlePhrases, newPhrase],
    })
    setNewPhraseText('')
    setNewPhraseEmotion('neutral')
  }

  const handleDeletePhrase = (id: string) => {
    const remaining = idlePhrases.filter((p) => p.id !== id)
    const reindexed = remaining.map((p, i) => ({ ...p, order: i }))
    settingsStore.setState({ idlePhrases: reindexed })
  }

  const handlePhraseTextChange = (id: string, text: string) => {
    settingsStore.setState({
      idlePhrases: idlePhrases.map((p) => (p.id === id ? { ...p, text } : p)),
    })
  }

  const handlePhraseEmotionChange = (id: string, emotion: EmotionType) => {
    settingsStore.setState({
      idlePhrases: idlePhrases.map((p) =>
        p.id === id ? { ...p, emotion } : p
      ),
    })
  }

  const handleMovePhrase = (id: string, direction: 'up' | 'down') => {
    const index = idlePhrases.findIndex((p) => p.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === idlePhrases.length - 1) return

    const newPhrases = [...idlePhrases]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newPhrases[index], newPhrases[swapIndex]] = [
      newPhrases[swapIndex],
      newPhrases[index],
    ]
    // Update order values with new phrase objects to maintain immutability
    const updatedPhrases = newPhrases.map((p, i) => ({ ...p, order: i }))
    settingsStore.setState({ idlePhrases: updatedPhrases })
  }

  const handleTimePeriodChange = (
    period: 'morning' | 'afternoon' | 'evening',
    value: string
  ) => {
    const key =
      `idleTimePeriod${period.charAt(0).toUpperCase() + period.slice(1)}` as
        | 'idleTimePeriodMorning'
        | 'idleTimePeriodAfternoon'
        | 'idleTimePeriodEvening'
    settingsStore.setState({ [key]: value })
  }

  const handleAiPromptTemplateChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    settingsStore.setState({ idleAiPromptTemplate: e.target.value })
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <div
            className="w-6 h-6 mr-2 icon-mask-default"
            style={{
              maskImage: 'url(/images/setting-icons/other-settings.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          />
          <h2 className="text-2xl font-bold">{t('IdleSettings')}</h2>
        </div>

        {/* アイドルモードON/OFF */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('IdleModeEnabled')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('IdleModeEnabledInfo')}
          </div>
          {isIdleModeDisabled && (
            <div className="my-4 text-sm text-orange-500 whitespace-pre-line">
              {t('IdleModeDisabledInfo')}
            </div>
          )}
          <div className="my-2">
            <ToggleSwitch
              enabled={idleModeEnabled}
              onChange={(v) => settingsStore.setState({ idleModeEnabled: v })}
              disabled={isIdleModeDisabled}
            />
          </div>
        </div>

        {/* 発話間隔 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('IdleInterval')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('IdleIntervalInfo', {
              min: IDLE_INTERVAL_MIN,
              max: IDLE_INTERVAL_MAX,
            })}
          </div>
          <div className="my-4 flex items-center gap-2">
            <input
              type="number"
              min={IDLE_INTERVAL_MIN}
              max={IDLE_INTERVAL_MAX}
              value={idleInterval}
              onChange={handleIntervalChange}
              onBlur={handleIntervalBlur}
              aria-label={t('IdleInterval')}
              className="w-24 px-4 py-2 bg-white border border-gray-300 rounded-lg"
            />
            <span>{t('Seconds')}</span>
          </div>
        </div>

        {/* 発話ソース */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('IdleSpeechSource')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('IdleSpeechSourceInfo')}
          </div>
          <div className="my-4">
            <select
              value={
                idleTimePeriodEnabled
                  ? 'timePeriod'
                  : idleAiGenerationEnabled
                    ? 'aiGeneration'
                    : 'phraseList'
              }
              onChange={(e) => {
                const value = e.target.value
                settingsStore.setState({
                  idleTimePeriodEnabled: value === 'timePeriod',
                  idleAiGenerationEnabled: value === 'aiGeneration',
                })
              }}
              aria-label={t('IdleSpeechSource')}
              className="w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg"
            >
              <option value="phraseList">
                {t('IdleSpeechSourcePhraseList')}
              </option>
              <option value="timePeriod">{t('IdleTimePeriodEnabled')}</option>
              <option value="aiGeneration">
                {t('IdleAiGenerationEnabled')}
              </option>
            </select>
          </div>

          {/* 発話リスト（phraseList選択時） */}
          {!idleTimePeriodEnabled && !idleAiGenerationEnabled && (
            <div className="my-4 space-y-4">
              {/* 再生モード */}
              <div>
                <div className="my-2 text-sm font-medium">
                  {t('IdlePlaybackMode')}
                </div>
                <div className="my-1 text-xs text-gray-500">
                  {t('IdlePlaybackModeInfo')}
                </div>
                <select
                  value={idlePlaybackMode}
                  onChange={handlePlaybackModeChange}
                  aria-label={t('IdlePlaybackMode')}
                  className="w-40 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                >
                  <option value="sequential">
                    {t('IdlePlaybackSequential')}
                  </option>
                  <option value="random">{t('IdlePlaybackRandom')}</option>
                </select>
              </div>

              {/* 発話リスト */}
              <div>
                <div className="my-2 text-sm font-medium">
                  {t('IdlePhrases')}
                </div>
                <div className="my-1 text-xs text-gray-500">
                  {t('IdlePhrasesInfo')}
                </div>

                {/* 既存の発話リスト */}
                {idlePhrases.length > 0 && (
                  <div className="my-4 space-y-2">
                    {idlePhrases.map((phrase, index) => (
                      <div
                        key={phrase.id}
                        className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMovePhrase(phrase.id, 'up')}
                            disabled={index === 0}
                            className="px-2 py-0.5 text-xs bg-gray-100 rounded disabled:opacity-30"
                            aria-label={t('IdleMoveUp')}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMovePhrase(phrase.id, 'down')}
                            disabled={index === idlePhrases.length - 1}
                            className="px-2 py-0.5 text-xs bg-gray-100 rounded disabled:opacity-30"
                            aria-label={t('IdleMoveDown')}
                          >
                            ▼
                          </button>
                        </div>
                        <input
                          type="text"
                          value={phrase.text}
                          onChange={(e) =>
                            handlePhraseTextChange(phrase.id, e.target.value)
                          }
                          className="flex-1 px-3 py-1 border border-gray-200 rounded"
                          aria-label={t('IdlePhraseText')}
                        />
                        <select
                          value={phrase.emotion}
                          onChange={(e) =>
                            handlePhraseEmotionChange(
                              phrase.id,
                              e.target.value as EmotionType
                            )
                          }
                          className="w-28 px-2 py-1 border border-gray-200 rounded"
                          aria-label={t('IdlePhraseEmotion')}
                        >
                          {EMOTION_OPTIONS.map((emotion) => (
                            <option key={emotion} value={emotion}>
                              {t(`Emotion_${emotion}`)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeletePhrase(phrase.id)}
                          className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
                          aria-label={t('IdleDeletePhrase')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 新規発話追加 */}
                <div className="my-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={newPhraseText}
                    onChange={(e) => setNewPhraseText(e.target.value)}
                    placeholder={t('IdlePhraseTextPlaceholder')}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        handleAddPhrase()
                      }
                    }}
                  />
                  <select
                    value={newPhraseEmotion}
                    onChange={(e) =>
                      setNewPhraseEmotion(e.target.value as EmotionType)
                    }
                    className="w-28 px-2 py-2 bg-white border border-gray-300 rounded-lg"
                  >
                    {EMOTION_OPTIONS.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {t(`Emotion_${emotion}`)}
                      </option>
                    ))}
                  </select>
                  <TextButton onClick={handleAddPhrase}>
                    {t('IdleAddPhrase')}
                  </TextButton>
                </div>
              </div>
            </div>
          )}

          {/* 時間帯別挨拶（timePeriod選択時） */}
          {idleTimePeriodEnabled && (
            <div className="my-4 space-y-4">
              {/* 朝（5:00-10:59） */}
              <div>
                <div className="my-2 text-sm font-medium">
                  {t('IdleTimePeriodMorning')}
                  <span className="ml-2 text-gray-500">(5:00-10:59)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={idleTimePeriodMorning}
                    onChange={(e) =>
                      handleTimePeriodChange('morning', e.target.value)
                    }
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    aria-label={t('IdleTimePeriodMorning')}
                  />
                  <select
                    value={idleTimePeriodMorningEmotion}
                    onChange={(e) =>
                      settingsStore.setState({
                        idleTimePeriodMorningEmotion: e.target
                          .value as EmotionType,
                      })
                    }
                    className="w-28 px-2 py-2 border border-gray-300 rounded-lg"
                  >
                    {EMOTION_OPTIONS.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {t(`Emotion_${emotion}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* 昼（11:00-16:59） */}
              <div>
                <div className="my-2 text-sm font-medium">
                  {t('IdleTimePeriodAfternoon')}
                  <span className="ml-2 text-gray-500">(11:00-16:59)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={idleTimePeriodAfternoon}
                    onChange={(e) =>
                      handleTimePeriodChange('afternoon', e.target.value)
                    }
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    aria-label={t('IdleTimePeriodAfternoon')}
                  />
                  <select
                    value={idleTimePeriodAfternoonEmotion}
                    onChange={(e) =>
                      settingsStore.setState({
                        idleTimePeriodAfternoonEmotion: e.target
                          .value as EmotionType,
                      })
                    }
                    className="w-28 px-2 py-2 border border-gray-300 rounded-lg"
                  >
                    {EMOTION_OPTIONS.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {t(`Emotion_${emotion}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* 夕（17:00-4:59） */}
              <div>
                <div className="my-2 text-sm font-medium">
                  {t('IdleTimePeriodEvening')}
                  <span className="ml-2 text-gray-500">(17:00-4:59)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={idleTimePeriodEvening}
                    onChange={(e) =>
                      handleTimePeriodChange('evening', e.target.value)
                    }
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    aria-label={t('IdleTimePeriodEvening')}
                  />
                  <select
                    value={idleTimePeriodEveningEmotion}
                    onChange={(e) =>
                      settingsStore.setState({
                        idleTimePeriodEveningEmotion: e.target
                          .value as EmotionType,
                      })
                    }
                    className="w-28 px-2 py-2 border border-gray-300 rounded-lg"
                  >
                    {EMOTION_OPTIONS.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {t(`Emotion_${emotion}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* AI自動生成（aiGeneration選択時） */}
          {idleAiGenerationEnabled && (
            <div className="my-4">
              <div className="my-2 text-sm font-medium">
                {t('IdleAiPromptTemplate')}
              </div>
              <div className="my-2 text-xs text-gray-500">
                {t('IdleAiPromptTemplateHint')}
              </div>
              <textarea
                value={idleAiPromptTemplate}
                onChange={handleAiPromptTemplateChange}
                className="w-full h-24 px-4 py-2 bg-white border border-gray-300 rounded-lg resize-none"
                placeholder={t('IdleAiPromptTemplatePlaceholder')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default IdleSettings
