import { useState, KeyboardEvent, useEffect } from 'react'
import { IconButton } from '@/components/iconButton'
import settingsStore from '@/features/stores/settings'

const SendMessage = () => {
  const [message, setMessage] = useState('')
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
    if (!message.trim() || !clientId.trim()) return

    const url = new URL('/api/messages', window.location.origin)
    url.searchParams.append('clientId', clientId.trim())

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
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
      setMessage('')
    } catch (error) {
      console.error('Error:', error)
      setResponse(
        `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
                {`curl -X POST -H "Content-Type: application/json" -d '{"message": "こんにちは、今日もいい天気ですね。"}' 'http://localhost:3000/api/messages/?clientId=${clientId}'`}
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
          <div className="my-8">
            <div className="text-text-primary typography-16 font-bold mb-8">
              Message
            </div>
            <div className="grid grid-flow-col gap-[8px] grid-cols-[1fr_min-content]">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
                rows={3}
                style={{
                  lineHeight: '1.5',
                  padding: '8px 16px',
                  resize: 'vertical',
                  minHeight: '4.5em',
                }}
              />
              <IconButton
                iconName="24/Send"
                className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
                disabled={!message.trim() || !clientId.trim()}
                type="submit"
                isProcessing={false}
              />
            </div>
          </div>
        </form>
        {response && (
          <div className="mt-4 w-full">
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
