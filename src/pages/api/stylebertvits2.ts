import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  audio: Buffer;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body = JSON.parse(req.body)
  const message = body.message;
  const stylebertvits2ModelId = body.stylebertvits2ModelId
  const stylebertvit2ServerUrl = body.stylebertvit2ServerUrl

  const queryParams = new URLSearchParams({ text: message, model_id: stylebertvits2ModelId});

  const voice = await fetch(`${stylebertvit2ServerUrl}/voice?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "audio/wav",
    },
  });

  const arrayBuffer = await voice.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  res.writeHead(200, {
    'Content-Type': 'audio/wav',
    'Content-Length': buffer.length
  });
  res.end(buffer);
}