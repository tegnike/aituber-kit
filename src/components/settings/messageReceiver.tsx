import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'

const MessageReceiverSetting = () => {
  const { t } = useTranslation()
  const { messageReceiverEnabled, clientId } = settingsStore()

  const generateClientId = useCallback(() => {
    if (!clientId) {
      const newClientId = uuidv4()
      settingsStore.setState({ clientId: newClientId })
    }
  }, [clientId])

  useEffect(() => {
    if (messageReceiverEnabled && !clientId) {
      generateClientId()
    }
  }, [messageReceiverEnabled, clientId, generateClientId])

  const toggleMessageReceiver = () => {
    const newState = !messageReceiverEnabled
    settingsStore.setState({ messageReceiverEnabled: newState })
    if (newState && !clientId) {
      generateClientId()
    }
  }

  return (
    <div className="mt-2 mb-2">
      <div className="my-4 text-xl font-bold">{t('MessageReceiver')}</div>
      <p className="">{t('MessageReceiverDescription')}</p>
      <div className="my-2">
        <TextButton onClick={toggleMessageReceiver}>
          {messageReceiverEnabled ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
      {messageReceiverEnabled && clientId && (
        <>
          <div className="mt-4">
            <div className="font-bold">{t('ClientID')}</div>
            <div className="bg-gray-100 p-2 rounded">{clientId}</div>
          </div>
          <div className="mt-4">
            <Link href={`/send-message`} passHref legacyBehavior>
              <a
                target="_blank" // 新しいタブで開く
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm bg-primary hover:bg-primary-hover rounded-3xl text-white font-bold transition-colors duration-200 whitespace-nowrap"
              >
                {t('OpenSendMessagePage')}
                <Image
                  src="/images/icons/external-link.svg"
                  alt="open in new tab"
                  width={16}
                  height={16}
                  className="ml-1"
                />
              </a>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default MessageReceiverSetting
