---
title: 'Voice Agents | OpenAI Agents SDK'
source_url: 'https://openai.github.io/openai-agents-js/guides/voice-agents/index'
fetched_at: '2025-12-19T21:01:27.520248+00:00'
---

# Voice Agents

![Realtime Agents](https://cdn.openai.com/API/docs/images/diagram-speech-to-speech.png)

Voice Agents use OpenAI speech-to-speech models to provide realtime voice chat. These models support streaming audio, text, and tool calls and are great for applications like voice/phone customer support, mobile app experiences, and voice chat.

The Voice Agents SDK provides a TypeScript client for the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime).

[Voice Agents Quickstart](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart.html) Build your first realtime voice assistant using the OpenAI Agents SDK in minutes.

### Key features

[Section titled “Key features”](https://openai.github.io/openai-agents-js/guides/voice-agents/index.html#key-features)

- Connect over WebSocket or WebRTC
- Can be used both in the browser and for backend connections
- Audio and interruption handling
- Multi-agent orchestration through handoffs
- Tool definition and calling
- Custom guardrails to monitor model output
- Callbacks for streamed events
- Reuse the same components for both text and voice agents

By using speech-to-speech models, we can leverage the model’s ability to process the audio in realtime without the need of transcribing and reconverting the text back to audio after the model acted.

![Speech-to-speech model](https://cdn.openai.com/API/docs/images/diagram-chained-agent.png)
