export async function googleTts(message: string, ttsType: string) {
  // Imports the Google Cloud client library
  const textToSpeech = require('@google-cloud/text-to-speech')

  // Creates a client
  const client = new textToSpeech.TextToSpeechClient()

  // Construct the request
  const request = {
    input: { text: message },
    // Select the language and SSML voice gender (optional)
    voice: { languageCode: 'en-US', name: ttsType, ssmlGender: 'FEMALE' },
    // select the type of audio encoding
    audioConfig: { audioEncoding: 'LINEAR16' },
  }

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request)

  return { audio: response.audioContent }
}
