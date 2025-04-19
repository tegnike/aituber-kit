import { Message } from '@/features/messages/messages'
import OpenAI from 'openai'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { handleReceiveTextFromRtFn } from './handlers'
import {
  base64ToArrayBuffer,
  AudioBufferManager,
} from '@/utils/audioBufferManager'
import { messageSelectors } from '../messages/messageSelectors'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { AudioModeModel, RealtimeAPIModeVoice } from '../constants/settings'

export async function getOpenAIAudioChatResponseStream(
  messages: Message[]
): Promise<ReadableStream<string>> {
  const ss = settingsStore.getState()
  const openai = new OpenAI({
    apiKey: ss.openaiKey,
    dangerouslyAllowBrowser: true,
  })

  try {
    const response = await openai.chat.completions.create({
      model: (ss.selectAIModel as AudioModeModel) || 'gpt-4o-audio-preview',
      messages: messageSelectors.getAudioMessages(
        messages
      ) as ChatCompletionMessageParam[],
      stream: true,
      modalities: ['text', 'audio'],
      audio: {
        voice: ss.audioModeVoice as RealtimeAPIModeVoice,
        format: 'pcm16',
      },
    })

    return new ReadableStream({
      async start(controller) {
        const handleReceiveText = handleReceiveTextFromRtFn()

        const bufferManager = new AudioBufferManager(async (buffer) => {
          await handleReceiveText('', 'assistant', 'response.audio', buffer)
        })

        for await (const chunk of response) {
          const audio = (chunk.choices[0]?.delta as any)?.audio
          if (audio) {
            if (audio.transcript) {
              controller.enqueue(audio.transcript)
            }
            if (audio.data) {
              bufferManager.addData(base64ToArrayBuffer(audio.data))
            }
            if (audio.id) {
              homeStore.getState().upsertMessage({
                id: audio.id, // これで同一メッセージを更新
                role: 'assistant',
                audio: { id: audio.id },
                content: '',
              })
            }
          }
        }

        await bufferManager.flush()
        controller.close()
      },
    })
  } catch (error) {
    console.error('OpenAI Audio API error:', error)
    throw error
  }
}
