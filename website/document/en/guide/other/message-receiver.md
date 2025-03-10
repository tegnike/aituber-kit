# API Settings

## Overview

Settings for accepting instructions to the AI character from external sources. When this feature is enabled, you can make the AI character speak through a dedicated API.

**Environment Variables**:

```bash
# Enable external instruction acceptance setting (true/false)
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false
```

## Enabling the Feature

You can toggle ON/OFF the feature to accept instructions from external sources. When turned ON, a client ID is automatically generated.

:::tip Hint
The generated client ID is required when sending messages from external sources.
:::

## Message Sending Page

When enabled, a "Open Message Sending Page" link is displayed. From this page, you can instruct the AI character to speak from external sources.

The message sending page offers three methods to send messages:

### 1. Make the AI Character Speak Directly (direct_send)

- Makes the AI character speak the input message as is
- If multiple messages are sent, they are processed in order
- The voice model selected in the AITuberKit settings is used

**API Request Example**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": ["Hello, the weather is nice today.", "Please tell me your schedule for today."]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=direct_send'
```

### 2. Generate an Answer with AI and Then Speak (ai_generate)

- The AI generates a response from the input message, and the AI character speaks that response
- If multiple messages are sent, they are processed in order
- The AI model and voice model selected in the AITuberKit settings are used
- How to set the system prompt:
  - To use the AITuberKit system prompt, set `useCurrentSystemPrompt: true`
  - To use a custom system prompt, specify it in the `systemPrompt` parameter and set `useCurrentSystemPrompt: false`
- To load past conversation history, you can include the string `[conversation_history]` anywhere in the system prompt or user message

**API Request Example**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt": "You are a helpful assistant.", "useCurrentSystemPrompt": false, "messages": ["Please tell me your schedule for today."]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=ai_generate'
```

### 3. Send User Input (user_input)

- The sent message is processed the same as if it were input from the AITuberKit input form
- If multiple messages are sent, they are processed in order
- The AI model and voice model selected in the AITuberKit settings are used
- The system prompt and conversation history from AITuberKit are used

**API Request Example**:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": ["Hello, the weather is nice today.", "Please tell me your schedule for today."]}' \
  'http://localhost:3000/api/messages/?clientId=YOUR_CLIENT_ID&type=user_input'
```

## API Response

The response to each API request is returned as a JSON object containing the result of the request processing. The response includes information about the processed messages and processing status.

:::tip Hint
On the message sending page, there is a response display area at the bottom of each sending method form where you can check the response from the API.
:::

## Notes

- The client ID is used to restrict access from external sources. Be careful not to leak it to third parties.
- Sending a large number of messages in a short time may cause processing delays.
- The feature to accept instructions from external sources involves security risks. Enable it only in trusted environments.
