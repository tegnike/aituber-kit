import { OpenAI } from "openai";
import { Message } from "../messages/messages";

export async function getChatResponse(messages: Message[], apiKey: string) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const data = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
  });

  const [aiRes] = data.choices;
  const message = aiRes.message?.content || "エラーが発生しました";

  return { message: message };
}

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string
) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    stream: true,
    max_tokens: 200,
  });

  const res = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        for await (const chunk of stream) {
          const messagePiece = chunk.choices[0].delta.content;
          if (!!messagePiece) {
            controller.enqueue(messagePiece);
          }
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
