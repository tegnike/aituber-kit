/**
 * MemorySettings Component
 *
 * メモリ機能の設定UIコンポーネント
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { getMemoryService } from '@/features/memory/memoryService'
import { extractTextContent } from '@/features/memory/memoryStoreSync'
import { Message } from '@/features/messages/messages'
import { useDemoMode } from '@/hooks/useDemoMode'
import { DemoModeNotice } from '../demoModeNotice'

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

  // Local state
  const [memoryCount, setMemoryCount] = useState<number>(0)
  const [isClearing, setIsClearing] = useState<boolean>(false)
  const [isRestoring, setIsRestoring] = useState<boolean>(false)
  const [restoreMessage, setRestoreMessage] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // APIキーが設定されているか
  const hasApiKey = Boolean(openaiKey)

  // デモモード判定
  const { isDemoMode } = useDemoMode()

  // 機能が利用可能かどうか（APIキーがあり、デモモードでない）
  const isDisabled = !hasApiKey || isDemoMode

  // メモリ件数を取得
  const fetchMemoryCount = useCallback(async () => {
    try {
      const memoryService = getMemoryService()
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

  // 類似度閾値の変更
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    settingsStore.setState({ memorySimilarityThreshold: value })
  }

  // 検索上限の変更
  const handleSearchLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ memorySearchLimit: value })
    }
  }

  // 最大コンテキストトークンの変更
  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ memoryMaxContextTokens: value })
    }
  }

  // ファイル選択ボタンのクリック
  const handleFileSelectClick = () => {
    fileInputRef.current?.click()
  }

  // ファイルからの記憶復元
  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    setRestoreMessage('')

    try {
      const content = await file.text()
      const data = JSON.parse(content) as Message[]

      if (!Array.isArray(data)) {
        throw new Error('Invalid file format')
      }

      const confirmed = window.confirm(t('MemoryRestoreConfirm'))
      if (!confirmed) {
        setIsRestoring(false)
        return
      }

      const memoryService = getMemoryService()

      // 各メッセージをメモリに保存
      for (const msg of data) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          const textContent = extractTextContent(msg.content)
          if (textContent) {
            await memoryService.saveMemory({
              role: msg.role as 'user' | 'assistant',
              content: textContent,
            })
          }
        }
      }

      // メモリ件数を更新
      await fetchMemoryCount()
      setRestoreMessage(t('MemoryRestoreSuccess'))
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

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <div
            className="w-6 h-6 mr-2 icon-mask-default"
            style={{
              maskImage: 'url(/images/setting-icons/other-settings.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          />
          <h2 className="text-2xl font-bold">{t('MemorySettings')}</h2>
        </div>

        {/* APIキー未設定警告 */}
        {!hasApiKey && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
            {t('MemoryAPIKeyWarning')}
          </div>
        )}

        {/* デモモード通知 */}
        <DemoModeNotice />

        {/* メモリ機能ON/OFF */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('MemoryEnabled')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('MemoryEnabledInfo')}
          </div>
          <div className="my-2">
            <TextButton
              onClick={() =>
                settingsStore.setState((s) => ({
                  memoryEnabled: !s.memoryEnabled,
                }))
              }
              disabled={isDisabled}
            >
              {memoryEnabled ? t('StatusOn') : t('StatusOff')}
            </TextButton>
          </div>
        </div>

        {/* 類似度閾値スライダー */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('MemorySimilarityThreshold')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('MemorySimilarityThresholdInfo')}
          </div>
          <div className="my-4 flex items-center gap-4">
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={memorySimilarityThreshold}
              onChange={handleThresholdChange}
              aria-label={t('MemorySimilarityThreshold')}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isDisabled}
            />
            <span className="w-12 text-center font-mono">
              {memorySimilarityThreshold.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 検索結果上限 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('MemorySearchLimit')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('MemorySearchLimitInfo')}
          </div>
          <div className="my-4">
            <input
              type="number"
              min="1"
              max="10"
              value={memorySearchLimit}
              onChange={handleSearchLimitChange}
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
              onChange={handleMaxTokensChange}
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

        {/* 記憶を復元 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('MemoryRestore')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('MemoryRestoreInfo')}
          </div>
          <div className="my-4 flex items-center gap-4">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileRestore}
              className="hidden"
            />
            <TextButton
              onClick={handleFileSelectClick}
              disabled={isRestoring || isDisabled}
            >
              {isRestoring ? '...' : t('MemoryRestoreSelect')}
            </TextButton>
            {restoreMessage && (
              <span
                className={`text-sm ${restoreMessage.includes('成功') || restoreMessage.includes('Success') ? 'text-green-600' : 'text-red-600'}`}
              >
                {restoreMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default MemorySettings
