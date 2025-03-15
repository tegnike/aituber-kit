import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import settingsStore, { PresetQuestion } from '@/features/stores/settings'
import { TextButton } from '../textButton'

const PresetQuestions = () => {
  const presetQuestions = settingsStore((s) => s.presetQuestions)
  const showPresetQuestions = settingsStore((s) => s.showPresetQuestions)
  const [newQuestion, setNewQuestion] = useState('')
  const { t } = useTranslation()

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      const newQuestionObj: PresetQuestion = {
        id: uuidv4(),
        text: newQuestion.trim(),
      }
      settingsStore.setState({
        presetQuestions: [...presetQuestions, newQuestionObj],
      })
      setNewQuestion('')
    }
  }

  const handleDeleteQuestion = (id: string) => {
    settingsStore.setState({
      presetQuestions: presetQuestions.filter((q) => q.id !== id),
    })
  }

  const handleUpdateQuestion = (id: string, text: string) => {
    settingsStore.setState({
      presetQuestions: presetQuestions.map((q) =>
        q.id === id ? { ...q, text } : q
      ),
    })
  }

  const handleToggleShowPresetQuestions = () => {
    settingsStore.setState({
      showPresetQuestions: !showPresetQuestions,
    })
  }

  return (
    <div className="">
      <div className="mb-2 grid-cols-2">
        <div className="mb-4 text-xl font-bold">{t('PresetQuestions')}</div>
        <div className="my-2">{t('PresetQuestionsInfo')}</div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="showPresetQuestions"
            checked={showPresetQuestions}
            onChange={handleToggleShowPresetQuestions}
            className="mr-2"
          />
          <label htmlFor="showPresetQuestions">
            {t('ShowPresetQuestions')}
          </label>
        </div>

        <div className="grid grid-flow-col grid-cols-[1fr_min-content] gap-2 mb-4">
          <input
            className="bg-white hover:bg-white-hover rounded-lg w-full px-4 py-2"
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder={t('EnterPresetQuestion')}
          />
          <TextButton onClick={handleAddQuestion}>
            {t('AddPresetQuestion')}
          </TextButton>
        </div>
      </div>

      {presetQuestions.length > 0 && (
        <div className="my-2">
          {presetQuestions.map((question) => (
            <div
              key={question.id}
              className="my-2 grid grid-flow-col grid-cols-[1fr_min-content] gap-2"
            >
              <input
                className="bg-white hover:bg-white-hover rounded-lg w-full px-4 py-2"
                type="text"
                value={question.text}
                onChange={(e) =>
                  handleUpdateQuestion(question.id, e.target.value)
                }
              />
              <TextButton onClick={() => handleDeleteQuestion(question.id)}>
                {t('Delete')}
              </TextButton>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PresetQuestions
