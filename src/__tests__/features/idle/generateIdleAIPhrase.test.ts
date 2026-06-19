import { getAIChatResponseStream } from '@/features/chat/aiChatFactory'
import { generateIdleAIPhrase } from '@/features/idle/generateIdleAIPhrase'

jest.mock('@/features/chat/aiChatFactory', () => ({
  getAIChatResponseStream: jest.fn(),
}))

function createTextStream(text: string): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(text)
      controller.close()
    },
  })
}

describe('generateIdleAIPhrase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('combines the character prompt with the idle prompt template', async () => {
    ;(getAIChatResponseStream as jest.Mock).mockResolvedValue(
      createTextStream('[happy]こんにちは！')
    )

    await expect(
      generateIdleAIPhrase(
        '展示会の来場者に向けて一言話してください。',
        'あなたは明るいAIキャラクターです。'
      )
    ).resolves.toEqual({
      text: 'こんにちは！',
      emotion: 'happy',
    })

    expect(getAIChatResponseStream).toHaveBeenCalledWith([
      {
        role: 'system',
        content: expect.stringContaining(
          'あなたは明るいAIキャラクターです。\n\n展示会の来場者に向けて一言話してください。'
        ),
      },
      { role: 'user', content: 'セリフを一つ生成してください。' },
    ])
    expect(
      (getAIChatResponseStream as jest.Mock).mock.calls[0][0][0].content
    ).toContain('回答は以下の書式で返してください。')
  })
})
