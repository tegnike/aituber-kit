# Audio Mode Settings

## Overview

In AITuberKit, you can use Audio Mode, which utilizes OpenAI's Audio API feature to respond with natural voice to text or voice input. This mode is provided as a different feature from the Realtime API mode.

**Environment Variables**:

```bash
# Enable Audio Mode
NEXT_PUBLIC_AUDIO_MODE=false

# Set in frontend environment variables when using Audio API
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Audio mode input type (input_text or input_audio)
NEXT_PUBLIC_AUDIO_MODE_INPUT_TYPE=input_text

# Audio mode voice (alloy, coral, echo, verse, ballad, ash, shimmer, sage)
NEXT_PUBLIC_AUDIO_MODE_VOICE=alloy
```

## Supported Models

Audio Mode supports the following models:

- gpt-4o-audio-preview-2024-12-17
- gpt-4o-mini-audio-preview-2024-12-17
- gpt-4o-audio-preview-2024-10-01

## Setup Method

To use Audio Mode, follow these steps:

1. Select OpenAI as the AI service
2. Set up the OpenAI API key
3. Turn ON the Audio Mode
4. Select the input type and voice as needed

### Transmission Type Settings

In Audio Mode, you can choose from two transmission methods:

- **Text**: Transcribes voice input with Web Speech API before sending
- **Voice**: Sends voice data directly from the microphone to the Realtime API

### Voice Type Settings

In Audio Mode, the following voice types are available:

- alloy, coral, echo, verse, ballad, ash, shimmer, sage

Each voice has different characteristics, allowing you to select the optimal voice for your character.

## Limitations

- Currently only supports OpenAI's service
- Cannot be used with External Linkage mode or Realtime API mode
- May incur higher API usage fees than other modes
