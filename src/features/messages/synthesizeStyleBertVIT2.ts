export async function synthesizeStyleBertVIT2Api(
  message: string,
  stylebertvit2ServerUrl: string,
  stylebertvits2ModelId: string
) {
  const body = {
    message: message,
    stylebertvit2ServerUrl: stylebertvit2ServerUrl,
    stylebertvits2ModelId: stylebertvits2ModelId,
    type: "stylebertvits2",
  };

  const res = await fetch("/api/stylebertvits2", {
    method: "POST",
    headers: {
      "Content-Type": "audio/wav",
    },
    body: JSON.stringify(body),
  });
  const buffer = await res.arrayBuffer();
  return buffer;
}