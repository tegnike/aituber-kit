import { OpenAI } from "openai";
import { Message } from "../messages/messages";
import { ChatCompletionMessageParam } from "openai/resources";

export async function getOpenAIChatResponse(messages: Message[], apiKey: string, model: string) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    const data = await openai.chat.completions.create({
      model: model,
      messages: messages as ChatCompletionMessageParam[],
    });

    const [aiRes] = data.choices;
    const message = aiRes.message?.content || "[sad]回答生成時にエラーが発生しました。";

    try {
      JSON.parse(message);
      return { message: message };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { message: "[sad]回答生成時にエラーが発生しました。" };
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { message: "[sad]回答生成時にエラーが発生しました。" };
  }
}

export async function getOpenAIChatResponseStream(
  messages: Message[],
  apiKey: string,
  model: string
) {
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = await openai.chat.completions.create({
    model: model,
    messages: messages as ChatCompletionMessageParam[],
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
