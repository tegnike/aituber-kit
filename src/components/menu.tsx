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
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const youtubeMode = settingsStore((s) => s.youtubeMode)
  const youtubePlaying = settingsStore((s) => s.youtubePlaying)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const chatLog = homeStore((s) => s.chatLog)
  const showWebcam = menuStore((s) => s.showWebcam)
  const showControlPanel = settingsStore((s) => s.showControlPanel)
  const showCapture = menuStore((s) => s.showCapture)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const showAssistantText = settingsStore((s) => s.showAssistantText)

  const [showSettings, setShowSettings] = useState(false)
  const [showChatLog, setShowChatLog] = useState(false)
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
    setTouchStartTime(Date.now())
  }

  const handleTouchEnd = () => {
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
        setShowSettings((prevState) => !prevState)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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
      {isMobile === true && !showControlPanel && (
        <div
          className="absolute top-0 left-0 z-30 w-20 h-20"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="w-full h-full opacity-0"></div>
        </div>
      )}

      <div className="absolute z-15 m-6">
        <div
          className="grid md:grid-flow-col gap-[8px] mb-10"
          style={{ width: 'max-content' }}
        >
          {showControlPanel && (
            <>
              <div className="md:order-1 order-2">
                <IconButton
                  iconName="24/Settings"
                  isProcessing={false}
                  onClick={() => setShowSettings(true)}
                ></IconButton>
              </div>
              <div className="md:order-2 order-1">
                {showChatLog ? (
                  <IconButton
                    iconName="24/CommentOutline"
                    label={t('ChatLog')}
                    isProcessing={false}
                    onClick={() => setShowChatLog(false)}
                  />
                ) : (
                  <IconButton
                    iconName="24/CommentFill"
                    label={t('ChatLog')}
                    isProcessing={false}
                    disabled={false}
                    onClick={() => setShowChatLog(true)}
                  />
                )}
              </div>
              {!youtubeMode && (
                <>
                  <div className="order-3">
                    <IconButton
                      iconName="screen-share"
                      isProcessing={false}
                      onClick={toggleCapture}
                    />
                  </div>
                  <div className="order-4">
                    <IconButton
                      iconName="24/Camera"
                      isProcessing={false}
                      onClick={toggleWebcam}
                    />
                  </div>
                  {isMultiModalAvailable(
                    selectAIService as AIService,
                    selectAIModel,
                    enableMultiModal,
                    multiModalMode
                  ) && (
                    <div className="order-4">
                      <IconButton
                        iconName="24/AddImage"
                        isProcessing={false}
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
                    </div>
                  )}
                </>
              )}
              {youtubeMode && (
                <div className="order-5">
                  <IconButton
                    iconName={youtubePlaying ? '24/PauseAlt' : '24/Video'}
                    isProcessing={false}
                    onClick={() =>
                      settingsStore.setState({
                        youtubePlaying: !youtubePlaying,
                      })
                    }
                  />
                </div>
              )}
              {slideMode && (
                <div className="order-5">
                  <IconButton
                    iconName="24/FrameEffect"
                    isProcessing={false}
                    onClick={() =>
                      menuStore.setState({ slideVisible: !slideVisible })
                    }
                    disabled={slidePlaying}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="relative">
        {slideMode && slideVisible && <Slides markdown={markdownContent} />}
      </div>
      {showChatLog && <ChatLog />}
      {showSettings && <Settings onClickClose={() => setShowSettings(false)} />}
      {!showChatLog &&
        latestAssistantMessage &&
        (!slideMode || !slideVisible) &&
        showAssistantText && <AssistantText message={latestAssistantMessage} />}
      {showWebcam && navigator.mediaDevices && <Webcam />}
      {showCapture && <Capture />}
      {showPermissionModal && (
        <div className="modal">
          <div className="modal-content">
            <p>カメラの使用を許可してください。</p>
            <button onClick={() => setShowPermissionModal(false)}>
              閉じる
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
