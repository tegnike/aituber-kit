import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAivisCloudStreaming } from '@/hooks/useAivisCloudStreaming'
import settingsStore from '@/features/stores/settings'

interface Props {
  text: string
  onComplete?: (audioBlob: Blob | null) => void
  onError?: (error: string) => void
  onProgress?: (progress: any) => void
}

export const AivisCloudStreamingPlayer = ({ 
  text, 
  onComplete, 
  onError,
  onProgress 
}: Props) => {
  const { t } = useTranslation()
  const { status, startStreaming, stopStreaming, audioElement } = useAivisCloudStreaming()
  const [isVisible, setIsVisible] = useState(false)

  // 設定値を取得
  const aivisCloudApiKey = settingsStore((s) => s.aivisCloudApiKey)
  const aivisCloudModelUuid = settingsStore((s) => s.aivisCloudModelUuid)
  const aivisCloudStyleId = settingsStore((s) => s.aivisCloudStyleId)
  const aivisCloudStyleName = settingsStore((s) => s.aivisCloudStyleName)
  const aivisCloudUseStyleName = settingsStore((s) => s.aivisCloudUseStyleName)
  const aivisCloudSpeed = settingsStore((s) => s.aivisCloudSpeed)
  const aivisCloudPitch = settingsStore((s) => s.aivisCloudPitch)
  const aivisCloudIntonationScale = settingsStore((s) => s.aivisCloudIntonationScale)
  const aivisCloudTempoDynamics = settingsStore((s) => s.aivisCloudTempoDynamics)
  const aivisCloudPrePhonemeLength = settingsStore((s) => s.aivisCloudPrePhonemeLength)
  const aivisCloudPostPhonemeLength = settingsStore((s) => s.aivisCloudPostPhonemeLength)

  // ストリーミング開始
  useEffect(() => {
    if (text && aivisCloudApiKey && aivisCloudModelUuid) {
      setIsVisible(true)
      
      startStreaming({
        apiKey: aivisCloudApiKey,
        modelUuid: aivisCloudModelUuid,
        text,
        styleId: aivisCloudStyleId,
        styleName: aivisCloudStyleName,
        useStyleName: aivisCloudUseStyleName,
        speed: aivisCloudSpeed,
        pitch: aivisCloudPitch,
        emotionalIntensity: aivisCloudIntonationScale,
        tempoDynamics: aivisCloudTempoDynamics,
        prePhonemeLength: aivisCloudPrePhonemeLength,
        postPhonemeLength: aivisCloudPostPhonemeLength,
      })
    }

    return () => {
      stopStreaming()
    }
  }, [
    text, 
    aivisCloudApiKey, 
    aivisCloudModelUuid,
    aivisCloudStyleId,
    aivisCloudStyleName,
    aivisCloudUseStyleName,
    aivisCloudSpeed,
    aivisCloudPitch,
    aivisCloudIntonationScale,
    aivisCloudTempoDynamics,
    aivisCloudPrePhonemeLength,
    aivisCloudPostPhonemeLength,
    startStreaming,
    stopStreaming
  ])

  // ステータス変更の監視
  useEffect(() => {
    if (status.error) {
      onError?.(status.error)
    }
    
    if (!status.isStreaming && status.audioBlob && !status.error) {
      onComplete?.(status.audioBlob)
    }

    onProgress?.(status.progress)
  }, [status, onComplete, onError, onProgress])

  // 完了後に非表示にする
  useEffect(() => {
    if (!status.isStreaming && status.audioBlob && !status.error) {
      const timer = setTimeout(() => setIsVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [status.isStreaming, status.audioBlob, status.error])

  if (!isVisible) return null

  const formatTime = (ms?: number) => {
    if (!ms) return '-'
    return `${ms}ms`
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    return `${seconds.toFixed(2)}s`
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-sm w-full mx-4 sm:mx-0 sm:w-auto border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-800">
          {t('VoiceGeneration') || 'リアルタイム音声生成'}
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none"
        >
          ×
        </button>
      </div>
      
      {status.error ? (
        <div className="text-red-600 text-sm font-medium">
          {status.error}
        </div>
      ) : (
        <div className="space-y-2">
          {/* ステータス表示 */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status.isStreaming ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm font-medium">
              {status.isStreaming ? (
                t('Generating') || '生成中...'
              ) : status.audioBlob ? (
                t('Completed') || '完了'
              ) : (
                t('Preparing') || '準備中'
              )}
            </span>
          </div>

          {/* 進捗情報 */}
          {(status.progress.timeToRequestSent || status.progress.timeToFirstChunkArrived || status.progress.timeToFirstPlayback) && (
            <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <span>リクエスト送信:</span>
                <span className="font-mono">{formatTime(status.progress.timeToRequestSent)}</span>
                <span>受信開始:</span>
                <span className="font-mono">{formatTime(status.progress.timeToFirstChunkArrived)}</span>
                <span>再生開始:</span>
                <span className="font-mono">{formatTime(status.progress.timeToFirstPlayback)}</span>
                {status.progress.timeToLastChunkArrived && (
                  <>
                    <span>生成完了:</span>
                    <span className="font-mono">{formatTime(status.progress.timeToLastChunkArrived)}</span>
                  </>
                )}
                {status.progress.totalAudioDuration && (
                  <>
                    <span>音声長:</span>
                    <span className="font-mono">{formatDuration(status.progress.totalAudioDuration)}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* プログレスバー */}
          {status.isStreaming && (
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse"></div>
            </div>
          )}

          {/* 音声再生コントロール (デバッグ用、通常は非表示) */}
          {audioElement && process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <div>Current Time: {audioElement.currentTime.toFixed(2)}s</div>
              <div>Duration: {audioElement.duration?.toFixed(2) || 'N/A'}s</div>
              <div>Buffered: {
                audioElement.buffered.length > 0 
                  ? `${audioElement.buffered.end(0).toFixed(2)}s`
                  : 'N/A'
              }</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}