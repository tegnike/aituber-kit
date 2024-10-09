import { useEffect, useRef, useState, useCallback } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

const SYSTEM_PROMPT = `
You are a helpful assistant.
`

///取得したコメントをストックするリストの作成（tmpMessages）
interface TmpMessage {
  text: string
  role: string
  emotion: string
  state: string
}

interface Params {
  handleReceiveTextFromWs: (
    text: string,
    role?: string,
    state?: string,
    buffer?: ArrayBuffer
  ) => Promise<void>
}

const useWebSocket = ({ handleReceiveTextFromWs }: Params) => {
  const webSocketMode = settingsStore((s) => s.webSocketMode)
  const [tmpMessages, setTmpMessages] = useState<TmpMessage[]>([])
  const accumulatedAudioDataRef = useRef<Int16Array>(new Int16Array())

  const processMessage = useCallback(
    async (message: TmpMessage, buffer: ArrayBuffer) => {
      await handleReceiveTextFromWs(
        message.text,
        message.role,
        message.state,
        buffer
      )
    },
    [handleReceiveTextFromWs]
  )

  useEffect(() => {
    if (tmpMessages.length > 0) {
      const message = tmpMessages[0]
      if (
        message.role === 'output' ||
        message.role === 'executing' ||
        message.role === 'console'
      ) {
        message.role = 'code'
      }
      setTmpMessages((prev) => prev.slice(1))
      processMessage(message)
    }
  }, [tmpMessages, processMessage])

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
    for (let i = 0; i < left.length; i++) {
      newValues[i] = left[i]
    }
    for (let j = 0; j < right.length; j++) {
      newValues[left.length + j] = right[j]
    }
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
    if (!ss.webSocketMode) return

    const handleOpen = (event: Event) => {
      console.log('WebSocket connection opened:', event)
      ws.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'System settings:\n' + SYSTEM_PROMPT,
            voice: 'shimmer',
            // input_audio_format: 'pcm16',
            // output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: null,
            temperature: 0.8,
            max_response_output_tokens: 4096,
          },
        })
      )
      // ws.send(
      //   JSON.stringify({
      //     "type": "conversation.item.create",
      //     "item": {
      //       "type": "message",
      //       "role": "user",
      //       "content": [
      //         {
      //           "type": "input_text",
      //           "text": "簡潔に自己紹介してください"
      //         }
      //       ]
      //     }
      //   })
      // )
      // ws.send(
      //   JSON.stringify({
      //     type: "response.create",
      //   })
      // )
    }
    const handleMessage = (event: MessageEvent) => {
      const jsonData = JSON.parse(event.data)
      console.log('Received message:', jsonData.type)
      if (jsonData.type === 'error') {
        console.log('エラーデータを受信しました', jsonData)
      }
      if (jsonData.type === 'conversation.item.created') {
        console.log('コンテキストデータを受信しました', jsonData)
      }
      if (jsonData.type === 'response.audio.delta') {
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
      }
      if (
        (jsonData.type === 'response.audio.delta' &&
          accumulatedAudioDataRef.current.buffer.byteLength > 50000) ||
        jsonData.type === 'response.audio.done'
      ) {
        const arrayBuffer = accumulatedAudioDataRef.current.buffer
        try {
          // サンプリングレートを適切な値に設定（例: 24000Hz）
          const processedBuffer = arrayBuffer
          if (processedBuffer) {
            processMessage(
              { text: '', role: 'assistant', emotion: '', state: '' },
              processedBuffer
            )
          }
          // 累積データをリセット
          accumulatedAudioDataRef.current = new Int16Array()
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
      const url =
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
      const ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.xxx`,
        'openai-beta.realtime-v1',
      ])

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
        ss.webSocketMode &&
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
      ws.close()
      homeStore.setState({ ws: null })
    }
  }, [webSocketMode, processMessage])

  return null
}

export default useWebSocket
