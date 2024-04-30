// pages/api/anthropic.ts
import { NextApiRequest, NextApiResponse } from "next";
import { Anthropic } from "@anthropic-ai/sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages, apiKey, stream } = req.body;

  const client = new Anthropic({ apiKey });
  const systemMessage = messages.find((message: any) => message.role === "system");
  const userMessages = messages.filter((message: any) => message.role !== "system");

  if (stream) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    await client.messages.stream({
      system: systemMessage?.content,
      messages: userMessages,
      model: "claude-3-opus-20240229",
      max_tokens: 200,
    })
    .on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`);
    })
    .on('error', (error) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
    })
    .on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
      res.end();
    });
  } else {
    const response = await client.messages.create({
      system: systemMessage?.content,
      messages: userMessages,
      model: "claude-3-opus-20240229",
      max_tokens: 200,
    });

    res.status(200).json({ message: response.content });
  }
}