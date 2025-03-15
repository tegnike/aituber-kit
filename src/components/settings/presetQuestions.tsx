import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

import settingsStore, { PresetQuestion } from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { IconButton } from '../iconButton'

const PresetQuestions = () => {
  const presetQuestions = settingsStore((s) => s.presetQuestions)
  const showPresetQuestions = settingsStore((s) => s.showPresetQuestions)
  const [newQuestion, setNewQuestion] = useState('')
  const { t } = useTranslation()

  // Sort questions by order
  const sortedQuestions = [...presetQuestions].sort((a, b) => a.order - b.order)

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      // Find the highest order value
      const maxOrder =
        presetQuestions.length > 0
          ? Math.max(...presetQuestions.map((q) => q.order))
          : -1

      const newQuestionObj: PresetQuestion = {
        id: uuidv4(),
        text: newQuestion.trim(),
        order: maxOrder + 1,
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

  // Fix for hydration issues with react-beautiful-dnd
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(sortedQuestions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order values
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    settingsStore.setState({
      presetQuestions: updatedItems,
    })
  }

  return (
    <div className="mb-10">
      <div className="mb-6">
        <div className="mb-4 text-xl font-bold">{t('PresetQuestions')}</div>
        <div className="my-4 text-base">{t('PresetQuestionsInfo')}</div>

        <div className="my-4">
          <TextButton onClick={handleToggleShowPresetQuestions}>
            {t(showPresetQuestions ? 'StatusOn' : 'StatusOff')}
          </TextButton>
        </div>
      </div>

      <div className="mt-4 mb-5">
        <div className="pr-1 grid grid-flow-col grid-cols-[1fr_min-content] gap-4 mt-6">
          <input
            className="text-ellipsis px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder={t('EnterPresetQuestion')}
          />
          <IconButton
            iconName="24/Add"
            onClick={handleAddQuestion}
            className="min-w-[40px] w-[40px] h-[40px] shrink-0 ml-2"
            isProcessing={false}
          />
        </div>
      </div>

      {sortedQuestions.length > 0 && (
        <div className="my-4">
          {isClient ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {sortedQuestions.map((question, index) => (
                      <Draggable
                        key={question.id}
                        draggableId={question.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`pr-1 my-4 grid grid-flow-col grid-cols-[min-content_1fr_min-content] gap-4 items-center ${
                              snapshot.isDragging
                                ? 'bg-gray-100 rounded-lg shadow-lg'
                                : ''
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-move px-2 py-3 text-gray-500 flex items-center justify-center"
                              title={t('DragToReorder')}
                            >
                              ⋮⋮
                            </div>
                            <input
                              className="text-ellipsis px-4 py-2 bg-white hover:bg-white-hover rounded-lg w-full"
                              type="text"
                              value={question.text}
                              onChange={(e) =>
                                handleUpdateQuestion(
                                  question.id,
                                  e.target.value
                                )
                              }
                            />
                            <IconButton
                              iconName="24/Subtract"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="min-w-[40px] w-[40px] h-[40px] shrink-0 ml-2"
                              isProcessing={false}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            // Fallback for SSR
            sortedQuestions.map((question) => (
              <div
                key={question.id}
                className="my-4 grid grid-flow-col grid-cols-[min-content_1fr_min-content] gap-4 items-center"
              >
                <div className="cursor-move px-2 py-3 text-gray-500 flex items-center justify-center">
                  ⋮⋮
                </div>
                <input
                  className="text-ellipsis px-4 py-2 bg-white hover:bg-white-hover rounded-lg w-full"
                  type="text"
                  value={question.text}
                  onChange={(e) =>
                    handleUpdateQuestion(question.id, e.target.value)
                  }
                />
                <IconButton
                  iconName="24/Subtract"
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="min-w-[40px] w-[40px] h-[40px] shrink-0 ml-2"
                  isProcessing={false}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default PresetQuestions
