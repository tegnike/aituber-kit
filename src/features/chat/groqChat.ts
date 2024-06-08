import { Message } from "../messages/messages";

export async function getGroqChatResponse(messages: Message[], apiKey: string, model: string) {
  const response = await fetch("/api/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, apiKey, model }),
  });

  const data = await response.json();
  return data;
}

export async function getGroqChatResponseStream(messages: Message[], apiKey: string, model: string) {
  const response = await fetch("/api/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, apiKey, model, stream: false }),
  });

  if (!response.ok) {
    throw new Error("Groq API request failed");
  }

  if (!response.body) {
    throw new Error("Groq API response is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  return new ReadableStream({
    async start(controller) {
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // const chunk = decoder.decode(value, { stream: true });
        // controller.enqueue(chunk);

        buffer += decoder.decode(value, { stream: true });

        // バッファを処理し、「{"message":」文字列を削除する
        buffer = buffer.replace(/{"message":\s*"/g, '');

        // バッファが完全なメッセージを含んでいる場合、それを送信する。
        if (buffer.includes('"}')) {
          const messages = buffer.split('"}');
          
          for (let i = 0; i < messages.length - 1; i++) {
            controller.enqueue(messages[i]);
          }
          
          buffer = messages[messages.length - 1];
        }
      }

      console.log('buffer', buffer);

      // 残りのバッファを処理する。
      if (buffer.length > 0) {
        controller.enqueue(buffer);
      }

      controller.close();
    },
  });
}
