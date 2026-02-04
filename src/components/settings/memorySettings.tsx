/**
 * MemorySettings Component
 *
 * 記憶設定UIコンポーネント（会話履歴・長期記憶）
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import settingsStore from '@/features/stores/settings'
import homeStore, {
  setRestoringChatLog,
  setTargetLogFileName,
} from '@/features/stores/home'
import { TextButton } from '../textButton'
import { ToggleSwitch } from '../toggleSwitch'
import { ApiKeyInput } from './modelProvider/ApiKeyInput'
import { getMemoryService } from '@/features/memory/memoryService'
import { extractTextContent } from '@/features/memory/memoryStoreSync'
import { Message } from '@/features/messages/messages'
import { messageSelectors } from '@/features/messages/messageSelectors'

/** Close icon SVG component */
function CloseIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4L4 12M4 4L12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const MemorySettings = () => {
  const { t } = useTranslation()

  // Settings store state
  const memoryEnabled = settingsStore((s) => s.memoryEnabled)
  const memorySimilarityThreshold = settingsStore(
    (s) => s.memorySimilarityThreshold
  )
  const memorySearchLimit = settingsStore((s) => s.memorySearchLimit)
  const memoryMaxContextTokens = settingsStore((s) => s.memoryMaxContextTokens)
  const openaiKey = settingsStore((s) => s.openaiKey)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const maxPastMessages = settingsStore((s) => s.maxPastMessages)

  // 会話履歴
  const chatLog = messageSelectors.getTextAndImageMessages(
    homeStore((s) => s.chatLog)
  )

  // Local state
  const [memoryCount, setMemoryCount] = useState<number>(0)
  const [isClearing, setIsClearing] = useState<boolean>(false)
  const [isRestoring, setIsRestoring] = useState<boolean>(false)
  const [restoreMessage, setRestoreMessage] = useState<string>('')
  const [vectorizeOnRestore, setVectorizeOnRestore] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<
    Array<{
      role: string
      content: string
      similarity: number
      timestamp: string
    }>
  >([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // APIキーが設定されているか
  const hasApiKey = Boolean(openaiKey)

  // 機能が利用可能かどうか（APIキーがある）
  const isDisabled = !hasApiKey

  // メモリ件数を取得
  const fetchMemoryCount = useCallback(async () => {
    try {
      const memoryService = getMemoryService()
      if (!memoryService.isAvailable()) {
        await memoryService.initialize()
      }
      const count = await memoryService.getMemoryCount()
      setMemoryCount(count)
    } catch (error) {
      console.warn('Failed to fetch memory count:', error)
    }
  }, [])

  useEffect(() => {
    fetchMemoryCount()
  }, [fetchMemoryCount])

  // 記憶をクリア
  const handleClearMemories = async () => {
    const confirmed = window.confirm(t('MemoryClearConfirm'))
    if (!confirmed) {
      return
    }

    setIsClearing(true)
    try {
      const memoryService = getMemoryService()
      await memoryService.clearAllMemories()
      setMemoryCount(0)
    } catch (error) {
      console.error('Failed to clear memories:', error)
    } finally {
      setIsClearing(false)
    }
  }

  // 数値設定の変更ハンドラーを生成
  const createNumberHandler =
    (
      key:
        | 'memorySimilarityThreshold'
        | 'memorySearchLimit'
        | 'memoryMaxContextTokens',
      isFloat = false
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = isFloat
        ? parseFloat(e.target.value)
        : parseInt(e.target.value, 10)
      if (!isNaN(value)) {
        settingsStore.setState({ [key]: value })
      }
    }

  // 類似度プレビュー検索
  const handleSearchPreview = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setHasSearched(true)
    try {
      const memoryService = getMemoryService()
      if (!memoryService.isAvailable()) {
        await memoryService.initialize()
      }
      const results = await memoryService.searchMemories(searchQuery, {
        threshold: -1,
        limit: 10,
      })
      setSearchResults(
        results.map((r) => ({
          role: r.role,
          content: r.content,
          similarity: r.similarity ?? 0,
          timestamp: r.timestamp,
        }))
      )
    } catch (error) {
      console.error('Failed to search memories:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // ファイル選択ボタンのクリック
  const handleFileSelectClick = () => {
    fileInputRef.current?.click()
  }

  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setRestoreMessage('')
    }
  }

  // ファイル選択をクリア
  const handleClearSelectedFile = () => {
    setSelectedFile(null)
    setRestoreMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ファイルからの記憶復元
  const handleRestore = async () => {
    if (!selectedFile) return

    setIsRestoring(true)
    setRestoreMessage('')

    try {
      const content = await selectedFile.text()
      const data = JSON.parse(content) as Message[]

      if (!Array.isArray(data)) {
        throw new Error('Invalid file format')
      }

      const confirmed = window.confirm(t('MemoryRestoreConfirm'))
      if (!confirmed) {
        setIsRestoring(false)
        return
      }

      // 会話履歴に追加するメッセージを収集
      const restoredMessages: Message[] = []
      // ベクトル化する場合はembedding付きメッセージも収集
      const shouldVectorize = vectorizeOnRestore && memoryEnabled

      // memoryServiceの初期化（ベクトル化する場合）
      let memoryService: ReturnType<typeof getMemoryService> | null = null
      if (shouldVectorize) {
        memoryService = getMemoryService()
        if (!memoryService.isAvailable()) {
          await memoryService.initialize()
        }
        // 既存の記憶をクリアしてから復元（上書き）
        await memoryService.clearAllMemories()
      }

      for (const msg of data) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          const textContent = extractTextContent(msg.content)
          if (textContent) {
            // 基本メッセージを作成
            const restoredMsg: Message = {
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: textContent,
              timestamp: msg.timestamp,
            }

            // ベクトル化オプションがONの場合
            if (shouldVectorize && memoryService) {
              let embedding: number[] | null = null

              // embeddingがファイルに含まれている場合はそれを使用
              if (msg.embedding && Array.isArray(msg.embedding)) {
                embedding = msg.embedding
              } else {
                // embeddingがない場合はAPIを呼んで取得
                embedding = await memoryService.fetchEmbedding(textContent)
              }

              // embeddingが取得できた場合
              if (embedding) {
                restoredMsg.embedding = embedding

                // IndexedDBに保存
                await memoryService.restoreMemory({
                  id:
                    msg.id ||
                    `memory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                  role: msg.role as 'user' | 'assistant',
                  content: textContent,
                  embedding,
                  timestamp: msg.timestamp || new Date().toISOString(),
                  sessionId: `restored-${Date.now()}`,
                })
              }
            }

            restoredMessages.push(restoredMsg)
          }
        }
      }

      // 会話履歴を上書き（復元中フラグを設定してembedding取得をスキップ）
      setRestoringChatLog(true)
      homeStore.setState({ chatLog: restoredMessages })
      setRestoringChatLog(false)

      // 復元したファイルをターゲットとして設定（以降の会話はこのファイルに追記される）
      setTargetLogFileName(selectedFile.name)

      // ベクトル化した場合はログファイルも上書き保存（embedding付きで）
      if (shouldVectorize) {
        await fetch('/api/save-chat-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: restoredMessages,
            targetFileName: selectedFile.name,
            overwrite: true,
          }),
        })
        await fetchMemoryCount()
      }
      setRestoreMessage(t('MemoryRestoreSuccess'))
      setSelectedFile(null)
    } catch (error) {
      console.error('Failed to restore memories:', error)
      setRestoreMessage(t('MemoryRestoreError'))
    } finally {
      setIsRestoring(false)
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 会話履歴の編集
  const handleChangeChatLog = (targetIndex: number, text: string) => {
    const newChatLog = chatLog.map((m, i) => {
      return i === targetIndex ? { role: m.role, content: text } : m
    })
    homeStore.setState({ chatLog: newChatLog })
  }

  // 会話履歴のメッセージ削除
  const handleDeleteMessage = (targetIndex: number) => {
    const newChatLog = chatLog.filter((_, i) => i !== targetIndex)
    homeStore.setState({ chatLog: newChatLog })
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <div
            className="w-6 h-6 mr-2 icon-mask-default"
            style={{
              maskImage: 'url(/images/setting-icons/memory-settings.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          />
          <h2 className="text-2xl font-bold">{t('MemorySettings')}</h2>
        </div>

        {/* ===== 長期記憶セクション ===== */}
        <div className="mb-8">
          {/* 長期記憶ON/OFF */}
          <div className="my-6">
            <div className="my-4 text-xl font-bold">{t('MemoryEnabled')}</div>
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('MemoryEnabledInfo')}
            </div>
            <div className="my-2">
              <ToggleSwitch
                enabled={memoryEnabled}
                onChange={(v) => settingsStore.setState({ memoryEnabled: v })}
              />
            </div>
          </div>

          {/* 長期記憶がONの場合のみ詳細設定を表示 */}
          {memoryEnabled && (
            <>
              {/* OpenAI APIキー設定 */}
              <ApiKeyInput
                label={t('OpenAIAPIKeyLabel')}
                value={openaiKey}
                onChange={(value) =>
                  settingsStore.setState({ openaiKey: value })
                }
                placeholder="sk-..."
                linkUrl="https://platform.openai.com/account/api-keys"
                linkLabel="OpenAI Platform"
              />

              {/* 類似度閾値スライダー */}
              <div className="my-6">
                <div className="my-4 text-xl font-bold">
                  {t('MemorySimilarityThreshold')}
                </div>
                <div className="my-2 text-sm whitespace-pre-wrap">
                  {t('MemorySimilarityThresholdInfo')}
                </div>
                <div className="mt-6 font-bold">
                  <div className="select-none">
                    {t('MemorySimilarityThreshold')}:{' '}
                    {memorySimilarityThreshold.toFixed(2)}
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={memorySimilarityThreshold}
                    onChange={createNumberHandler(
                      'memorySimilarityThreshold',
                      true
                    )}
                    aria-label={t('MemorySimilarityThreshold')}
                    className="mt-2 mb-4 input-range"
                    disabled={isDisabled}
                  />
                </div>
              </div>

              {/* 類似度プレビュー */}
              <div className="my-6">
                <div className="my-4 font-bold">{t('MemorySearchPreview')}</div>
                <div className="my-2 text-sm whitespace-pre-wrap">
                  {t('MemorySearchPreviewInfo')}
                </div>
                <div className="flex gap-2 my-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchPreview()
                    }}
                    placeholder={t('MemorySearchPreviewPlaceholder')}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    disabled={isDisabled || isSearching}
                  />
                  <TextButton
                    onClick={handleSearchPreview}
                    disabled={isDisabled || isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? '...' : t('MemorySearchPreviewButton')}
                  </TextButton>
                </div>
                {hasSearched && !isSearching && (
                  <div className="my-4">
                    {searchResults.length > 0 ? (
                      <div className="text-sm space-y-1">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className={`flex items-start gap-3 py-2 ${
                              index < searchResults.length - 1
                                ? 'border-b border-gray-200'
                                : ''
                            } ${
                              result.similarity >= memorySimilarityThreshold
                                ? ''
                                : 'opacity-40'
                            }`}
                          >
                            <span
                              className={`font-mono font-bold whitespace-nowrap ${
                                result.similarity >= memorySimilarityThreshold
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {result.similarity.toFixed(3)}
                            </span>
                            <span className="whitespace-nowrap text-gray-500">
                              {result.role === 'user' ? 'User' : 'AI'}
                            </span>
                            <span className="break-all line-clamp-2">
                              {result.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {t('MemorySearchPreviewNoResults')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 検索結果上限 */}
              <div className="my-6">
                <div className="my-4 text-xl font-bold">
                  {t('MemorySearchLimit')}
                </div>
                <div className="my-2 text-sm whitespace-pre-wrap">
                  {t('MemorySearchLimitInfo')}
                </div>
                <div className="my-4">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={memorySearchLimit}
                    onChange={createNumberHandler('memorySearchLimit')}
                    aria-label={t('MemorySearchLimit')}
                    className="w-24 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    disabled={isDisabled}
                  />
                </div>
              </div>

              {/* 最大コンテキストトークン数 */}
              <div className="my-6">
                <div className="my-4 text-xl font-bold">
                  {t('MemoryMaxContextTokens')}
                </div>
                <div className="my-2 text-sm whitespace-pre-wrap">
                  {t('MemoryMaxContextTokensInfo')}
                </div>
                <div className="my-4">
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={memoryMaxContextTokens}
                    onChange={createNumberHandler('memoryMaxContextTokens')}
                    aria-label={t('MemoryMaxContextTokens')}
                    className="w-32 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    disabled={isDisabled}
                  />
                </div>
              </div>

              {/* 保存済み記憶件数 */}
              <div className="my-6">
                <div className="my-4 text-xl font-bold">{t('MemoryCount')}</div>
                <div className="my-2 text-lg">
                  {t('MemoryCountValue', { count: memoryCount })}
                </div>
              </div>

              {/* 記憶をクリア */}
              <div className="my-6">
                <TextButton
                  onClick={handleClearMemories}
                  disabled={isClearing || isDisabled}
                >
                  {isClearing ? '...' : t('MemoryClear')}
                </TextButton>
              </div>
            </>
          )}
        </div>

        {/* ===== 記憶を復元セクション ===== */}
        <div className="border-t border-gray-300 pt-6 my-6">
          <div className="my-4 text-xl font-bold">{t('MemoryRestore')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('MemoryRestoreInfo')}
          </div>

          {/* ベクトル化オプション */}
          <div className="my-6">
            <div className="my-4 font-bold">{t('VectorizeOnRestore')}</div>
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('VectorizeOnRestoreInfo')}
            </div>
            <div className="my-2">
              <ToggleSwitch
                enabled={vectorizeOnRestore}
                onChange={(v) => setVectorizeOnRestore(v)}
                disabled={!memoryEnabled}
              />
            </div>
          </div>

          <div className="my-4">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-4">
              <TextButton
                onClick={handleFileSelectClick}
                disabled={isRestoring}
              >
                {t('MemoryRestoreSelect')}
              </TextButton>
              {selectedFile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">{selectedFile.name}</span>
                  <button
                    onClick={handleClearSelectedFile}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    title={t('Clear')}
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}
            </div>
            {selectedFile && (
              <div className="mt-4 flex items-center gap-4">
                <TextButton onClick={handleRestore} disabled={isRestoring}>
                  {isRestoring ? '...' : t('MemoryRestoreExecute')}
                </TextButton>
                {restoreMessage && (
                  <span
                    className={`text-sm ${restoreMessage.includes('成功') || restoreMessage.includes('Success') ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {restoreMessage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== 会話履歴セクション ===== */}
        <div className="border-t border-gray-300 pt-6">
          <div className="flex items-center mb-4">
            <Image
              src="/images/setting-icons/conversation-history.svg"
              alt="Conversation History"
              width={24}
              height={24}
              className="mr-2"
            />
            <h3 className="text-xl font-bold">{t('ConversationHistory')}</h3>
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {selectAIService !== 'dify'
              ? t('ConversationHistoryInfo', { count: maxPastMessages })
              : t('DifyInfo2')}
          </div>

          {/* 過去のメッセージ保持数 */}
          {selectAIService !== 'dify' && (
            <div className="my-6">
              <div className="my-4 text-xl font-bold">
                {t('MaxPastMessages')}
              </div>
              <div className="my-4">
                <input
                  type="number"
                  min="1"
                  max="9999"
                  className="w-24 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                  value={maxPastMessages}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (!Number.isNaN(value) && value >= 1 && value <= 9999) {
                      settingsStore.setState({ maxPastMessages: value })
                    }
                  }}
                />
              </div>
            </div>
          )}

          <TextButton
            onClick={async () => {
              homeStore.setState({ chatLog: [] })
              settingsStore.setState({ difyConversationId: '' })
              // IndexedDBの記憶もクリア
              try {
                const memoryService = getMemoryService()
                if (memoryService.isAvailable()) {
                  await memoryService.clearAllMemories()
                  setMemoryCount(0)
                }
              } catch (error) {
                console.warn('Failed to clear IndexedDB memories:', error)
              }
            }}
          >
            {t('ConversationHistoryReset')}
          </TextButton>

          {chatLog.length > 0 && (
            <div className="my-4">
              {chatLog.map((value, index) => {
                return (
                  value.content && (
                    <div
                      key={index}
                      className="my-2 grid grid-flow-col grid-cols-[100px_1fr_auto] gap-x-fixed"
                    >
                      <div className="min-w-[100px] py-2 whitespace-nowrap">
                        {value.role === 'user' ? 'You' : 'Character'}
                      </div>
                      {typeof value.content == 'string' ? (
                        <input
                          key={index}
                          className="bg-white hover:bg-white-hover rounded-lg w-full px-4 py-2"
                          type="text"
                          value={value.content}
                          onChange={(e) => {
                            handleChangeChatLog(index, e.target.value)
                          }}
                        ></input>
                      ) : (
                        <Image
                          src={value.content[1].image}
                          alt="画像"
                          width={500}
                          height={500}
                        />
                      )}
                      <button
                        onClick={() => handleDeleteMessage(index)}
                        className="ml-2 p-1 text-red-500 hover:text-red-700 rounded"
                        title={t('DeleteMessage')}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  )
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MemorySettings
