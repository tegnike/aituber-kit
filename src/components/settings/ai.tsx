import ExternalLinkage from './externalLinkage'
import ModelProvider from './modelProvider'
import { PromptType } from '@/features/constants/systemPromptConstants'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'

const AI = () => {
  const promptType = settingsStore((s) => s.promptType)
  const { t } = useTranslation()

  return (
    <>
      <ExternalLinkage />
      <ModelProvider />
      <div className="mt-24">
        {/* 既存のAI設定項目 */}
        
        {/* プロンプトタイプ選択を追加 */}
        <div className="my-24">
          <div className="my-16 typography-20 font-bold">
            {t('PromptType')}
          </div>
          <select
            value={promptType}
            onChange={(e) => {
              settingsStore.setState({
                promptType: e.target.value as PromptType
              })
            }}
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
          >
            <option value={PromptType.CHAT_PARTNER}>
              {t('ChatPartner')}
            </option>
            <option value={PromptType.GOOD_LISTENER}>
              {t('GoodListener')}
            </option>
          </select>
        </div>
      </div>
    </>
  )
}
export default AI
