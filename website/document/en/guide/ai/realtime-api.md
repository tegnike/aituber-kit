# Realtime API Settings

## Overview

Realtime API is a feature provided by OpenAI that enables a more natural and low-latency conversation experience. By shortening the traditional processing flow and allowing AI to respond directly from voice input, it enables smoother communication.

**Environment Variables**:

```bash
# Enable Realtime API mode
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

## Supported Models

Realtime API supports the following models:

- gpt-4o-realtime-preview-2024-12-17
- gpt-4o-mini-realtime-preview-2024-12-17
- gpt-4o-realtime-preview-2024-10-01

## Features and Characteristics

### How It Works and Benefits

Realtime API utilizes WebSocket communication and offers the following advantages compared to traditional RESTful APIs:

- Near-zero latency real-time responses
- Natural responses that reflect voice nuances and intonation
- Shortened processing flow (reducing conversion steps from voice→text→AI text→voice)

### Comparison of Processing Flows

**Traditional Flow**:

1. User speaks with voice
2. Voice is transcribed to text
3. Text is passed to AI to get a text response
4. Text is converted to voice and played

**Realtime API Flow**:

1. User speaks with voice
2. Voice is passed to AI to get a voice response

## Setup Method

To use Realtime API, follow these steps:

1. Select OpenAI or Azure OpenAI as the AI service
2. Set up the OpenAI API key (and related settings for Azure OpenAI)
3. Turn ON the Realtime API mode
4. Select the transmission type and voice as needed

### Transmission Type Settings

In Realtime API mode, you can choose from two transmission methods:

- **Text**: Transcribes voice input with Web Speech API before sending
- **Voice**: Sends voice data directly from the microphone to the Realtime API

::: warning Note
Realtime API mode only supports microphone input. Text input is not available.
For Japanese, selecting the "Text" transmission type may improve voice recognition accuracy.
:::

### Voice Type Settings

Different voice types are available depending on the service:

**OpenAI**:

- alloy, coral, echo, verse, ballad, ash, shimmer, sage

**Azure OpenAI**:

- amuch, dan, elan, marilyn, breeze, cove, ember, jupiter, alloy, echo, shimmer

::: warning Note
If you change the API key, Azure Endpoint, voice type, AI model, or character prompt in the character settings, you need to press the update button to restart the WebSocket session.
:::

## Checking Connection Status

After closing the settings screen, the connection status is displayed in the upper left. Make sure it shows "Success". If it shows "Attempting" or "Closed", check if the API key is set correctly.

## Function Execution Feature

In Realtime API mode, you can use Function Calling. This is used by AI to perform specific operations.

### Built-in Functions

By default, the `get_current_weather` function is implemented, and you can get weather information by asking "What's the current weather in XX".

### Adding Custom Functions

1. **Define the Function**

Add function definition to the `src/components/realtimeAPITools.json` file:

```json
[
  {
    "type": "function",
    "name": "get_current_weather",
    "description": "Retrieves the current weather for a given timezone, latitude, longitude coordinate pair. Specify a label for the location.",
    "parameters": {
      "type": "object",
      "properties": {
        "latitude": {
          "type": "number",
          "description": "Latitude"
        },
        "longitude": {
          "type": "number",
          "description": "Longitude"
        },
        "timezone": {
          "type": "string",
          "description": "Timezone"
        },
        "location": {
          "type": "string",
          "description": "Name of the location"
        }
      },
      "required": ["timezone", "latitude", "longitude", "location"]
    }
  }
]
```

2. **Implement the Function**

Implement the actual function in the `src/components/realtimeAPITools.tsx` file:

```tsx
class RealtimeAPITools {
  async get_current_weather(
    latitude: number,
    longitude: number,
    timezone: string,
    location: string
  ): Promise<string> {
    // Function implementation
    // ...
    return `Weather information: The current temperature in ${location} is ${temperature}°C, and the weather is ${weatherStatus}.`
  }
}
```

::: tip
If function execution takes time, you can add the following text to the `description` in the function definition to prompt the AI to say something before executing the function:

```
Please respond to the user before calling the tool.
```

It's also effective to add the following to the character settings:

```
When using tools, please inform the user to wait if necessary.
```

:::

## Limitations

- Currently only supports OpenAI or Azure OpenAI
- Cannot be used with External Linkage mode, Audio mode, or Youtube mode
- Japanese voice recognition accuracy may be unstable depending on the environment
- Inconsistencies may occur between text data and voice data
- Traditional text-based emotion control (e.g., `[happy]Hello`) cannot be used
- Higher cost compared to other models

## Managing Conversation History

In Realtime API, conversation history is saved for each session and deleted when the session ends. When you press the "Update Realtime API Settings" button, the session is reset and the conversation history is cleared. The current AITuberKit does not implement the ability to carry over past conversation history to a new session.

::: warning Note
Since conversations are automatically saved for each session, continuing the conversation on the same screen will increase costs. It is recommended to reload the browser after use.
:::
