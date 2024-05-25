// import { Message } from "../messages/messages";

// export async function getGoogleChatResponse(messages: Message[], apiKey: string, model: string) {
//   const response = await fetch("/api/google", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ messages, apiKey, model }),
//   });

//   const data = await response.json();
//   return data;
// }

// export async function getGoogleChatResponseStream(
//   messages: Message[],
//   apiKey: string,
//   model: string
// ) {
//   const response = await fetch("/api/google", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ messages, apiKey, model, stream: true }),
//   });

//   if (!response.ok) {
//     throw new Error("Google Gemini APIリクエストに失敗しました");
//   }

//   if (response.body === null) {
//     throw new Error("Google Gemini APIリクエストに失敗しました");
//   }

//   const reader = response.body.getReader();
//   const decoder = new TextDecoder("utf-8");

//   return new ReadableStream({
//     async start(controller) {
//       while (true) {
//         const { done, value } = await reader.read();

//         if (done) {
//           break;
//         }

//         const chunk = decoder.decode(value);
//         // 各行を個別に処理
//         const lines = chunk.split('\n');
//         lines.forEach(line => {
//           if (line.startsWith('event: end')) {
//             controller.close(); // ストリームの終了を検出
//             return;
//           }
//           // 'data: ' プレフィックスを取り除く
//           const jsonStr = line.replace(/^data: /, '').trim();
//           if (jsonStr) {
//             try {
//               const json = JSON.parse(jsonStr);
//               if (json.text) {
//                 controller.enqueue(json.text);
//               }
//             } catch (error) {
//               console.error("Failed to parse JSON:", error);
//             }
//           }
//         });
//       }

//       controller.close();
//     },
//   });
// }

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "../messages/messages";

export async function getGoogleChatResponse(messages: Message[], apiKey: string, model: string) {
  const { history, systemMessage } = processMessages(messages);

  const genAI = new GoogleGenerativeAI(apiKey);
  const chatModel = genAI.getGenerativeModel({ model: model, systemInstruction: systemMessage });

  const chat = chatModel.startChat({ history });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  const response = await result.response;
  const text = response.text();

  return { text };
}

export async function getGoogleChatResponseStream(
  messages: Message[],
  apiKey: string,
  model: string
) {
  const { history, systemMessage } = processMessages(messages);

  const genAI = new GoogleGenerativeAI(apiKey);
  const chatModel = genAI.getGenerativeModel({ model: model, systemInstruction: systemMessage });

  const chat = chatModel.startChat({ history });
  const result = await chat.sendMessageStream(messages[messages.length - 1].content);

  const stream = new ReadableStream({
    async start(controller) {
      let text = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        text += chunkText;
        controller.enqueue(chunkText);
      }
      controller.close();
    },
  });

  return stream;
}

function processMessages(messages: Message[]) {
  let systemMessage = '';
  const history = messages
    .filter((message, index) => {
      if (message.role === 'system') {
        systemMessage = message.content;
        return false;
      }
      return index === 0 ? message.role === 'user' : true;
    })
    .map(message => ({
      role: message.role === 'assistant' ? 'model' : message.role,
      parts: [{ text: message.content }],
    }));

  return { history, systemMessage };
}
