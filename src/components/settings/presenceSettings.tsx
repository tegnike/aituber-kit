/**
 * PresenceSettings Component
 *
 * 人感検知機能の設定UIを提供
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.4
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore, {
  PresenceDetectionSensitivity,
} from '@/features/stores/settings'
import { EmotionType, createIdlePhrase } from '@/features/idle/idleTypes'
import { ToggleSwitch } from '../toggleSwitch'
import { TextButton } from '../textButton'

const EMOTION_OPTIONS: EmotionType[] = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'relaxed',
  'surprised',
]

/**
 * 折りたたみ可能なセクションコンポーネント
 */
const CollapsibleSection = ({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <div>
          <div className="font-bold text-lg">{title}</div>
          {description && (
            <div className="text-sm text-gray-500 mt-1">{description}</div>
          )}
        </div>
        <span
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>
      {isOpen && <div className="p-4 border-t border-gray-200">{children}</div>}
    </div>
  )
}

const PresenceSettings = () => {
  const { t } = useTranslation()

  // Settings store state
  const presenceDetectionEnabled = settingsStore(
    (s) => s.presenceDetectionEnabled
  )
  const presenceGreetingPhrases = settingsStore(
    (s) => s.presenceGreetingPhrases
  )
  const presenceDepartureTimeout = settingsStore(
    (s) => s.presenceDepartureTimeout
  )
  const presenceCooldownTime = settingsStore((s) => s.presenceCooldownTime)
  const presenceDetectionSensitivity = settingsStore(
    (s) => s.presenceDetectionSensitivity
  )
  const presenceDetectionThreshold = settingsStore(
    (s) => s.presenceDetectionThreshold
  )
  const presenceDebugMode = settingsStore((s) => s.presenceDebugMode)
  const presenceDeparturePhrases = settingsStore(
    (s) => s.presenceDeparturePhrases
  )
  const presenceClearChatOnDeparture = settingsStore(
    (s) => s.presenceClearChatOnDeparture
  )
  const presenceSelectedCameraId = settingsStore(
    (s) => s.presenceSelectedCameraId
  )

  // カメラデバイス一覧の状態
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [isLoadingCameras, setIsLoadingCameras] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Local state for new phrase input
  const [newGreetingText, setNewGreetingText] = useState('')
  const [newGreetingEmotion, setNewGreetingEmotion] =
    useState<EmotionType>('happy')
  const [newDepartureText, setNewDepartureText] = useState('')
  const [newDepartureEmotion, setNewDepartureEmotion] =
    useState<EmotionType>('neutral')

  // 排他制御による無効化判定
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const audioMode = settingsStore((s) => s.audioMode)
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)
  const slideMode = settingsStore((s) => s.slideMode)
  const isPresenceDisabled =
    realtimeAPIMode || audioMode || externalLinkageMode || slideMode

  // カメラデバイス一覧を取得
  const loadCameraDevices = useCallback(async () => {
    setIsLoadingCameras(true)
    setCameraError(null)
    try {
      // カメラへのアクセス許可を得るため、一時的にストリームを取得
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      })
      // すぐに解放
      tempStream.getTracks().forEach((track) => {
        track.stop()
      })

      // デバイス一覧を取得
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter((device) => device.kind === 'videoinput')
      setCameraDevices(cameras)
    } catch (err) {
      const error = err as Error
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setCameraError(t('PresenceCameraPermissionRequired'))
      } else {
        setCameraError(error.message)
      }
    } finally {
      setIsLoadingCameras(false)
    }
  }, [t])

  // 初回マウント時にカメラ一覧を取得
  useEffect(() => {
    loadCameraDevices()
  }, [loadCameraDevices])

  // カメラ選択変更ハンドラー
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    settingsStore.setState({ presenceSelectedCameraId: e.target.value })
  }

  // Greeting phrase handlers
  const handleAddGreetingPhrase = () => {
    if (!newGreetingText.trim()) return
    const newPhrase = createIdlePhrase(
      newGreetingText.trim(),
      newGreetingEmotion,
      presenceGreetingPhrases.length
    )
    settingsStore.setState({
      presenceGreetingPhrases: [...presenceGreetingPhrases, newPhrase],
    })
    setNewGreetingText('')
    setNewGreetingEmotion('happy')
  }

  const handleDeleteGreetingPhrase = (id: string) => {
    settingsStore.setState({
      presenceGreetingPhrases: presenceGreetingPhrases.filter(
        (p) => p.id !== id
      ),
    })
  }

  const handleGreetingPhraseTextChange = (id: string, text: string) => {
    settingsStore.setState({
      presenceGreetingPhrases: presenceGreetingPhrases.map((p) =>
        p.id === id ? { ...p, text } : p
      ),
    })
  }

  const handleGreetingPhraseEmotionChange = (
    id: string,
    emotion: EmotionType
  ) => {
    settingsStore.setState({
      presenceGreetingPhrases: presenceGreetingPhrases.map((p) =>
        p.id === id ? { ...p, emotion } : p
      ),
    })
  }

  // Departure phrase handlers
  const handleAddDeparturePhrase = () => {
    if (!newDepartureText.trim()) return
    const newPhrase = createIdlePhrase(
      newDepartureText.trim(),
      newDepartureEmotion,
      presenceDeparturePhrases.length
    )
    settingsStore.setState({
      presenceDeparturePhrases: [...presenceDeparturePhrases, newPhrase],
    })
    setNewDepartureText('')
    setNewDepartureEmotion('neutral')
  }

  const handleDeleteDeparturePhrase = (id: string) => {
    settingsStore.setState({
      presenceDeparturePhrases: presenceDeparturePhrases.filter(
        (p) => p.id !== id
      ),
    })
  }

  const handleDeparturePhraseTextChange = (id: string, text: string) => {
    settingsStore.setState({
      presenceDeparturePhrases: presenceDeparturePhrases.map((p) =>
        p.id === id ? { ...p, text } : p
      ),
    })
  }

  const handleDeparturePhraseEmotionChange = (
    id: string,
    emotion: EmotionType
  ) => {
    settingsStore.setState({
      presenceDeparturePhrases: presenceDeparturePhrases.map((p) =>
        p.id === id ? { ...p, emotion } : p
      ),
    })
  }

  // Other handlers
  const handleDepartureTimeoutChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ presenceDepartureTimeout: value })
    }
  }

  const handleCooldownTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ presenceCooldownTime: value })
    }
  }

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    settingsStore.setState({
      presenceDetectionSensitivity: e.target
        .value as PresenceDetectionSensitivity,
    })
  }

  const handleDetectionThresholdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      settingsStore.setState({ presenceDetectionThreshold: value })
    }
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
          <h2 className="text-2xl font-bold">{t('PresenceSettings')}</h2>
        </div>

        {/* ===== 基本設定 ===== */}

        {/* 人感検知モードON/OFF */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceDetectionEnabled')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceDetectionEnabledInfo')}
          </div>
          {isPresenceDisabled && (
            <div className="my-4 text-sm text-orange-500 whitespace-pre-line">
              {t('PresenceDetectionDisabledInfo')}
            </div>
          )}
          <div className="my-2">
            <ToggleSwitch
              enabled={presenceDetectionEnabled}
              onChange={(v) =>
                settingsStore.setState({ presenceDetectionEnabled: v })
              }
              disabled={isPresenceDisabled}
            />
          </div>
        </div>

        {/* 挨拶メッセージリスト */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceGreetingPhrases')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceGreetingPhrasesInfo')}
          </div>

          {/* 既存の挨拶メッセージリスト */}
          {presenceGreetingPhrases.length > 0 && (
            <div className="my-4 space-y-2">
              {presenceGreetingPhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg"
                >
                  <input
                    type="text"
                    value={phrase.text}
                    onChange={(e) =>
                      handleGreetingPhraseTextChange(phrase.id, e.target.value)
                    }
                    className="flex-1 px-3 py-1 border border-gray-200 rounded"
                    aria-label={t('PresencePhraseTextPlaceholder')}
                  />
                  <select
                    value={phrase.emotion}
                    onChange={(e) =>
                      handleGreetingPhraseEmotionChange(
                        phrase.id,
                        e.target.value as EmotionType
                      )
                    }
                    className="w-28 px-2 py-1 border border-gray-200 rounded"
                  >
                    {EMOTION_OPTIONS.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {t(`Emotion_${emotion}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDeleteGreetingPhrase(phrase.id)}
                    className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
                    aria-label={t('PresenceDeletePhrase')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 新規挨拶メッセージ追加 */}
          <div className="my-4 flex items-center gap-2">
            <input
              type="text"
              value={newGreetingText}
              onChange={(e) => setNewGreetingText(e.target.value)}
              placeholder={t('PresencePhraseTextPlaceholder')}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  handleAddGreetingPhrase()
                }
              }}
            />
            <select
              value={newGreetingEmotion}
              onChange={(e) =>
                setNewGreetingEmotion(e.target.value as EmotionType)
              }
              className="w-28 px-2 py-2 bg-white border border-gray-300 rounded-lg"
            >
              {EMOTION_OPTIONS.map((emotion) => (
                <option key={emotion} value={emotion}>
                  {t(`Emotion_${emotion}`)}
                </option>
              ))}
            </select>
            <TextButton onClick={handleAddGreetingPhrase}>
              {t('PresenceAddPhrase')}
            </TextButton>
          </div>
        </div>

        {/* 離脱メッセージリスト */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceDeparturePhrases')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceDeparturePhrasesInfo')}
          </div>

          {/* 既存の離脱メッセージリスト */}
          {presenceDeparturePhrases.length > 0 && (
            <div className="my-4 space-y-2">
              {presenceDeparturePhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg"
                >
                  <input
                    type="text"
                    value={phrase.text}
                    onChange={(e) =>
                      handleDeparturePhraseTextChange(phrase.id, e.target.value)
                    }
                    className="flex-1 px-3 py-1 border border-gray-200 rounded"
                    aria-label={t('PresencePhraseTextPlaceholder')}
                  />
                  <select
                    value={phrase.emotion}
                    onChange={(e) =>
                      handleDeparturePhraseEmotionChange(
                        phrase.id,
                        e.target.value as EmotionType
                      )
                    }
                    className="w-28 px-2 py-1 border border-gray-200 rounded"
                  >
                    {EMOTION_OPTIONS.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {t(`Emotion_${emotion}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDeleteDeparturePhrase(phrase.id)}
                    className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
                    aria-label={t('PresenceDeletePhrase')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 新規離脱メッセージ追加 */}
          <div className="my-4 flex items-center gap-2">
            <input
              type="text"
              value={newDepartureText}
              onChange={(e) => setNewDepartureText(e.target.value)}
              placeholder={t('PresencePhraseTextPlaceholder')}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  handleAddDeparturePhrase()
                }
              }}
            />
            <select
              value={newDepartureEmotion}
              onChange={(e) =>
                setNewDepartureEmotion(e.target.value as EmotionType)
              }
              className="w-28 px-2 py-2 bg-white border border-gray-300 rounded-lg"
            >
              {EMOTION_OPTIONS.map((emotion) => (
                <option key={emotion} value={emotion}>
                  {t(`Emotion_${emotion}`)}
                </option>
              ))}
            </select>
            <TextButton onClick={handleAddDeparturePhrase}>
              {t('PresenceAddPhrase')}
            </TextButton>
          </div>
        </div>

        {/* 離脱時に会話履歴をクリア */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceClearChatOnDeparture')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceClearChatOnDepartureInfo')}
          </div>
          <div className="my-2">
            <ToggleSwitch
              enabled={presenceClearChatOnDeparture}
              onChange={(v) =>
                settingsStore.setState({ presenceClearChatOnDeparture: v })
              }
            />
          </div>
        </div>

        {/* ===== タイミング設定（折りたたみ） ===== */}
        <CollapsibleSection
          title={t('PresenceTimingSettings')}
          description={t('PresenceTimingSettingsInfo')}
        >
          {/* 離脱判定時間 */}
          <div className="mb-6">
            <div className="mb-2 font-bold">
              {t('PresenceDepartureTimeout')}
            </div>
            <div className="mb-2 text-sm whitespace-pre-wrap">
              {t('PresenceDepartureTimeoutInfo')}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={presenceDepartureTimeout}
                onChange={handleDepartureTimeoutChange}
                aria-label={t('PresenceDepartureTimeout')}
                className="w-20 px-4 py-2 bg-white border border-gray-300 rounded-lg"
              />
              <span>{t('Seconds')}</span>
            </div>
          </div>

          {/* クールダウン時間 */}
          <div>
            <div className="mb-2 font-bold">{t('PresenceCooldownTime')}</div>
            <div className="mb-2 text-sm whitespace-pre-wrap">
              {t('PresenceCooldownTimeInfo')}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                value={presenceCooldownTime}
                onChange={handleCooldownTimeChange}
                aria-label={t('PresenceCooldownTime')}
                className="w-20 px-4 py-2 bg-white border border-gray-300 rounded-lg"
              />
              <span>{t('Seconds')}</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* ===== 検出設定（折りたたみ） ===== */}
        <CollapsibleSection
          title={t('PresenceDetectionSettings')}
          description={t('PresenceDetectionSettingsInfo')}
        >
          {/* カメラ選択 */}
          <div className="mb-6">
            <div className="mb-2 font-bold">{t('PresenceSelectedCamera')}</div>
            <div className="mb-2 text-sm whitespace-pre-wrap">
              {t('PresenceSelectedCameraInfo')}
            </div>
            {cameraError && (
              <div className="mb-2 text-sm text-orange-500">{cameraError}</div>
            )}
            <div className="flex items-center gap-2">
              <select
                value={presenceSelectedCameraId}
                onChange={handleCameraChange}
                aria-label={t('PresenceSelectedCamera')}
                className="flex-1 max-w-md px-4 py-2 bg-white border border-gray-300 rounded-lg"
                disabled={isLoadingCameras}
              >
                <option value="">{t('PresenceCameraDefault')}</option>
                {cameraDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
              <TextButton
                onClick={loadCameraDevices}
                disabled={isLoadingCameras}
              >
                {isLoadingCameras ? '...' : t('PresenceCameraRefresh')}
              </TextButton>
            </div>
          </div>

          {/* 検出感度 */}
          <div className="mb-6">
            <div className="mb-2 font-bold">
              {t('PresenceDetectionSensitivity')}
            </div>
            <div className="mb-2 text-sm whitespace-pre-wrap">
              {t('PresenceDetectionSensitivityInfo')}
            </div>
            <div>
              <select
                value={presenceDetectionSensitivity}
                onChange={handleSensitivityChange}
                aria-label={t('PresenceDetectionSensitivity')}
                className="w-40 px-4 py-2 bg-white border border-gray-300 rounded-lg"
              >
                <option value="low">{t('PresenceSensitivityLow')}</option>
                <option value="medium">{t('PresenceSensitivityMedium')}</option>
                <option value="high">{t('PresenceSensitivityHigh')}</option>
              </select>
            </div>
          </div>

          {/* 検出確定時間 */}
          <div>
            <div className="mb-2 font-bold">
              {t('PresenceDetectionThreshold')}
            </div>
            <div className="mb-2 text-sm whitespace-pre-wrap">
              {t('PresenceDetectionThresholdInfo')}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={presenceDetectionThreshold}
                onChange={handleDetectionThresholdChange}
                aria-label={t('PresenceDetectionThreshold')}
                className="w-20 px-4 py-2 bg-white border border-gray-300 rounded-lg"
              />
              <span>{t('Seconds')}</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* ===== 開発者向け設定（折りたたみ） ===== */}
        <CollapsibleSection title={t('PresenceDeveloperSettings')}>
          {/* デバッグモード */}
          <div>
            <div className="mb-2 font-bold">{t('PresenceDebugMode')}</div>
            <div className="mb-2 text-sm whitespace-pre-wrap">
              {t('PresenceDebugModeInfo')}
            </div>
            <div>
              <ToggleSwitch
                enabled={presenceDebugMode}
                onChange={(v) =>
                  settingsStore.setState({ presenceDebugMode: v })
                }
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </>
  )
}

export default PresenceSettings
