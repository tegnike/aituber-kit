import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EMOTIONS } from '@/features/messages/messages'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { messageSelectors } from '@/features/messages/messageSelectors'

export const ChatLog = () => {
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const chatLogRef = useRef<HTMLDivElement>(null)

  const characterName = settingsStore((s) => s.characterName)
  const userDisplayName = settingsStore((s) => s.userDisplayName)
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const messages = messageSelectors.getTextAndImageMessages(
    homeStore((s) => s.chatLog)
  )

  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isResizeHandleHovered, setIsResizeHandleHovered] =
    useState<boolean>(false)

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'center',
    })
  }, [])

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [messages])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      window.getSelection()?.removeAllRanges()
      setIsDragging(true)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      window.getSelection()?.removeAllRanges()

      const newWidth = e.clientX

      const constrainedWidth = Math.max(
        300,
        Math.min(newWidth, window.innerWidth * 0.8)
      )

      settingsStore.setState({ chatLogWidth: constrainedWidth })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const previousUserSelect = document.body.style.userSelect
    if (isDragging) {
      document.body.style.userSelect = 'none'
    }

    const resizeHandle = resizeHandleRef.current
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener('mousedown', handleMouseDown)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = previousUserSelect
    }
  }, [isDragging])

  return (
    <div
      ref={chatLogRef}
      className="absolute z-10 h-[100svh] max-w-full pb-16"
      style={{ width: `${chatLogWidth}px` }}
    >
      <div className="scroll-hidden max-h-full overflow-y-auto px-2 pb-16 pt-24 sm:px-4">
        {messages.map((msg, i) => {
          return (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              {typeof msg.content === 'string' ? (
                <Chat
                  index={i}
                  role={msg.role}
                  message={msg.content}
                  thinking={msg.thinking}
                  characterName={characterName}
                  userName={msg.userName}
                  userDisplayName={userDisplayName}
                />
              ) : (
                <>
                  <Chat
                    index={i}
                    role={msg.role}
                    message={msg.content ? msg.content[0].text : ''}
                    thinking={msg.thinking}
                    characterName={characterName}
                    userName={msg.userName}
                    userDisplayName={userDisplayName}
                  />
                  <ChatImage
                    role={msg.role}
                    imageUrl={msg.content ? msg.content[1].image : ''}
                    characterName={characterName}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
      <div
        ref={resizeHandleRef}
        className="absolute right-0 top-0 h-full w-5 cursor-ew-resize select-none"
        style={{
          cursor: isDragging ? 'grabbing' : 'ew-resize',
          userSelect: 'none',
        }}
        onMouseEnter={() => setIsResizeHandleHovered(true)}
        onMouseLeave={() => setIsResizeHandleHovered(false)}
      >
        <div
          className={`absolute right-0.5 top-1/2 h-24 w-1.5 -translate-y-1/2 rounded-full transition-opacity ${
            isDragging || isResizeHandleHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--color-primary) 70%, transparent)',
          }}
        ></div>
      </div>
    </div>
  )
}

const Chat = ({
  index,
  role,
  message,
  thinking,
  characterName,
  userName,
  userDisplayName,
}: {
  index: number
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
  const roleBadge = isUser
    ? 'bg-primary/10 text-primary'
    : 'bg-secondary/10 text-secondary'
  const roleText = isUser ? 'text-primary' : 'text-secondary'
  const offsetX = role === 'user' ? 'pl-4 sm:pl-10' : 'pr-4 sm:pr-10'

  return (
    <div
      className={`mx-auto my-3 ml-0 md:ml-10 lg:ml-20 ${offsetX}`}
      data-testid={`chat-message-${role}`}
      data-message-index={index}
    >
      {role === 'code' ? (
        <pre className="theme-surface-contrast whitespace-pre-wrap break-words rounded-xl border border-primary/20 p-4 shadow-md">
          <code className="font-mono text-xs sm:text-sm">{message}</code>
        </pre>
      ) : (
        <div className="theme-surface-popover rounded-xl border border-primary/20 px-3 py-3 text-sm shadow-md backdrop-blur-md sm:px-4 sm:text-base">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-bold ${roleBadge}`}
            >
              <span className="truncate">
                {role !== 'user'
                  ? characterName || 'CHARACTER'
                  : userName || userDisplayName || 'YOU'}
              </span>
            </span>
          </div>
          {thinking && role !== 'user' && (
            <div className="mb-3">
              <button
                onClick={() => setIsLocalExpanded(!isLocalExpanded)}
                className="flex items-center gap-1 text-xs text-text-primary transition-colors hover:text-primary"
              >
                <span
                  className={`inline-block transform transition-transform ${isThinkingExpanded ? 'rotate-90' : ''}`}
                >
                  &#9654;
                </span>
                <span>{t('ThinkingProcess')}</span>
              </button>
              {isThinkingExpanded && (
                <div className="theme-surface-soft mt-2 whitespace-pre-wrap rounded border border-l-2 border-l-primary px-3 py-2 text-xs italic text-theme-default">
                  {thinking}
                </div>
              )}
            </div>
          )}
          <div className={`font-bold leading-relaxed ${roleText}`}>
            {processedMessage}
          </div>
        </div>
      )}
    </div>
  )
}

const ChatImage = ({
  role,
  imageUrl,
  characterName,
}: {
  role: string
  imageUrl: string
  characterName: string
}) => {
  const offsetX = role === 'user' ? 'pl-16 sm:pl-40' : 'pr-16 sm:pr-40'

  return (
    <div className={`mx-auto my-3 ml-0 md:ml-10 lg:ml-20 ${offsetX}`}>
      <Image
        src={imageUrl}
        alt="Generated Image"
        className="rounded-xl border border-primary/20 shadow-md"
        width={512}
        height={512}
      />
    </div>
  )
}
