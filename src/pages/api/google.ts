// import { NextApiRequest, NextApiResponse } from "next";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { Message } from "@/features/messages/messages";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const { messages, apiKey, model, stream } = req.body;
//   const systemMessage = messages.find((message: any) => message.role === "system");
//   let userMessages = messages.filter((message: any) => message.role !== "system");

//   const genAI = new GoogleGenerativeAI(apiKey);
//   const geminiModel = genAI.getGenerativeModel({ model: "models/" + model, systemInstruction: systemMessage.content });

//   let filteredMessages = userMessages
//     .filter((message: Message) => message.content !== "")
//     .map((message: Message) => ({
//       role: message.role === "assistant" ? "model" : message.role,
//       parts: [{ text: message.content }],
//     }));

//   // 最初の要素の role が 'user' でなければ、その要素を除外
//   if (filteredMessages.length > 0 && filteredMessages[0].role !== 'user') {
//     filteredMessages = filteredMessages.slice(1);
//   }

//   const lastMessage = filteredMessages[filteredMessages.length - 1].parts[0].text;

//   if (stream) {
//     res.writeHead(200, {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     });

//     const chat = geminiModel.startChat({
//       history: filteredMessages,
//       generationConfig: {
//         maxOutputTokens: 200,
//       },
//     });

//     const result = await chat.sendMessageStream(lastMessage);
  
//     for await (const chunk of result.stream) {
//       const text = await chunk.text();
//       console.log(text);
//       res.write(`data: ${JSON.stringify({ text: text })}\n\n`);
//     }

//     res.write("event: end\n\n");
//     res.end();
//   } else {
//     const chat = await geminiModel.startChat({
//       history: filteredMessages,
//       generationConfig: {
//         maxOutputTokens: 200,
//       },
//     });

//     const result = await chat.sendMessage(lastMessage);
//     const response = await result.response;

//     res.status(200).json({ message: response.text() });
//   }
// }
