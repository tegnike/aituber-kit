# Introduction

## Overview

AITuberKit is an open-source toolkit that allows anyone to easily build web applications for chatting with AI characters. It features AI character interaction and AITuber streaming functions, along with various extension capabilities.

## Main Features

### 1. AI Character Interaction

- Easily chat with AI characters using various LLM API keys
- Multimodal support to recognize camera footage and uploaded images to generate responses
- Retains recent conversations as memory

### 2. AITuber Streaming

- Retrieves YouTube stream comments for automatic AI character responses
- Conversation continuation mode allows proactive speaking even without comments
- Comments starting with "#" are not read aloud

### 3. Other Features

- **External Linkage Mode**: Connect with server applications via WebSocket to achieve more advanced features
- **Slide Mode**: Mode where AI characters automatically present slides
- **Realtime API Mode**: Low-latency interaction and function execution using OpenAI's Realtime API

## Supported Character Models

- **3D Models**: VRM files
- **2D Models**: Live2D files (Cubism 3 and later)

### Supported LLMs

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI
- Groq
- Cohere
- Mistral AI
- Perplexity
- Fireworks
- Local LLM
- Dify

## Supported Voice Synthesis Engines

- VOICEVOX
- Koeiromap
- Google Text-to-Speech
- Style-Bert-VITS2
- AivisSpeech
- GSVI TTS
- ElevenLabs
- OpenAI
- Azure OpenAI
- Nijivoice

## System Requirements

- Node.js: ^20.0.0
- npm: ^10.0.0

## Security Considerations

This repository is intended for personal use, local development, and commercial use with appropriate security measures. However, please note the following when deploying to a web environment:

- **API Key Handling**: The system is designed to call AI services (OpenAI, Anthropic, etc.) and TTS services via a backend server, so proper API key management is necessary.

### Production Use

When using in a production environment, one of the following approaches is recommended:

1. **Implement a Backend Server**: Manage API keys on the server side and avoid direct API access from clients
2. **Provide Appropriate Explanations to Users**: If users are using their own API keys, explain the security considerations
3. **Implement Access Restrictions**: Implement appropriate authentication and authorization mechanisms as needed

## Support and Community

- [GitHub](https://github.com/tegnike/aituber-kit)
- [Discord](https://discord.gg/5rHEue52nZ)
- [X (Twitter)](https://x.com/tegnike)

## License

From version v2.0.0 onwards, this project has adopted a **custom license**. For details, please check the [License page](/en/guide/license).
