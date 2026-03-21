import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { AssistantText } from './assistantText'
import { ChatLog } from './chatLog'
import { ChatHistoryModal } from './chatHistoryModal'
import { CurrentThreadOverlay } from './currentThreadOverlay'
import { IconButton } from './iconButton'
import Settings from './settings'
import { Webcam } from './webcam'
import Slides from './slides'
import Capture from './capture'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'
import { getLatestAssistantMessage } from '@/utils/assistantMessageUtils'
import { useKioskMode } from '@/hooks/useKioskMode'
import layoutStore from '@/features/stores/layout'

// 繝｢繝舌う繝ｫ繝・ヰ繧､繧ｹ讀懷・逕ｨ縺ｮ繧ｫ繧ｹ繧ｿ繝繝輔ャ繧ｯ
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    // 繝｢繝舌う繝ｫ繝・ヰ繧､繧ｹ讀懷・逕ｨ縺ｮ髢｢謨ｰ
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
          /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      )
    }

    // 蛻晏屓繝ｬ繝ｳ繝繝ｪ繝ｳ繧ｰ譎ゅ→繧ｦ繧｣繝ｳ繝峨え繧ｵ繧､繧ｺ螟画峩譎ゅ↓讀懷・
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
  const customModel = settingsStore((s) => s.customModel)
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

  // 繝・Δ遶ｯ譛ｫ繝｢繝ｼ繝蛾未騾｣
  const { isKioskMode, isTemporaryUnlocked, canAccessSettings } = useKioskMode()

  // 繝・Δ遶ｯ譛ｫ繝｢繝ｼ繝画凾縺ｯ繧ｳ繝ｳ繝医Ο繝ｼ繝ｫ繝代ロ繝ｫ繧帝撼陦ｨ遉ｺ・井ｸ譎りｧ｣髯､譎ゅ・髯､縺擾ｼ・
  const effectiveShowControlPanel =
    showControlPanel && (!isKioskMode || isTemporaryUnlocked)

  const [showSettings, setShowSettings] = useState(false)

  // 繧ｭ繧ｪ繧ｹ繧ｯ繝｢繝ｼ繝峨〒險ｭ螳壹い繧ｯ繧ｻ繧ｹ讓ｩ縺悟翁螂ｪ縺輔ｌ縺溷ｴ蜷医↓閾ｪ蜍輔け繝ｭ繝ｼ繧ｺ
  useEffect(() => {
    if (!canAccessSettings) {
      setShowSettings(false)
    }
  }, [canAccessSettings])
  const layoutMode = layoutStore((s) => s.layoutMode)
  const mobileChatOpen = layoutStore((s) => s.mobileChatOpen)
  const [isDedicatedMobileWindow, setIsDedicatedMobileWindow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDedicatedMobileWindow(
      new URLSearchParams(window.location.search).get('layout') ===
        'mobile-window'
    )
  }, [])
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  // 繝ｭ繝ｳ繧ｰ繧ｿ繝・・逕ｨ縺ｮ繧ｹ繝・・繝・
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null)
  const [touchEndTime, setTouchEndTime] = useState<number | null>(null)

  const isMobile = useIsMobile()
  const isMobileLayout =
    isDedicatedMobileWindow ||
    layoutMode === 'mobile' ||
    (layoutMode === 'auto' && isMobile === true)

  const selectedSlideDocs = slideStore((state) => state.selectedSlideDocs)
  const { t } = useTranslation()

  const [markdownContent, setMarkdownContent] = useState('')

  // 繝ｭ繝ｳ繧ｰ繧ｿ繝・・蜃ｦ逅・畑縺ｮ髢｢謨ｰ
  const handleTouchStart = () => {
    // 繝・Δ遶ｯ譛ｫ繝｢繝ｼ繝峨〒險ｭ螳壹い繧ｯ繧ｻ繧ｹ荳榊庄縺ｮ蝣ｴ蜷医・繝ｭ繝ｳ繧ｰ繧ｿ繝・・繧堤┌蜉ｹ蛹・
    if (!canAccessSettings) return
    setTouchStartTime(Date.now())
  }

  const handleTouchEnd = () => {
    // 繝・Δ遶ｯ譛ｫ繝｢繝ｼ繝峨〒險ｭ螳壹い繧ｯ繧ｻ繧ｹ荳榊庄縺ｮ蝣ｴ蜷医・繝ｭ繝ｳ繧ｰ繧ｿ繝・・繧堤┌蜉ｹ蛹・
    if (!canAccessSettings) return
    setTouchEndTime(Date.now())
    if (touchStartTime && Date.now() - touchStartTime >= 800) {
      // 800ms莉･荳頑款縺礼ｶ壹￠繧九→繝ｭ繝ｳ繧ｰ繧ｿ繝・・縺ｨ蛻､螳・
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

  // 繧｢繧ｷ繧ｹ繧ｿ繝ｳ繝医Γ繝・そ繝ｼ繧ｸ
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
        // 繝・Δ遶ｯ譛ｫ繝｢繝ｼ繝峨〒險ｭ螳壹い繧ｯ繧ｻ繧ｹ荳榊庄縺ｮ蝣ｴ蜷医・繧ｷ繝ｧ繝ｼ繝医き繝・ヨ繧堤┌蜉ｹ蛹・
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
    if (!isMobileLayout && mobileChatOpen) {
      layoutStore.getState().setMobileChatOpen(false)
    }
  }, [isMobileLayout, mobileChatOpen])

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
    menuStore.setState({ showWebcam: false }) // Capture繧定｡ｨ遉ｺ縺吶ｋ縺ｨ縺晃ebcam繧帝撼陦ｨ遉ｺ縺ｫ縺吶ｋ
    if (!showCapture) {
      homeStore.setState({ webcamStatus: false }) // Ensure webcam status is false when enabling capture
    }
  }, [showCapture])

  const toggleWebcam = useCallback(() => {
    menuStore.setState(({ showWebcam }) => ({ showWebcam: !showWebcam }))
    menuStore.setState({ showCapture: false }) // Webcam繧定｡ｨ遉ｺ縺吶ｋ縺ｨ縺垢apture繧帝撼陦ｨ遉ｺ縺ｫ縺吶ｋ
    if (!showWebcam) {
      homeStore.setState({ captureStatus: false }) // Ensure capture status is false when enabling webcam
    }
  }, [showWebcam])

  return (
    <>
      {/* 繝ｭ繝ｳ繧ｰ繧ｿ繝・・逕ｨ縺ｮ騾乗・縺ｪ鬆伜沺・医Δ繝舌う繝ｫ縺ｧ繧ｳ繝ｳ繝医Ο繝ｼ繝ｫ繝代ロ繝ｫ縺碁撼陦ｨ遉ｺ縺ｮ蝣ｴ蜷茨ｼ・*/}
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
          className="grid md:grid-flow-col gap-[8px] mb-10"
          style={{ width: 'max-content' }}
        >
          {effectiveShowControlPanel && (
            <>
              {canAccessSettings && (
                <div className="md:order-1 order-2">
                  <IconButton
                    iconName="24/Settings"
                    isProcessing={false}
                    onClick={() => setShowSettings(true)}
                  ></IconButton>
                </div>
              )}
              <div className="md:order-2 order-1">
                <IconButton
                  iconName="24/CommentOutline"
                  label={t('ChatLog')}
                  isProcessing={false}
                  onClick={() =>
                    isMobileLayout
                      ? layoutStore.getState().toggleMobileChat()
                      : menuStore.setState({
                          showChatHistoryModal: true,
                        })
                  }
                />
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
                    multiModalMode,
                    customModel
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
      <ChatLog
        onOpenSettings={() => setShowSettings(true)}
        isMobileLayout={isMobileLayout}
        isMobileOpen={mobileChatOpen}
        onCloseMobile={() => layoutStore.getState().setMobileChatOpen(false)}
      />
      <CurrentThreadOverlay />
      <ChatHistoryModal />
      {showSettings && canAccessSettings && (
        <Settings onClickClose={() => setShowSettings(false)} />
      )}
      {latestAssistantMessage &&
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
