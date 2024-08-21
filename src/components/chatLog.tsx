import Image from 'next/image'
import { useEffect, useRef } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

export const ChatLog = () => {
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const characterName = settingsStore((s) => s.characterName)
  const messages = homeStore((s) => s.chatLog)

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
    <div className="absolute w-col-span-7 max-w-full h-[100svh] pb-64 z-10">
      <div className="max-h-full px-16 pt-104 pb-64 overflow-y-auto scroll-hidden">
        {messages.map((msg, i) => {
          const prevRole = i > 0 ? messages[i - 1].role : ''
          const nextRole = i < messages.length - 1 ? messages[i + 1].role : ''

          return (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              {typeof msg.content === 'string' ? (
                <Chat
                  role={msg.role}
                  message={msg.content}
                  characterName={characterName}
                  prevRole={prevRole}
                  nextRole={nextRole}
                />
              ) : (
                <>
                  <Chat
                    role={msg.role}
                    message={msg.content[0].text}
                    characterName={characterName}
                    prevRole={prevRole}
                    nextRole={nextRole}
                  />
                  <ChatImage
                    role={msg.role}
                    imageUrl={msg.content[1].image_url.url}
                    characterName={characterName}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Chat = ({
  role,
  message,
  characterName,
  prevRole,
  nextRole,
}: {
  role: string
  message: string
  characterName: string
  prevRole: string
  nextRole: string
}) => {
  const roleColor =
    role !== 'user' ? 'bg-secondary text-white' : 'bg-base text-primary'
  const roleText = role !== 'user' ? 'text-secondary' : 'text-primary'
  const offsetX = role === 'user' ? 'pl-40' : 'pr-40'

  const sameAsPrevRole = role === prevRole
  const sameAsNextRole = role === nextRole

  if (role === 'code') {
    const messageLines = message.split('\n\n')
    return (
      <div
        className={`mx-auto max-w-[32rem] ${!sameAsNextRole && 'mb-16'} ${offsetX}`}
      >
        <div
          className={`px-24 ${!sameAsPrevRole && 'pt-16 rounded-t-8'} ${!sameAsNextRole && 'rounded-b-8 pb-16'} bg-[#1F2937] text-white`}
        >
          {messageLines.map((line, index) => (
            <div
              key={index}
              className="typography-16 font-bold font-mono"
              style={{ whiteSpace: 'pre-wrap', minHeight: '1em' }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`mx-auto max-w-[32rem] ${!sameAsNextRole && 'mb-16'} ${offsetX}`}
    >
      {!sameAsPrevRole && (
        <div
          className={`px-24 py-8 rounded-t-8 font-bold tracking-wider ${roleColor}`}
        >
          {role !== 'user' ? characterName || 'CHARACTER' : 'YOU'}
        </div>
      )}
      <div
        className={`px-24 py-16 bg-white ${sameAsNextRole ? '' : 'rounded-b-8'}`}
      >
        <div className={`typography-16 font-bold ${roleText}`}>{message}</div>
      </div>
    </div>
  )
}

const ChatImage = ({
  role,
  imageUrl,
  characterName,
}: {
  role: string
  imageUrl: string
  characterName: string
}) => {
  const offsetX = role === 'user' ? 'pl-40' : 'pr-40'

  return (
    <div className={`mx-auto max-w-[32rem] my-16 ${offsetX}`}>
      <Image
        src={imageUrl}
        alt="Generated Image"
        className="rounded-8"
        width={512}
        height={512}
      />
    </div>
  )
}
