import { Message } from "../messages/messages";

export async function getDifyChatResponseStream(
  messages: Message[],
  apiKey: string,
  url: string,
  conversationId: string,
  setDifyConversationId: (id: string) => void
) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  const body = JSON.stringify({
    inputs: {},
    query: messages[messages.length - 1].content, // messages[-1] は TypeScript では無効です
    response_mode: "streaming",
    conversation_id: conversationId,
    user: "aituber-kit",
    files: []
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: body
  });

  if (!response.body) {
    throw new Error("Invalid response body");
  }

  const reader = response.body.getReader();

  const res = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const textChunk = new TextDecoder("utf-8").decode(value);
          const messages = textChunk.split('\n').filter(line => line.startsWith('data:'));
          messages.forEach(message => {
            const data = JSON.parse(message.slice(5)); // Remove 'data:' prefix
            if (data.event === "message") {
              controller.enqueue(data.answer);
              setDifyConversationId(data.conversation_id);
            }
          });
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });

  return res;
}
