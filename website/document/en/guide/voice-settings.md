# Voice Synthesis Settings

## Overview

Voice synthesis settings allow you to configure settings related to AI character voice synthesis. You can select various voice synthesis engines and adjust voice quality and parameters.

```bash
# Voice synthesis engine to use
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

::: warning Note
Voice synthesis settings are not used when Realtime API mode or Audio mode is enabled.
:::

## Selecting a Voice Synthesis Engine

Select the voice synthesis engine that your AI character will use. The following engines are supported:

- VOICEVOX: High-quality voice synthesis engine specialized for Japanese
- Koeiromap: Voice synthesis engine for Japanese with rich emotional expression
- Google Text-to-Speech: Google Cloud Text-to-Speech service supporting multiple languages
- Style-Bert-VITS2: High-quality voice synthesis engine with style control (supports Japanese, English, and Chinese)
- AivisSpeech: Japanese voice synthesis engine that makes Style-Bert-VITS2 models easy to use
- GSVI TTS: Customizable voice synthesis engine
- ElevenLabs: High-quality voice synthesis service supporting multiple languages
- OpenAI TTS: OpenAI's voice synthesis service supporting multiple languages
- Azure TTS: Microsoft Azure's multilingual voice synthesis service
- Nijivoice: Japanese voice synthesis service with over 100 voices available

## VOICEVOX

```bash
# Server URL
VOICEVOX_SERVER_URL=http://localhost:50021
# Speaker ID
NEXT_PUBLIC_VOICEVOX_SPEAKER=46
# Speed
NEXT_PUBLIC_VOICEVOX_SPEED=1.0
# Pitch
NEXT_PUBLIC_VOICEVOX_PITCH=0.0
# Intonation
NEXT_PUBLIC_VOICEVOX_INTONATION=1.0
```

[VOICEVOX](https://voicevox.hiroshiba.jp/) is a high-quality voice synthesis engine specialized for Japanese.

### Server URL

Set the URL to access the VOICEVOX Engine API. The standard URL for running VOICEVOX locally is `http://localhost:50021`.

### Speaker Selection

Select from available speakers in VOICEVOX. You can test play the selected speaker's voice with the "Test Voice" button.

### Voice Parameter Adjustment

- **Speed**: Adjustable in the range of 0.5 to 2.0 (higher values make speech faster)
- **Pitch**: Adjustable in the range of -0.15 to 0.15 (higher values make the voice higher)
- **Intonation**: Adjustable in the range of 0.0 to 2.0 (higher values make intonation stronger)

## Koeiromap

```bash
# API key
NEXT_PUBLIC_KOEIROMAP_KEY=
```

[Koeiromap](https://koemotion.rinna.co.jp) is a voice synthesis engine for Japanese with rich emotional expression. It has now been renamed to Koemotion.

### API Key

Set the API key for using the Koeiromap API. API keys can be obtained from [Koemotion](https://koemotion.rinna.co.jp).

### Presets and Adjustment

- **Presets**: You can select from presets like "Cute", "Energetic", "Cool", and "Deep"
- **X-axis**: Adjust voice quality in the range of -10 to 10
- **Y-axis**: Adjust voice quality in the range of -10 to 10

## Google Text-to-Speech

```bash
# Path to JSON file for authentication
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
# API key
GOOGLE_TTS_KEY=""
# Language/model setting
NEXT_PUBLIC_GOOGLE_TTS_TYPE=
```

Google Cloud Text-to-Speech is a voice synthesis service supporting multiple languages.

### Settings

- **Language Selection**: Set the language/voice model to use
- **Authentication**: API key or authentication JSON file (credentials.json) is required

For detailed voice models, refer to the [Google Cloud official documentation](https://cloud.google.com/text-to-speech/docs/voices).

## Style-Bert-VITS2

```bash
# Server URL
STYLEBERTVITS2_SERVER_URL=""
# API key
STYLEBERTVITS2_API_KEY=""
# Model ID
NEXT_PUBLIC_STYLEBERTVITS2_MODEL_ID=0
# Style
NEXT_PUBLIC_STYLEBERTVITS2_STYLE=Neutral
# SDP/DP mix ratio
NEXT_PUBLIC_STYLEBERTVITS2_SDP_RATIO=0.2
# Speaking speed
NEXT_PUBLIC_STYLEBERTVITS2_LENGTH=1.0
```

[Style-Bert-VITS2](https://github.com/litagin02/Style-Bert-VITS2) is a high-quality voice synthesis engine with style control. It supports Japanese, English, and Chinese.

### Server URL

Set the URL for the Style-Bert-VITS2 server.

### API Key

This is required when launched with RunPod. Generally not needed.

### Voice Parameter Adjustment

- **Model ID**: Specify the ID of the model to use
- **Style**: Specify the voice style (e.g., Neutral)
- **SDP/DP Mix Ratio**: Adjustable in the range of 0.0 to 1.0
- **Speaking Speed**: Adjustable in the range of 0.0 to 2.0

## AivisSpeech

```bash
# Server URL
AIVIS_SPEECH_SERVER_URL=http://localhost:10101
# Speaker ID
NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER=888753760
# Speed
NEXT_PUBLIC_AIVIS_SPEECH_SPEED=1.0
# Pitch
NEXT_PUBLIC_AIVIS_SPEECH_PITCH=0.0
# Intonation
NEXT_PUBLIC_AIVIS_SPEECH_INTONATION=1.0
```

[AivisSpeech](https://aivis-project.com/) is a Japanese voice synthesis engine.

### Server URL

Set the URL for the AivisSpeech server. The standard URL for running AivisSpeech locally is `http://localhost:10101`.

### Speaker Selection

Select from available speakers in AivisSpeech. You can update the speaker list with the "Update Speaker List" button.

### Voice Parameter Adjustment

- **Speed**: Adjustable in the range of 0.5 to 2.0 (higher values make speech faster)
- **Speaker Selection**: Select from available speakers
- **Speed**: Adjustable in the range of 0.5 to 2.0
- **Pitch**: Adjustable in the range of -0.15 to 0.15
- **Intonation**: Adjustable in the range of 0.0 to 2.0

## GSVI TTS

```bash
# Server URL
NEXT_PUBLIC_GSVI_TTS_URL=http://127.0.0.1:5000/tts
# Model ID
NEXT_PUBLIC_GSVI_TTS_MODEL_ID=0
# Batch size
NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE=2
# Speaking rate
NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE=1.0
```

GSVI TTS is a customizable voice synthesis engine.

### Server URL

Set the URL for the GSVI TTS server. The standard URL for running GSVI TTS locally is `http://127.0.0.1:5000/tts`.

### Voice Parameter Adjustment

- **Model ID**: Specify the ID of the model to use
- **Batch Size**: Affects inference speed (1-100, larger is faster but uses more memory)
- **Speaking Rate**: Adjustable in the range of 0.5 to 2.0

## ElevenLabs

```bash
# API key
ELEVENLABS_API_KEY=""
# Voice ID
ELEVENLABS_VOICE_ID=""
```

[ElevenLabs](https://elevenlabs.io/api) is a high-quality voice synthesis service supporting multiple languages.

### API Key

Set the API key for using the ElevenLabs API.

### Voice ID

Set the ID of the voice to use (can be checked from the [ElevenLabs API](https://api.elevenlabs.io/v1/voices))

## OpenAI TTS

```bash
# API key
OPENAI_TTS_KEY=""
# Voice type
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# Model
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# Speaking speed
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

OpenAI's multilingual voice synthesis service.

### API Key

Set the API key for using the OpenAI API.

### Voice Parameter Adjustment

- **Voice Type**: Select from alloy, echo, fable, onyx, nova, shimmer
- **Model**: Select from tts-1 (standard), tts-1-hd (high quality), or gpt-4o-mini-tts
- **Speaking Speed**: Adjustable in the range of 0.25 to 4.0

## Azure OpenAPI TTS

```bash
# API key
AZURE_TTS_KEY=""
# Endpoint
AZURE_TTS_ENDPOINT=""
# Voice type
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# Speaking speed
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

Microsoft Azure's multilingual voice synthesis service.

### API Key

Set the Azure TTS API key.

### Endpoint

Set the Azure TTS endpoint URL.

### Voice Parameter Adjustment

- **Voice Type**: Select the voice type to use
- **Speaking Speed**: Adjustable in the range of 0.25 to 4.0

## Nijivoice

```bash
# API key
NIJIVOICE_API_KEY=""
# Speaker ID
NEXT_PUBLIC_NIJIVOICE_ACTOR_ID=""
# Speaking speed
NEXT_PUBLIC_NIJIVOICE_SPEED=1.0
# Emotional level
NEXT_PUBLIC_NIJIVOICE_EMOTIONAL_LEVEL=0.0
# Voice duration
NEXT_PUBLIC_NIJIVOICE_SOUND_DURATION=1.0
```

[Nijivoice](https://app.nijivoice.com/) is a voice synthesis service for Japanese.

### API Key

Set the Nijivoice API key.

### Voice Parameter Adjustment

- **Speaker ID**: Select the speaker to use
- **Speaking Speed**: Adjustable in the range of 0.4 to 3.0. By default, the recommended speaking speed for each character is automatically set
- **Emotional Level**: Adjustable in the range of 0 to 1.5
- **Voice Duration**: Adjustable in the range of 0 to 1.7
