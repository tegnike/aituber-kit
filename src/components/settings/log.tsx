import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const Log = () => {
  const chatLog = homeStore((s) => s.chatLog)
  const selectAIService = settingsStore((s) => s.selectAIService)

  const { t } = useTranslation()

  return (
    <div className="my-40">
      <div className="my-8 grid-cols-2">
        <div className="my-16 typography-20 font-bold">
          {t('ConversationHistory')}
        </div>
        <div className="my-8">
          {selectAIService !== 'dify'
            ? t('ConversationHistoryInfo')
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
        <div className="my-8">
          {chatLog.map((value, index) => {
            return (
              <div
                key={index}
                className="my-8 grid grid-flow-col  grid-cols-[min-content_1fr] gap-x-fixed"
              >
                <div className="w-[64px] py-8">
                  {value.role === 'assistant' ? 'Character' : 'You'}
                </div>
                {typeof value.content == 'string' ? (
                  <input
                    key={index}
                    className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default Log

const handleChangeChatLog = (targetIndex: number, text: string) => {
  const hs = homeStore.getState()

  const newChatLog = hs.chatLog.map((m, i) => {
    return i === targetIndex ? { role: m.role, content: text } : m
  })

  homeStore.setState({ chatLog: newChatLog })
}
