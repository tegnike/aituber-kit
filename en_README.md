# AITuber Trial Kit for Everyone
[Japanese version](./README.md)
[Chinese version](./zh_README.md)

## Overview

This repository has the following 3 features:

1. Conversation with AI character (ChatVRM feature)
2. AITuber streaming 
3. WebSocket mode

I've written a detailed usage guide in the article below:

[![Become an AITuber Developer Today | Nike-chan](https://github.com/tegnike/nike-ChatVRM/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

### Common Preparations

1. Install packages
```bash
npm install
```

2. Start the application in development mode

```bash
npm run dev
```

3. Open the URL [http://localhost:3000](http://localhost:3000)

## Conversation with AI Character

- This is a feature to converse with an AI character.
- It is a feature of [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM), which is the basis of this repository.
- It can be tried relatively easily as long as you have an API key for various LLMs.
- The last 10 conversation sentences are retained as memory. (The number can be specified in future updates)

### Usage

1. Enter your API key for various LLMs in the settings screen.
   - OpenAI
   - Anthropic
   - Groq
   - Ollama (No API key is required, but a local API server needs to be running.)
   - Dify Chatbot (No API key is required, but a local API server needs to be running.)
2. Edit the character's setting prompt if necessary.
3. Load a VRM file if needed.
4. Select a speech synthesis engine and configure voice settings if necessary.
   - For VOICEVOX, you can select a speaker from multiple options. The VOICEVOX app needs to be running beforehand.
   - For Koeiromap, you can finely adjust the voice. An API key is required.
   - For Google TTS, languages other than Japanese can also be selected. Credential information is required.
   - For Style-Bert-VITS2, a local API server needs to be running.
5. Start conversing with the character from the input form. Microphone input is also possible.

## AITuber Streaming

- It is possible to retrieve YouTube streaming comments and have the character speak.
- A YouTube API key is required.
- Comments starting with '#' are not read. (The string can be specified in future updates)

### Usage

1. Turn on YouTube mode in the settings screen.
2. Enter your YouTube API key and YouTube Live ID.
3. Configure other settings the same way as "Conversation with AI Character".
4. Start streaming on YouTube and confirm that the character reacts to comments.

## WebSocket Mode

- You can send messages to the server app via WebSocket and get a response.
- Unlike the above two, it does not complete within the front-end app, so the difficulty level is a bit higher.

### Usage

1. Start the server app and open the `ws://127.0.0.1:8000/ws` endpoint.
2. Turn on WebSocket mode in the settings screen.
3. Configure other settings the same way as "Conversation with AI Character".
7. Wait for messages from the server app and confirm that the character reacts.

### Related

- You can try it with the server app repository I created. [tegnike/nike-open-interpreter](https://github.com/tegnike/nike-open-interpreter)
- For detailed settings, please read "[Let's develop with a beautiful girl!! [Open Interpreter]](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)".

## TIPS

### VRM Model and Background Fixing Method

- Change the VRM model data at `public/AvatarSample_B.vrm`. Do not change the name.
- Change the background image at `public/bg-c.jpg`. Do not change the name.

## Other

- The license adheres to [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM).
- Language settings support Japanese, English, and Traditional Chinese. You can switch in the settings screen.
- Conversation history can be reset in the settings screen.
- Various settings are stored in the browser.
