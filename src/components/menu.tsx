import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { AssistantText } from './assistantText'
import { ChatLog } from './chatLog'
import { IconButton } from './iconButton'
import Settings from './settings'
import { Webcam } from './webcam'
import Slides from './slides'
import Capture from './capture'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'
import { getLatestAssistantMessage } from '@/utils/assistantMessageUtils'
import { useKioskMode } from '@/hooks/useKioskMode'

// モバイルデバイス検出用のカスタムフック
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    // モバイルデバイス検出用の関数
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
          /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      )
    }

    // 初回レンダリング時とウィンドウサイズ変更時に検出
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export const Menu = () => {
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const customModel = settingsStore((s) => s.customModel)
  const youtubeMode = settingsStore((s) => s.youtubeMode)
  const youtubePlaying = settingsStore((s) => s.youtubePlaying)
  const gameCommentaryEnabled = settingsStore((s) => s.gameCommentaryEnabled)
  const gameCommentaryPlaying = settingsStore((s) => s.gameCommentaryPlaying)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const chatLog = homeStore((s) => s.chatLog)
  const showWebcam = menuStore((s) => s.showWebcam)
  const showControlPanel = settingsStore((s) => s.showControlPanel)
  const showCapture = menuStore((s) => s.showCapture)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const showAssistantText = settingsStore((s) => s.showAssistantText)

  // デモ端末モード関連
  const { isKioskMode, isTemporaryUnlocked, canAccessSettings } = useKioskMode()

  // デモ端末モード時はコントロールパネルを非表示（一時解除時は除く）
  const effectiveShowControlPanel =
    showControlPanel && (!isKioskMode || isTemporaryUnlocked)

  const [showSettings, setShowSettings] = useState(false)

  // デモ端末モードで設定アクセス権が剥奪された場合に自動クローズ
  useEffect(() => {
    if (!canAccessSettings) {
      setShowSettings(false)
    }
  }, [canAccessSettings])
  // 会話ログ表示モード
  const CHAT_LOG_MODE = {
    HIDDEN: 0, // 非表示
    ASSISTANT: 1, // アシスタントテキスト
    CHAT_LOG: 2, // 会話ログ
  } as const

  const [chatLogMode, setChatLogMode] = useState<number>(
    CHAT_LOG_MODE.ASSISTANT
  )
  const [showToolMenu, setShowToolMenu] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  // ロングタップ用のステート
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null)
  const [touchEndTime, setTouchEndTime] = useState<number | null>(null)

  // モバイルデバイス検出
  const isMobile = useIsMobile()

  const selectedSlideDocs = slideStore((state) => state.selectedSlideDocs)
  const { t } = useTranslation()

  const [markdownContent, setMarkdownContent] = useState('')

  // ロングタップ処理用の関数
  const handleTouchStart = () => {
    // デモ端末モードで設定アクセス不可の場合はロングタップを無効化
    if (!canAccessSettings) return
    setTouchStartTime(Date.now())
  }

  const handleTouchEnd = () => {
    // デモ端末モードで設定アクセス不可の場合はロングタップを無効化
    if (!canAccessSettings) return
    setTouchEndTime(Date.now())
    if (touchStartTime && Date.now() - touchStartTime >= 800) {
      // 800ms以上押し続けるとロングタップと判定
      setShowSettings(true)
    }
    setTouchStartTime(null)
  }

  const handleTouchCancel = () => {
    setTouchStartTime(null)
  }

  useEffect(() => {
    if (!selectedSlideDocs) return

    fetch(`/slides/${selectedSlideDocs}/slides.md`)
      .then((response) => response.text())
      .then((text) => setMarkdownContent(text))
      .catch((error) =>
        console.error('Failed to fetch markdown content:', error)
      )
  }, [selectedSlideDocs])

  // アシスタントメッセージ
  const latestAssistantMessage = getLatestAssistantMessage(chatLog)

  const handleChangeVrmFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files) return

      const file = files[0]
      if (!file) return

      const file_type = file.name.split('.').pop()

      if (file_type === 'vrm') {
        const blob = new Blob([file], { type: 'application/octet-stream' })
        const url = window.URL.createObjectURL(blob)

        const hs = homeStore.getState()
        hs.viewer.loadVrm(url)
      }

      event.target.value = ''
    },
    []
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        // デモ端末モードで設定アクセス不可の場合はショートカットを無効化
        if (!canAccessSettings) return
        setShowSettings((prevState) => !prevState)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [canAccessSettings])

  useEffect(() => {
    console.log('onChangeWebcamStatus')
    homeStore.setState({ webcamStatus: showWebcam })

    if (showWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => {
          setShowPermissionModal(false)
        })
        .catch(() => {
          setShowPermissionModal(true)
          homeStore.setState({ webcamStatus: false })
          menuStore.setState({ showWebcam: false })
        })
    }
  }, [showWebcam])

  useEffect(() => {
    console.log('onChangeCaptureStatus')
    homeStore.setState({ captureStatus: showCapture })
  }, [showCapture])

  useEffect(() => {
    if (!youtubePlaying) {
      settingsStore.setState({
        youtubeContinuationCount: 0,
        youtubeNoCommentCount: 0,
        youtubeSleepMode: false,
      })
    }
  }, [youtubePlaying])

  const toggleGameCommentary = useCallback(() => {
    const nextPlaying = !gameCommentaryPlaying
    settingsStore.setState({ gameCommentaryPlaying: nextPlaying })
    if (nextPlaying) {
      // 開始時: キャプチャが未表示なら自動で表示する
      if (!showCapture) {
        menuStore.setState({ showCapture: true, showWebcam: false })
        homeStore.setState({ webcamStatus: false })
      }
    }
  }, [gameCommentaryPlaying, showCapture])

  const toggleCapture = useCallback(() => {
    menuStore.setState(({ showCapture }) => ({ showCapture: !showCapture }))
    menuStore.setState({ showWebcam: false }) // Captureを表示するときWebcamを非表示にする
    if (!showCapture) {
      homeStore.setState({ webcamStatus: false }) // Ensure webcam status is false when enabling capture
    }
  }, [showCapture])

  const toggleWebcam = useCallback(() => {
    menuStore.setState(({ showWebcam }) => ({ showWebcam: !showWebcam }))
    menuStore.setState({ showCapture: false }) // Webcamを表示するときCaptureを非表示にする
    if (!showWebcam) {
      homeStore.setState({ captureStatus: false }) // Ensure capture status is false when enabling webcam
    }
  }, [showWebcam])

  return (
    <>
      {/* ロングタップ用の透明な領域（モバイルでコントロールパネルが非表示の場合） */}
      {isMobile === true && !effectiveShowControlPanel && (
        <div
          className="absolute top-0 left-0 z-30 w-20 h-20"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="w-full h-full opacity-0"></div>
        </div>
      )}

      <div className="absolute z-15 m-3 sm:m-6">
        <div
          className="aurora-glass-dock relative mb-10 grid grid-flow-col gap-0.5 rounded-[18px] p-1.5"
          style={{ width: 'max-content' }}
        >
          {effectiveShowControlPanel && (
            <>
              {canAccessSettings && (
                <div className="order-1">
                  <IconButton
                    iconName="24/Settings"
                    isProcessing={false}
                    onClick={() => setShowSettings(true)}
                    aria-label={t('Settings')}
                    data-testid="open-settings-button"
                    backgroundColor="bg-transparent hover:bg-primary/10 active:bg-primary/15 disabled:bg-transparent"
                    iconColor="text-text1"
                    className="transition-colors duration-200"
                  ></IconButton>
                </div>
              )}
              <div className="order-2">
                <IconButton
                  iconName={
                    chatLogMode === CHAT_LOG_MODE.CHAT_LOG
                      ? '24/CommentOutline'
                      : chatLogMode === CHAT_LOG_MODE.ASSISTANT
                        ? '24/CommentFill'
                        : '24/Close'
                  }
                  label={t('ChatLog')}
                  labelClassName="hidden sm:block"
                  isProcessing={false}
                  onClick={() => setChatLogMode((prev) => (prev + 1) % 3)}
                  aria-label={t('ChatLog')}
                  backgroundColor="bg-transparent hover:bg-black/5 active:bg-black/10 disabled:bg-transparent"
                  iconColor="text-text1"
                  className="!rounded-[13px] transition-colors duration-200"
                />
              </div>
              <div className="order-3">
                <IconButton
                  iconName={showToolMenu ? '24/Close' : '24/Menu'}
                  label={t('Tools')}
                  labelClassName="hidden sm:block"
                  isProcessing={false}
                  onClick={() => setShowToolMenu((prev) => !prev)}
                  aria-label={t('Tools')}
                  aria-expanded={showToolMenu}
                  data-testid="main-tools-toggle-button"
                  backgroundColor="bg-transparent hover:bg-black/5 active:bg-black/10 disabled:bg-transparent"
                  iconColor="text-text1"
                  className="!rounded-[13px] transition-colors duration-200"
                />
              </div>
              {showToolMenu && (
                <div
                  className="aurora-glass-popover absolute left-0 top-full z-20 mt-2 grid w-max min-w-[180px] max-w-[calc(100vw-24px)] gap-0.5 rounded-[18px] p-2 sm:min-w-[220px]"
                  data-testid="main-tools-menu"
                >
                  <ToolMenuButton
                    iconName="screen-share"
                    label={
                      showCapture
                        ? (t(
                            'StopScreenShare',
                            'Stop screen sharing'
                          ) as string)
                        : t('ScreenShare')
                    }
                    active={showCapture}
                    onClick={toggleCapture}
                    data-testid="capture-toggle-button"
                  />
                  <ToolMenuButton
                    iconName="24/Camera"
                    label={t('Camera')}
                    active={showWebcam}
                    onClick={toggleWebcam}
                  />
                  {isMultiModalAvailable(
                    selectAIService as AIService,
                    selectAIModel,
                    enableMultiModal,
                    customModel
                  ) && (
                    <>
                      <ToolMenuButton
                        iconName="24/AddImage"
                        label={t('SelectImage')}
                        onClick={() => imageFileInputRef.current?.click()}
                      />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        ref={imageFileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              const imageUrl = e.target?.result as string
                              homeStore.setState({ modalImage: imageUrl })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </>
                  )}
                  {youtubeMode && (
                    <ToolMenuButton
                      iconName={youtubePlaying ? '24/PauseAlt' : '24/Video'}
                      label={
                        youtubePlaying ? t('PauseYoutube') : t('StartYoutube')
                      }
                      active={youtubePlaying}
                      onClick={() =>
                        settingsStore.setState({
                          youtubePlaying: !youtubePlaying,
                        })
                      }
                      aria-pressed={youtubePlaying}
                      data-testid="youtube-play-toggle-button"
                    />
                  )}
                  {gameCommentaryEnabled && (
                    <ToolMenuButton
                      iconName={
                        gameCommentaryPlaying
                          ? '24/PauseAlt'
                          : 'game-controller'
                      }
                      label={
                        gameCommentaryPlaying
                          ? t('PauseGameCommentary')
                          : t('StartGameCommentary')
                      }
                      active={gameCommentaryPlaying}
                      onClick={toggleGameCommentary}
                      aria-pressed={gameCommentaryPlaying}
                      data-testid="game-commentary-play-toggle-button"
                    />
                  )}
                  {slideMode && (
                    <ToolMenuButton
                      iconName="24/FrameEffect"
                      label={slideVisible ? t('HideSlide') : t('ShowSlide')}
                      active={slideVisible}
                      onClick={() =>
                        menuStore.setState({ slideVisible: !slideVisible })
                      }
                      disabled={slidePlaying}
                      aria-pressed={slideVisible}
                      data-testid="slide-visibility-toggle-button"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="relative">
        {slideMode && slideVisible && <Slides markdown={markdownContent} />}
      </div>
      {chatLogMode === CHAT_LOG_MODE.CHAT_LOG && <ChatLog />}
      {showSettings && canAccessSettings && (
        <Settings onClickClose={() => setShowSettings(false)} />
      )}
      {chatLogMode === CHAT_LOG_MODE.ASSISTANT &&
        latestAssistantMessage &&
        (!slideMode || !slideVisible) &&
        showAssistantText && <AssistantText message={latestAssistantMessage} />}
      {showWebcam && navigator.mediaDevices && <Webcam />}
      {showCapture && <Capture />}
      {showPermissionModal && (
        <div className="modal">
          <div className="modal-content">
            <p>{t('Errors.CameraPermissionMessage')}</p>
            <button onClick={() => setShowPermissionModal(false)}>
              {t('Close')}
            </button>
          </div>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept=".vrm"
        ref={(fileInput) => {
          if (!fileInput) {
            menuStore.setState({ fileInput: null })
            return
          }

          menuStore.setState({ fileInput })
        }}
        onChange={handleChangeVrmFile}
      />
      <input
        type="file"
        className="hidden"
        accept="image/*"
        ref={(bgFileInput) => {
          if (!bgFileInput) {
            menuStore.setState({ bgFileInput: null })
            return
          }

          menuStore.setState({ bgFileInput })
        }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            const imageUrl = URL.createObjectURL(file)
            homeStore.setState({ backgroundImageUrl: imageUrl })
          }
        }}
      />
    </>
  )
}

const ToolMenuButton = ({
  active = false,
  iconName,
  label,
  ...rest
}: Omit<
  React.ComponentProps<typeof IconButton>,
  'backgroundColor' | 'iconColor' | 'isProcessing' | 'label'
> & {
  active?: boolean
  label: string
}) => (
  <IconButton
    {...rest}
    aria-label={rest['aria-label'] ?? label}
    iconName={iconName}
    label={label}
    isProcessing={false}
    backgroundColor={
      active
        ? 'bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled disabled:cursor-not-allowed'
        : 'bg-transparent hover:bg-black/5 active:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50'
    }
    iconColor={active ? 'text-theme' : 'text-text1'}
    className={`w-full !justify-start !rounded-xl ${rest.className ?? ''}`}
  />
)
