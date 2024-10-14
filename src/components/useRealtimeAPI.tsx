import { useEffect, useRef, useState, useCallback } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

///取得したコメントをストックするリストの作成（tmpMessages）
interface TmpMessage {
  text: string
  role: string
  emotion: string
  state: string
  buffer?: ArrayBuffer
}

interface Params {
  handleReceiveTextFromRt: (
    text: string,
    role?: string,
    state?: string,
    buffer?: ArrayBuffer
  ) => Promise<void>
}

const useRealtimeAPI = ({ handleReceiveTextFromRt }: Params) => {
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const accumulatedAudioDataRef = useRef<Int16Array>(new Int16Array())

  const processMessage = useCallback(
    async (message: TmpMessage) => {
      await handleReceiveTextFromRt(
        message.text,
        message.role,
        message.state,
        message.buffer
      )
    },
    [handleReceiveTextFromRt]
  )

  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const arrayBuffer = bytes.buffer
    if (!validateAudioBuffer(arrayBuffer)) {
      console.error('Invalid audio buffer')
      return new ArrayBuffer(0) // 空のバッファーを返す
    }

    return arrayBuffer
  }

  function mergeInt16Arrays(
    left: Int16Array | ArrayBuffer,
    right: Int16Array | ArrayBuffer
  ): Int16Array {
    if (left instanceof ArrayBuffer) {
      left = new Int16Array(left)
    }
    if (right instanceof ArrayBuffer) {
      right = new Int16Array(right)
    }
    if (!(left instanceof Int16Array) || !(right instanceof Int16Array)) {
      throw new Error(`Both items must be Int16Array`)
    }
    const newValues = new Int16Array(left.length + right.length)
    newValues.set(left, 0)
    newValues.set(right, left.length)
    return newValues
  }

  function validateAudioBuffer(buffer: ArrayBuffer): boolean {
    // バッファーサイズのチェック（例：最小1KB、最大1MB）
    if (buffer.byteLength < 1024 || buffer.byteLength > 1024 * 1024) {
      console.error(`Invalid buffer size: ${buffer.byteLength} bytes`)
      return false
    }

    // PCM 16-bit データの場合、バッファーサイズは偶数でなければならない
    if (buffer.byteLength % 2 !== 0) {
      console.error('Buffer size is not even, which is required for 16-bit PCM')
      return false
    }

    // データの範囲チェック（16-bit PCMの場合、-32768 から 32767）
    const int16Array = new Int16Array(buffer)
    const isInValidRange = int16Array.every(
      (value) => value >= -32768 && value <= 32767
    )
    if (!isInValidRange) {
      console.error(
        'Audio data contains values outside the valid range for 16-bit PCM'
      )
      return false
    }

    // すべてのチェックをパスした場合
    return true
  }

  // WebSocket接続の設定（既存のコード）
  useEffect(() => {
    const ss = settingsStore.getState()
    if (!ss.realtimeAPIMode || !ss.selectAIService) return

    const handleOpen = (event: Event) => {
      console.log('WebSocket connection opened:', event)
      if (ws) {
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: ss.systemPrompt,
              voice: 'shimmer',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1',
              },
              turn_detection: null,
              temperature: 0.8,
              max_response_output_tokens: 4096,
            },
          })
        )
      }
    }
    const handleMessage = (event: MessageEvent) => {
      const jsonData = JSON.parse(event.data)
      console.log('Received message:', jsonData.type)

      switch (jsonData.type) {
        case 'error':
          console.log('エラーデータを受信しました', jsonData)
          break
        case 'conversation.item.created':
          console.log('コンテキストデータを受信しました', jsonData)
          break
        case 'response.audio.delta':
          console.log('オーディオデータを受信しました', jsonData)
          if (jsonData.delta) {
            const arrayBuffer = base64ToArrayBuffer(jsonData.delta)
            if (arrayBuffer.byteLength > 0) {
              // 有効なバッファーの場合のみ処理
              const appendValues = new Int16Array(arrayBuffer)
              accumulatedAudioDataRef.current = mergeInt16Arrays(
                accumulatedAudioDataRef.current,
                appendValues
              )
            } else {
              console.error('無効なオーディオバッファーを受信しました')
            }
          } else {
            console.error('無効なオーディオバッファーを受信しました')
          }
          break
        case 'response.content_part.done':
          if (jsonData.part && jsonData.part.transcript) {
            processMessage({
              text: jsonData.part.transcript,
              role: 'assistant',
              emotion: '',
              state: jsonData.type,
            })
          }
          break
        case 'conversation.item.input_audio_transcription.completed':
          console.log('音声データの音声認識が完了しました', jsonData)
          break
      }

      if (
        (jsonData.type === 'response.audio.delta' &&
          accumulatedAudioDataRef.current?.buffer?.byteLength > 100_000) ||
        jsonData.type === 'response.audio.done'
      ) {
        const arrayBuffer = accumulatedAudioDataRef.current.buffer
        // 累積データをリセット
        accumulatedAudioDataRef.current = new Int16Array()
        try {
          if (arrayBuffer) {
            processMessage({
              text: '',
              role: 'assistant',
              emotion: '',
              state: jsonData.type,
              buffer: arrayBuffer,
            })
          }
        } catch (error) {
          console.error('Audio processing error:', error)
        }
      }
    }
    const handleError = (event: Event) => {
      console.error('WebSocket error:', event)
    }
    const handleClose = (event: Event) => {
      console.log('WebSocket connection closed:', event)
    }

    function setupWebsocket() {
      let ws: WebSocket

      if (ss.selectAIService === 'openai') {
        const url =
          'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
        ws = new WebSocket(url, [
          'realtime',
          `openai-insecure-api-key.${ss.openaiKey}`,
          'openai-beta.realtime-v1',
        ])
      } else if (ss.selectAIService === 'azure') {
        const url =
          `${ss.azureEndpoint}&api-key=${ss.azureKey}` ||
          `${process.env.AZURE_ENDPOINT}&api-key=${ss.azureKey}` ||
          ''
        ws = new WebSocket(url, [])
      } else {
        return null
      }

      ws.addEventListener('open', handleOpen)
      ws.addEventListener('message', handleMessage)
      ws.addEventListener('error', handleError)
      ws.addEventListener('close', handleClose)
      return ws
    }

    let ws = setupWebsocket()
    homeStore.setState({ ws })

    const reconnectInterval = setInterval(() => {
      const ss = settingsStore.getState()
      if (
        ss.realtimeAPIMode &&
        ws &&
        ws.readyState !== WebSocket.OPEN &&
        ws.readyState !== WebSocket.CONNECTING
      ) {
        homeStore.setState({ chatProcessing: false })
        console.log('try reconnecting...')
        ws.close()
        ws = setupWebsocket()
        homeStore.setState({ ws })
      }
    }, 1000)

    return () => {
      clearInterval(reconnectInterval)
      if (ws) {
        ws.close()
        homeStore.setState({ ws: null })
      }
    }
  }, [realtimeAPIMode, processMessage])

  return null
}

export default useRealtimeAPI
