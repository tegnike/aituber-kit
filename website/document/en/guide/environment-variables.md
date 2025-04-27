# Environment Variables List

## Overview

This page explains all environment variables that can be used with AITuberKit. These environment variables can be set in the `.env` file to customize the behavior of the application.

::: tip
Samples of all environment variables are listed in the `.env.example` file. Copy this file to create a `.env` file.
:::

## Basic Settings

For details, see [Basic Settings](/guide/basic-settings).

```bash
# Default language setting (specify one of the following values)
# ja: Japanese, en: English, ko: Korean, zh: Chinese (Traditional), vi: Vietnamese
# fr: French, es: Spanish, pt: Portuguese, de: German
# ru: Russian, it: Italian, ar: Arabic, hi: Hindi, pl: Polish
NEXT_PUBLIC_SELECT_LANGUAGE=en

# Setting to pronounce English words in Japanese (true/false)
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false

# Background image path
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/backgrounds/bg-c.png

# Assistant text display setting (true/false)
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true

# Character name display setting (true/false)
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true

# Control panel display setting (true/false)
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true

# Character preset menu display setting (true/false)
NEXT_PUBLIC_SHOW_CHARACTER_PRESET_MENU=true
```

## Character Settings

For details, see [Character Settings](/guide/character/common).

### Common Settings

```bash
# Character name
NEXT_PUBLIC_CHARACTER_NAME=Nike-chan

# Model type to use (vrm or live2d)
NEXT_PUBLIC_MODEL_TYPE=vrm

# Custom preset names
NEXT_PUBLIC_CUSTOM_PRESET_NAME1="Preset 1"
NEXT_PUBLIC_CUSTOM_PRESET_NAME2="Preset 2"
NEXT_PUBLIC_CUSTOM_PRESET_NAME3="Preset 3"
NEXT_PUBLIC_CUSTOM_PRESET_NAME4="Preset 4"
NEXT_PUBLIC_CUSTOM_PRESET_NAME5="Preset 5"

# Character presets
NEXT_PUBLIC_CHARACTER_PRESET1="You are an AI assistant named Nike."
NEXT_PUBLIC_CHARACTER_PRESET2="You are an AI assistant named Nike."
NEXT_PUBLIC_CHARACTER_PRESET3="You are an AI assistant named Nike."
NEXT_PUBLIC_CHARACTER_PRESET4="You are an AI assistant named Nike."
NEXT_PUBLIC_CHARACTER_PRESET5="You are an AI assistant named Nike."
```

### VRM Settings

```bash
# Path to the selected VRM model
NEXT_PUBLIC_SELECTED_VRM_PATH=/vrm/default.vrm
```

### Live2D Settings

```bash
# Path to the model file of the selected Live2D model
NEXT_PUBLIC_SELECTED_LIVE2D_PATH=/live2d/modername/model3.json

# Emotion settings (multiple can be specified with commas)
NEXT_PUBLIC_NEUTRAL_EMOTIONS=Neutral
NEXT_PUBLIC_HAPPY_EMOTIONS=Happy,Happy2
NEXT_PUBLIC_SAD_EMOTIONS=Sad,Sad2,Troubled
NEXT_PUBLIC_ANGRY_EMOTIONS=Angry,Focus
NEXT_PUBLIC_RELAXED_EMOTIONS=Relaxed
NEXT_PUBLIC_SURPRISED_EMOTIONS=Surprised

# Motion group settings
NEXT_PUBLIC_IDLE_MOTION_GROUP=Idle
NEXT_PUBLIC_NEUTRAL_MOTION_GROUP=Neutral
NEXT_PUBLIC_HAPPY_MOTION_GROUP=Happy
NEXT_PUBLIC_SAD_MOTION_GROUP=Sad
NEXT_PUBLIC_ANGRY_MOTION_GROUP=Angry
NEXT_PUBLIC_RELAXED_MOTION_GROUP=Relaxed
NEXT_PUBLIC_SURPRISED_MOTION_GROUP=Surprised
```

## AI Settings

For details, see [AI Settings](/guide/ai/common).

### Common Settings

```bash
# AI service selection
# openai, anthropic, google, azure, groq, cohere,
# mistralai, perplexity, fireworks, deepseek, localLlm, dify
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# Selected AI model name
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# Number of past messages to retain
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# Temperature parameter to adjust conversation randomness (0.0-2.0)
NEXT_PUBLIC_TEMPERATURE=0.7

# Maximum number of tokens
NEXT_PUBLIC_MAX_TOKENS=4096
```

### AI Service Settings

```bash
# OpenAI API key
OPENAI_API_KEY=sk-...

# Anthropic API key
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini API key
GOOGLE_API_KEY=...

# Enable search grounding feature
NEXT_PUBLIC_USE_SEARCH_GROUNDING=true

# Azure OpenAI API key
AZURE_API_KEY=...
# Azure OpenAI endpoint
AZURE_ENDPOINT="https://RESOURCE_NAME.openai.azure.com/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=API_VERSION"

# Groq API key
GROQ_API_KEY=...

# Cohere API key
COHERE_API_KEY=...

# Mistral AI API key
MISTRALAI_API_KEY=...

# Perplexity API key
PERPLEXITY_API_KEY=...

# Fireworks API key
FIREWORKS_API_KEY=...

# DeepSeek API key
DEEPSEEK_API_KEY=...

# Local LLM URL
# ex. Ollama: http://localhost:11434/v1/chat/completions
# ex. LM Studio: http://localhost:1234/v1/chat/completions
NEXT_PUBLIC_LOCAL_LLM_URL=""
# Local LLM model
NEXT_PUBLIC_LOCAL_LLM_MODEL=""

# Dify API key
DIFY_API_KEY=""
# Dify API URL
DIFY_URL=""

# Custom API URL
NEXT_PUBLIC_CUSTOM_API_URL=""
# Custom API headers
NEXT_PUBLIC_CUSTOM_API_HEADERS=""
# Custom API body
NEXT_PUBLIC_CUSTOM_API_BODY=""
# Enable system messages in custom API (true/false)
NEXT_PUBLIC_INCLUDE_SYSTEM_MESSAGES_IN_CUSTOM_API=true
```

### Realtime API Settings

```bash
# Enable realtime API mode
NEXT_PUBLIC_REALTIME_API_MODE=false

# Set in frontend environment variables when using Realtime API
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_AZURE_API_KEY=...
NEXT_PUBLIC_AZURE_ENDPOINT=...

# Realtime API mode content type (input_text or input_audio)
NEXT_PUBLIC_REALTIME_API_MODE_CONTENT_TYPE=input_text

# Realtime API mode voice
# OpenAI: alloy, coral, echo, verse, ballad, ash, shimmer, sage
# Azure: alloy, amuch, breeze, cove, dan, echo, elan, ember, jupiter, marilyn, shimmer
NEXT_PUBLIC_REALTIME_API_MODE_VOICE=alloy
```

### Audio Mode Settings

```bash
# Enable audio mode
NEXT_PUBLIC_AUDIO_MODE=false

# Set in frontend environment variables when using Audio API
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Audio mode input type (input_text or input_audio)
NEXT_PUBLIC_AUDIO_MODE_INPUT_TYPE=input_text

# Audio mode voice (alloy, coral, echo, verse, ballad, ash, shimmer, sage)
NEXT_PUBLIC_AUDIO_MODE_VOICE=alloy
```

### External Linkage Mode Settings

```bash
# Enable external linkage mode
NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE=true
```

## Voice Synthesis Settings

For details, see [Voice Synthesis Settings](/guide/voice-settings).

```bash
# Voice synthesis engine to use
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox

# VOICEVOX
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

# Koeiromap
# API key
NEXT_PUBLIC_KOEIROMAP_KEY=

# Google Text-to-Speech
# Path to JSON file for authentication
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
# API key
GOOGLE_TTS_KEY=""
# Language/model setting
NEXT_PUBLIC_GOOGLE_TTS_TYPE=

# Style-Bert-VITS2
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

# AivisSpeech
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

# GSVI TTS
# Server URL
NEXT_PUBLIC_GSVI_TTS_URL=http://127.0.0.1:5000/tts
# Model ID
NEXT_PUBLIC_GSVI_TTS_MODEL_ID=0
# Batch size
NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE=2
# Speaking rate
NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE=1.0

# ElevenLabs
# API key
ELEVENLABS_API_KEY=""
# Voice ID
ELEVENLABS_VOICE_ID=""

# OpenAI TTS
# API key
OPENAI_TTS_KEY=""
# Voice type
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# Model
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# Speaking speed
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0

# Azure OpenAPI TTS
# API key
AZURE_TTS_KEY=""
# Endpoint
AZURE_TTS_ENDPOINT=""
# Voice type
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# Speaking speed
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0

# Nijivoice
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

## Voice Input Settings

```bash
# Speech recognition mode (browser, whisper)
NEXT_PUBLIC_SPEECH_RECOGNITION_MODE=browser

# Speech recognition timeout (seconds)
NEXT_PUBLIC_INITIAL_SPEECH_TIMEOUT=5.0

# Silence detection timeout (seconds)
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2.0

# Show silence progress bar (true/false)
NEXT_PUBLIC_SHOW_SILENCE_PROGRESS_BAR=true

# Continuous microphone input mode (true/false)
NEXT_PUBLIC_CONTINUOUS_MIC_LISTENING_MODE=false

# OpenAI API key (for OpenAI TTS mode)
NEXT_PUBLIC_OPENAI_KEY=

# Transcription model (whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe)
NEXT_PUBLIC_WHISPER_TRANSCRIPTION_MODEL=whisper-1
```

## YouTube Settings

For details, see [YouTube Settings](/guide/youtube-settings).

```bash
# Whether to enable YouTube mode (true/false)
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTube API key
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTube live stream ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## Slide Settings

For details, see [Slide Settings](/guide/slide-settings).

```bash
# Set the initial state of slide mode (true/false)
NEXT_PUBLIC_SLIDE_MODE=false
```

## Other Settings

### Advanced Settings

For details, see [Advanced Settings](/guide/other/advanced-settings).

```bash
# Background video usage setting (true/false)
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false

# Timestamp inclusion setting (true/false)
NEXT_PUBLIC_INCLUDE_TIMESTAMP_IN_USER_MESSAGE=false

# Preset questions display setting (true/false)
NEXT_PUBLIC_SHOW_PRESET_QUESTIONS=false

# Preset questions (multiple can be specified with commas)
NEXT_PUBLIC_PRESET_QUESTIONS=

```

### API Settings

For details, see [API Settings](/guide/other/message-receiver).

```bash
# Enable external instruction reception (true/false)
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false
```

### Others

```bash
# Introduction screen display setting (true/false)
NEXT_PUBLIC_SHOW_INTRODUCTION="true"

# Chat log width
NEXT_PUBLIC_CHAT_LOG_WIDTH=400
```
