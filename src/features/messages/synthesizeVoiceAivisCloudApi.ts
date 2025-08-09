import { Talk } from './messages'
import homeStore from '@/features/stores/home'

// ストリーミング無効時の従来の実装
export async function synthesizeVoiceAivisCloudApi(
  talk: Talk,
  apiKey: string,
  modelUuid: string,
  styleId: number,
  styleName: string,
  useStyleName: boolean,
  speed: number,
  pitch: number,
  emotionalIntensity: number,
  tempoDynamics: number,
  prePhonemeLength: number,
  postPhonemeLength: number
): Promise<ArrayBuffer> {
  try {
    const res = await fetch('/api/tts-aivis-cloud-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: talk.message,
        apiKey,
        modelUuid,
        styleId,
        styleName,
        useStyleName,
        speed,
        pitch,
        emotionalIntensity,
        tempoDynamics,
        prePhonemeLength,
        postPhonemeLength,
        outputFormat: 'mp3',
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${res.status}`
      throw new Error(`Aivis Cloud APIからの応答が異常です: ${errorMessage}`)
    }

    return await res.arrayBuffer()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Aivis Cloud APIでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('Aivis Cloud APIで不明なエラーが発生しました')
    }
  }
}

// ストリーミング対応版の実装（直接API呼び出し）
export async function synthesizeVoiceAivisCloudApiStreaming(
  talk: Talk,
  apiKey: string,
  modelUuid: string,
  styleId: number,
  styleName: string,
  useStyleName: boolean,
  speed: number,
  pitch: number,
  emotionalIntensity: number,
  tempoDynamics: number,
  prePhonemeLength: number,
  postPhonemeLength: number,
  onProgress?: (progress: any) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // LipSync用のオーディオコンテキスト取得
      let lipSyncContext: AudioContext | null = null
      try {
        // homeStoreから現在のVRMモデルのAudioContextを取得
        if (typeof window !== 'undefined') {
          const homeStoreModule = await import('@/features/stores/home')
          const homeStore = homeStoreModule.default
          const model = homeStore.getState().viewer?.model
          if (model && typeof model.getAudioContext === 'function') {
            lipSyncContext = model.getAudioContext()
            console.log('✅ LipSync用AudioContextを取得')
          }
        }
      } catch (error) {
        console.log('ℹ️ LipSync用AudioContext取得失敗（後でフォールバック）')
      }

      // MediaSource API を使用したストリーミング再生
      const mediaSource = new MediaSource()
      const audio = new Audio()
      audio.src = URL.createObjectURL(mediaSource)
      
      console.log('🌊 ストリーミング音声用Audio要素作成')

      // MediaSource の初期化完了を待機
      await new Promise<void>((resolveMS) => {
        mediaSource.addEventListener('sourceopen', () => resolveMS(), {
          once: true,
        })
      })
      
      // Audio要素をDOMに追加（監視システムで検出できるようにする）
      audio.style.display = 'none' // 見た目には影響しないように隠す
      document.body.appendChild(audio)
      console.log('🔗 Audio要素をDOMに追加（監視システム用）')
      
      // MutationObserverは非同期なので、手動でスキャンもトリガー
      setTimeout(() => {
        try {
          // homeStoreから現在のVRMモデルインスタンスを取得してスキャンを手動実行
          if (typeof window !== 'undefined') {
            import('@/features/stores/home').then((homeStoreModule) => {
              const homeStore = homeStoreModule.default
              const model = homeStore.getState().viewer?.model
              if (model && typeof model.scanAudioElements === 'function') {
                model.scanAudioElements()
              }
            }).catch(() => {
              // 無視（MutationObserverが処理）
            })
          }
        } catch (error) {
          // 無視（MutationObserverが処理）
        }
      }, 50)

      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
      const chunks: Uint8Array[] = []
      const pendingChunks: Uint8Array[] = []

      let readerDone = false
      let chunkArrivedCallback: (() => void) | null = null
      
      // LipSync用チャンク送信関数
      const sendChunkToLipSync = async (chunk: Uint8Array) => {
        if (!lipSyncContext) return
        
        try {
          // MP3チャンクをArrayBufferに変換してデコード
          const arrayBuffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)
          
          // AudioContextでデコードを試行
          const audioBuffer = await lipSyncContext.decodeAudioData(arrayBuffer.slice())
          
          // homeStoreから現在のVRMモデルを取得してspeak
          if (typeof window !== 'undefined') {
            const homeStoreModule = await import('@/features/stores/home')
            const homeStore = homeStoreModule.default
            const model = homeStore.getState().viewer?.model
            if (model && typeof model.speak === 'function') {
              // チャンク単位でspeak実行（デコード済みなのでisNeedDecode=true）
              await model.speak(arrayBuffer, talk, true)
              console.log('✅ LipSync用チャンク送信完了')
            }
          }
        } catch (error) {
          // デコードエラーは正常（MP3の断片的なチャンクなので）
          // ログ出力は不要（頻繁に発生するため）
        }
      }

      // 音声再生イベントの設定
      const handlePlayStart = () => {
        console.log('▶️ ストリーミング音声再生開始')
      }

      const handlePlayEnd = () => {
        console.log('🏁 ストリーミング音声再生終了')
      }

      const handleError = (error: Event) => {
        console.error('❌ ストリーミング音声再生エラー:', error)
      }

      // イベントリスナーを設定
      audio.addEventListener('play', handlePlayStart)
      audio.addEventListener('ended', handlePlayEnd)
      audio.addEventListener('pause', handlePlayEnd)
      audio.addEventListener('error', handleError)

      const waitForIdle = (): Promise<void> => {
        return new Promise((resolve) => {
          const checkIdle = () => {
            if (!sourceBuffer.updating) {
              resolve()
            } else {
              setTimeout(checkIdle, 10)
            }
          }
          checkIdle()
        })
      }

      const requestBody = {
        model_uuid: modelUuid,
        text: talk.message,
        use_ssml: true,
        speaking_rate: speed,
        pitch,
        emotional_intensity: emotionalIntensity,
        tempo_dynamics_scale: tempoDynamics,
        pre_phoneme_length: prePhonemeLength,
        post_phoneme_length: postPhonemeLength,
        output_format: 'mp3',
        output_sampling_rate: 44100,
        output_audio_channels: 'mono',
        ...(useStyleName && styleName
          ? { style_name: styleName }
          : { style_id: styleId }),
      }

      // ストリーミングリクエスト
      const response = await fetch(
        'https://api.aivis-project.com/v1/tts/synthesize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || `HTTP ${response.status}`
        throw new Error(`Aivis Cloud APIからの応答が異常です: ${errorMessage}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      let isFirstChunk = true

      // 読み取りループ
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
              break
            }

            chunks.push(value)
            
            // LipSync用にチャンクを送信（非同期、エラーを無視）
            sendChunkToLipSync(value).catch(() => {
              // チャンクデコード失敗は正常（MP3断片のため）
            })

            if (isFirstChunk) {
              isFirstChunk = false

              try {
                await waitForIdle()
                sourceBuffer.appendBuffer(value)
                await audio.play()
                onProgress?.({ stage: 'playback_started' })
              } catch (err) {
                console.error('Error starting playback:', err)
              }

              if (chunkArrivedCallback) {
                chunkArrivedCallback()
                chunkArrivedCallback = null
              }
              continue
            }

            pendingChunks.push(value)
            if (chunkArrivedCallback) {
              chunkArrivedCallback()
              chunkArrivedCallback = null
            }
          }
        } catch (error) {
          reject(
            new Error(
              `ストリーミング読み取りエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          )
        }
      }

      // 書き込みループ
      const appendLoop = async () => {
        try {
          while (true) {
            if (readerDone && pendingChunks.length === 0) {
              await waitForIdle()
              mediaSource.endOfStream()

              // 全チャンクを結合してArrayBufferとして返す
              const totalLength = chunks.reduce(
                (sum, chunk) => sum + chunk.length,
                0
              )
              const result = new Uint8Array(totalLength)
              let offset = 0
              for (const chunk of chunks) {
                result.set(chunk, offset)
                offset += chunk.length
              }
              
              // 完全な音声データをLipSyncに送信（バックアップ手段）
              if (lipSyncContext && result.byteLength > 0) {
                try {
                  const completeArrayBuffer = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength)
                  
                  // homeStoreから現在のVRMモデルを取得してspeak
                  if (typeof window !== 'undefined') {
                    const homeStoreModule = await import('@/features/stores/home')
                    const homeStore = homeStoreModule.default
                    const model = homeStore.getState().viewer?.model
                    if (model && typeof model.speak === 'function') {
                      await model.speak(completeArrayBuffer, talk, true)
                      console.log('✅ ストリーミング音声のLipSync連携完了')
                    }
                  }
                } catch (error) {
                  console.log('ℹ️ 完全音声データのLipSync送信失敗:', error)
                }
              }

              // クリーンアップ関数
              const cleanup = () => {
                // イベントリスナーの除去
                audio.removeEventListener('play', handlePlayStart)
                audio.removeEventListener('ended', handlePlayEnd)
                audio.removeEventListener('pause', handlePlayEnd)
                audio.removeEventListener('error', handleError)
                
                // DOMからAudio要素を削除
                if (audio.parentNode) {
                  audio.parentNode.removeChild(audio)
                  console.log('🧹 Audio要素をDOMから削除')
                }
                
                // URLオブジェクトの解放
                URL.revokeObjectURL(audio.src)
              }

              // 音声再生完了を待機
              audio.addEventListener(
                'ended',
                () => {
                  cleanup()
                  resolve()
                },
                { once: true }
              )

              // 音声が短い場合は即座に完了とみなす
              setTimeout(() => {
                if (audio.ended || audio.duration < 1) {
                  cleanup()
                  resolve()
                }
              }, 100)

              break
            }

            if (pendingChunks.length === 0) {
              await new Promise<void>((resolve) => {
                if (pendingChunks.length > 0 || readerDone) return resolve()
                chunkArrivedCallback = resolve
              })
              continue
            }

            const chunk = pendingChunks.shift()!

            await new Promise((r) => setTimeout(r, 0))
            try {
              await waitForIdle()
              sourceBuffer.appendBuffer(chunk)
            } catch (error: any) {
              if (error.name === 'QuotaExceededError') {
                await new Promise((r) => setTimeout(r, 500))
                pendingChunks.unshift(chunk)
                continue
              } else {
                throw error
              }
            }
          }
        } catch (error) {
          reject(
            new Error(
              `バッファ書き込みエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          )
        }
      }

      // 両ループを並行実行
      Promise.all([readLoop(), appendLoop()]).catch(reject)
    } catch (error) {
      console.error('❌ ストリーミング音声合成でエラー発生:', error)
      
      if (error instanceof Error) {
        reject(
          new Error(`Aivis Cloud APIでエラーが発生しました: ${error.message}`)
        )
      } else {
        reject(new Error('Aivis Cloud APIで不明なエラーが発生しました'))
      }
    }
  })
}
