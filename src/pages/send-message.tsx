import { useState, KeyboardEvent, useEffect } from 'react'
import { IconButton } from '@/components/iconButton'
import settingsStore from '@/features/stores/settings'

const SendMessage = () => {
  const [messages, setMessages] = useState(Array(5).fill(''))
  const [clientId, setClientId] = useState('')
  const [response, setResponse] = useState('')

  useEffect(() => {
    const storedClientId = settingsStore.getState().clientId
    if (storedClientId) {
      setClientId(storedClientId)
    }
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!messages.some((msg) => msg.trim()) || !clientId.trim()) return

    const url = new URL('/api/messages', window.location.origin)
    url.searchParams.append('clientId', clientId.trim())

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.filter((msg) => msg.trim()),
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Oops! We haven't received a JSON response")
      }

      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
      setMessages(Array(5).fill(''))
    } catch (error) {
      console.error('Error:', error)
      setResponse(
        `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col items-center bg-base text-black m-24 min-h-screen">
      <div className="w-full max-w-4xl p-24">
        <form onSubmit={handleSubmit} className="grid grid-flow-row gap-[8px]">
          <div className="my-8">
            <div className="text-text-primary typography-16 font-bold mb-8">
              Curl Sample
            </div>
            <pre className="bg-[#1F2937] text-white rounded-16 w-full p-16 typography-16 font-bold whitespace-pre-wrap break-words">
              <code>
                {`curl -X POST -H "Content-Type: application/json" -d '{"messages": ["こんにちは、今日もいい天気ですね。", "今日の予定を教えてください。"]}' 'http://localhost:3000/api/messages/?clientId=${clientId}'`}
              </code>
            </pre>
          </div>

          <div className="my-8">
            <div className="text-text-primary typography-16 font-bold mb-8">
              Client ID
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
          <div className="mt-8">
            <div className="text-text-primary typography-16 font-bold mb-8">
              Messages
            </div>
            {messages.map((message, index) => (
              <div
                key={index}
                className="my-8 grid grid-flow-col  grid-cols-[1fr_min-content]"
              >
                <textarea
                  value={message}
                  onChange={(e) => {
                    const newMessages = [...messages]
                    newMessages[index] = e.target.value
                    setMessages(newMessages)
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
                  rows={2}
                  style={{
                    lineHeight: '1.5',
                    padding: '8px 16px',
                    resize: 'vertical',
                    minHeight: '4.5em',
                  }}
                />
              </div>
            ))}
            <div className="flex justify-end mt-8">
              <IconButton
                iconName="24/Send"
                className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled w-[120px] h-[48px] flex items-center justify-center"
                disabled={
                  !messages.some((msg) => msg.trim()) || !clientId.trim()
                }
                type="submit"
                isProcessing={false}
              />
            </div>
          </div>
        </form>
        {response && (
          <div className="mt-16 w-full">
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default SendMessage
