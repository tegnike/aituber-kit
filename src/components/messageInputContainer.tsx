import { useState, useEffect, useCallback, useRef } from 'react'
import { MessageInput } from '@/components/messageInput'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'

type Props = {
  onChatProcessStart: (text: string) => void
}

export const MessageInputContainer = ({ onChatProcessStart }: Props) => {
  const [userMessage, setUserMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const keyPressStartTime = useRef<number | null>(null)
  const transcriptRef = useRef('')
  const isKeyboardTriggered = useRef(false)
  const audioBufferRef = useRef<Float32Array | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition()
      const ss = settingsStore.getState()
      newRecognition.lang = ss.selectVoiceLanguage
      newRecognition.continuous = true
      newRecognition.interimResults = true

      newRecognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
        transcriptRef.current = transcript
        setUserMessage(transcript)
      }

      newRecognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error)
        setIsListening(false)
      }

      setRecognition(newRecognition)
    }
  }, [])

  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)()
    setAudioContext(context)
  }, [])

  // Float32Array を PCM16 ArrayBuffer に変換する関数
  const floatTo16BitPCM = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2)
    const view = new DataView(buffer)
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return buffer
  }

  // リサンプリング関数
  const resampleAudio = (
    audioData: Float32Array,
    fromSampleRate: number,
    toSampleRate: number
  ): Float32Array => {
    const ratio = fromSampleRate / toSampleRate
    const newLength = Math.round(audioData.length / ratio)
    const result = new Float32Array(newLength)

    for (let i = 0; i < newLength; i++) {
      const position = i * ratio
      const leftIndex = Math.floor(position)
      const rightIndex = Math.ceil(position)
      const fraction = position - leftIndex

      if (rightIndex >= audioData.length) {
        result[i] = audioData[leftIndex]
      } else {
        result[i] =
          (1 - fraction) * audioData[leftIndex] +
          fraction * audioData[rightIndex]
      }
    }

    return result
  }

  // Float32Array を base64エンコードされた PCM16 データに変換する関数
  const base64EncodeAudio = (float32Array: Float32Array) => {
    const arrayBuffer = floatTo16BitPCM(float32Array)
    let binary = ''
    const bytes = new Uint8Array(arrayBuffer)
    const chunkSize = 0x8000 // 32KB chunk size
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunkSize))
      )
    }
    return btoa(binary)
  }

  const startListening = useCallback(() => {
    if (recognition && !isListening && audioContext) {
      transcriptRef.current = ''
      setUserMessage('')
      recognition.start()
      setIsListening(true)
      audioChunksRef.current = [] // 音声チャンクをリセット

      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        setMediaRecorder(recorder)

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
            console.log('音声チャンク追加:', audioChunksRef.current.length)
          }
        }

        recorder.start(100) // より小さな間隔でデータを収集
      })
    }
  }, [recognition, isListening, audioContext])

  const stopListening = useCallback(async () => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
      if (mediaRecorder) {
        mediaRecorder.stop()
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = async () => {
            console.log('MediaRecorder停止')
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, {
                type: 'audio/webm',
              })
              const arrayBuffer = await audioBlob.arrayBuffer()
              const audioBuffer =
                await audioContext!.decodeAudioData(arrayBuffer)
              const processedData = processAudio(audioBuffer)
              console.log('処理後のデータ長:', processedData.length)
              audioBufferRef.current = processedData // ここを変更
              resolve()
            } else {
              console.error('音声チャンクが空です')
              resolve()
            }
          }
        })
      }
      sendAudioBuffer()
    }
  }, [recognition, isListening, mediaRecorder, audioContext])

  const sendAudioBuffer = useCallback(() => {
    if (audioBufferRef.current && audioBufferRef.current.length > 0) {
      const base64Chunk = base64EncodeAudio(audioBufferRef.current)
      const ws = homeStore.getState().ws
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(
          'バッファを送信します。長さ:',
          audioBufferRef.current.length
        )
        ws.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_audio',
                  audio: base64Chunk,
                },
              ],
            },
          })
        )
        // ws.send(
        //   JSON.stringify({
        //     type: 'input_audio_buffer.commit',
        //   })
        // )
        ws.send(
          JSON.stringify({
            type: 'response.create',
          })
        )
      }
      audioBufferRef.current = null // 送信後にバッファをクリア
    } else {
      console.error('音声バッファが空です')
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && !isListening) {
        keyPressStartTime.current = Date.now()
        isKeyboardTriggered.current = true
        startListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.key === 'Meta') {
        stopListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isListening, startListening, stopListening])

  const handleSendMessage = useCallback(() => {
    if (userMessage.trim()) {
      onChatProcessStart(userMessage)
      setUserMessage('')
    }
  }, [userMessage, onChatProcessStart])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setUserMessage(e.target.value)
    },
    []
  )

  return (
    <MessageInput
      userMessage={userMessage}
      isMicRecording={isListening}
      onChangeUserMessage={handleInputChange}
      onClickMicButton={toggleListening}
      onClickSendButton={handleSendMessage}
    />
  )
}

// リサンプリング関数
const resampleAudio = (
  audioData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array => {
  const ratio = fromSampleRate / toSampleRate
  const newLength = Math.round(audioData.length / ratio)
  const result = new Float32Array(newLength)

  for (let i = 0; i < newLength; i++) {
    const position = i * ratio
    const leftIndex = Math.floor(position)
    const rightIndex = Math.ceil(position)
    const fraction = position - leftIndex

    if (rightIndex >= audioData.length) {
      result[i] = audioData[leftIndex]
    } else {
      result[i] =
        (1 - fraction) * audioData[leftIndex] + fraction * audioData[rightIndex]
    }
  }

  return result
}

// リサンプリングとモノラル変換を行う関数
const processAudio = (audioBuffer: AudioBuffer): Float32Array => {
  const targetSampleRate = 24000
  const numChannels = audioBuffer.numberOfChannels

  // モノラルに変換
  let monoData = new Float32Array(audioBuffer.length)
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0
    for (let channel = 0; channel < numChannels; channel++) {
      sum += audioBuffer.getChannelData(channel)[i]
    }
    monoData[i] = sum / numChannels
  }

  // リサンプリング
  return resampleAudio(monoData, audioBuffer.sampleRate, targetSampleRate)
}
