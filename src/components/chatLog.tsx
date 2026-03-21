import { useEffect, useRef, useState } from 'react'
import { Message } from '@/features/messages/messages'
import homeStore, {
  getTargetLogFileName,
  setRestoringChatLog,
  setTargetLogFileName,
} from '@/features/stores/home'
import layoutStore from '@/features/stores/layout'
import settingsStore from '@/features/stores/settings'
import { resetSessionId } from '@/utils/sessionId'

type ChatLogProps = {
  onOpenSettings: () => void
  isMobileLayout?: boolean
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

interface MemoryFileInfo {
  filename: string
  title: string
  createdAt: string
  messageCount: number
  hasEmbeddings: boolean
}

export const ChatLog = ({
  onOpenSettings,
  isMobileLayout = false,
  isMobileOpen = false,
  onCloseMobile,
}: ChatLogProps) => {
  const resizeHandleRef = useRef<HTMLDivElement>(null)

  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const chatLogLength = homeStore((s) => s.chatLog.length)

  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [historyFiles, setHistoryFiles] = useState<MemoryFileInfo[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [openedMenuFile, setOpenedMenuFile] = useState<string | null>(null)
  const [activeFileName, setActiveFileName] = useState<string | null>(
    getTargetLogFileName()
  )
  const [isSwitchingWindow, setIsSwitchingWindow] = useState(false)
  const [isDedicatedMobileWindow, setIsDedicatedMobileWindow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsDedicatedMobileWindow(
      new URLSearchParams(window.location.search).get('layout') ===
        'mobile-window'
    )
  }, [])

  useEffect(() => {
    const handleMouseDown = () => {
      setIsDragging(true)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newWidth = e.clientX
      const constrainedWidth = Math.max(
        320,
        Math.min(newWidth, window.innerWidth * 0.8)
      )

      settingsStore.setState({ chatLogWidth: constrainedWidth })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
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
    }
  }, [isDragging])

  const fetchHistoryFiles = async () => {
    setIsHistoryLoading(true)
    setHistoryError('')

    try {
      const response = await fetch('/api/memory-files')
      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`)
      }
      const data = (await response.json()) as { files?: MemoryFileInfo[] }
      const files = Array.isArray(data.files) ? data.files : []
      setHistoryFiles(files)
      if (activeFileName && !files.some((f) => f.filename === activeFileName)) {
        setActiveFileName(null)
      }
    } catch (error) {
      console.error('Failed to fetch history files:', error)
      setHistoryError('Failed to load chat list.')
      setHistoryFiles([])
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    void fetchHistoryFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchHistoryFiles()
    }, 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatLogLength])

  const clearCurrentThread = (requireConfirm: boolean) => {
    if (requireConfirm) {
      const confirmed = window.confirm(
        'Start a new chat? Current thread will be cleared.'
      )
      if (!confirmed) return
    }

    homeStore.setState({ chatLog: [] })
    settingsStore.setState({ difyConversationId: '' })
    setTargetLogFileName(null)
    setActiveFileName(null)
    resetSessionId()
    setOpenedMenuFile(null)
  }

  const handleRestoreHistory = async (file: MemoryFileInfo) => {
    const confirmed = window.confirm(
      `Open "${file.title || file.filename}"? Current chat will be replaced.`
    )
    if (!confirmed) return

    setHistoryError('')
    setOpenedMenuFile(null)

    try {
      const response = await fetch('/api/memory-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.filename }),
      })

      if (!response.ok) {
        throw new Error(`Restore failed: ${response.status}`)
      }

      const data = (await response.json()) as { messages?: Message[] }
      const restoredMessages = Array.isArray(data.messages) ? data.messages : []

      setRestoringChatLog(true)
      homeStore.setState({ chatLog: restoredMessages })
      settingsStore.setState({ difyConversationId: '' })
      setTargetLogFileName(file.filename)
      setActiveFileName(file.filename)
      setRestoringChatLog(false)
      resetSessionId()
    } catch (error) {
      setRestoringChatLog(false)
      console.error('Failed to restore chat history:', error)
      setHistoryError('Failed to open chat.')
    }
  }

  const handleDeleteHistory = async (file: MemoryFileInfo) => {
    const confirmed = window.confirm(
      `Delete "${file.title || file.filename}"? This action cannot be undone.`
    )
    if (!confirmed) return

    setHistoryError('')
    setOpenedMenuFile(null)

    try {
      const response = await fetch('/api/memory-files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.filename }),
      })
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`)
      }

      if (activeFileName === file.filename) {
        clearCurrentThread(false)
      }

      await fetchHistoryFiles()
    } catch (error) {
      console.error('Failed to delete chat history:', error)
      setHistoryError('Failed to delete chat.')
    }
  }

  const handleSwitchLayoutWindow = async () => {
    if (isSwitchingWindow) return
    setIsSwitchingWindow(true)

    try {
      const switchingToMobile = !isDedicatedMobileWindow
      if (switchingToMobile) {
        settingsStore.setState({
          fixedCharacterPosition: false,
          characterPosition: { x: 0, y: 0, z: 0, scale: 1 },
          characterRotation: { x: 0, y: 0, z: 0 },
          pngTuberOffsetX: 0,
          pngTuberOffsetY: 0,
        })
        const hs = homeStore.getState()
        hs.viewer?.unfixCameraPosition?.()
        hs.viewer?.resetCameraPosition?.()
        hs.live2dViewer?.unfixPosition?.()
        hs.live2dViewer?.resetPosition?.()
      }

      if (window.electronApp?.isDesktop) {
        if (isDedicatedMobileWindow) {
          await window.electronApp.focusMainWindow?.()
          await window.electronApp.closeMobileWindow?.()
        } else {
          await window.electronApp.openMobileWindow?.()
          await window.electronApp.hideMainWindow?.()
        }
        return
      }

      layoutStore
        .getState()
        .setLayoutMode(isDedicatedMobileWindow ? 'desktop' : 'mobile')
      layoutStore.getState().setMobileChatOpen(false)
    } catch (error) {
      console.error('Failed to switch layout window:', error)
    } finally {
      setIsSwitchingWindow(false)
    }
  }

  return (
    <>
      {isMobileLayout && isMobileOpen && (
        <button
          aria-label="Close chat panel"
          className="fixed inset-0 z-30 bg-black/35"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-[#d8bfa2]/80 bg-[#ead8c4]/95 text-[#4f3c2f] shadow-2xl backdrop-blur-md transition-transform duration-300 ${
          isMobileLayout
            ? isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'translate-x-0'
        }`}
        style={{
          width: isMobileLayout
            ? `min(${chatLogWidth}px, 88vw)`
            : `${chatLogWidth}px`,
          maxWidth: '100vw',
        }}
      >
        <div className="flex items-center justify-between border-b border-[#d8bfa2]/80 px-4 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-[#7b6658]">
              Chat
            </div>
            <div className="mt-1 text-lg font-semibold tracking-wide text-[#4f3c2f]">
              Your Chat
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitchLayoutWindow}
              disabled={isSwitchingWindow}
              className="rounded-full border border-[#cfb294] bg-[#f5ebe0] px-3 py-1 text-xs text-[#5a4638] hover:bg-[#f1e3d4] disabled:opacity-60"
            >
              {isDedicatedMobileWindow
                ? '通常画面に切り替える'
                : 'モバイルに切り替える'}
            </button>
            {isMobileLayout && (
              <button
                onClick={onCloseMobile}
                className="rounded-full border border-[#cfb294] bg-[#f5ebe0] px-3 py-1 text-xs text-[#5a4638] hover:bg-[#f1e3d4]"
              >
                Close
              </button>
            )}
            <button
              onClick={onOpenSettings}
              className="rounded-full border border-[#cfb294] bg-[#f5ebe0] px-3 py-1 text-xs text-[#5a4638] hover:bg-[#f1e3d4]"
            >
              Settings
            </button>
            <button
              onClick={() => clearCurrentThread(true)}
              className="rounded-full border border-[#d89f90] bg-[#f6ddd6] px-3 py-1 text-xs text-[#7b3f36] hover:bg-[#f1d0c7]"
            >
              New Chat
            </button>
          </div>
        </div>

        <div className="border-b border-[#d8bfa2]/80 px-3 py-3">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[#7b6658]">
            Chats
          </div>
          <div className="max-h-[34vh] overflow-y-auto pr-1 scroll-hidden">
            {isHistoryLoading && (
              <div className="rounded-lg border border-[#d6bda0] bg-[#f5e8d9] px-3 py-2 text-xs text-[#6a5444]">
                Loading...
              </div>
            )}

            {!isHistoryLoading &&
              historyFiles.length === 0 &&
              !historyError && (
                <div className="rounded-lg border border-dashed border-[#d6bda0] bg-[#f5e8d9] px-3 py-3 text-xs text-[#6a5444]">
                  No saved chats yet
                </div>
              )}

            {historyFiles.map((file) => {
              const isActive = file.filename === activeFileName
              return (
                <div
                  key={file.filename}
                  className={`relative mb-2 rounded-xl border p-2 ${
                    isActive
                      ? 'border-[#b99174] bg-[#f3e3d2]'
                      : 'border-[#d6bda0] bg-[#f7eee4]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleRestoreHistory(file)}
                    >
                      <div className="truncate text-sm font-medium text-[#4f3c2f]">
                        {file.title || file.filename}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[#7b6658]">
                        {new Date(file.createdAt).toLocaleString()} /{' '}
                        {file.messageCount} messages
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setOpenedMenuFile((prev) =>
                          prev === file.filename ? null : file.filename
                        )
                      }
                      className="rounded-md border border-[#d6bda0] px-2 py-1 text-xs text-[#6a5444] hover:bg-[#efdfcd]"
                    >
                      ...
                    </button>
                  </div>

                  {openedMenuFile === file.filename && (
                    <div className="absolute right-2 top-9 z-40 rounded-md border border-[#d6bda0] bg-[#fff4e8] p-1 shadow-xl">
                      <button
                        onClick={() => handleDeleteHistory(file)}
                        className="w-full rounded px-3 py-1 text-left text-xs text-[#9f4a3f] hover:bg-[#f8ddd7]"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {historyError && (
            <div className="mt-2 rounded-lg border border-[#d89f90] bg-[#f8ddd7] px-3 py-2 text-xs text-[#8d4338]">
              {historyError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 scroll-hidden" />
        {!isMobileLayout && (
          <div
            ref={resizeHandleRef}
            className="absolute right-0 top-0 h-full w-4 cursor-ew-resize hover:bg-[#d6bda0]/40"
            style={{ cursor: isDragging ? 'grabbing' : 'ew-resize' }}
          >
            <div className="absolute right-1 top-1/2 h-16 w-1 -translate-y-1/2 rounded-full bg-[#b99174]/70" />
          </div>
        )}
      </aside>
    </>
  )
}
