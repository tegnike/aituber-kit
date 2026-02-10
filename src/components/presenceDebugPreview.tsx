/**
 * PresenceDebugPreview Component
 *
 * デバッグ用のカメラ映像プレビューと検出枠表示
 * Requirements: 5.3
 */

import React, { RefObject, useState, useEffect, useMemo } from 'react'
import settingsStore from '@/features/stores/settings'
import { DetectionResult } from '@/features/presence/presenceTypes'
import { useTranslation } from 'react-i18next'

interface PresenceDebugPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>
  detectionResult: DetectionResult | null
  className?: string
}

const PresenceDebugPreview = ({
  videoRef,
  detectionResult,
  className = '',
}: PresenceDebugPreviewProps) => {
  const { t } = useTranslation()
  const presenceDebugMode = settingsStore((s) => s.presenceDebugMode)
  const [scale, setScale] = useState(1)
  const [videoWidth, setVideoWidth] = useState(640)

  // ビデオサイズ変更時にスケール係数とビデオ幅を計算
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateDimensions = () => {
      if (video.videoWidth > 0 && video.clientWidth > 0) {
        setScale(video.clientWidth / video.videoWidth)
        setVideoWidth(video.videoWidth)
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(video)
    video.addEventListener('loadedmetadata', updateDimensions)
    updateDimensions()

    return () => {
      resizeObserver.disconnect()
      video.removeEventListener('loadedmetadata', updateDimensions)
    }
  }, [videoRef])

  const shouldShowBoundingBox =
    detectionResult?.faceDetected && detectionResult?.boundingBox

  // バウンディングボックスの位置を計算（ミラー表示対応）
  // 状態を使用してレンダー中のref参照を回避
  const boxStyle = useMemo(() => {
    if (!detectionResult?.boundingBox) return {}
    const box = detectionResult.boundingBox
    // ミラー表示なのでx座標を反転
    const mirroredX = videoWidth - box.x - box.width
    return {
      left: `${mirroredX * scale}px`,
      top: `${box.y * scale}px`,
      width: `${box.width * scale}px`,
      height: `${box.height * scale}px`,
    }
  }, [detectionResult?.boundingBox, videoWidth, scale])

  return (
    <div className={`relative ${className}`}>
      {/* カメラプレビュー */}
      <video
        ref={videoRef as RefObject<HTMLVideoElement>}
        autoPlay
        playsInline
        muted
        className="w-full h-auto rounded-lg bg-black"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* 検出枠（デバッグモード時のみ） */}
      {presenceDebugMode && shouldShowBoundingBox && (
        <div
          data-testid="bounding-box"
          className="absolute border-2 border-green-500 rounded"
          style={boxStyle}
        />
      )}

      {/* 検出情報（デバッグモード時のみ） */}
      {presenceDebugMode && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {detectionResult?.faceDetected ? (
            <span className="text-green-400">
              {t('PresenceDebugFaceDetected')} (
              {(detectionResult.confidence * 100).toFixed(1)}%)
            </span>
          ) : (
            <span className="text-gray-400">{t('PresenceDebugNoFace')}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default PresenceDebugPreview
