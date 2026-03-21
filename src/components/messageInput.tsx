import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import slideStore from '@/features/stores/slide'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import { IconButton } from './iconButton'
import { useKioskMode } from '@/hooks/useKioskMode'
import layoutStore from '@/features/stores/layout'

// 繝輔ぃ繧､繝ｫ繝舌Μ繝・・繧ｷ繝ｧ繝ｳ縺ｮ險ｭ螳・
const FILE_VALIDATION = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
  ],
  maxImageDimensions: { width: 4096, height: 4096 },
} as const

type Props = {
  userMessage: string
  isMicRecording: boolean
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void
  onClickStopButton: (event: React.MouseEvent<HTMLButtonElement>) => void
  isSpeaking: boolean
  silenceTimeoutRemaining: number | null
  continuousMicListeningMode: boolean
  onToggleContinuousMode: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export const MessageInput = ({
  userMessage,
  isMicRecording,
  onChangeUserMessage,
  onClickMicButton,
  onClickSendButton,
  onClickStopButton,
  isSpeaking,
  silenceTimeoutRemaining,
  continuousMicListeningMode,
}: Props) => {
  const chatProcessing = homeStore((s) => s.chatProcessing)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const modalImage = homeStore((s) => s.modalImage)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const imageDisplayPosition = settingsStore((s) => s.imageDisplayPosition)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const customModel = settingsStore((s) => s.customModel)
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const layoutMode = layoutStore((s) => s.layoutMode)
  const [rows, setRows] = useState(1)
  const [loadingDots, setLoadingDots] = useState('')
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [fileError, setFileError] = useState<string>('')
  const [showImageActions, setShowImageActions] = useState(false)
  const [inputValidationError, setInputValidationError] = useState<string>('')
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isCompactLayout, setIsCompactLayout] = useState(false)
  const [isDedicatedMobileWindow, setIsDedicatedMobileWindow] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const showSilenceProgressBar = settingsStore((s) => s.showSilenceProgressBar)

  const { t } = useTranslation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDedicatedMobileWindow(
      new URLSearchParams(window.location.search).get('layout') ===
        'mobile-window'
    )
  }, [])

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 640px)')
    setIsSmallScreen(!mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(!e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    setIsCompactLayout(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsCompactLayout(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const isMobileLayout =
    isDedicatedMobileWindow ||
    layoutMode === 'mobile' ||
    (layoutMode === 'auto' && isCompactLayout)

  // Kiosk mode input validation
  const { isKioskMode, validateInput, maxInputLength } = useKioskMode()

  // 繝槭Ν繝√Δ繝ｼ繝繝ｫ蟇ｾ蠢懊°縺ｩ縺・°繧貞愛螳・
  const isMultiModalSupported = isMultiModalAvailable(
    selectAIService,
    selectAIModel,
    enableMultiModal,
    multiModalMode,
    customModel
  )

  // 繧｢繧､繧ｳ繝ｳ陦ｨ遉ｺ縺ｮ譚｡莉ｶ
  const showIconDisplay = modalImage && imageDisplayPosition === 'icon'

  useEffect(() => {
    if (chatProcessing) {
      const interval = setInterval(() => {
        setLoadingDots((prev) => {
          if (prev === '...') return ''
          return prev + '.'
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      if (textareaRef.current) {
        textareaRef.current.value = ''
        const isTouchDevice = () => {
          if (typeof window === 'undefined') return false
          return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            // @ts-expect-error: msMaxTouchPoints is IE-specific
            navigator.msMaxTouchPoints > 0
          )
        }
        if (!isTouchDevice()) {
          textareaRef.current.focus()
        }
      }
    }
  }, [chatProcessing])

  // 繝・く繧ｹ繝亥・螳ｹ縺ｫ蝓ｺ縺･縺・※驕ｩ蛻・↑陦梧焚繧定ｨ育ｮ・
  const calculateRows = useCallback((text: string): number => {
    const MIN_ROWS = 1
    const MAX_ROWS = 5 // 譛螟ｧ陦梧焚繧貞宛髯撰ｼ・I縺ｮ隕区・∴繧定・・縺励※隱ｿ謨ｴ・・
    const CHARS_PER_LINE = 50 // 蟷ｳ蝮・噪縺ｪ1陦後・譁・ｭ玲焚・域ｦらｮ暦ｼ・
    const lines = text.split('\n')

    // 蜷・｡後・蟷・ｒ閠・・縺励※繝・く繧ｹ繝医・謚倥ｊ霑斐＠繧定ｨ育ｮ・
    // 邁｡蜊倥↑螳溯｣・〒縺ｯ謾ｹ陦梧枚蟄励・謨ｰ + 1繧剃ｽｿ逕ｨ
    const baseRows = Math.max(MIN_ROWS, lines.length)

    // 髟ｷ縺・｡後′縺ゅｋ蝣ｴ蜷医∬ｿｽ蜉縺ｮ陦後ｒ閠・・・医♀縺翫ｈ縺昴・險育ｮ暦ｼ・
    const extraRows = lines.reduce((acc, line) => {
      const lineRows = Math.ceil(line.length / CHARS_PER_LINE)
      return acc + Math.max(0, lineRows - 1)
    }, 0)

    return Math.min(MAX_ROWS, baseRows + extraRows)
  }, [])

  // userMessage縺ｮ螟画峩縺ｫ蠢懊§縺ｦ陦梧焚繧定ｪｿ謨ｴ
  useEffect(() => {
    const newRows = calculateRows(userMessage)
    setRows(newRows)
  }, [userMessage, calculateRows])

  // 蜈ｱ騾壹・驕・ｻｶ陦梧焚譖ｴ譁ｰ蜃ｦ逅・
  const updateRowsWithDelay = useCallback(
    (target: HTMLTextAreaElement) => {
      setTimeout(() => {
        const newRows = calculateRows(target.value)
        setRows(newRows)
      }, 0)
    },
    [calculateRows]
  )

  // 繝・く繧ｹ繝医お繝ｪ繧｢縺ｮ蜀・ｮｹ螟画峩譎ゅ・蜃ｦ逅・
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value
    const newRows = calculateRows(newText)
    setRows(newRows)
    onChangeUserMessage(event)
  }

  // 繝輔ぃ繧､繝ｫ繝舌Μ繝・・繧ｷ繝ｧ繝ｳ髢｢謨ｰ
  const validateFile = useCallback(
    (file: File): { isValid: boolean; error?: string } => {
      // 繝輔ぃ繧､繝ｫ繧ｵ繧､繧ｺ繝√ぉ繝・け
      if (file.size > FILE_VALIDATION.maxSizeBytes) {
        return {
          isValid: false,
          error: t('FileSizeError', {
            maxSize: Math.round(FILE_VALIDATION.maxSizeBytes / (1024 * 1024)),
          }),
        }
      }

      // 繝輔ぃ繧､繝ｫ繧ｿ繧､繝励メ繧ｧ繝・け
      if (!FILE_VALIDATION.allowedTypes.includes(file.type as any)) {
        return {
          isValid: false,
          error: t('FileTypeError'),
        }
      }

      return { isValid: true }
    },
    [t]
  )

  // 逕ｻ蜒上・蟇ｸ豕輔ｒ繝√ぉ繝・け縺吶ｋ髢｢謨ｰ
  const validateImageDimensions = useCallback(
    (imageElement: HTMLImageElement): boolean => {
      return (
        imageElement.naturalWidth <= FILE_VALIDATION.maxImageDimensions.width &&
        imageElement.naturalHeight <= FILE_VALIDATION.maxImageDimensions.height
      )
    },
    []
  )

  // 逕ｻ蜒上ｒ蜃ｦ逅・☆繧矩未謨ｰ
  const processImageFile = useCallback(
    async (file: File): Promise<void> => {
      setFileError('')

      const validation = validateFile(file)
      if (!validation.isValid) {
        setFileError(validation.error || 'Unknown error')
        return
      }

      try {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64Image = e.target?.result as string

          // 逕ｻ蜒上・蟇ｸ豕輔メ繧ｧ繝・け・医が繝励す繝ｧ繝ｳ・・
          const img = document.createElement('img')
          img.onload = () => {
            if (!validateImageDimensions(img)) {
              setFileError(
                t('ImageDimensionError', {
                  maxWidth: FILE_VALIDATION.maxImageDimensions.width,
                  maxHeight: FILE_VALIDATION.maxImageDimensions.height,
                })
              )
              return
            }
            homeStore.setState({ modalImage: base64Image })
          }
          img.onerror = () => {
            setFileError(t('ImageLoadError'))
          }
          img.src = base64Image
        }
        reader.onerror = () => {
          setFileError(t('FileReadError'))
        }
        reader.readAsDataURL(file)
      } catch (error) {
        setFileError(t('FileProcessError'))
      }
    },
    [validateFile, validateImageDimensions, t]
  )

  // 逕ｻ蜒上ｒ蜑企勁縺吶ｋ髢｢謨ｰ
  const handleRemoveImage = useCallback(() => {
    homeStore.setState({ modalImage: '' })
    setFileError('')
  }, [])

  // 繧ｯ繝ｪ繝・・繝懊・繝峨°繧峨・逕ｻ蜒上・繝ｼ繧ｹ繝亥・逅・
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!isMultiModalSupported) {
        updateRowsWithDelay(event.target as HTMLTextAreaElement)
        return
      }

      const clipboardData = event.clipboardData
      if (!clipboardData) {
        updateRowsWithDelay(event.target as HTMLTextAreaElement)
        return
      }

      const items = clipboardData.items
      let hasImage = false

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await processImageFile(file)
            hasImage = true
          }
          break
        }
      }

      // 逕ｻ蜒上′縺ｪ縺・ｴ蜷医・縺ｿ騾壼ｸｸ縺ｮ繝壹・繧ｹ繝亥・逅・ｒ螳溯｡・
      if (!hasImage) {
        updateRowsWithDelay(event.target as HTMLTextAreaElement)
      }
    },
    [isMultiModalSupported, processImageFile, updateRowsWithDelay]
  )

  // 繝峨Λ繝・げ・・ラ繝ｭ繝・・蜃ｦ逅・
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!isMultiModalSupported) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
    },
    [isMultiModalSupported]
  )

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      if (!isMultiModalSupported) {
        return
      }
      event.preventDefault()
      event.stopPropagation()

      const files = event.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('image/')) {
          await processImageFile(file)
        } else {
          setFileError(t('FileTypeError'))
        }
      }
    },
    [isMultiModalSupported, processImageFile, t]
  )

  // Validate input and handle send with kiosk mode restrictions
  const handleValidatedSend = useCallback(
    (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent) => {
      if (userMessage.trim() === '') return false

      // Validate input in kiosk mode
      if (isKioskMode) {
        const validation = validateInput(userMessage)
        if (!validation.valid) {
          setInputValidationError(validation.reason || t('Kiosk.InputInvalid'))
          return false
        }
      }

      // Clear any previous validation errors
      setInputValidationError('')
      return true
    },
    [userMessage, isKioskMode, validateInput, t]
  )

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      // IME 譁・ｭ怜､画鋤荳ｭ繧帝勁螟悶＠縺､縺､縲∝濠隗・蜈ｨ隗偵く繝ｼ・・ackquote・峨↓繧医ｋ IME 繝医げ繝ｫ縺ｯ辟｡隕・
      !event.nativeEvent.isComposing &&
      event.code !== 'Backquote' &&
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault() // 繝・ヵ繧ｩ繝ｫ繝医・謖吝虚繧帝亟豁｢
      if (userMessage.trim() !== '') {
        // Validate before sending
        if (
          handleValidatedSend(
            event as unknown as React.MouseEvent<HTMLButtonElement>
          )
        ) {
          onClickSendButton(
            event as unknown as React.MouseEvent<HTMLButtonElement>
          )
          setRows(1)
        }
      }
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Shift+Enter縺ｮ蝣ｴ蜷医…alculateRows縺ｧ閾ｪ蜍戊ｨ育ｮ励＆繧後ｋ縺溘ａ縲∵焔蜍輔〒陦梧焚繧貞｢励ｄ縺吝ｿ・ｦ√↑縺・
      updateRowsWithDelay(event.target as HTMLTextAreaElement)
    } else if (
      event.key === 'Backspace' &&
      rows > 1 &&
      userMessage.slice(-1) === '\n'
    ) {
      // Backspace縺ｮ蝣ｴ蜷医ｂ縲…alculateRows縺ｧ閾ｪ蜍戊ｨ育ｮ励＆繧後ｋ縺溘ａ縲∵焔蜍輔〒陦梧焚繧呈ｸ帙ｉ縺吝ｿ・ｦ√↑縺・
      updateRowsWithDelay(event.target as HTMLTextAreaElement)
    }
  }

  // Handle send button click with validation
  const handleSendClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (handleValidatedSend(event)) {
        onClickSendButton(event)
      }
    },
    [handleValidatedSend, onClickSendButton]
  )

  const handleMicClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClickMicButton(event)
  }

  return (
    <div
      className="absolute bottom-0 z-20"
      style={{
        left: isMobileLayout ? '0px' : `${chatLogWidth}px`,
        width: isMobileLayout ? '100vw' : `calc(100vw - ${chatLogWidth}px)`,
      }}
    >
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 sm:p-6 rounded-2xl max-w-[calc(100vw-2rem)] sm:max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">
              {t('MicrophonePermission')}
            </h3>
            <p className="mb-4">{t('MicrophonePermissionMessage')}</p>
            <button
              className="bg-secondary hover:bg-secondary-hover px-4 py-2 rounded-lg"
              onClick={() => setShowPermissionModal(false)}
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}
      <div
        className={
          isMobileLayout
            ? 'bg-black/30 text-black backdrop-blur-md'
            : 'bg-base-light text-black'
        }
        style={
          isMobileLayout
            ? { paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }
            : undefined
        }
      >
        <div
          className={`mx-auto p-2 sm:p-4 pb-3 ${
            isMobileLayout ? 'max-w-2xl' : 'max-w-4xl'
          }`}
        >
          {/* 繝励Ο繧ｰ繝ｬ繧ｹ繝舌・ - 險ｭ螳壹↓蝓ｺ縺･縺・※陦ｨ遉ｺ/髱櫁｡ｨ遉ｺ */}
          {isMicRecording && showSilenceProgressBar && (
            <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-200 ease-linear"
                style={{
                  // 繝励Ο繧ｰ繝ｬ繧ｹ繝舌・縺ｮ蟷・ｨ育ｮ・- 譛蛻昴→譛蠕後・0.3遘偵・陦ｨ遉ｺ縺励↑縺・
                  width:
                    silenceTimeoutRemaining !== null
                      ? `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((settingsStore.getState().noSpeechTimeout * 1000 -
                              silenceTimeoutRemaining -
                              300) /
                              (settingsStore.getState().noSpeechTimeout * 1000 -
                                600)) *
                              100
                          )
                        )}%`
                      : '0%',
                }}
              ></div>
            </div>
          )}
          {/* 繧ｨ繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ陦ｨ遉ｺ */}
          {fileError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {fileError}
            </div>
          )}
          {/* 蜈･蜉帙ヰ繝ｪ繝・・繧ｷ繝ｧ繝ｳ繧ｨ繝ｩ繝ｼ陦ｨ遉ｺ (Kiosk mode) */}
          {inputValidationError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {inputValidationError}
            </div>
          )}
          {/* 逕ｻ蜒上・繝ｬ繝薙Η繝ｼ - 蜈･蜉帶ｬ・｡ｨ遉ｺ險ｭ螳壹・蝣ｴ蜷医・縺ｿ */}
          {modalImage && imageDisplayPosition === 'input' && (
            <div
              className="mb-2 p-2 bg-gray-100 rounded-lg relative"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50"
              >
                x
              </button>
              <Image
                src={modalImage}
                alt="Pasted image"
                width={0}
                height={0}
                sizes="100vw"
                className="max-w-full max-h-32 rounded object-contain w-auto h-auto"
              />
            </div>
          )}

          <div className="flex gap-2 items-end">
            {!isMobileLayout && (
              <div className="flex-shrink-0 pb-[0.3rem]">
                <IconButton
                  iconName={
                    continuousMicListeningMode ? '24/Close' : '24/Microphone'
                  }
                  backgroundColor={
                    continuousMicListeningMode
                      ? isMicRecording
                        ? 'bg-green-500 text-theme'
                        : 'bg-green-600 text-theme'
                      : undefined
                  }
                  isProcessing={isMicRecording}
                  isProcessingIcon={
                    continuousMicListeningMode ? '24/Microphone' : '24/PauseAlt'
                  }
                  disabled={
                    continuousMicListeningMode || chatProcessing || isSpeaking
                  }
                  onClick={handleMicClick}
                />
              </div>
            )}
            <div className="flex-1 relative">
              {/* 逕ｻ蜒乗ｷｻ莉倥う繝ｳ繧ｸ繧ｱ繝ｼ繧ｿ繝ｼ - 繧｢繧､繧ｳ繝ｳ縺ｮ縺ｿ陦ｨ遉ｺ險ｭ螳壹・蝣ｴ蜷・*/}
              {showIconDisplay && (
                <div className="absolute left-3 top-3 z-10">
                  <div
                    className="relative cursor-pointer"
                    onMouseEnter={() => setShowImageActions(true)}
                    onMouseLeave={() => setShowImageActions(false)}
                    onFocus={() => setShowImageActions(true)}
                    onBlur={() => setShowImageActions(false)}
                    tabIndex={0}
                    role="button"
                    aria-label={t('RemoveImage')}
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    {showImageActions && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage()
                          setShowImageActions(false)
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-theme rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        title={t('RemoveImage')}
                      >
                        x
                      </button>
                    )}
                  </div>
                </div>
              )}
              <textarea
                ref={textareaRef}
                placeholder={
                  chatProcessing
                    ? `${t('AnswerGenerating')}${loadingDots}`
                    : continuousMicListeningMode && isMicRecording
                      ? t('ListeningContinuously')
                      : isMultiModalSupported && !isSmallScreen
                        ? `${t('EnterYourQuestion')} (${t('PasteImageSupported') || 'Paste image supported'})`
                        : t('EnterYourQuestion')
                }
                onChange={handleTextChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyPress}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                disabled={chatProcessing || slidePlaying || realtimeAPIMode}
                className="bg-white hover:bg-white-hover focus:bg-white disabled:bg-gray-100 disabled:text-primary-disabled rounded-2xl w-full px-4 text-sm sm:text-base text-theme-default font-bold disabled"
                value={userMessage}
                rows={rows}
                maxLength={maxInputLength}
                style={{
                  lineHeight: '1.5',
                  padding: showIconDisplay ? '8px 16px 8px 32px' : '8px 16px',
                  resize: 'none',
                  whiteSpace: 'pre-wrap',
                }}
              ></textarea>
            </div>
            <div className="flex gap-2 flex-shrink-0 pb-[0.3rem]">
              <IconButton
                iconName="24/Send"
                className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
                isProcessing={chatProcessing}
                disabled={chatProcessing || !userMessage || realtimeAPIMode}
                onClick={handleSendClick}
              />

              {!isMobileLayout && (
                <IconButton
                  iconName="stop"
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
                  onClick={onClickStopButton}
                  isProcessing={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
