import { useState, useEffect, useCallback, useRef } from 'react'
import * as faceapi from 'face-api.js'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import {
  PresenceState,
  PresenceError,
  DetectionResult,
} from '@/features/presence/presenceTypes'
import { IdlePhrase } from '@/features/idle/idleTypes'

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
  onGreetingStart?: (phrase: IdlePhrase) => void
  onGreetingComplete?: () => void
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
}: UsePresenceDetectionProps): UsePresenceDetectionReturn {
  // ----- 設定の取得 -----
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
  const presenceSelectedCameraId = settingsStore(
    (s) => s.presenceSelectedCameraId
  )

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
  const detectionStartTimeRef = useRef<number | null>(null)
  const modelLoadedRef = useRef(false)

  // Callback refs to avoid stale closures
  const callbackRefs = useRef({
    onPersonDetected,
    onPersonDeparted,
    onGreetingStart,
    onGreetingComplete,
  })

  // Update callback refs in useEffect to avoid accessing refs during render
  useEffect(() => {
    callbackRefs.current = {
      onPersonDetected,
      onPersonDeparted,
      onGreetingStart,
      onGreetingComplete,
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

  // ----- ランダム選択ヘルパー -----
  const selectRandomPhrase = useCallback(
    (phrases: IdlePhrase[]): IdlePhrase | null => {
      if (!phrases || phrases.length === 0) return null
      return phrases[Math.floor(Math.random() * phrases.length)]
    },
    []
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
      // カメラ制約を構築
      const videoConstraints: MediaTrackConstraints = presenceSelectedCameraId
        ? { deviceId: { exact: presenceSelectedCameraId } }
        : { facingMode: 'user' }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      logDebug(
        `Camera stream acquired${presenceSelectedCameraId ? ` (deviceId: ${presenceSelectedCameraId})` : ' (default)'}`
      )
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
      } else if (mediaError.name === 'OverconstrainedError') {
        // 指定されたカメラが見つからない場合
        presenceError = {
          code: 'CAMERA_NOT_AVAILABLE',
          message: '指定されたカメラが見つかりません。設定を確認してください。',
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
  }, [logDebug, presenceSelectedCameraId])

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
  }, [presenceCooldownTime, transitionState, logDebug])

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
      if (faceDetected) {
        // 離脱タイマーをクリア
        if (departureTimeoutRef.current) {
          clearTimeout(departureTimeoutRef.current)
          departureTimeoutRef.current = null
        }

        if (!lastFaceDetectedRef.current) {
          // 顔を検出開始 - タイマー開始
          lastFaceDetectedRef.current = true
          detectionStartTimeRef.current = Date.now()
          logDebug('Face detection started, waiting for threshold...')
        }

        // クールダウン中でなく、idle状態の場合のみ閾値チェック
        if (!isInCooldownRef.current && presenceState === 'idle') {
          const elapsedTime = detectionStartTimeRef.current
            ? (Date.now() - detectionStartTimeRef.current) / 1000
            : 0

          // 閾値が0または経過時間が閾値を超えた場合に来場者検知
          if (
            presenceDetectionThreshold <= 0 ||
            elapsedTime >= presenceDetectionThreshold
          ) {
            logDebug(
              `Face confirmed after ${elapsedTime.toFixed(1)}s (threshold: ${presenceDetectionThreshold}s)`
            )
            callbackRefs.current.onPersonDetected?.()
            transitionState('detected')

            // フレーズをランダム選択して挨拶を開始
            const selectedPhrase = selectRandomPhrase(presenceGreetingPhrases)
            if (selectedPhrase) {
              transitionState('greeting')
              callbackRefs.current.onGreetingStart?.(selectedPhrase)
            } else {
              // フレーズが無い場合は即座にconversation-readyに遷移
              transitionState('conversation-ready')
              callbackRefs.current.onGreetingComplete?.()
            }
          }
        }
      } else if (!faceDetected && lastFaceDetectedRef.current) {
        // 顔が消えた - 検出タイマーをリセット
        lastFaceDetectedRef.current = false
        detectionStartTimeRef.current = null
        logDebug('Face lost, detection timer reset')

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
    presenceGreetingPhrases,
    selectRandomPhrase,
    presenceDepartureTimeout,
    presenceDetectionThreshold,
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
    detectionStartTimeRef.current = null

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
