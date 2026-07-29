import { logger } from '@/lib/logger'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import homeStore from '@/features/stores/home'
import { SpeakQueue } from '@/features/messages/speakQueue'

const LIVE_TRANSCRIPTION_MODEL = 'gpt-live-transcribe'
const CONNECTION_TIMEOUT_MS = 10000
const TRANSCRIPTION_TIMEOUT_MS = 15000

type LiveTranscriptionEvent = {
  type?: string
  item_id?: string
  delta?: string
  transcript?: string
  error?: { message?: string }
}

const normalizeLanguage = (language: string) => language.trim().toLowerCase()

/**
 * gpt-live-transcribeをWebRTCで使用する音声認識フック。
 * 発話中はdeltaを入力欄へ反映し、手動停止またはクライアント側の
 * 無音タイムアウトで確定結果をチャットへ送信する。
 */
export function useLiveTranscription(
  onChatProcessStart: (text: string) => void
) {
  const { t } = useTranslation()
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const initialSpeechTimeout = settingsStore((s) => s.initialSpeechTimeout)
  const noSpeechTimeout = settingsStore((s) => s.noSpeechTimeout)

  const [userMessage, setUserMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [silenceTimeoutRemaining, setSilenceTimeoutRemaining] = useState<
    number | null
  >(null)

  const isListeningRef = useRef(false)
  const isStartingRef = useRef(false)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const partialTranscriptsRef = useRef(new Map<string, string>())
  const pendingCompletionRef = useRef<((transcript: string) => void) | null>(
    null
  )
  const initialSpeechTimerRef = useRef<number | null>(null)
  const silenceProgressTimerRef = useRef<number | null>(null)
  const lastTranscriptActivityRef = useRef(0)
  const speechDetectedRef = useRef(false)
  const isFinishingRef = useRef(false)
  const stopListeningRef = useRef<() => Promise<void>>(async () => undefined)

  const addErrorToast = useCallback(() => {
    toastStore.getState().addToast({
      message: t('Toasts.LiveTranscriptionError'),
      type: 'error',
      tag: 'live-transcription-error',
    })
  }, [t])

  const clearInitialSpeechTimer = useCallback(() => {
    if (initialSpeechTimerRef.current !== null) {
      window.clearTimeout(initialSpeechTimerRef.current)
      initialSpeechTimerRef.current = null
    }
  }, [])

  const clearSilenceProgress = useCallback(() => {
    if (silenceProgressTimerRef.current !== null) {
      window.clearInterval(silenceProgressTimerRef.current)
      silenceProgressTimerRef.current = null
    }
    setSilenceTimeoutRemaining(null)
  }, [])

  const cleanupConnection = useCallback(() => {
    clearInitialSpeechTimer()
    clearSilenceProgress()
    pendingCompletionRef.current?.('')
    pendingCompletionRef.current = null

    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close()
      } catch (error) {
        logger.error('Failed to close live transcription data channel:', error)
      }
      dataChannelRef.current = null
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close()
      } catch (error) {
        logger.error('Failed to close live transcription connection:', error)
      }
      peerConnectionRef.current = null
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    partialTranscriptsRef.current.clear()
    speechDetectedRef.current = false
    lastTranscriptActivityRef.current = 0
  }, [clearInitialSpeechTimer, clearSilenceProgress])

  const setupInitialSpeechTimer = useCallback(() => {
    clearInitialSpeechTimer()
    if (initialSpeechTimeout <= 0) return

    initialSpeechTimerRef.current = window.setTimeout(() => {
      if (!isListeningRef.current || speechDetectedRef.current) return

      logger.log(
        `OpenAI live transcription stopped after ${initialSpeechTimeout} seconds without speech`
      )
      isListeningRef.current = false
      setIsListening(false)
      cleanupConnection()
      toastStore.getState().addToast({
        message: t('Toasts.NoSpeechDetected'),
        type: 'info',
        tag: 'live-transcription-no-speech-detected',
      })
    }, initialSpeechTimeout * 1000)
  }, [clearInitialSpeechTimer, cleanupConnection, initialSpeechTimeout, t])

  const markTranscriptActivity = useCallback(() => {
    speechDetectedRef.current = true
    clearInitialSpeechTimer()
    lastTranscriptActivityRef.current = Date.now()

    if (noSpeechTimeout <= 0) {
      setSilenceTimeoutRemaining(null)
      return
    }

    if (noSpeechTimeout > 1) {
      setSilenceTimeoutRemaining(noSpeechTimeout * 1000)
    }
    if (silenceProgressTimerRef.current !== null) return

    silenceProgressTimerRef.current = window.setInterval(() => {
      if (!isListeningRef.current || !speechDetectedRef.current) return
      const remainingTime = Math.max(
        0,
        noSpeechTimeout * 1000 -
          (Date.now() - lastTranscriptActivityRef.current)
      )

      if (noSpeechTimeout > 1) {
        setSilenceTimeoutRemaining(remainingTime)
      }

      if (remainingTime === 0 && !isFinishingRef.current) {
        window.clearInterval(silenceProgressTimerRef.current ?? undefined)
        silenceProgressTimerRef.current = null
        setSilenceTimeoutRemaining(null)
        void stopListeningRef.current()
      }
    }, 100)
  }, [clearInitialSpeechTimer, noSpeechTimeout])

  const handleServerEvent = useCallback(
    (event: MessageEvent<string>) => {
      let data: LiveTranscriptionEvent
      try {
        data = JSON.parse(event.data) as LiveTranscriptionEvent
      } catch (error) {
        logger.error('Failed to parse live transcription event:', error)
        return
      }

      if (
        data.type === 'conversation.item.input_audio_transcription.delta' &&
        data.delta
      ) {
        const itemId = data.item_id || 'current'
        const transcript =
          (partialTranscriptsRef.current.get(itemId) || '') + data.delta
        partialTranscriptsRef.current.set(itemId, transcript)
        setUserMessage(transcript)
        markTranscriptActivity()
        return
      }

      if (
        data.type === 'conversation.item.input_audio_transcription.completed'
      ) {
        const transcript = data.transcript?.trim() || ''
        const itemId = data.item_id || 'current'
        partialTranscriptsRef.current.delete(itemId)
        clearInitialSpeechTimer()
        clearSilenceProgress()
        setUserMessage(transcript)
        if (pendingCompletionRef.current) {
          pendingCompletionRef.current(transcript)
          pendingCompletionRef.current = null
        }
        return
      }

      if (data.type === 'error') {
        logger.error(
          'OpenAI live transcription error:',
          data.error?.message || data
        )
        pendingCompletionRef.current?.('')
        pendingCompletionRef.current = null
        isListeningRef.current = false
        setIsListening(false)
        setIsProcessing(false)
        cleanupConnection()
        addErrorToast()
      }
    },
    [
      addErrorToast,
      cleanupConnection,
      clearInitialSpeechTimer,
      clearSilenceProgress,
      markTranscriptActivity,
    ]
  )

  const waitForDataChannel = useCallback(
    (dataChannel: RTCDataChannel) =>
      new Promise<void>((resolve, reject) => {
        if (dataChannel.readyState === 'open') {
          resolve()
          return
        }

        const timeoutId = window.setTimeout(() => {
          cleanup()
          reject(new Error('Live transcription data channel timed out'))
        }, CONNECTION_TIMEOUT_MS)

        const handleOpen = () => {
          cleanup()
          resolve()
        }
        const handleError = () => {
          cleanup()
          reject(new Error('Live transcription data channel failed'))
        }
        const cleanup = () => {
          window.clearTimeout(timeoutId)
          dataChannel.removeEventListener('open', handleOpen)
          dataChannel.removeEventListener('error', handleError)
        }

        dataChannel.addEventListener('open', handleOpen)
        dataChannel.addEventListener('error', handleError)
      }),
    []
  )

  const startListening = useCallback(async () => {
    if (isStartingRef.current || isListeningRef.current) return
    isStartingRef.current = true

    cleanupConnection()
    setUserMessage('')
    partialTranscriptsRef.current.clear()
    speechDetectedRef.current = false

    try {
      const settings = settingsStore.getState()
      const clientSecretPromise = (async () => {
        const tokenResponse = await fetch('/api/ai/realtime-client-secret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: settings.openaiKey,
            model: LIVE_TRANSCRIPTION_MODEL,
            sessionType: 'transcription',
            languages: selectLanguage
              ? [normalizeLanguage(selectLanguage)]
              : undefined,
          }),
        })
        const tokenData = (await tokenResponse.json().catch(() => ({}))) as {
          value?: string
          error?: string
        }
        if (!tokenResponse.ok || !tokenData.value) {
          throw new Error(
            tokenData.error ||
              'Failed to create live transcription client secret'
          )
        }
        return tokenData.value
      })()
      const mediaStreamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      const [clientSecretResult, mediaStreamResult] = await Promise.allSettled([
        clientSecretPromise,
        mediaStreamPromise,
      ])
      if (clientSecretResult.status === 'rejected') {
        if (mediaStreamResult.status === 'fulfilled') {
          mediaStreamResult.value.getTracks().forEach((track) => track.stop())
        }
        throw clientSecretResult.reason
      }
      if (mediaStreamResult.status === 'rejected') {
        throw mediaStreamResult.reason
      }

      const clientSecret = clientSecretResult.value
      const mediaStream = mediaStreamResult.value

      const peerConnection = new RTCPeerConnection()
      const dataChannel = peerConnection.createDataChannel('oai-events')

      peerConnectionRef.current = peerConnection
      dataChannelRef.current = dataChannel
      mediaStreamRef.current = mediaStream
      dataChannel.addEventListener('message', handleServerEvent)

      const audioTrack = mediaStream.getAudioTracks()[0]
      if (!audioTrack) {
        throw new Error('Microphone did not provide an audio track')
      }
      peerConnection.addTrack(audioTrack, mediaStream)

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      if (!offer.sdp) {
        throw new Error('Failed to create live transcription SDP offer')
      }

      const sdpResponse = await fetch(
        'https://api.openai.com/v1/realtime/calls',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      )
      if (!sdpResponse.ok) {
        const details = await sdpResponse.text()
        throw new Error(
          details || `Live transcription SDP failed: ${sdpResponse.status}`
        )
      }

      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: await sdpResponse.text(),
      })
      await waitForDataChannel(dataChannel)

      isListeningRef.current = true
      setIsListening(true)
      setupInitialSpeechTimer()
    } catch (error) {
      logger.error('Failed to start OpenAI live transcription:', error)
      cleanupConnection()
      addErrorToast()
    } finally {
      isStartingRef.current = false
    }
  }, [
    addErrorToast,
    cleanupConnection,
    handleServerEvent,
    selectLanguage,
    setupInitialSpeechTimer,
    waitForDataChannel,
  ])

  const stopListening = useCallback(async () => {
    if (!isListeningRef.current || isFinishingRef.current) return

    isFinishingRef.current = true
    isListeningRef.current = false
    setIsListening(false)
    setIsProcessing(true)

    const dataChannel = dataChannelRef.current
    mediaStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = false))

    try {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        throw new Error('Live transcription data channel is not open')
      }

      const transcriptPromise = new Promise<string>((resolve) => {
        pendingCompletionRef.current = resolve
      })
      dataChannel.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))

      const transcript = await Promise.race([
        transcriptPromise,
        new Promise<string>((resolve) =>
          window.setTimeout(() => resolve(''), TRANSCRIPTION_TIMEOUT_MS)
        ),
      ])

      if (transcript) {
        onChatProcessStart(transcript)
      } else {
        toastStore.getState().addToast({
          message: t('Toasts.NoSpeechDetected'),
          type: 'info',
          tag: 'no-speech-detected',
        })
      }
    } catch (error) {
      logger.error('Failed to finish OpenAI live transcription:', error)
      addErrorToast()
    } finally {
      cleanupConnection()
      setUserMessage('')
      setIsProcessing(false)
      isFinishingRef.current = false
    }
  }, [addErrorToast, cleanupConnection, onChatProcessStart, t])

  useEffect(() => {
    stopListeningRef.current = stopListening
  }, [stopListening])

  const toggleListening = useCallback(async () => {
    if (isListeningRef.current) {
      await stopListening()
      return
    }

    homeStore.setState({ isSpeaking: false })
    SpeakQueue.stopAll()
    await startListening()
  }, [startListening, stopListening])

  const handleSendMessage = useCallback(() => {
    const message = userMessage.trim()
    if (!message || isListeningRef.current) return

    homeStore.setState({ isSpeaking: false })
    SpeakQueue.stopAll()
    onChatProcessStart(message)
    setUserMessage('')
  }, [onChatProcessStart, userMessage])

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setUserMessage(event.target.value)
    },
    []
  )

  useEffect(
    () => () => {
      isListeningRef.current = false
      cleanupConnection()
    },
    [cleanupConnection]
  )

  return useMemo(
    () => ({
      userMessage,
      isListening,
      isProcessing,
      silenceTimeoutRemaining,
      handleInputChange,
      handleSendMessage,
      toggleListening,
      startListening,
      stopListening,
      checkRecognitionActive: () =>
        peerConnectionRef.current?.connectionState === 'connected',
    }),
    [
      userMessage,
      isListening,
      isProcessing,
      silenceTimeoutRemaining,
      handleInputChange,
      handleSendMessage,
      toggleListening,
      startListening,
      stopListening,
    ]
  )
}
