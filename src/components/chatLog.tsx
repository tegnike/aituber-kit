import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EMOTIONS } from '@/features/messages/messages'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { messageSelectors } from '@/features/messages/messageSelectors'

const useAutoScrollRef = (dependency: unknown) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'center',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [dependency])

  return scrollRef
}

type ResizeEdge = 'inner' | 'outer'

const useChatLogResize = (
  isRightAligned: boolean,
  panelRef: React.RefObject<HTMLDivElement>
) => {
  const innerHandleRef = useRef<HTMLDivElement>(null)
  const outerHandleRef = useRef<HTMLDivElement>(null)
  const [draggingEdge, setDraggingEdge] = useState<ResizeEdge | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<ResizeEdge | null>(null)

  useEffect(() => {
    const startDrag = (edge: ResizeEdge) => (e: MouseEvent) => {
      e.preventDefault()
      window.getSelection()?.removeAllRanges()
      setDraggingEdge(edge)
    }
    const handleInnerMouseDown = startDrag('inner')
    const handleOuterMouseDown = startDrag('outer')

    // 画面端からパネル外縁までの現在距離。実測できない環境では保存値にフォールバック
    const getEdgeOffset = () => {
      const rect = panelRef.current?.getBoundingClientRect()
      if (rect && rect.width > 0) {
        return Math.max(
          0,
          isRightAligned ? window.innerWidth - rect.right : rect.left
        )
      }
      return settingsStore.getState().chatLogEdgeOffset ?? 0
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingEdge) return
      e.preventDefault()
      window.getSelection()?.removeAllRanges()

      const pointerFromEdge = isRightAligned
        ? window.innerWidth - e.clientX
        : e.clientX

      if (draggingEdge === 'inner') {
        // 内側の縁をドラッグ: 外縁は固定したまま幅を変える
        const constrainedWidth = Math.max(
          300,
          Math.min(pointerFromEdge - getEdgeOffset(), window.innerWidth * 0.8)
        )
        settingsStore.setState({ chatLogWidth: constrainedWidth })
      } else {
        // 外側の縁をドラッグ: 内縁は固定したまま画面端との距離と幅を変える
        const innerEdge =
          getEdgeOffset() + settingsStore.getState().chatLogWidth
        const newOffset = Math.min(
          Math.max(0, pointerFromEdge),
          Math.max(0, innerEdge - 300)
        )
        settingsStore.setState({
          chatLogEdgeOffset: newOffset,
          chatLogWidth: innerEdge - newOffset,
        })
      }
    }

    const handleMouseUp = () => {
      setDraggingEdge(null)
    }

    const previousUserSelect = document.body.style.userSelect
    if (draggingEdge) {
      document.body.style.userSelect = 'none'
    }

    const innerHandle = innerHandleRef.current
    const outerHandle = outerHandleRef.current
    innerHandle?.addEventListener('mousedown', handleInnerMouseDown)
    outerHandle?.addEventListener('mousedown', handleOuterMouseDown)
    if (innerHandle || outerHandle) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      innerHandle?.removeEventListener('mousedown', handleInnerMouseDown)
      outerHandle?.removeEventListener('mousedown', handleOuterMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = previousUserSelect
    }
  }, [draggingEdge, isRightAligned, panelRef])

  return {
    innerHandleRef,
    outerHandleRef,
    draggingEdge,
    hoveredEdge,
    setHoveredEdge,
  }
}

const ResizeHandle = ({
  handleRef,
  edge,
  isDragging,
  isHovered,
  onHoverChange,
  isRightAligned,
}: {
  handleRef: React.RefObject<HTMLDivElement>
  edge: ResizeEdge
  isDragging: boolean
  isHovered: boolean
  onHoverChange: (hovered: boolean) => void
  isRightAligned: boolean
}) => {
  // 内側ハンドルはパネルの画面中央側、外側ハンドルは画面端側に配置
  const isLeftSide = edge === 'inner' ? isRightAligned : !isRightAligned

  return (
    <div
      ref={handleRef}
      className={`absolute top-0 h-full w-5 cursor-ew-resize select-none ${isLeftSide ? 'left-0' : 'right-0'}`}
      style={{
        cursor: isDragging ? 'grabbing' : 'ew-resize',
        userSelect: 'none',
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div
        className={`absolute top-1/2 h-24 w-1.5 -translate-y-1/2 rounded-full transition-opacity ${isLeftSide ? 'left-0.5' : 'right-0.5'} ${
          isDragging || isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--color-primary) 70%, transparent)',
        }}
      ></div>
    </div>
  )
}

const ResizeHandles = ({
  innerHandleRef,
  outerHandleRef,
  draggingEdge,
  hoveredEdge,
  setHoveredEdge,
  isRightAligned,
}: {
  innerHandleRef: React.RefObject<HTMLDivElement>
  outerHandleRef: React.RefObject<HTMLDivElement>
  draggingEdge: ResizeEdge | null
  hoveredEdge: ResizeEdge | null
  setHoveredEdge: (edge: ResizeEdge | null) => void
  isRightAligned: boolean
}) => (
  <>
    <ResizeHandle
      handleRef={innerHandleRef}
      edge="inner"
      isDragging={draggingEdge === 'inner'}
      isHovered={hoveredEdge === 'inner'}
      onHoverChange={(hovered) => setHoveredEdge(hovered ? 'inner' : null)}
      isRightAligned={isRightAligned}
    />
    <ResizeHandle
      handleRef={outerHandleRef}
      edge="outer"
      isDragging={draggingEdge === 'outer'}
      isHovered={hoveredEdge === 'outer'}
      onHoverChange={(hovered) => setHoveredEdge(hovered ? 'outer' : null)}
      isRightAligned={isRightAligned}
    />
  </>
)

export const ChatLog = () => {
  const chatLogStyle = settingsStore((s) => s.chatLogStyle)
  return chatLogStyle === 'classic' ? <ClassicChatLog /> : <GlassChatLog />
}

const GlassChatLog = () => {
  const { t } = useTranslation()
  const chatLogRef = useRef<HTMLDivElement>(null)

  const characterName = settingsStore((s) => s.characterName)
  const userDisplayName = settingsStore((s) => s.userDisplayName)
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const chatLogPosition = settingsStore((s) => s.chatLogPosition)
  const chatLogEdgeOffset = settingsStore((s) => s.chatLogEdgeOffset)
  const chatProcessing = homeStore((s) => s.chatProcessing)
  const chatLog = homeStore((s) => s.chatLog)
  const messages = useMemo(
    () => messageSelectors.getTextAndImageMessages(chatLog),
    [chatLog]
  )

  const isRightAligned = chatLogPosition === 'right'
  const chatScrollRef = useAutoScrollRef(messages)
  const {
    innerHandleRef,
    outerHandleRef,
    draggingEdge,
    hoveredEdge,
    setHoveredEdge,
  } = useChatLogResize(isRightAligned, chatLogRef)

  const defaultOffsetClasses = isRightAligned
    ? 'right-2 sm:right-4 md:right-9 lg:right-14'
    : 'left-2 sm:left-4 md:left-14 lg:left-24'

  return (
    <div
      ref={chatLogRef}
      className={`aurora-glass-panel absolute bottom-[128px] top-[94px] z-10 flex max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-[22px] ${chatLogEdgeOffset == null ? defaultOffsetClasses : ''}`}
      style={{
        width: `${chatLogWidth}px`,
        ...(chatLogEdgeOffset != null
          ? isRightAligned
            ? { right: `${chatLogEdgeOffset}px` }
            : { left: `${chatLogEdgeOffset}px` }
          : {}),
      }}
    >
      <div className="border-b border-black/5 px-[18px] pb-2.5 pt-3.5 text-[13px] font-bold text-[var(--aurora-text-soft)]">
        {t('ChatLog')}
      </div>
      <div className="scroll-hidden flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5">
        {messages.map((msg, i) => {
          return (
            <div
              key={i}
              ref={messages.length - 1 === i ? chatScrollRef : null}
              className="flex flex-col gap-2.5"
            >
              {typeof msg.content === 'string' ? (
                <GlassChat
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
                  <GlassChat
                    index={i}
                    role={msg.role}
                    message={msg.content ? msg.content[0].text : ''}
                    thinking={msg.thinking}
                    characterName={characterName}
                    userName={msg.userName}
                    userDisplayName={userDisplayName}
                  />
                  <GlassChatImage
                    role={msg.role}
                    imageUrl={msg.content ? msg.content[1].image : ''}
                    characterName={characterName}
                  />
                </>
              )}
            </div>
          )
        })}
        {chatProcessing && (
          <div className="flex gap-1 self-start rounded-[16px_16px_16px_4px] bg-white/80 px-[15px] py-[11px]">
            <span className="block h-1.5 w-1.5 animate-[aurora-dot-blink_1.2s_infinite] rounded-full bg-[var(--aurora-text-muted)]"></span>
            <span className="block h-1.5 w-1.5 animate-[aurora-dot-blink_1.2s_0.2s_infinite] rounded-full bg-[var(--aurora-text-muted)]"></span>
            <span className="block h-1.5 w-1.5 animate-[aurora-dot-blink_1.2s_0.4s_infinite] rounded-full bg-[var(--aurora-text-muted)]"></span>
          </div>
        )}
      </div>
      <ResizeHandles
        innerHandleRef={innerHandleRef}
        outerHandleRef={outerHandleRef}
        draggingEdge={draggingEdge}
        hoveredEdge={hoveredEdge}
        setHoveredEdge={setHoveredEdge}
        isRightAligned={isRightAligned}
      />
    </div>
  )
}

const GlassChat = ({
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
  const senderName = isUser
    ? userName || userDisplayName
    : characterName || 'CHARACTER'

  if (role === 'code') {
    return (
      <pre
        className="theme-surface-contrast animate-aurora-bubble-in self-stretch whitespace-pre-wrap break-words rounded-2xl p-4"
        data-testid={`chat-message-${role}`}
        data-message-index={index}
      >
        <code className="font-mono text-xs">{message}</code>
      </pre>
    )
  }

  return (
    <div
      className={`animate-aurora-bubble-in flex max-w-[85%] flex-col gap-1 ${isUser ? 'items-end self-end' : 'items-start self-start'}`}
      data-testid={`chat-message-${role}`}
      data-message-index={index}
    >
      {senderName && (
        <span className="max-w-full truncate px-1.5 text-[10px] font-bold text-[var(--aurora-text-subtle)]">
          {senderName}
        </span>
      )}
      <div
        className={`w-fit max-w-full px-3.5 py-[9px] text-[13px] leading-[1.6] ${
          isUser
            ? 'rounded-[16px_16px_4px_16px] bg-primary text-white'
            : 'rounded-[16px_16px_16px_4px] bg-white/80 text-[var(--aurora-text-medium)]'
        }`}
      >
        {thinking && !isUser && (
          <div className="mb-2">
            <button
              onClick={() => setIsLocalExpanded(!isLocalExpanded)}
              className="flex items-center gap-1 text-xs text-[var(--aurora-text-subtle)] transition-colors hover:text-primary"
            >
              <span
                className={`inline-block transform transition-transform ${isThinkingExpanded ? 'rotate-90' : ''}`}
              >
                &#9654;
              </span>
              <span>{t('ThinkingProcess')}</span>
            </button>
            {isThinkingExpanded && (
              <div className="mt-2 whitespace-pre-wrap rounded border-l-2 border-l-primary bg-white/60 px-3 py-2 text-xs italic text-[var(--aurora-text-subtle)]">
                {thinking}
              </div>
            )}
          </div>
        )}
        <div className="font-medium">{processedMessage}</div>
      </div>
    </div>
  )
}

const GlassChatImage = ({
  role,
  imageUrl,
  characterName,
}: {
  role: string
  imageUrl: string
  characterName: string
}) => {
  const isUser = role === 'user'

  return (
    <div
      className={`animate-aurora-bubble-in max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
    >
      <Image
        src={imageUrl}
        alt="Generated Image"
        className="rounded-2xl border border-white/70 shadow-md"
        width={512}
        height={512}
      />
    </div>
  )
}

const ClassicChatLog = () => {
  const chatLogRef = useRef<HTMLDivElement>(null)

  const characterName = settingsStore((s) => s.characterName)
  const userDisplayName = settingsStore((s) => s.userDisplayName)
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const chatLogPosition = settingsStore((s) => s.chatLogPosition)
  const chatLogEdgeOffset = settingsStore((s) => s.chatLogEdgeOffset)
  const chatLog = homeStore((s) => s.chatLog)
  const messages = useMemo(
    () => messageSelectors.getTextAndImageMessages(chatLog),
    [chatLog]
  )

  const isRightAligned = chatLogPosition === 'right'
  const chatScrollRef = useAutoScrollRef(messages)
  const {
    innerHandleRef,
    outerHandleRef,
    draggingEdge,
    hoveredEdge,
    setHoveredEdge,
  } = useChatLogResize(isRightAligned, chatLogRef)

  const defaultOffsetClasses = isRightAligned
    ? 'right-2 sm:right-4 md:right-9 lg:right-14'
    : 'left-2 sm:left-4 md:left-14 lg:left-24'

  return (
    <div
      ref={chatLogRef}
      className={`absolute z-10 h-[100svh] max-w-[calc(100vw-40px)] pb-16 ${chatLogEdgeOffset == null ? defaultOffsetClasses : ''}`}
      style={{
        width: `${chatLogWidth}px`,
        ...(chatLogEdgeOffset != null
          ? isRightAligned
            ? { right: `${chatLogEdgeOffset}px` }
            : { left: `${chatLogEdgeOffset}px` }
          : {}),
      }}
    >
      <div className="scroll-hidden max-h-full overflow-y-auto px-2 pb-16 pt-24 sm:px-4">
        {messages.map((msg, i) => {
          return (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              {typeof msg.content === 'string' ? (
                <ClassicChat
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
                  <ClassicChat
                    index={i}
                    role={msg.role}
                    message={msg.content ? msg.content[0].text : ''}
                    thinking={msg.thinking}
                    characterName={characterName}
                    userName={msg.userName}
                    userDisplayName={userDisplayName}
                  />
                  <ClassicChatImage
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
      <ResizeHandles
        innerHandleRef={innerHandleRef}
        outerHandleRef={outerHandleRef}
        draggingEdge={draggingEdge}
        hoveredEdge={hoveredEdge}
        setHoveredEdge={setHoveredEdge}
        isRightAligned={isRightAligned}
      />
    </div>
  )
}

const ClassicChat = ({
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
      className={`mx-auto my-3 ${offsetX}`}
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

const ClassicChatImage = ({
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
    <div className={`mx-auto my-3 ${offsetX}`}>
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
