import { useState, KeyboardEvent } from 'react'
import { IconButton } from '@/components/iconButton'

const SendMessage = () => {
  const [message, setMessage] = useState('')
  const [clientId, setClientId] = useState('')
  const [response, setResponse] = useState('')

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!message.trim() || !clientId.trim()) return

    try {
      const res = await fetch(
        `/api/messages?clientId=${encodeURIComponent(clientId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      )

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
    <div className="flex flex-col items-center bg-base text-black p-4 min-h-screen">
      <div className="w-full max-w-4xl mt-4">
        <form onSubmit={handleSubmit} className="grid grid-flow-row gap-[8px]">
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="クライアントIDを入力"
            className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
            style={{ padding: '8px 16px' }}
          />
          <div className="grid grid-flow-col gap-[8px] grid-cols-[1fr_min-content]">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力"
              className="bg-surface1 hover:bg-surface1-hover focus:bg-surface1 rounded-16 w-full px-16 text-text-primary typography-16 font-bold"
              rows={1}
              style={{ lineHeight: '1.5', padding: '8px 16px', resize: 'none' }}
            />
            <IconButton
              iconName="24/Send"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              disabled={!message.trim() || !clientId.trim()}
              type="submit"
              isProcessing={false}
            />
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
