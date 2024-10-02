export async function synthesizeVoiceGoogleApi(
  message: string,
  ttsType: string
) {
  const body = {
    message: message,
    ttsType: ttsType,
  }

  const res = await fetch('/api/tts-google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()

  return { audio: data.audio }
}
