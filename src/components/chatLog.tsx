import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { EMOTIONS } from '@/features/messages/messages'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { messageSelectors } from '@/features/messages/messageSelectors'

export const ChatLog = () => {
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const characterName = settingsStore((s) => s.characterName)
  const messages = messageSelectors.getTextAndImageMessages(
    homeStore((s) => s.chatLog)
  )

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
    <div className="absolute w-col-span-7 max-w-full h-[100svh] pb-16 z-10">
      <div className="max-h-full px-4 pt-24 pb-16 overflow-y-auto scroll-hidden">
        {messages.map((msg, i) => {
          return (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              {typeof msg.content === 'string' ? (
                <Chat
                  role={msg.role}
                  message={msg.content}
                  characterName={characterName}
                />
              ) : (
                <>
                  <Chat
                    role={msg.role}
                    message={msg.content ? msg.content[0].text : ''}
                    characterName={characterName}
                  />
                  <ChatImage
                    role={msg.role}
                    imageUrl={msg.content ? msg.content[1].image : ''}
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
}: {
  role: string
  message: string
  characterName: string
}) => {
  const emotionPattern = new RegExp(`\\[(${EMOTIONS.join('|')})\\]\\s*`, 'gi')
  const processedMessage = message.replace(emotionPattern, '')

  const roleColor =
    role !== 'user' ? 'bg-secondary text-white ' : 'bg-base-light text-primary'
  const roleText = role !== 'user' ? 'text-secondary' : 'text-primary'
  const offsetX = role === 'user' ? 'pl-10' : 'pr-10'

  return (
    <div className={`mx-auto max-w-[32rem] my-4 ${offsetX}`}>
      {role === 'code' ? (
        <pre className="whitespace-pre-wrap break-words bg-[#1F2937] text-white p-4 rounded-lg">
          <code className="font-mono text-sm">{message}</code>
        </pre>
      ) : (
        <>
          <div
            className={`px-6 py-2 rounded-t-lg font-bold tracking-wider ${roleColor}`}
          >
            {role !== 'user' ? characterName || 'CHARACTER' : 'YOU'}
          </div>
          <div className="px-6 py-4 bg-white rounded-b-lg">
            <div className={`text-base font-bold ${roleText}`}>
              {processedMessage}
            </div>
          </div>
        </>
      )}
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
    <div className={`mx-auto max-w-[32rem] my-4 ${offsetX}`}>
      <Image
        src={imageUrl}
        alt="Generated Image"
        className="rounded-lg"
        width={512}
        height={512}
      />
    </div>
  )
}
