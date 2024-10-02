import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { v4 as uuidv4 } from 'uuid'

const MessageReceiverSetting = () => {
  const { t } = useTranslation()
  const { messageReceiverEnabled, clientId } = settingsStore()

  const generateClientId = () => {
    if (!clientId) {
      const newClientId = uuidv4()
      settingsStore.setState({ clientId: newClientId })
    }
  }

  useEffect(() => {
    if (messageReceiverEnabled && !clientId) {
      generateClientId()
    }
  }, [messageReceiverEnabled, clientId])

  const toggleMessageReceiver = () => {
    const newState = !messageReceiverEnabled
    settingsStore.setState({ messageReceiverEnabled: newState })
    if (newState && !clientId) {
      generateClientId()
    }
  }

  return (
    <div className="mt-8 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="font-bold">{t('MessageReceiver')}</div>
          <div className="text-text2">{t('MessageReceiverDescription')}</div>
        </div>
        <TextButton onClick={toggleMessageReceiver}>
          {messageReceiverEnabled ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
      {messageReceiverEnabled && clientId && (
        <div className="mt-4">
          <div className="font-bold">{t('ClientID')}</div>
          <div className="bg-gray-100 p-2 rounded">{clientId}</div>
        </div>
      )}
    </div>
  )
}

export default MessageReceiverSetting
