import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { ToggleSwitch } from '../toggleSwitch'
import { useCallback } from 'react'

const SEND_EXAMPLE = `{
  "content": "ユーザーのメッセージ",
  "type": "chat",
  "image": "data:image/png;base64,..."
}`

const RECEIVE_EXAMPLE = `{
  "text": "アシスタントの応答",
  "role": "assistant",
  "emotion": "happy",
  "type": "",
  "image": "data:image/png;base64,..."
}`

const ExternalLinkage = () => {
  const { t } = useTranslation()
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)

  const handleExternalLinkageModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({ externalLinkageMode: newMode })
  }, [])

  return (
    <div className="mb-10">
      <div className="mb-4 text-xl font-bold">{t('ExternalLinkageMode')}</div>
      <div className="my-2 text-sm whitespace-pre-wrap">
        {t('ExternalLinkageModeInfo')}
      </div>
      <div className="my-2">
        <ToggleSwitch
          enabled={externalLinkageMode}
          onChange={handleExternalLinkageModeChange}
        />
      </div>

      {externalLinkageMode && (
        <div className="my-6 border border-gray-200 rounded-lg p-4 space-y-4">
          <div>
            <div className="font-bold text-lg">
              {t('ExternalLinkageImageProtocol')}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {t('ExternalLinkageImageProtocolInfo')}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold mb-1">
              {t('ExternalLinkageSendFormat')}
            </div>
            <pre className="text-xs bg-gray-100 rounded p-3 overflow-x-auto font-mono">
              {SEND_EXAMPLE}
            </pre>
          </div>
          <div>
            <div className="text-sm font-bold mb-1">
              {t('ExternalLinkageReceiveFormat')}
            </div>
            <pre className="text-xs bg-gray-100 rounded p-3 overflow-x-auto font-mono">
              {RECEIVE_EXAMPLE}
            </pre>
          </div>
          <div className="text-xs text-gray-500">
            {t('ExternalLinkageImageNote')}
          </div>
        </div>
      )}
    </div>
  )
}
export default ExternalLinkage
