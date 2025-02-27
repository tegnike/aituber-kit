# AITuberKit

<img style="max-width: 100%;" src="./docs/logo.png">

**Notice: This project adopts a custom license from version v2.0.0 onwards. If you intend to use it for commercial purposes, please check the [Terms of Use](#利用規約) section.**

<p align="center">
   <a href="https://github.com/tegnike/aituber-kit"><img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit"><img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/tegnike/aituber-kit"></a>
   <img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/tegnike/aituber-kit?sort=semver&color=orange">
   <a href="https://github.com/tegnike/aituber-kit/blob/main/LICENSE"><img alt="License: Custom" src="https://img.shields.io/badge/License-Custom-blue"></a>
</p>
<p align="center">
   <a href="https://github.com/tegnike/aituber-kit/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/network/members"><img alt="GitHub forks" src="https://img.shields.io/github/forks/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/tegnike/aituber-kit"></a>
</p>
<p align="center">
   <a href="https://x.com/tegnike"><img alt="X (Twitter)" src="https://img.shields.io/badge/X-tegnike-1DA1F2?logo=x&style=flat&logoColor=white"/></a>
   <a href="https://discord.gg/5rHEue52nZ"><img alt="Discord" src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white"/></a>
   <a href="https://github.com/sponsors/tegnike"><img alt="GitHub Sponsor" src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github"/></a>
</p>

<div align="center">
   <h3>
      🌟 <a href="https://aituberkit.com">Go to Demo Site</a> 🌟
   </h3>
</div>

<h3 align="center">
   <a href="./docs/README_en.md">English</a>｜
   <a href="./docs/README_zh.md">中文</a>｜
   <a href="./docs/README_ko.md">Korean</a>
</h3>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tegnike/aituber-kit&type=Date)](https://star-history.com/#tegnike/aituber-kit&Date)

## Overview

There are mainly two features:

1. Interaction with AI characters
2. AITuber streaming

Detailed usage is described in the article below.

[![Become an AITuber Developer Today｜Nike-chan](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## ⚠️ Important Security Notice

This repository is intended for personal use and local development, as well as commercial use with appropriate security measures. However, please note the following when deploying to a web environment:

- **Handling of API Keys**: Since the backend server is used to call APIs of AI services (OpenAI, Anthropic, etc.) and TTS services, proper management of API keys is required.

### For Production Use

When using in a production environment, it is recommended to take one of the following actions:

1. **Implement a Backend Server**: Manage API keys on the server side to avoid direct API access from the client.
2. **Provide Appropriate Explanation to Users**: If each user uses their own API key, explain the security precautions.
3. **Implement Access Restrictions**: Implement appropriate authentication and authorization mechanisms as needed.

## Development Environment

This project is developed in the following environment:

- Node.js: ^20.0.0
- npm: 10.8.1

## Common Preparations

1. Clone the repository locally.

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. Open the folder.

```bash
cd aituber-kit
```

3. Install the packages.

```bash
npm install
```

4. Start the application in development mode.

```bash
npm run dev
```

5. Open the URL. [http://localhost:3000](http://localhost:3000)

6. Create an .env file if necessary.

```bash
cp .env.example .env
```

## Interaction with AI Characters

- A feature to converse with AI characters.
- An extended feature based on [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM).
- Easy to start with just the API keys of various LLMs.
- Keeps recent conversation texts as memory.
- Multimodal, capable of recognizing images from the camera or uploaded images to generate responses.

### Usage

1. Enter the API key of the selected LLM in the settings screen.
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
   - Dify (Chatbot or Agent)
2. Edit the character's setting prompt if necessary.
3. Upload the character's VRM file or Live2D file and background file if necessary.
4. Select a speech synthesis engine and configure the voice settings if necessary.
   - VOICEVOX: You can choose a speaker from multiple options. The VOICEVOX app must be launched in advance.
   - Koeiromap: Allows detailed voice adjustments. API key input is required.
   - Google TTS: Languages other than Japanese can be selected. Credential information is required.
   - Style-Bert-VITS2: A local API server must be launched.
   - AivisSpeech: The AivisSpeech app must be launched in advance.
   - GSVI TTS: A local API server must be launched.
   - ElevenLabs: Various languages can be selected. API key input is required.
   - OpenAI: API key input is required.
   - Azure OpenAI: API key input is required.
   - Nijivoice: API key input is required.
5. Start a conversation with the character from the input form. Microphone input is also possible.

## AITuber Streaming

- Can retrieve and speak YouTube streaming comments.
- YouTube API key is required.
- Comments starting with "#" will not be read.

### Usage

1. Turn on YouTube mode in the settings screen.
2. Enter the YouTube API key and YouTube Live ID.
3. Other settings are the same as "Interaction with AI Characters."
4. Start the YouTube stream and confirm that the character reacts to comments.
5. When conversation continuation mode is on, the AI can speak on its own when there are no comments.

## Other Features

### External Integration Mode

- Can send requests to a server app via WebSocket and receive responses.
- A separate server app needs to be prepared.

#### Usage

1. Start the server app and open the `ws://127.0.0.1:8000/ws` endpoint.
2. Turn on external integration mode in the settings screen.
3. Other settings are the same as "Interaction with AI Characters."
4. Send a request from the input form and confirm that a request is returned from the server app.

#### Related

- You can try it immediately with this server app repository. [tegnike/aituber-server](https://github.com/tegnike/aituber-server)
- For detailed settings, please read "[Let's Develop with a Beautiful Girl!! 【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)."

### Slide Mode

- A mode where AI characters automatically present slides.
- Slides and script files need to be prepared in advance.

#### Usage

1. Proceed to the point where you can interact with AI characters.
2. Place the slide folder and script file in the specified folder.
3. Turn on slide mode in the settings screen.
4. Press the slide start button to begin the presentation.

#### Related

- For detailed settings, please read "[It's the Era of AI Doing Slide Presentations!!!!](https://note.com/nike_cha_n/n/n867081a598f1)."

### Realtime API Mode

- A mode that uses OpenAI's Realtime API to interact with characters with low latency.
- You can define function execution.

#### Usage

1. Select OpenAI or Azure OpenAI in the AI service.
2. Turn on Realtime API mode.
3. Speak using the microphone.

#### Function Execution

- Define new functions in src/components/realtimeAPITools.tsx, src/components/realtimeAPITools.json.
- Refer to the existing get_current_weather function.

## TIPS

### Regarding Live2D Specifications

The unofficial library [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display) is used for Live2D display.

Live2D provides a library called Cubism as a development SDK, and currently, Cubism 2.1, Cubism 3, Cubism 4, and Cubism 5 exist. Cubism 4 is compatible with Cubism 3 models, and the latest Cubism 5 is compatible with Cubism 4.

By using Cubism 2.1 and Cubism 4/5, all variants of Live2D models are supported.

#### Cubism Core

Before using this feature, you need to place the following Cubism Core (Cubism runtime library) files in `public/scripts`:

1. `live2dcubismcore.min.js` (for Cubism 4/5)

   - Available for download from the [official site](https://www.live2d.com/sdk/download/web/)
   - Or available [here](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js) (Note: Not recommended for production use)

2. `live2d.min.js` (for Cubism 2.1)
   - Not available for download from the official site since September 4, 2019, but available from:
     - GitHub: [dylanNew/live2d](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib)
     - CDN: https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js

By placing both files, all versions of Live2D models can be supported.

### Setting Background Images

- Change the image of `public/bg-c.png` for the background image. Do not change the name.

### Setting Environment Variables

- Some settings can refer to the contents of the `.env` file.
- If entered in the settings screen, it takes precedence over the values specified in environment variables.

### Microphone Input Methods (2 Patterns)

1. Hold the Alt (or option) key to accept input => Release to send
2. Click the microphone button (press once to accept input) => Click again to send

### Others

- Settings information and conversation history can be reset in the settings screen.
- Various settings items are saved as local storage in the browser.
- Elements enclosed in code blocks are not read by TTS.

## Related Articles

- [Become an AITuber Developer Today｜Nike-chan](https://note.com/nike_cha_n/n/ne98acb25e00f)
- [Let's Develop with a Beautiful Girl!! 【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)
- [It's the Era of AI Doing Slide Presentations!!!!](https://note.com/nike_cha_n/n/n867081a598f1)
- [Added Multimodal Functionality to AITuberKit, So I Tried Drinking at Home with an AI Character](https://note.com/nike_cha_n/n/n6d8e330561e4)
- [Super Easy Chatbot Construction with AITuberKit × Dify](https://note.com/nike_cha_n/n/n13cd8b3cf88a)
- [Publishing Dify on the Internet with Xserver](https://note.com/nike_cha_n/n/n23467824b22b)
- [Trying Advanced Voice Mode, aka Realtime API](https://note.com/nike_cha_n/n/ne51c16ddadd0)

## Looking for Sponsors

We are looking for sponsors to continue development.<br>
Your support greatly contributes to the development and improvement of the AITuber Kit.

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/fdanv1k6iz)

### Collaborators (in order of support)

<p>
  <a href="https://github.com/morioki3" title="morioki3">
    <img src="https://github.com/morioki3.png" width="40" height="40" alt="morioki3">
  </a>
  <a href="https://github.com/hodachi-axcxept" title="hodachi-axcxept">
    <img src="https://github.com/hodachi-axcxept.png" width="40" height="40" alt="hodachi-axcxept">
  </a>
  <a href="https://github.com/coderabbitai" title="coderabbitai">
    <img src="https://github.com/coderabbitai.png" width="40" height="40" alt="coderabbitai">
  </a>
  <a href="https://github.com/ai-bootcamp-tokyo" title="ai-bootcamp-tokyo">
    <img src="https://github.com/ai-bootcamp-tokyo.png" width="40" height="40" alt="ai-bootcamp-tokyo">
  </a>
  <a href="https://github.com/wmoto-ai" title="wmoto-ai">
    <img src="https://github.com/wmoto-ai.png" width="40" height="40" alt="wmoto-ai">
  </a>
  <a href="https://github.com/JunzoKamahara" title="JunzoKamahara">
    <img src="https://github.com/JunzoKamahara.png" width="40" height="40" alt="JunzoKamahara">
  </a>
  <a href="https://github.com/darkgaldragon" title="darkgaldragon">
    <img src="https://github.com/darkgaldragon.png" width="40" height="40" alt="darkgaldragon">
  </a>
  <a href="https://github.com/usagi917" title="usagi917">
    <img src="https://github.com/usagi917.png" width="40" height="40" alt="usagi917">
  </a>
  <a href="https://github.com/ochisamu" title="ochisamu">
    <img src="https://github.com/ochisamu.png" width="40" height="40" alt="ochisamu">
  </a>
  <a href="https://github.com/mo0013" title="mo0013">
    <img src="https://github.com/mo0013.png" width="40" height="40" alt="mo0013">
  </a>
  <a href="https://github.com/tsubouchi" title="tsubouchi">
    <img src="https://github.com/tsubouchi.png" width="40" height="40" alt="tsubouchi">
  </a>
  <a href="https://github.com/bunkaich" title="bunkaich">
    <img src="https://github.com/bunkaich.png" width="40" height="40" alt="bunkaich">
  </a>
  <a href="https://github.com/seiki-aliveland" title="seiki-aliveland">
    <img src="https://github.com/seiki-aliveland.png" width="40" height="40" alt="seiki-aliveland">
  </a>
  <a href="https://github.com/rossy8417" title="rossy8417">
    <img src="https://github.com/rossy8417.png" width="40" height="40" alt="rossy8417">
  </a>
  <a href="https://github.com/gijigae" title="gijigae">
    <img src="https://github.com/gijigae.png" width="40" height="40" alt="gijigae">
  </a>
  <a href="https://github.com/takm-reason" title="takm-reason">
    <img src="https://github.com/takm-reason.png" width="40" height="40" alt="takm-reason">
  </a>
  <a href="https://github.com/haoling" title="haoling">
    <img src="https://github.com/haoling.png" width="40" height="40" alt="haoling">
  </a>
  <a href="https://github.com/FoundD-oka" title="FoundD-oka">
    <img src="https://github.com/FoundD-oka.png" width="40" height="40" alt="FoundD-oka">
  </a>
  <a href="https://github.com/terisuke" title="terisuke">
    <img src="https://github.com/terisuke.png" width="40" height="40" alt="terisuke">
  </a>
  <a href="https://github.com/konpeita" title="konpeita">
    <img src="https://github.com/konpeita.png" width="40" height="40" alt="konpeita">
  </a>
  <a href="https://github.com/MojaX2" title="MojaX2">
    <img src="https://github.com/MojaX2.png" width="40" height="40" alt="MojaX2">
  </a>
  <a href="https://github.com/micchi99" title="micchi99">
    <img src="https://github.com/micchi99.png" width="40" height="40" alt="micchi99">
  </a>
</p>

Others, multiple private sponsors

## Terms of Use

### License

This project adopts a **custom license** from version v2.0.0 onwards.

- **Free Use**

  - Non-commercial personal use, educational purposes, and non-profit use are available for free.

- **Commercial License**
  - A separate commercial license is required for commercial use.
  - For details, please check [About the License](./docs/license.md).

## Priority Implementation

This project accepts paid priority implementation of features.

- Features requested by companies or individuals can be implemented on a priority basis.
- Implemented features will be published as part of this OSS project.
- Fees will be individually estimated based on the complexity of the feature and the time required for implementation.
- This priority implementation is separate from the commercial license. A separate commercial license is required to use the implemented features commercially.

For details, please contact support@aituberkit.com.

### Others

- [Logo Terms of Use](./docs/logo_licence.md)
- [VRM and Live2D Model Terms of Use](./docs/character_model_licence.md)