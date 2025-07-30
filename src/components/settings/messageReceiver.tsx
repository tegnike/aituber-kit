import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'

const MessageReceiverSetting = () => {
  const { t } = useTranslation()
  const { messageReceiverEnabled, clientId } = settingsStore()
  const [inputClientId, setInputClientId] = useState(clientId || '')
  const [isEditing, setIsEditing] = useState(false)

  // Update local state when store changes
  useEffect(() => {
    setInputClientId(clientId || '')
  }, [clientId])

  const generateClientId = useCallback(() => {
    const newClientId = uuidv4()
    settingsStore.setState({ clientId: newClientId })
    setInputClientId(newClientId)
  }, [])

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputClientId(e.target.value)
  }

  const handleSaveClientId = () => {
    const trimmedId = inputClientId.trim()
    if (trimmedId) {
      settingsStore.setState({ clientId: trimmedId })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setInputClientId(clientId || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveClientId()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

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
      {messageReceiverEnabled && (
        <>
          <div className="mt-4">
            <div className="font-bold">{t('ClientID')}</div>
            {isEditing ? (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={inputClientId}
                  onChange={handleClientIdChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 p-2 border border-gray-300 rounded-3xl"
                  placeholder={t('EnterClientID')}
                  aria-label={t('ClientID')}
                  autoFocus
                />
                <TextButton
                  onClick={handleSaveClientId}
                  className="px-3 py-2 text-sm bg-primary hover:bg-primary-hover rounded-3xl font-bold"
                >
                  {t('Save')}
                </TextButton>
                <TextButton
                  onClick={handleCancelEdit}
                  className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 rounded-3xl font-bold"
                >
                  {t('Cancel')}
                </TextButton>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <div className="flex-1 bg-gray-100 p-2 rounded-3xl">
                  {clientId || t('NoClientIDSet')}
                </div>
                <TextButton
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 text-sm bg-primary hover:bg-primary-hover rounded-3xl font-bold"
                >
                  {t('Edit')}
                </TextButton>
                <TextButton
                  onClick={generateClientId}
                  className="px-3 py-2 text-sm bg-secondary hover:bg-secondary-hover rounded-3xl font-bold"
                >
                  {t('GenerateNew')}
                </TextButton>
              </div>
            )}
          </div>
          {clientId && (
            <div className="mt-4">
              <Link href={`/send-message`} passHref legacyBehavior>
                <a
                  target="_blank" // 新しいタブで開く
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm bg-primary hover:bg-primary-hover rounded-3xl text-theme font-bold transition-colors duration-200 whitespace-nowrap"
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
          )}
        </>
      )}
    </div>
  )
}

export default MessageReceiverSetting
