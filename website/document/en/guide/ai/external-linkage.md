# External Linkage Mode Settings

## Overview

External Linkage Mode is a feature that allows AITuberKit to connect with external applications via WebSocket. Using this mode, you can send text messages from external applications and make the AITuberKit character speak.

::: warning About Beta Features
**This External Linkage Mode is currently provided as a beta version.**

- Specifications may change without notice
- Operation may be unstable
- Please thoroughly test before using in a production environment
- We would appreciate your feedback if you discover any bugs or issues
  :::

**Environment Variables**:

```bash
# Enable External Linkage Mode
NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE=true
```

## Features and Uses

External Linkage Mode has the following features and uses:

- Accepts text input from external applications
- Integration with custom applications
- Connection with other AI services
- Use as an extension for virtual broadcasting

## Limitations

When External Linkage Mode is enabled, the following features are disabled:

- Conversation Continuation Mode
- Realtime API Mode

Also, please note the following when External Linkage Mode is enabled:

- AI processing must be done on the external application side
- AITuberKit is only responsible for receiving text and generating voice and motion

## Setup Procedure

1. Set "External Linkage Mode" to ON in the AITuberKit settings screen
2. WebSocket connection will automatically start at "ws://localhost:8000/ws"
3. Connect from external application via WebSocket

## WebSocket Communication Format

Input format from external applications:

```json
{
  "text": "Text you want the character to speak",
  "role": "assistant",
  "emotion": "neutral",
  "type": "message"
}
```

Parameter explanation:

- `text`: Text content for the character to speak (required)
- `role`: Role of the message. Usually use "assistant" (required)
- `emotion`: Emotional expression (optional, default is "neutral")
  - Available values: "neutral", "happy", "sad", "angry", "relaxed", "surprised"
- `type`: Type of message (optional)
  - Use "start" to begin a new response block

For example, you can connect with the following Python code:

```python
import websocket
import json

def send_message(text, emotion="neutral"):
    ws = websocket.create_connection("ws://localhost:8000/ws")
    message = {
        "text": text,
        "role": "assistant",
        "emotion": emotion,
        "type": "message"
    }
    ws.send(json.dumps(message))
    ws.close()

send_message("Hello! How are you?", "happy")
```

## Connection Status Notification

When connecting via WebSocket, the following notifications will be displayed on the screen:

- During connection attempt: "Attempting WebSocket connection"
- On successful connection: "WebSocket connection successful"
- When an error occurs: "WebSocket connection error occurred"
- When connection ends: "WebSocket connection has ended"

If there are connection problems, please check these notifications.

::: tip
When using External Linkage Mode, you may need to open the WebSocket port (8000) in your firewall settings. Also, if the connection is disconnected, it will attempt to reconnect every 2 seconds.
:::
