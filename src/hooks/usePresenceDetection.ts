import { useState, useEffect, useCallback, useRef } from 'react'
import * as faceapi from 'face-api.js'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import {
  PresenceState,
  PresenceError,
  DetectionResult,
} from '@/features/presence/presenceTypes'

/**
 * Sensitivity to detection interval mapping (ms)
 */
const SENSITIVITY_INTERVALS = {
  low: 500,
  medium: 300,
  high: 150,
} as const

interface UsePresenceDetectionProps {
  onPersonDetected?: () => void
  onPersonDeparted?: () => void
  onGreetingStart?: (message: string) => void
  onGreetingComplete?: () => void
  onInterruptGreeting?: () => void
}

interface UsePresenceDetectionReturn {
  presenceState: PresenceState
  isDetecting: boolean
  error: PresenceError | null
  startDetection: () => Promise<void>
  stopDetection: () => void
  completeGreeting: () => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  detectionResult: DetectionResult | null
}

/**
 * 人感検知フック
 * Webカメラで顔を検出し、来場者の存在を管理する
 */
export function usePresenceDetection({
  onPersonDetected,
  onPersonDeparted,
  onGreetingStart,
  onGreetingComplete,
  onInterruptGreeting,
}: UsePresenceDetectionProps): UsePresenceDetectionReturn {
  // ----- 設定の取得 -----
  const presenceGreetingMessage = settingsStore(
    (s) => s.presenceGreetingMessage
  )
  const presenceDepartureTimeout = settingsStore(
    (s) => s.presenceDepartureTimeout
  )
  const presenceCooldownTime = settingsStore((s) => s.presenceCooldownTime)
  const presenceDetectionSensitivity = settingsStore(
    (s) => s.presenceDetectionSensitivity
  )
  const presenceDebugMode = settingsStore((s) => s.presenceDebugMode)

  // ----- 状態 -----
  const [presenceState, setPresenceState] = useState<PresenceState>('idle')
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<PresenceError | null>(null)
  const [detectionResult, setDetectionResult] =
    useState<DetectionResult | null>(null)

  // ----- Refs -----
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const departureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInCooldownRef = useRef(false)
  const lastFaceDetectedRef = useRef(false)
  const modelLoadedRef = useRef(false)

  // Callback refs to avoid stale closures
  const callbackRefs = useRef({
    onPersonDetected,
    onPersonDeparted,
    onGreetingStart,
    onGreetingComplete,
    onInterruptGreeting,
  })

  // Update callback refs in useEffect to avoid accessing refs during render
  useEffect(() => {
    callbackRefs.current = {
      onPersonDetected,
      onPersonDeparted,
      onGreetingStart,
      onGreetingComplete,
      onInterruptGreeting,
    }
  })

  // ----- ログ出力ヘルパー -----
  const logDebug = useCallback(
    (message: string, ...args: unknown[]) => {
      if (presenceDebugMode) {
        console.log(`[PresenceDetection] ${message}`, ...args)
      }
    },
    [presenceDebugMode]
  )

  // ----- 状態遷移ヘルパー -----
  const transitionState = useCallback(
    (newState: PresenceState) => {
      setPresenceState((prev) => {
        if (prev !== newState) {
          logDebug(`State transition: ${prev} → ${newState}`)
          homeStore.setState({ presenceState: newState })
        }
        return newState
      })
    },
    [logDebug]
  )

  // ----- モデルロード -----
  const loadModels = useCallback(async () => {
    if (modelLoadedRef.current) return

    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      modelLoadedRef.current = true
      logDebug('Face detection model loaded')
    } catch (err) {
      logDebug('Model load failed:', err)
      const loadError: PresenceError = {
        code: 'MODEL_LOAD_FAILED',
        message: '顔検出モデルの読み込みに失敗しました',
      }
      setError(loadError)
      homeStore.setState({ presenceError: loadError })
      throw err
    }
  }, [logDebug])

  // ----- カメラストリーム取得 -----
  const getCameraStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      logDebug('Camera stream acquired')
      return stream
    } catch (err) {
      const mediaError = err as Error & { name?: string }
      let presenceError: PresenceError

      if (
        mediaError.name === 'NotAllowedError' ||
        mediaError.name === 'PermissionDeniedError'
      ) {
        presenceError = {
          code: 'CAMERA_PERMISSION_DENIED',
          message: 'カメラへのアクセス許可が必要です',
        }
      } else if (
        mediaError.name === 'NotFoundError' ||
        mediaError.name === 'DevicesNotFoundError'
      ) {
        presenceError = {
          code: 'CAMERA_NOT_AVAILABLE',
          message: 'カメラが利用できません',
        }
      } else {
        presenceError = {
          code: 'CAMERA_NOT_AVAILABLE',
          message: `カメラの取得に失敗しました: ${mediaError.message}`,
        }
      }

      logDebug('Camera error:', presenceError)
      setError(presenceError)
      homeStore.setState({ presenceError })
      throw err
    }
  }, [logDebug])

  // ----- カメラストリーム解放 -----
  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      logDebug('Camera stream released')
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [logDebug])

  // ----- 検出ループ停止 -----
  const stopDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    if (departureTimeoutRef.current) {
      clearTimeout(departureTimeoutRef.current)
      departureTimeoutRef.current = null
    }
  }, [])

  // ----- 離脱処理 -----
  const handleDeparture = useCallback(() => {
    logDebug('Person departed')

    // greeting中の離脱は発話中断
    if (presenceState === 'greeting') {
      callbackRefs.current.onInterruptGreeting?.()
    }

    callbackRefs.current.onPersonDeparted?.()
    transitionState('idle')

    // lastFaceDetectedをリセット（次の検出で新規検出として扱うため）
    lastFaceDetectedRef.current = false

    // クールダウン開始
    isInCooldownRef.current = true
    cooldownTimeoutRef.current = setTimeout(() => {
      isInCooldownRef.current = false
      logDebug('Cooldown ended')
    }, presenceCooldownTime * 1000)
  }, [presenceState, presenceCooldownTime, transitionState, logDebug])

  // ----- 顔検出実行 -----
  const detectFace = useCallback(async () => {
    if (!isDetecting || !videoRef.current) return

    try {
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      )

      const faceDetected = !!detection
      const result: DetectionResult = {
        faceDetected,
        confidence: detection?.score ?? 0,
        boundingBox: detection?.box
          ? {
              x: detection.box.x,
              y: detection.box.y,
              width: detection.box.width,
              height: detection.box.height,
            }
          : undefined,
      }
      setDetectionResult(result)

      // 検出状態の変化を処理
      if (faceDetected && !lastFaceDetectedRef.current) {
        // 顔を検出開始
        lastFaceDetectedRef.current = true

        // 離脱タイマーをクリア
        if (departureTimeoutRef.current) {
          clearTimeout(departureTimeoutRef.current)
          departureTimeoutRef.current = null
        }

        // クールダウン中でなく、idle状態の場合のみ状態遷移
        if (!isInCooldownRef.current && presenceState === 'idle') {
          logDebug('Face detected')
          callbackRefs.current.onPersonDetected?.()
          transitionState('detected')

          // 即座にgreeting状態に遷移し、挨拶を開始
          transitionState('greeting')
          callbackRefs.current.onGreetingStart?.(presenceGreetingMessage)
        }
      } else if (!faceDetected && lastFaceDetectedRef.current) {
        // 顔が消えた
        lastFaceDetectedRef.current = false

        // 離脱判定タイマー開始
        if (!departureTimeoutRef.current && presenceState !== 'idle') {
          departureTimeoutRef.current = setTimeout(
            handleDeparture,
            presenceDepartureTimeout * 1000
          )
        }
      }
    } catch (err) {
      logDebug('Detection error:', err)
    }
  }, [
    isDetecting,
    presenceState,
    presenceGreetingMessage,
    presenceDepartureTimeout,
    handleDeparture,
    transitionState,
    logDebug,
  ])

  // ----- 検出開始 -----
  const startDetection = useCallback(async () => {
    if (isDetecting) return

    setError(null)
    homeStore.setState({ presenceError: null })

    try {
      await loadModels()
      await getCameraStream()
      setIsDetecting(true)

      logDebug(
        `Detection started with ${SENSITIVITY_INTERVALS[presenceDetectionSensitivity]}ms interval`
      )
    } catch {
      setIsDetecting(false)
    }
  }, [
    isDetecting,
    loadModels,
    getCameraStream,
    presenceDetectionSensitivity,
    logDebug,
  ])

  // ----- 検出ループの開始（isDetectingがtrueになった時に開始） -----
  useEffect(() => {
    if (isDetecting && !detectionIntervalRef.current) {
      const interval = SENSITIVITY_INTERVALS[presenceDetectionSensitivity]
      detectionIntervalRef.current = setInterval(detectFace, interval)
      logDebug(`Detection loop started with ${interval}ms interval`)
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
    }
  }, [isDetecting, presenceDetectionSensitivity, detectFace, logDebug])

  // ----- 検出停止 -----
  const stopDetection = useCallback(() => {
    stopDetectionLoop()
    releaseStream()
    setIsDetecting(false)
    transitionState('idle')
    setDetectionResult(null)
    lastFaceDetectedRef.current = false

    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current)
      cooldownTimeoutRef.current = null
    }
    isInCooldownRef.current = false

    logDebug('Detection stopped')
  }, [stopDetectionLoop, releaseStream, transitionState, logDebug])

  // ----- 挨拶完了 -----
  const completeGreeting = useCallback(() => {
    if (presenceState === 'greeting') {
      transitionState('conversation-ready')
      callbackRefs.current.onGreetingComplete?.()
      logDebug('Greeting completed')
    }
  }, [presenceState, transitionState, logDebug])

  // ----- クリーンアップ -----
  useEffect(() => {
    return () => {
      stopDetectionLoop()
      releaseStream()

      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current)
      }
    }
  }, [stopDetectionLoop, releaseStream])

  return {
    presenceState,
    isDetecting,
    error,
    startDetection,
    stopDetection,
    completeGreeting,
    videoRef,
    detectionResult,
  }
}
