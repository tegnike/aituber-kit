import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EMOTIONS } from '@/features/messages/messages'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { messageSelectors } from '@/features/messages/messageSelectors'
import layoutStore from '@/features/stores/layout'

export const CurrentThreadOverlay = () => {
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const layoutMode = layoutStore((s) => s.layoutMode)
  const characterName = settingsStore((s) => s.characterName)
  const userDisplayName = settingsStore((s) => s.userDisplayName)
  const messages = messageSelectors.getTextAndImageMessages(
    homeStore((s) => s.chatLog)
  )
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [isCompactLayout, setIsCompactLayout] = useState(false)
  const [isDedicatedMobileWindow, setIsDedicatedMobileWindow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDedicatedMobileWindow(
      new URLSearchParams(window.location.search).get('layout') ===
        'mobile-window'
    )
  }, [])

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    setIsCompactLayout(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsCompactLayout(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages])

  if (messages.length === 0) return null

  const isMobileLayout =
    isDedicatedMobileWindow ||
    layoutMode === 'mobile' ||
    (layoutMode === 'auto' && isCompactLayout)
  const left = isMobileLayout ? 12 : chatLogWidth + 16
  const width = isMobileLayout
    ? 'calc(100vw - 24px)'
    : `min(420px, calc(100vw - ${chatLogWidth + 32}px))`

  return (
    <div
      className="fixed z-15"
      style={{
        left: `${left}px`,
        top: isMobileLayout ? '84px' : '110px',
        bottom: '130px',
        width,
        backgroundColor: 'transparent',
      }}
    >
      <div className="h-full overflow-y-auto pr-2 scroll-hidden">
        {messages.map((msg, i) => {
          const isLast = messages.length - 1 === i
          return (
            <div key={i} ref={isLast ? chatScrollRef : null} className="mb-3">
              {typeof msg.content === 'string' ? (
                <ThreadBubble
                  role={msg.role}
                  message={msg.content}
                  thinking={msg.thinking}
                  characterName={characterName}
                  userName={msg.userName}
                  userDisplayName={userDisplayName}
                />
              ) : (
                <>
                  <ThreadBubble
                    role={msg.role}
                    message={msg.content ? msg.content[0].text : ''}
                    thinking={msg.thinking}
                    characterName={characterName}
                    userName={msg.userName}
                    userDisplayName={userDisplayName}
                  />
                  <ThreadImage
                    role={msg.role}
                    imageUrl={msg.content ? msg.content[1].image : ''}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ThreadBubble = ({
  role,
  message,
  thinking,
  characterName,
  userName,
  userDisplayName,
}: {
  role: string
  message: string
  thinking?: string
  characterName: string
  userName?: string
  userDisplayName: string
}) => {
  const { t } = useTranslation()
  const showThinkingText = settingsStore((s) => s.showThinkingText)
  const [isLocalExpanded, setIsLocalExpanded] = useState(false)
  const isThinkingExpanded = showThinkingText || isLocalExpanded
  const emotionPattern = new RegExp(`\\[(${EMOTIONS.join('|')})\\]\\s*`, 'gi')
  const processedMessage = message
    .replace(emotionPattern, '')
    .replace(/\[motion:[^\]]*\]\s*/gi, '')

  const isUser = role === 'user'
  const isCode = role === 'code'
  const roleLabel = isUser
    ? userName || userDisplayName || 'YOU'
    : characterName || 'CHARACTER'

  return (
    <div className="rounded-2xl border border-white/30 bg-black/20 p-3 text-white shadow-sm backdrop-blur-[2px]">
      {isCode ? (
        <pre className="whitespace-pre-wrap break-words rounded-xl border border-white/20 bg-black/35 p-3 text-xs text-white">
          <code className="font-mono">{message}</code>
        </pre>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              {roleLabel}
            </div>
            <div className="rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white">
              {isUser ? 'You' : 'Assistant'}
            </div>
          </div>

          <div className="mt-2 text-sm leading-6 text-white">
            {thinking && !isUser && (
              <div className="mb-3">
                <button
                  onClick={() => setIsLocalExpanded(!isLocalExpanded)}
                  className="flex items-center gap-1 text-xs text-white/75 transition-colors hover:text-white"
                >
                  <span
                    className={`inline-block transform transition-transform ${isThinkingExpanded ? 'rotate-90' : ''}`}
                  >
                    &#9654;
                  </span>
                  <span>{t('ThinkingProcess')}</span>
                </button>
                {isThinkingExpanded && (
                  <div className="mt-2 rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-xs italic whitespace-pre-wrap text-white/80">
                    {thinking}
                  </div>
                )}
              </div>
            )}
            <div className="whitespace-pre-wrap break-words">
              {processedMessage}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const ThreadImage = ({
  role,
  imageUrl,
}: {
  role: string
  imageUrl: string
}) => {
  const offsetX = role === 'user' ? 'pl-8' : 'pr-8'

  return (
    <div className={`mt-3 ${offsetX}`}>
      <Image
        src={imageUrl}
        alt="Generated Image"
        className="rounded-xl border border-white/30"
        width={512}
        height={512}
      />
    </div>
  )
}
