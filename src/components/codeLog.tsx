import { useEffect, useRef } from 'react'

import homeStore from '@/features/stores/home'

export const CodeLog = () => {
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const messages = homeStore((s) => s.codeLog)

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'center',
    })
  }, [])

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [messages])

  return (
    // 画面サイズによって変える
    <div className="absolute w-col-span-7 max-w-full h-[100svh] pb-104">
      <div className="h-full pl-64 pr-16 pt-104 pb-104">
        <div className="p-24 ml-16 h-full rounded-8 bg-base">
          <div className="h-full font-bold tracking-wider bg-base text-primary overflow-y-auto scroll-hidden">
            {messages.map((msg, i) => {
              const prevRole = i > 0 ? messages[i - 1].role : ''
              const nextRole =
                i < messages.length - 1 ? messages[i + 1].role : ''

              const content =
                typeof msg.content === 'string'
                  ? msg.content
                  : msg.content[0].text

              return (
                <div
                  key={i}
                  ref={messages.length - 1 === i ? chatScrollRef : null}
                >
                  <Chat
                    role={msg.role}
                    message={content}
                    prevRole={prevRole}
                    nextRole={nextRole}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const Chat = ({
  role,
  message,
  prevRole,
  nextRole,
}: {
  role: string
  message: string
  prevRole: string
  nextRole: string
}) => {
  const bgColor =
    role === 'code' || role === 'output' || role === 'executing'
      ? 'bg-black'
      : 'bg-white'
  let textColor: string
  switch (role) {
    case 'code':
    case 'output':
    case 'executing':
      textColor = 'text-white'
      break
    case 'assistant':
      textColor = 'text-secondary'
      break
    default:
      textColor = 'text-primary'
  }
  const same_as_prev_role = role === prevRole
  const same_as_next_role = role === nextRole

  if (role === 'code') {
    // 改行文字でメッセージを分割
    const messageLines = message.split('\n\n')
    return (
      <div className={`mx-auto ${!same_as_next_role && 'mb-16'}`}>
        <div
          className={`px-24 ${!same_as_prev_role && 'pt-16 rounded-t-8'} ${bgColor} ${!same_as_next_role && 'rounded-b-8 pb-16'}`}
        >
          {messageLines.map((line, index) => (
            <div
              key={index}
              className={`typography-16 font-bold ${textColor}`}
              style={{ whiteSpace: 'pre-wrap', minHeight: '1em' }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    )
  } else if (role === 'output' || role === 'executing') {
    // 改行文字でメッセージを分割
    const messageLines = message.split('\n')
    return (
      <div className={`mx-auto ${!same_as_next_role && 'mb-16'}`}>
        <div
          className={`px-24 ${!same_as_prev_role && 'pt-16 rounded-t-8'} ${bgColor} ${!same_as_next_role && 'rounded-b-8 pb-16'}`}
        >
          {messageLines.map((line, index) => (
            <div
              key={index}
              className={`typography-16 font-bold ${textColor}`}
              style={{ whiteSpace: 'pre-wrap', minHeight: '1em' }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    )
  } else {
    // 改行文字でメッセージを分割
    const messageLines = message.split('\n')
    return (
      <div className={`mx-auto ${!same_as_next_role && 'mb-16'}`}>
        <div
          className={`px-24 ${!same_as_prev_role && 'pt-16 rounded-t-8'} pb-16 ${bgColor} ${!same_as_next_role && 'rounded-b-8'}`}
        >
          {messageLines
            .filter((line) => line.trim() !== '')
            .map((line, index) => (
              <div
                key={index}
                className={`typography-16 font-bold ${textColor}`}
                style={{ whiteSpace: 'pre-wrap', minHeight: '1em' }}
              >
                {line}
              </div>
            ))}
        </div>
      </div>
    )
  }
}
