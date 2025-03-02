import settingsStore from '@/features/stores/settings'
import { Message } from '../messages/messages'
import i18next from 'i18next'
import toastStore from '@/features/stores/toast'

function handleApiError(errorCode: string): string {
  const languageCode = settingsStore.getState().selectLanguage
  i18next.changeLanguage(languageCode)
  return i18next.t(`Errors.${errorCode || 'AIAPIError'}`)
}

export async function getDifyChatResponseStream(
  messages: Message[],
  apiKey: string,
  url: string,
  conversationId: string,
  userId: string
): Promise<ReadableStream<string>> {
  const ss = settingsStore.getState();
  const userConversationId = ss.difyConversationMap[userId] || '';
  
  // 最新のメッセージを取得（ユーザーからの質問）
  const lastMessage = messages[messages.length - 1].content;
  
  // Dify APIリクエストの形式を修正
  const response = await fetch('/api/difyChat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: lastMessage,
      apiKey,
      url,
      // 会話IDをユーザー固有のものに、または新規の場合は空文字列を送信
      conversationId: userConversationId || "",
      stream: true,
      user: userId, // ユーザーIDを必ず送信 org : "aituber-kit" + 
      inputs: {}, // 必要に応じて追加の入力パラメータ
    }),
  })
  
  console.log('difyChat request:', {
    query: lastMessage,
    conversationId,
    userId
  });

  try {
    // エラーレスポンスの詳細なログ出力
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;
      try {
        errorDetail = JSON.parse(errorText);
      } catch {
        errorDetail = errorText;
      }
      
      console.error(`Dify API エラー (${response.status}):`, errorDetail);
      
      throw new Error(
        `API request to Dify failed with status ${response.status}`,
        { cause: { errorCode: 'DifyAPIError', detail: errorDetail } }
      );
    }

    return new ReadableStream({
      async start(controller) {
        if (!response.body) {
          throw new Error('API response from Dify is empty', {
            cause: { errorCode: 'AIAPIError' },
          })
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            // 改行で分割し、最後の不完全な行をバッファに保持
            let lines = buffer.split('\n')
            buffer = lines.pop() || ''

            lines.forEach((line) => {
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5) // 'data:' プレフィックスを除去
                try {
                  const data = JSON.parse(jsonStr)
                  //console.log('difyChat data:', data) //debug
                  if (
                    data.event === 'agent_message' ||
                    data.event === 'message'
                  ) {
                    controller.enqueue(data.answer)
                    settingsStore.setState({
                      difyConversationId: data.conversation_id,
                      difyConversationMap: {
                        ...ss.difyConversationMap,
                        [userId]: data.conversation_id,
                      },
                    })
                  }
                } catch (error) {
                  console.error('Error parsing JSON:', error)
                }
              }
            })
          }
        } catch (error) {
          console.error(`Error fetching Dify API response:`, error)

          toastStore.getState().addToast({
            message: i18next.t('Errors.AIAPIError'),
            type: 'error',
            tag: 'dify-api-error',
          })
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })
  } catch (error: any) {
    console.error('Dify API エラー詳細:', error);
    const errorMessage = handleApiError(error.cause?.errorCode || 'AIAPIError');
    
    toastStore.getState().addToast({
      message: errorMessage,
      type: 'error',
      tag: 'dify-api-error',
    });
    
    throw error;
  }
}
