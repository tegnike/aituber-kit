import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from '../../toggleSwitch'
import {
  getModels,
  isMultiModalModel,
  isSearchGroundingModel,
  isReasoningModel,
} from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'

interface ModelSelectorProps {
  aiService: AIService
  selectedModel: string
  customModel: boolean
  enableMultiModal?: boolean
  onModelChange: (model: string) => void
  onCustomModelToggle: () => void
  onMultiModalToggle?: () => void
  showMultiModalToggle?: boolean
  customModelValidation?: boolean
}

export const ModelSelector = ({
  aiService,
  selectedModel,
  customModel,
  enableMultiModal = false,
  onModelChange,
  onCustomModelToggle,
  onMultiModalToggle,
  showMultiModalToggle = false,
  customModelValidation = true,
}: ModelSelectorProps) => {
  const { t } = useTranslation()

  const handleCustomModelBlur = (value: string) => {
    if (customModelValidation && !value.trim()) {
      const defaultModel = getModels(aiService)[0]
      onModelChange(defaultModel)
      onCustomModelToggle()
    }
  }

  return (
    <div className="my-6">
      <div className="my-4 text-xl font-bold">{t('SelectModel')}</div>
      <div className="my-4">
        <div className="mb-2 flex items-center gap-3">
          <ToggleSwitch
            enabled={customModel}
            onChange={() => onCustomModelToggle()}
          />
          <span className="font-bold text-sm">{t('UseCustomModel')}</span>
        </div>
        {customModel ? (
          <input
            className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            type="text"
            placeholder={t('CustomModelPlaceholder')}
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value.trim())}
            onBlur={(e) => handleCustomModelBlur(e.target.value)}
          />
        ) : (
          <select
            className="px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {getModels(aiService).map((model) => {
              const isMultiModal = isMultiModalModel(aiService, model)
              const isSearchEnabled = isSearchGroundingModel(aiService, model)
              const isReasoning = isReasoningModel(aiService, model)
              const iconList: string[] = []
              if (isMultiModal) iconList.push('📷')
              if (isSearchEnabled) iconList.push('🔍')
              if (isReasoning) iconList.push('💡')
              const icons = iconList.join(' ')
              return (
                <option key={model} value={model}>
                  {model} {icons}
                </option>
              )
            })}
          </select>
        )}
      </div>

      {showMultiModalToggle && customModel && onMultiModalToggle && (
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('EnableMultiModal')}</div>
          <div className="my-2">
            <ToggleSwitch
              enabled={enableMultiModal}
              onChange={() => onMultiModalToggle()}
            />
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('EnableMultiModalDescription')}
          </div>
        </div>
      )}
    </div>
  )
}
