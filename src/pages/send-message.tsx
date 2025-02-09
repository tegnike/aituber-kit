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

  return (
    <div className="flex flex-col items-center text-black min-h-screen bg-background2">
      <h1 className="text-text-primary typography-32 font-bold my-24">
        {t('SendMessage.title')}
      </h1>
      <div className="w-full max-w-4xl p-24">
        <div className="mb-24 typography-16 bg-base rounded-16 p-16">
          <div className="text-text-primary font-bold mb-8 flex justify-between items-center">
            <span>Client ID</span>
            <button
              type="button"
              onClick={(e) => copyToClipboard(clientId, e)}
              className="px-8 py-2 text-sm bg-surface1 hover:bg-surface1-hover rounded-8"
            >
              Copy
            </button>
          </div>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
            style={{ padding: '8px 16px' }}
            disabled={!!settingsStore.getState().clientId}
          />
        </div>

        <div className="mb-24 bg-base rounded-16 p-16">
          <h2 className="text-text-primary typography-20 font-bold mb-24 mt-8">
            {t('SendMessage.directSendTitle')}
          </h2>
          <p className="typography-16 mb-16 whitespace-pre-line">
            {t('SendMessage.directSendDescription')}
          </p>
          <form
            onSubmit={(e) => handleSubmit(e, 'direct_send')}
            className="grid grid-flow-row gap-[8px]"
          >
            <div className="my-8 typography-16">
              <div className="text-text-primary font-bold mb-8 flex justify-between items-center">
                <span>Curl Sample</span>
                <button
                  type="button"
                  onClick={(e) =>
                    copyToClipboard(
                      `curl -X POST -H "Content-Type: application/json" -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=direct_send'`,
                      e
                    )
                  }
                  className="px-8 py-2 text-sm bg-surface1 hover:bg-surface1-hover rounded-8"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-[#1F2937] text-white rounded-16 w-full p-16 typography-16 font-bold whitespace-pre-wrap break-words">
                <code>
                  {`curl -X POST -H "Content-Type: application/json" -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=direct_send'`}
                </code>
              </pre>
            </div>
            <div className="mt-8">
              <div className="text-text-primary typography-16 font-bold mb-8">
                Messages
              </div>
              <div className="space-y-4">
                {[...Array(directFieldCount)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <textarea
                      value={directMessages[index]}
                      data-form-type="direct_send"
                      onChange={(e) => {
                        const newMessages = [...directMessages]
                        newMessages[index] = e.target.value
                        setDirectMessages(newMessages)
                      }}
                      onKeyDown={(e) => handleKeyDown(e)}
                      className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
                      rows={2}
                      style={{
                        lineHeight: '1.5',
                        padding: '8px 16px',
                        resize: 'vertical',
                      }}
                    />
                    {directFieldCount > 1 && (
                      <IconButton
                        iconName="24/Subtract"
                        onClick={() => removeField(index, 'direct_send')}
                        className="min-w-[40px] w-[40px] h-[40px] shrink-0 ml-8"
                        isProcessing={false}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <IconButton
                  iconName="24/Add"
                  onClick={() => addNewField('direct_send')}
                  className="mt-2"
                  isProcessing={false}
                />
                <IconButton
                  iconName="24/Send"
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled w-[120px]  flex items-center justify-center"
                  disabled={
                    !directMessages.some((msg) => msg.trim()) ||
                    !clientId.trim()
                  }
                  type="submit"
                  isProcessing={false}
                />
              </div>
            </div>
          </form>
          {directResponse && (
            <div className="mt-16 w-full">
              <div className="text-text-primary font-bold mb-8 flex justify-between items-center">
                <span>Response</span>
              </div>
              <div className="w-full bg-white rounded-16 p-16">
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                  {directResponse}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mb-24 bg-base rounded-16 p-16">
          <h2 className="text-text-primary typography-20 font-bold mb-24 mt-8">
            {t('SendMessage.aiGenerateTitle')}
          </h2>
          <p className="typography-16 mb-16 whitespace-pre-line">
            {t('SendMessage.aiGenerateDescription')}
          </p>
          <form
            onSubmit={(e) => handleSubmit(e, 'ai_generate')}
            className="grid grid-flow-row gap-[8px]"
          >
            <div className="my-8 typography-16">
              <div className="text-text-primary font-bold mb-8 flex justify-between items-center">
                <span>Curl Sample</span>
                <button
                  type="button"
                  onClick={(e) =>
                    copyToClipboard(
                      `curl -X POST -H "Content-Type: application/json" -d '{"systemPrompt": "You are a helpful assistant.", "useCurrentSystemPrompt": false, "messages": ["今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=ai_generate'`,
                      e
                    )
                  }
                  className="px-8 py-2 text-sm bg-surface1 hover:bg-surface1-hover rounded-8"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-[#1F2937] text-white rounded-16 w-full p-16 typography-16 font-bold whitespace-pre-wrap break-words">
                <code>
                  {`curl -X POST -H "Content-Type: application/json" -d '{"systemPrompt": "You are a helpful assistant.", "useCurrentSystemPrompt": false, "messages": ["今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=ai_generate'`}
                </code>
              </pre>
            </div>
            <div className="my-8 typography-16">
              <div className="text-text-primary font-bold mb-8">
                System Prompt
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className={`bg-surface1 ${useCurrentSystemPrompt ? 'bg-surface1-hover' : 'hover:bg-surface1-hover'} focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold`}
                rows={2}
                style={{
                  lineHeight: '1.5',
                  padding: '8px 16px',
                  resize: 'vertical',
                }}
                disabled={useCurrentSystemPrompt}
              />
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  checked={useCurrentSystemPrompt}
                  onChange={() =>
                    setUseCurrentSystemPrompt(!useCurrentSystemPrompt)
                  }
                  className="mr-4"
                />
                <label className="text-text-primary typography-16 font-bold">
                  {t('SendMessage.useCurrentSystemPrompt')}
                </label>
              </div>
            </div>
            <div className="mt-8">
              <div className="text-text-primary typography-16 font-bold mb-8">
                Messages
              </div>
              <div className="space-y-4">
                {[...Array(aiFieldCount)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <textarea
                      value={aiMessages[index]}
                      data-form-type="ai_generate"
                      onChange={(e) => {
                        const newMessages = [...aiMessages]
                        newMessages[index] = e.target.value
                        setAiMessages(newMessages)
                      }}
                      onKeyDown={(e) => handleKeyDown(e)}
                      className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
                      rows={2}
                      style={{
                        lineHeight: '1.5',
                        padding: '8px 16px',
                        resize: 'vertical',
                      }}
                    />
                    {aiFieldCount > 1 && (
                      <IconButton
                        iconName="24/Subtract"
                        onClick={() => removeField(index, 'ai_generate')}
                        className="min-w-[40px] w-[40px] h-[40px] shrink-0 ml-8"
                        isProcessing={false}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <IconButton
                  iconName="24/Add"
                  onClick={() => addNewField('ai_generate')}
                  className="mt-2"
                  isProcessing={false}
                />
                <IconButton
                  iconName="24/Send"
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled w-[120px]  flex items-center justify-center"
                  disabled={
                    !aiMessages.some((msg) => msg.trim()) || !clientId.trim()
                  }
                  type="submit"
                  isProcessing={false}
                />
              </div>
            </div>
          </form>
          {aiResponse && (
            <div className="mt-16 w-full">
              <div className="text-text-primary font-bold mb-8 flex justify-between items-center">
                <span>Response</span>
              </div>
              <div className="w-full bg-white rounded-16 p-16">
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                  {aiResponse}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mb-24 bg-base rounded-16 p-16">
          <h2 className="text-text-primary typography-20 font-bold mb-24 mt-8">
            {t('SendMessage.userInputTitle')}
          </h2>
          <p className="typography-16 mb-16 whitespace-pre-line">
            {t('SendMessage.userInputDescription')}
          </p>
          <form
            onSubmit={(e) => handleSubmit(e, 'user_input')}
            className="grid grid-flow-row gap-[8px]"
          >
            <div className="my-8 typography-16">
              <div className="text-text-primary font-bold mb-8 flex justify-between items-center">
                <span>Curl Sample</span>
                <button
                  type="button"
                  onClick={(e) =>
                    copyToClipboard(
                      `curl -X POST -H "Content-Type: application/json" -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=user_input'`,
                      e
                    )
                  }
                  className="px-8 py-2 text-sm bg-surface1 hover:bg-surface1-hover rounded-8"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-[#1F2937] text-white rounded-16 w-full p-16 typography-16 font-bold whitespace-pre-wrap break-words">
                <code>
                  {`curl -X POST -H "Content-Type: application/json" -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' '${baseUrl}/api/messages/?clientId=${clientId}&type=user_input'`}
                </code>
              </pre>
            </div>
            <div className="mt-8">
              <div className="text-text-primary typography-16 font-bold mb-8">
                Messages
              </div>
              <div className="space-y-4">
                {[...Array(userInputFieldCount)].map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <textarea
                      value={userInputMessages[index]}
                      data-form-type="user_input"
                      onChange={(e) => {
                        const newMessages = [...userInputMessages]
                        newMessages[index] = e.target.value
                        setUserInputMessages(newMessages)
                      }}
                      onKeyDown={(e) => handleKeyDown(e)}
                      className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
                      rows={2}
                      style={{
                        lineHeight: '1.5',
                        padding: '8px 16px',
                        resize: 'vertical',
                      }}
                    />
                    {userInputFieldCount > 1 && (
                      <IconButton
                        iconName="24/Subtract"
                        onClick={() => removeField(index, 'user_input')}
                        className="min-w-[40px] w-[40px] h-[40px] shrink-0 ml-8"
                        isProcessing={false}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <IconButton
                  iconName="24/Add"
                  onClick={() => addNewField('user_input')}
                  className="mt-2"
                  isProcessing={false}
                />
                <IconButton
                  iconName="24/Send"
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled w-[120px]  flex items-center justify-center"
                  disabled={
                    !userInputMessages.some((msg) => msg.trim()) ||
                    !clientId.trim()
                  }
                  type="submit"
                  isProcessing={false}
                />
              </div>
            </div>
          </form>
          {userInputResponse && (
            <div className="mt-16 w-full">
              <div className="text-text-primary font-bold mb-8 flex justify-between items-center">
                <span>Response</span>
              </div>
              <div className="w-full bg-white rounded-16 p-16">
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                  {userInputResponse}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      {copySuccess && popupPosition && (
        <div
          className="fixed bg-green-500 text-black px-4 py-2 rounded z-50"
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
