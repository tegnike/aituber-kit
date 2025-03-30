import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { v4 as uuidv4 } from 'uuid'

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
            <a
              href="/send-message"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:text-gray-800 hover:underline transition-all duration-300 ease-in-out"
            >
              {t('OpenSendMessagePage')}
            </a>
          </div>
        </>
      )}
    </div>
  )
}

export default MessageReceiverSetting
