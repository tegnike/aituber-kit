# Voice Settings

## Overview

In voice settings, you can configure settings related to AI character voice synthesis. You can select various voice synthesis engines and adjust voice quality and parameters.

```bash
# Voice synthesis engine to use
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

::: warning Note
If Realtime API mode or Audio mode is enabled, voice settings will not be used.
:::

## Selecting a Voice Synthesis Engine

Select the voice synthesis engine used by the AI character. The following engines are supported:

- VOICEVOX: High-quality voice synthesis engine specialized for Japanese
- Koeiromap: Voice synthesis engine for Japanese with rich emotional expression
- Google Text-to-Speech: Google Cloud Text-to-Speech service supporting multiple languages
- Style-Bert-VITS2: High-quality voice synthesis engine with style control (supports Japanese, English, Chinese)
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

Select from speakers available in VOICEVOX. You can test play the selected speaker's voice with the "Test Voice" button.

### Voice Parameter Adjustment

- **Speed**: Adjustable in the range of 0.5 to 2.0 (higher values make it speak faster)
- **Pitch**: Adjustable in the range of -0.15 to 0.15 (higher values make the voice higher)
- **Intonation**: Adjustable in the range of 0.0 to 2.0 (higher values strengthen intonation)

## Koeiromap

```bash
# API Key
NEXT_PUBLIC_KOEIROMAP_KEY=
```

[Koeiromap](https://koemotion.rinna.co.jp) is a voice synthesis engine for Japanese with rich emotional expression. It has now been renamed to Koemotion.

### API Key

Set the API key to use the Koeiromap API. API keys can be obtained from [Koemotion](https://koemotion.rinna.co.jp).

### Presets and Adjustments

- **Presets**: You can select from presets such as "Cute", "Energetic", "Cool", and "Deep"
- **X-axis**: Adjust voice quality in the range of -10 to 10
- **Y-axis**: Adjust voice quality in the range of -10 to 10

## Google Text-to-Speech

```bash
# Path to JSON file for authentication
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
# API Key
GOOGLE_TTS_KEY=""
# Language/Model Settings
NEXT_PUBLIC_GOOGLE_TTS_TYPE=
```

Google Cloud Text-to-Speech is a voice synthesis service supporting multiple languages.

### Settings

- **Language Selection**: Set the language/voice model to use
- **Authentication**: Requires an API key or authentication JSON file (credentials.json)

For detailed voice models, refer to the [Google Cloud Official Documentation](https://cloud.google.com/text-to-speech/docs/voices).

## ElevenLabs

```bash
# API Key
ELEVENLABS_API_KEY=""
# Voice ID
ELEVENLABS_VOICE_ID=""
```

[ElevenLabs](https://elevenlabs.io/api) is a high-quality voice synthesis service supporting multiple languages.

### API Key

Set the API key to use the ElevenLabs API.

### Voice ID

Set the ID of the voice to use (can be checked from the [ElevenLabs API](https://api.elevenlabs.io/v1/voices))

## OpenAI TTS

```bash
# API Key
OPENAI_TTS_KEY=""
# Voice Type
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# Model
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# Speed
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

A multilingual voice synthesis service provided by OpenAI.

### API Key

Set the API key to use the OpenAI API.

### Voice Parameter Adjustment

- **Voice Type**: Select from alloy, echo, fable, onyx, nova, shimmer
- **Model**: Select from tts-1 (standard) or tts-1-hd (high quality)
- **Speed**: Adjustable in the range of 0.25 to 4.0

## Azure OpenAPI TTS

```bash
# API Key
AZURE_TTS_KEY=""
# Endpoint
AZURE_TTS_ENDPOINT=""
# Voice Type
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# Speed
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

A multilingual voice synthesis service provided by Microsoft Azure.

### API Key

Set the Azure TTS API key.

### Endpoint

Set the Azure TTS endpoint URL.

### Voice Parameter Adjustment

- **Voice Type**: Select the voice type to use
- **Speed**: Adjustable in the range of 0.25 to 4.0
