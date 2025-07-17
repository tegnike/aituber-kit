import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { messageSelectors } from '@/features/messages/messageSelectors'

const Log = () => {
  const chatLog = messageSelectors.getTextAndImageMessages(
    homeStore((s) => s.chatLog)
  )
  const selectAIService = settingsStore((s) => s.selectAIService)
  const maxPastMessages = settingsStore((s) => s.maxPastMessages)

  const { t } = useTranslation()

  const handleChangeChatLog = (targetIndex: number, text: string) => {
    const newChatLog = chatLog.map((m, i) => {
      return i === targetIndex ? { role: m.role, content: text } : m
    })

    homeStore.setState({ chatLog: newChatLog })
  }

  const handleDeleteMessage = (targetIndex: number) => {
    const newChatLog = chatLog.filter((_, i) => i !== targetIndex)
    homeStore.setState({ chatLog: newChatLog })
  }

  return (
    <div className="">
      <div className="mb-2 grid-cols-2">
        <div className="flex items-center mb-4">
          <Image
            src="/images/setting-icons/conversation-history.svg"
            alt="Conversation History"
            width={24}
            height={24}
            className="mr-2"
          />
          <h2 className="text-2xl font-bold">{t('ConversationHistory')}</h2>
        </div>
        <div className="my-2">
          {selectAIService !== 'dify'
            ? t('ConversationHistoryInfo', { count: maxPastMessages })
            : t('DifyInfo2')}
        </div>
        <TextButton
          onClick={() => {
            homeStore.setState({ chatLog: [] })
            settingsStore.setState({ difyConversationId: '' })
          }}
        >
          {t('ConversationHistoryReset')}
        </TextButton>
      </div>

      {chatLog.length > 0 && (
        <div className="my-2">
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
                  </button>
                </div>
              )
            )
          })}
        </div>
      )}
    </div>
  )
}
export default Log
