import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { SpeakQueue } from '@/features/messages/speakQueue'
import { LiveSession, type LiveState } from '@/features/live/session'
import { LivePlayback } from '@/features/live/playback'
import { selectLiveHistory } from '@/features/live/history'
import { LiveTranscripts } from '@/features/live/transcripts'
import { TextButton } from './textButton'

export const LiveConversation = () => {
  const { t } = useTranslation()
  const [state, setState] = useState<LiveState>('idle')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [backendBusy, setBackendBusy] = useState(false)
  const session = useRef<LiveSession | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const mounted = useRef(false)
  const playbackRef = useRef<LivePlayback | null>(null)
  useEffect(() => {
    mounted.current = true
    const close = () => {
      playbackRef.current?.close()
      session.current?.close()
    }
    window.addEventListener('pagehide', close)
    return () => {
      mounted.current = false
      window.removeEventListener('pagehide', close)
      close()
    }
  }, [])

  const start = () => {
    if (
      !audio.current ||
      ['connecting', 'connected', 'closing'].includes(state)
    )
      return
    setError('')
    setSeconds(0)
    setBackendBusy(false)
    SpeakQueue.stopAll()
    let playback: LivePlayback
    try {
      playback = new LivePlayback(audio.current)
      playbackRef.current = playback
    } catch {
      setError('Live.ConnectionError')
      return
    }
    const captions = new LiveTranscripts(crypto.randomUUID())
    const connection = new LiveSession({
      state: (next, message) => {
        if (!mounted.current) return
        setState(next)
        if (message) setError(message)
      },
      stream: (stream) => {
        void playback.attach(stream).catch(() => {
          if (mounted.current) setError('Live.PlaybackBlocked')
        })
      },
      cleanup: () => playback.close(),
      event: (event) => {
        if (!mounted.current) return
        const row = captions.append(event)
        if (row) {
          homeStore.getState().upsertMessage({
            id: row.id,
            role: row.role,
            content: row.content,
            liveTranscript: row.fragments,
          })
          if (row.role === 'assistant')
            homeStore.setState({
              activeSpeech: { id: row.id, text: row.content },
            })
        }
        if (!mounted.current) return
        if (typeof event.usage?.seconds === 'number')
          setSeconds(event.usage.seconds)
        if (event.type === 'response.event' && event.event?.type) {
          if (event.event.type === 'response.created') setBackendBusy(true)
          if (
            [
              'response.completed',
              'response.failed',
              'response.incomplete',
              'response.cancelled',
            ].includes(event.event.type)
          ) {
            setBackendBusy(false)
            if (event.event.type !== 'response.completed')
              setError('Live.BackendError')
          }
        }
      },
    })
    session.current = connection
    const settings = settingsStore.getState()
    const history = selectLiveHistory(
      homeStore.getState().chatLog,
      settings.maxPastMessages
    )
    void connection.start({
      apiKey: settings.openaiKey,
      voice: settings.liveVoice,
      backendModel: settings.liveBackendModel,
      webSearch: settings.liveWebSearch,
      instructions: settings.systemPrompt,
      language: settings.selectLanguage,
      history,
    })
  }

  const active = ['connecting', 'connected'].includes(state)
  return (
    <div
      className="absolute bottom-0 z-20 w-screen"
      data-testid="live-conversation"
    >
      <div className="mx-auto w-full max-w-[680px] px-3 pb-2 pt-2 sm:pb-6">
        {error && (
          <div
            role="alert"
            className="theme-surface-elevated mb-2 rounded-2xl border p-3 text-sm text-theme-default"
          >
            {t(error)}
            {error === 'Live.PlaybackBlocked' && (
              <TextButton
                type="button"
                className="ml-2"
                onClick={() => {
                  void audio.current
                    ?.play()
                    .then(() => setError(''))
                    .catch(() => setError('Live.PlaybackBlocked'))
                }}
              >
                {t('Live.Playback')}
              </TextButton>
            )}
          </div>
        )}
        <div className="aurora-glass-capsule flex items-center gap-2 rounded-[31px] p-2 pl-4 text-theme-default">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold">GPT-Live-1</p>
            <p role="status" className="text-sm">
              {backendBusy && state === 'connected'
                ? t('Live.BackendBusy')
                : t(`Live.State.${state}`)}
              {seconds > 0 && ` · ${Math.ceil(seconds)}s`}
            </p>
          </div>
          <TextButton
            type="button"
            className="shrink-0 text-sm"
            onClick={active ? () => session.current?.close() : start}
            disabled={state === 'closing'}
          >
            {t(active ? 'Live.Stop' : 'Live.Start')}
          </TextButton>
        </div>
        <audio ref={audio} autoPlay aria-label={t('Live.Playback')} />
      </div>
    </div>
  )
}
