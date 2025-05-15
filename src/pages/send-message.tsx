import { useState, KeyboardEvent, useEffect } from 'react'
import { IconButton } from '@/components/iconButton'
import settingsStore from '@/features/stores/settings'
import { useTranslation } from 'react-i18next'

type SendType = 'direct_send' | 'ai_generate' | 'user_input'

interface RequestBody {
  messages: string[]
  systemPrompt?: string
  useCurrentSystemPrompt: boolean
}

const SendMessage = () => {
  const [directMessages, setDirectMessages] = useState(Array(1).fill(''))
  const [aiMessages, setAiMessages] = useState(Array(1).fill(''))
  const [directFieldCount, setDirectFieldCount] = useState(1)
  const [aiFieldCount, setAiFieldCount] = useState(1)
  const [userInputMessages, setUserInputMessages] = useState(Array(1).fill(''))
  const [userInputFieldCount, setUserInputFieldCount] = useState(1)
  const [clientId, setClientId] = useState('')
  const [directResponse, setDirectResponse] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [userInputResponse, setUserInputResponse] = useState('')
  const [copySuccess, setCopySuccess] = useState<string>('')
  const [popupPosition, setPopupPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [useCurrentSystemPrompt, setUseCurrentSystemPrompt] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [activeTab, setActiveTab] = useState<SendType>('direct_send')
  const { t } = useTranslation()

  useEffect(() => {
    const storedClientId = settingsStore.getState().clientId
    if (storedClientId) {
      setClientId(storedClientId)
    }
  }, [])

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const handleSubmit = async (
    e?: React.FormEvent,
    type: SendType = 'direct_send'
  ) => {
    e?.preventDefault()
    const messages = (() => {
      switch (type) {
        case 'direct_send':
          return directMessages
        case 'ai_generate':
          return aiMessages
        case 'user_input':
          return userInputMessages
        default:
          return directMessages
      }
    })()
    if (!messages.some((msg) => msg.trim()) || !clientId.trim()) return

    const url = new URL('/api/messages', window.location.origin)
    url.searchParams.append('clientId', clientId.trim())
    url.searchParams.append('type', type)

    const body: RequestBody = {
      messages: messages.filter((msg) => msg.trim()),
      useCurrentSystemPrompt: useCurrentSystemPrompt,
      ...(useCurrentSystemPrompt ? {} : { systemPrompt: systemPrompt }),
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Oops! We haven't received a JSON response")
      }

      const data = await res.json()
      switch (type) {
        case 'direct_send':
          setDirectResponse(JSON.stringify(data, null, 2))
          setDirectMessages(Array(1).fill(''))
          setDirectFieldCount(1)
          break
        case 'ai_generate':
          setAiResponse(JSON.stringify(data, null, 2))
          setAiMessages(Array(1).fill(''))
          setAiFieldCount(1)
          break
        case 'user_input':
          setUserInputResponse(JSON.stringify(data, null, 2))
          setUserInputMessages(Array(1).fill(''))
          setUserInputFieldCount(1)
          break
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      switch (type) {
        case 'direct_send':
          setDirectResponse(errorMessage)
          break
        case 'ai_generate':
          setAiResponse(errorMessage)
          break
        case 'user_input':
          setUserInputResponse(errorMessage)
          break
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()

      const formType = (e.target as HTMLTextAreaElement).getAttribute(
        'data-form-type'
      ) as SendType
      handleSubmit(undefined, formType)
    }
  }

  const addNewField = (type: SendType) => {
    if (type === 'direct_send') {
      setDirectFieldCount((prev) => prev + 1)
    } else if (type === 'ai_generate') {
      setAiFieldCount((prev) => prev + 1)
    } else if (type === 'user_input') {
      setUserInputFieldCount((prev) => prev + 1)
    }
  }

  const removeField = (index: number, type: SendType) => {
    if (type === 'direct_send') {
      if (directFieldCount <= 1) return
      setDirectFieldCount((prev) => prev - 1)
      setDirectMessages((prev) => prev.filter((_, i) => i !== index))
    } else if (type === 'ai_generate') {
      if (aiFieldCount <= 1) return
      setAiFieldCount((prev) => prev - 1)
      setAiMessages((prev) => prev.filter((_, i) => i !== index))
    } else if (type === 'user_input') {
      if (userInputFieldCount <= 1) return
      setUserInputFieldCount((prev) => prev - 1)
      setUserInputMessages((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const copyToClipboard = async (text: string, event: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText(text)
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      setPopupPosition({ x: rect.right, y: rect.top })
      setCopySuccess(`Copied!`)
      setTimeout(() => {
        setCopySuccess('')
        setPopupPosition(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // タブに対応するレスポンスを取得
  const getActiveResponse = () => {
    switch (activeTab) {
      case 'direct_send':
        return directResponse
      case 'ai_generate':
        return aiResponse
      case 'user_input':
        return userInputResponse
      default:
        return ''
    }
  }

  // タブに対応するCURL例を取得
  const getTabCurlSample = () => {
    switch (activeTab) {
      case 'direct_send':
        return `curl -X POST -H "Content-Type: application/json" -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=direct_send'`
      case 'ai_generate':
        return `curl -X POST -H "Content-Type: application/json" -d '{"systemPrompt": "You are a helpful assistant.", "useCurrentSystemPrompt": false, "messages": ["今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=ai_generate'`
      case 'user_input':
        return `curl -X POST -H "Content-Type: application/json" -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=user_input'`
      default:
        return ''
    }
  }

  // タブの説明を取得
  const getTabDescription = () => {
    switch (activeTab) {
      case 'direct_send':
        return t('SendMessage.directSendDescription')
      case 'ai_generate':
        return t('SendMessage.aiGenerateDescription')
      case 'user_input':
        return t('SendMessage.userInputDescription')
      default:
        return ''
    }
  }

  // タブのタイトルを取得
  const getTabTitle = () => {
    switch (activeTab) {
      case 'direct_send':
        return t('SendMessage.directSendTitle')
      case 'ai_generate':
        return t('SendMessage.aiGenerateTitle')
      case 'user_input':
        return t('SendMessage.userInputTitle')
      default:
        return ''
    }
  }

  // 送信ボタンの無効化条件
  const isSendButtonDisabled = () => {
    const messages = (() => {
      switch (activeTab) {
        case 'direct_send':
          return directMessages
        case 'ai_generate':
          return aiMessages
        case 'user_input':
          return userInputMessages
        default:
          return []
      }
    })()
    return !messages.some((msg) => msg.trim()) || !clientId.trim()
  }

  // タブの切り替え
  const handleTabChange = (tab: SendType) => {
    setActiveTab(tab)
  }

  // メッセージフィールドのレンダリング
  const renderMessageFields = () => {
    let messages: string[] = []
    let fieldCount = 0
    let setMessages: React.Dispatch<React.SetStateAction<string[]>> = () => {}

    switch (activeTab) {
      case 'direct_send':
        messages = directMessages
        fieldCount = directFieldCount
        setMessages = setDirectMessages
        break
      case 'ai_generate':
        messages = aiMessages
        fieldCount = aiFieldCount
        setMessages = setAiMessages
        break
      case 'user_input':
        messages = userInputMessages
        fieldCount = userInputFieldCount
        setMessages = setUserInputMessages
        break
    }

    return (
      <div className="space-y-4">
        {[...Array(fieldCount)].map((_, index) => (
          <div key={index} className="flex gap-4">
            <textarea
              value={messages[index] || ''}
              data-form-type={activeTab}
              onChange={(e) => {
                const newMessages = [...messages]
                newMessages[index] = e.target.value
                setMessages(newMessages)
              }}
              onKeyDown={(e) => handleKeyDown(e)}
              className="border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white rounded-xl w-full px-4 text-text-primary text-base font-medium transition-all duration-200"
              rows={2}
              style={{
                lineHeight: '1.5',
                padding: '12px 16px',
                resize: 'vertical',
              }}
              placeholder={'Enter your message...'}
            />
            {fieldCount > 1 && (
              <IconButton
                iconName="24/Subtract"
                onClick={() => removeField(index, activeTab)}
                className="min-w-[44px] w-[44px] h-[44px] shrink-0 ml-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 shadow-sm transition-colors duration-200"
                isProcessing={false}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-black min-h-screen bg-purple-50 py-8">
      <div className="w-full max-w-4xl px-4 md:px-8">
        <h1 className="text-text-primary text-3xl font-bold mb-8 text-center">
          {t('SendMessage.title')}
        </h1>

        {/* Client ID セクション */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-md">
          <div className="text-text-primary font-bold mb-3 flex justify-between items-center">
            <span className="text-lg">Client ID</span>
            <button
              type="button"
              onClick={(e) => copyToClipboard(clientId, e)}
              className="px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 transition-colors duration-200"
            >
              Copy
            </button>
          </div>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none rounded-xl w-full px-4 py-3 text-text-primary text-base font-medium transition-all duration-200"
            disabled={!!settingsStore.getState().clientId}
          />
        </div>

        {/* タブナビゲーション */}
        <div className="mb-6 bg-white rounded-xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:justify-between border-b border-gray-200 mb-6">
            <button
              className={`flex items-center mb-2 md:mb-0 px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
                activeTab === 'direct_send'
                  ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500 shadow-sm'
                  : 'text-gray-500 hover:text-indigo-500 hover:bg-indigo-50'
              }`}
              onClick={() => handleTabChange('direct_send')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              {t('SendMessage.directSendTitle')}
            </button>
            <button
              className={`flex items-center mb-2 md:mb-0 px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
                activeTab === 'ai_generate'
                  ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500 shadow-sm'
                  : 'text-gray-500 hover:text-indigo-500 hover:bg-indigo-50'
              }`}
              onClick={() => handleTabChange('ai_generate')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {t('SendMessage.aiGenerateTitle')}
            </button>
            <button
              className={`flex items-center px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
                activeTab === 'user_input'
                  ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-500 shadow-sm'
                  : 'text-gray-500 hover:text-indigo-500 hover:bg-indigo-50'
              }`}
              onClick={() => handleTabChange('user_input')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {t('SendMessage.userInputTitle')}
            </button>
          </div>

          <h2 className="text-text-primary text-xl font-bold mb-4">
            {getTabTitle()}
          </h2>

          <p className="text-base mb-6 text-gray-600 whitespace-pre-line">
            {getTabDescription()}
          </p>

          {/* CURL サンプル */}
          <div className="mb-6">
            <div className="text-text-primary font-bold mb-2 flex justify-between items-center">
              <span className="text-sm text-gray-600">Curl Sample</span>
              <button
                type="button"
                onClick={(e) => copyToClipboard(getTabCurlSample(), e)}
                className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 transition-colors duration-200"
              >
                Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-xl w-full p-4 text-sm font-mono whitespace-pre-wrap break-words overflow-auto max-h-40">
              <code>{getTabCurlSample()}</code>
            </pre>
          </div>

          {/* System Prompt (AI Generate タブのみ) */}
          {activeTab === 'ai_generate' && (
            <div className="mb-6">
              <div className="text-text-primary font-bold mb-2">
                System Prompt
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className={`${
                  useCurrentSystemPrompt
                    ? 'bg-slate-100 text-gray-500 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                } border rounded-xl w-full px-4 py-3 text-text-primary text-base font-medium transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white`}
                rows={2}
                style={{
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
                disabled={useCurrentSystemPrompt}
                placeholder="Enter system prompt here..."
              />
              <div className="flex items-center mt-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCurrentSystemPrompt}
                    onChange={() =>
                      setUseCurrentSystemPrompt(!useCurrentSystemPrompt)
                    }
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">
                    {t('SendMessage.useCurrentSystemPrompt')}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* メッセージフォーム */}
          <form onSubmit={(e) => handleSubmit(e, activeTab)}>
            <div className="mb-6">
              <div className="text-text-primary font-bold mb-3">Messages</div>
              {renderMessageFields()}
              <div className="flex justify-between mt-4">
                <IconButton
                  iconName="24/Add"
                  onClick={() => addNewField(activeTab)}
                  className="rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 shadow-sm transition-colors duration-200 min-w-[44px] w-[44px] h-[44px]"
                  isProcessing={false}
                />
                <IconButton
                  iconName="24/Send"
                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 w-[120px] flex items-center justify-center text-white rounded-xl transition-colors duration-200"
                  disabled={isSendButtonDisabled()}
                  type="submit"
                  isProcessing={false}
                />
              </div>
            </div>
          </form>

          {/* レスポンス表示 */}
          {getActiveResponse() && (
            <div className="mt-6 w-full">
              <div className="text-text-primary font-bold mb-3 flex justify-between items-center">
                <span>Response</span>
                <button
                  type="button"
                  onClick={(e) => copyToClipboard(getActiveResponse(), e)}
                  className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 transition-colors duration-200"
                >
                  Copy
                </button>
              </div>
              <div className="w-full bg-slate-50 rounded-xl p-4">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-auto max-h-60 text-sm font-mono">
                  {getActiveResponse()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* コピー成功ポップアップ */}
      {copySuccess && popupPosition && (
        <div
          className="fixed bg-black text-white px-2 py-1 rounded-md text-sm shadow-lg z-50 opacity-90"
          style={{
            left: `${popupPosition.x + 8}px`,
            top: `${popupPosition.y}px`,
          }}
        >
          {copySuccess}
        </div>
      )}
    </div>
  )
}

export default SendMessage
