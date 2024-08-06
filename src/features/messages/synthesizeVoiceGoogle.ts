export async function synthesizeVoiceGoogleApi(
  message: string,
  ttsType: string
) {
  const body = {
    message: message,
    ttsType: ttsType,
    type: 'google',
  }

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as any

  return { audio: data.audio }
}
