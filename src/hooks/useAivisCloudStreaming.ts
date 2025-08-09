import { useCallback, useRef, useState } from 'react'
import homeStore from '@/features/stores/home'

interface StreamingProgress {
  timeToRequestSent?: number
  timeToFirstChunkArrived?: number
  timeToFirstPlayback?: number
  timeToLastChunkArrived?: number
  totalAudioDuration?: number
}

interface StreamingStatus {
  isStreaming: boolean
  progress: StreamingProgress
  error: string | null
  audioBlob: Blob | null
}

interface AivisCloudStreamingParams {
  apiKey: string
  modelUuid: string
  text: string
  styleId?: number
  styleName?: string
  useStyleName?: boolean
  speed?: number
  pitch?: number
  emotionalIntensity?: number
  tempoDynamics?: number
  prePhonemeLength?: number
  postPhonemeLength?: number
}

export const useAivisCloudStreaming = () => {
  const [status, setStatus] = useState<StreamingStatus>({
    isStreaming: false,
    progress: {},
    error: null,
    audioBlob: null,
  })

  const mediaSourceRef = useRef<MediaSource | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const pendingChunksRef = useRef<Uint8Array[]>([])
  const chunksRef = useRef<Uint8Array[]>([])

  const waitForSourceBufferReady = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (
          sourceBufferRef.current &&
          !sourceBufferRef.current.updating &&
          sourceBufferRef.current.buffered.length === 0
        ) {
          resolve()
        } else {
          setTimeout(checkReady, 10)
        }
      }
      checkReady()
    })
  }, [])

  const waitForIdle = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const checkIdle = () => {
        if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
          resolve()
        } else {
          setTimeout(checkIdle, 10)
        }
      }
      checkIdle()
    })
  }, [])

  const startStreaming = useCallback(
    async (params: AivisCloudStreamingParams): Promise<void> => {
      const startTime = Date.now()
      let timeToRequestSent = 0
      let timeToFirstChunkArrived = 0
      let timeToFirstPlayback = 0
      let timeToLastChunkArrived = 0

      setStatus((prev) => ({
        ...prev,
        isStreaming: true,
        error: null,
        audioBlob: null,
        progress: {},
      }))

      try {
        // MediaSource の初期化
        const mediaSource = new MediaSource()
        mediaSourceRef.current = mediaSource

        // Audio要素の作成
        const audio = new Audio()
        audioRef.current = audio
        audio.src = URL.createObjectURL(mediaSource)

        // LipSyncシステムへの接続
        const hs = homeStore.getState()
        if (hs.viewer.model && typeof hs.viewer.model.connectAudioForLipSync === 'function') {
          console.log('🔗 ストリーミング音声をLipSyncに接続')
          hs.viewer.model.connectAudioForLipSync(audio)
        } else {
          console.warn('⚠️ VRMモデルまたはconnectAudioForLipSyncメソッドが利用できません')
        }

        // MediaSourceの準備を待機
        await new Promise<void>((resolve) => {
          mediaSource.addEventListener('sourceopen', () => resolve(), {
            once: true,
          })
        })

        // SourceBufferの作成
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
        sourceBufferRef.current = sourceBuffer

        // 状態をリセット
        pendingChunksRef.current = []
        chunksRef.current = []

        // APIリクエストの準備
        const requestBody = {
          model_uuid: params.modelUuid,
          text: params.text,
          use_ssml: true,
          speaking_rate: params.speed || 1.0,
          pitch: params.pitch || 0.0,
          emotional_intensity: params.emotionalIntensity || 1.0,
          tempo_dynamics_scale: params.tempoDynamics || 1.0,
          pre_phoneme_length: params.prePhonemeLength || 0.1,
          post_phoneme_length: params.postPhonemeLength || 0.1,
          output_format: 'mp3',
          output_sampling_rate: 44100,
          output_audio_channels: 'mono',
          ...(params.useStyleName && params.styleName
            ? { style_name: params.styleName }
            : { style_id: params.styleId || 0 }),
        }

        // ストリーミングリクエストを送信
        const response = await fetch(
          'https://api.aivis-project.com/v1/tts/synthesize',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${params.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        )

        timeToRequestSent = Date.now() - startTime

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        if (!response.body) {
          throw new Error('Response body is null')
        }

        const reader = response.body.getReader()
        let readerDone = false
        let chunkArrivedCallback: (() => void) | null = null
        let isFirstChunk = true

        // バッファリング設定
        const MAX_BUFFER_AHEAD = 90 // 秒
        const CLEANUP_MARGIN = 10 // 秒

        // ストリーミングデータ読み取りループ
        const readLoop = async () => {
          try {
            while (true) {
              const { value, done } = await reader.read()

              if (done) {
                readerDone = true
                if (chunkArrivedCallback) {
                  chunkArrivedCallback()
                  chunkArrivedCallback = null
                }

                // 全チャンクを結合してBlobを作成
                const audioBlob = new Blob(chunksRef.current, {
                  type: 'audio/mpeg',
                })
                timeToLastChunkArrived = Date.now() - startTime

                setStatus((prev) => ({
                  ...prev,
                  progress: {
                    ...prev.progress,
                    timeToRequestSent,
                    timeToFirstChunkArrived,
                    timeToFirstPlayback,
                    timeToLastChunkArrived,
                  },
                  audioBlob,
                }))
                break
              }

              // 最初のチャンクの処理
              if (isFirstChunk) {
                isFirstChunk = false
                timeToFirstChunkArrived = Date.now() - startTime

                chunksRef.current.push(value)

                try {
                  await waitForSourceBufferReady()
                  sourceBuffer.appendBuffer(value)

                  // 音声再生開始
                  await audio.play()
                  timeToFirstPlayback = Date.now() - startTime

                  setStatus((prev) => ({
                    ...prev,
                    progress: {
                      ...prev.progress,
                      timeToRequestSent,
                      timeToFirstChunkArrived,
                      timeToFirstPlayback,
                    },
                  }))
                } catch (err) {
                  console.error('Error appending first chunk:', err)
                }

                if (chunkArrivedCallback) {
                  chunkArrivedCallback()
                  chunkArrivedCallback = null
                }
                continue
              }

              // 後続チャンクをキューに追加
              chunksRef.current.push(value)
              pendingChunksRef.current.push(value)
              if (chunkArrivedCallback) {
                chunkArrivedCallback()
                chunkArrivedCallback = null
              }
            }
          } catch (error) {
            console.error('Read loop error:', error)
            setStatus((prev) => ({
              ...prev,
              error: `ストリーミング読み取りエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
              isStreaming: false,
            }))
          }
        }

        // SourceBuffer書き込みループ
        const appendLoop = async () => {
          try {
            while (true) {
              // 終了条件
              if (readerDone && pendingChunksRef.current.length === 0) {
                await waitForIdle()
                mediaSource.endOfStream()

                // 最終的な音声長を取得
                const totalAudioDuration = audio.duration

                setStatus((prev) => ({
                  ...prev,
                  progress: {
                    ...prev.progress,
                    totalAudioDuration,
                  },
                  isStreaming: false,
                }))
                break
              }

              // キューが空の場合は待機
              if (pendingChunksRef.current.length === 0) {
                await new Promise<void>((resolve) => {
                  if (pendingChunksRef.current.length > 0 || readerDone)
                    return resolve()
                  chunkArrivedCallback = resolve
                })
                continue
              }

              const chunk = pendingChunksRef.current.shift()!

              // バッファ管理
              if (sourceBuffer.buffered.length > 0) {
                const bufferedEnd = sourceBuffer.buffered.end(
                  sourceBuffer.buffered.length - 1
                )
                let bufferAhead = bufferedEnd - audio.currentTime

                // バッファ制限
                while (bufferAhead > MAX_BUFFER_AHEAD) {
                  await new Promise((r) => setTimeout(r, 100))
                  await waitForIdle()
                  const newBufferedEnd = sourceBuffer.buffered.end(
                    sourceBuffer.buffered.length - 1
                  )
                  bufferAhead = newBufferedEnd - audio.currentTime
                }

                // 古いデータの削除
                const removalEnd = audio.currentTime - CLEANUP_MARGIN
                if (removalEnd > 0) {
                  try {
                    await waitForIdle()
                    sourceBuffer.remove(0, removalEnd)
                    await waitForIdle()
                  } catch (err) {
                    console.error('Error removing buffer:', err)
                  }
                }
              }

              // チャンクをSourceBufferに追加
              await new Promise((r) => setTimeout(r, 0))
              try {
                await waitForIdle()
                sourceBuffer.appendBuffer(chunk)
              } catch (error: any) {
                if (error.name === 'QuotaExceededError') {
                  console.warn('QuotaExceededError: Retrying after cleanup')
                  await new Promise((r) => setTimeout(r, 500))
                  pendingChunksRef.current.unshift(chunk)
                  continue
                } else {
                  throw error
                }
              }
            }
          } catch (error) {
            console.error('Append loop error:', error)
            setStatus((prev) => ({
              ...prev,
              error: `バッファ書き込みエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
              isStreaming: false,
            }))
          }
        }

        // 両ループを並行実行
        await Promise.all([readLoop(), appendLoop()])
      } catch (error) {
        console.error('Streaming error:', error)
        setStatus((prev) => ({
          ...prev,
          error: `ストリーミングエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isStreaming: false,
        }))
      }
    },
    [waitForSourceBufferReady, waitForIdle]
  )

  const stopStreaming = useCallback(() => {
    // LipSyncシステムからの切断
    const hs = homeStore.getState()
    if (hs.viewer.model && typeof hs.viewer.model.disconnectAudioForLipSync === 'function') {
      console.log('🔗 ストリーミング音声のLipSync接続解除')
      hs.viewer.model.disconnectAudioForLipSync()
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    if (
      mediaSourceRef.current &&
      mediaSourceRef.current.readyState === 'open'
    ) {
      try {
        mediaSourceRef.current.endOfStream()
      } catch (error) {
        console.warn('Error ending stream:', error)
      }
    }

    // URLの解放
    if (audioRef.current?.src) {
      URL.revokeObjectURL(audioRef.current.src)
    }

    // 参照のクリーンアップ
    mediaSourceRef.current = null
    audioRef.current = null
    sourceBufferRef.current = null
    pendingChunksRef.current = []
    chunksRef.current = []

    setStatus({
      isStreaming: false,
      progress: {},
      error: null,
      audioBlob: null,
    })
  }, [])

  return {
    status,
    startStreaming,
    stopStreaming,
    audioElement: audioRef.current,
  }
}
