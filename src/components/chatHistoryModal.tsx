import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { Message } from '@/features/messages/messages'
import homeStore, {
  setRestoringChatLog,
  setTargetLogFileName,
} from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { resetSessionId } from '@/utils/sessionId'

interface MemoryFileInfo {
  filename: string
  title: string
  createdAt: string
  messageCount: number
  hasEmbeddings: boolean
}

export const ChatHistoryModal = () => {
  const showChatHistoryModal = menuStore((s) => s.showChatHistoryModal)
  const [historyFiles, setHistoryFiles] = useState<MemoryFileInfo[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isRestoringHistory, setIsRestoringHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [openedMenuFile, setOpenedMenuFile] = useState<string | null>(null)

  const fetchHistoryFiles = async () => {
    setIsHistoryLoading(true)
    setHistoryError('')

    try {
      const response = await fetch('/api/memory-files')
      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`)
      }

      const data = (await response.json()) as { files?: MemoryFileInfo[] }
      setHistoryFiles(Array.isArray(data.files) ? data.files : [])
    } catch (error) {
      console.error('Failed to fetch history files:', error)
      setHistoryError('Failed to load chat history.')
      setHistoryFiles([])
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (!showChatHistoryModal) {
      setOpenedMenuFile(null)
      return
    }

    void fetchHistoryFiles()
  }, [showChatHistoryModal])

  const handleRestoreHistory = async (filename: string) => {
    const displayTitle =
      historyFiles.find((f) => f.filename === filename)?.title ?? filename
    const confirmed = window.confirm(
      `Open "${displayTitle}"? Current chat will be replaced.`
    )
    if (!confirmed) return

    setIsRestoringHistory(true)
    setHistoryError('')

    try {
      const response = await fetch('/api/memory-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })

      if (!response.ok) {
        throw new Error(`Restore failed: ${response.status}`)
      }

      const data = (await response.json()) as { messages?: Message[] }
      const restoredMessages = Array.isArray(data.messages) ? data.messages : []

      setRestoringChatLog(true)
      homeStore.setState({ chatLog: restoredMessages })
      settingsStore.setState({ difyConversationId: '' })
      setTargetLogFileName(filename)

      setRestoringChatLog(false)
      resetSessionId()
      menuStore.setState({ showChatHistoryModal: false })
    } catch (error) {
      console.error('Failed to restore history:', error)
      setHistoryError('Failed to restore chat history.')
    } finally {
      setIsRestoringHistory(false)
    }
  }

  const handleDeleteHistory = async (filename: string) => {
    const confirmed = window.confirm(
      `Delete ${filename}? This action cannot be undone.`
    )
    if (!confirmed) return

    setOpenedMenuFile(null)
    setHistoryError('')

    try {
      const response = await fetch('/api/memory-files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`)
      }
      await fetchHistoryFiles()
    } catch (error) {
      console.error('Failed to delete history file:', error)
      setHistoryError('Failed to delete chat history file.')
    }
  }

  if (!showChatHistoryModal) return null

  return createPortal(
    <div
      className="flex items-center justify-center bg-black/65 p-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
      }}
    >
      <div className="flex h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#121212] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold tracking-wide">Chat History</h3>
          <button
            onClick={() => menuStore.setState({ showChatHistoryModal: false })}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
            disabled={isRestoringHistory}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scroll-hidden">
          {isHistoryLoading && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
              Loading...
            </div>
          )}

          {!isHistoryLoading && historyFiles.length === 0 && !historyError && (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/5 px-3 py-4 text-sm text-white/60">
              No history files found
            </div>
          )}

          {historyFiles.map((file) => (
            <div
              key={file.filename}
              className="relative mb-2 rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white/90">
                    {file.title || file.filename}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {new Date(file.createdAt).toLocaleString()} /{' '}
                    {file.messageCount} messages
                  </div>
                </div>
                <button
                  onClick={() =>
                    setOpenedMenuFile((prev) =>
                      prev === file.filename ? null : file.filename
                    )
                  }
                  className="rounded-md border border-white/10 px-2 py-1 text-sm text-white/75 hover:bg-white/10"
                  disabled={isRestoringHistory}
                >
                  ...
                </button>
              </div>

              <div className="mt-2">
                <button
                  onClick={() => handleRestoreHistory(file.filename)}
                  className="rounded-md border border-blue-300/20 bg-blue-900/30 px-3 py-1 text-xs text-blue-100 hover:bg-blue-900/45 disabled:opacity-50"
                  disabled={isRestoringHistory}
                >
                  {isRestoringHistory ? 'Opening...' : 'Open This Chat'}
                </button>
              </div>

              {openedMenuFile === file.filename && (
                <div className="absolute right-3 top-11 z-40 rounded-md border border-white/10 bg-[#1e1e1e] p-1 shadow-xl">
                  <button
                    onClick={() => handleDeleteHistory(file.filename)}
                    className="w-full rounded px-3 py-1 text-left text-xs text-red-200 hover:bg-red-900/35"
                    disabled={isRestoringHistory}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {historyError && (
            <div className="mt-2 rounded-lg border border-red-300/20 bg-red-900/20 px-3 py-2 text-sm text-red-100">
              {historyError}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
