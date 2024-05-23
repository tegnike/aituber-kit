import axios from 'axios';
import { Message } from '../messages/messages';

export async function getLocalLLMChatResponseStream(
  messages: Message[],
  localLlmUrl: string,
  model?: string
) {
  const response = await axios.post(
    localLlmUrl,
    {
      model: model,
      messages: messages,
      stream: true,
    },
    {
      responseType: 'stream',
    }
  );

  const stream = response.data;

  const res = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      let accumulatedChunks = '';
      try {
        for await (const chunk of stream) {
          accumulatedChunks += chunk;
          // console.log(accumulatedChunks);
          try {
            // 累積されたチャンクを解析
            const trimmedChunks = accumulatedChunks.trimStart();
            const data = JSON.parse(trimmedChunks.slice(6));

            // JSONが正常に解析された場合、必要なデータを抽出
            if (data.choices && data.choices.length > 0) {
              const content = data.choices[0].delta.content;
              controller.enqueue(content);
              accumulatedChunks = ''; // JSONが成功したのでチャンクをリセット

            }
          } catch (error) {
            // console.log("accumulatedChunks: `" + accumulatedChunks + "`");
            // JSONが不完全であるため、さらにチャンクを累積
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return res;
}
