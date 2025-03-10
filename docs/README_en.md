# AITuberKit

<img style="max-width: 100%;" src="../public/ogp.png">

**Notice: This project has adopted a custom license from version v2.0.0 onwards. If you are using it for commercial purposes, please check the [Terms of Use](#terms-of-use) section.**

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
      🌟 <a href="https://aituberkit.com">Demo Site</a> 🌟
   </h3>
</div>

<div align="center">
   <h3>
      📚 <a href="https://docs.aituberkit.com/en/">Documentation Site</a> 📚
   </h3>
</div>

<h3 align="center">
   <a href="../README.md">日本語</a>｜
   <a href="./README_zh.md">中文</a>｜
   <a href="./README_ko.md">한국어</a>｜
   <a href="./README_pl.md">Polski</a>
</h3>

## Overview

AITuberKit is an open-source toolkit that allows anyone to easily build a web application for chatting with AI characters. It features various extensions centered around interaction with AI characters and AITuber streaming functionality.

For detailed usage and configuration instructions, please visit the [Documentation Site](https://docs.aituberkit.com/en/).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tegnike/aituber-kit&type=Date)](https://star-history.com/#tegnike/aituber-kit&Date)

## Main Features

### 1. Interaction with AI Characters

- Easy conversation with AI characters using API keys for various LLMs
- Multimodal support for recognizing camera footage and uploaded images to generate responses
- Retention of recent conversations as memory

### 2. AITuber Streaming

- Retrieves YouTube stream comments for automatic responses from AI characters
- Conversation continuation mode allows spontaneous speech even without comments
- Feature to ignore comments starting with "#"

### 3. Other Features

- **External Integration Mode**: Connect with server applications via WebSocket for advanced functionality
- **Slide Mode**: Mode where AI characters automatically present slides
- **Realtime API**: Low-latency dialogue and function execution using OpenAI's Realtime API
- **Audio Mode**: Natural voice dialogue utilizing OpenAI's Audio API features
- **Message Reception Function**: Accept instructions from external sources through a dedicated API to make AI characters speak

## Supported Models & Services

### Character Models

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

### Supported Voice Synthesis Engines

- VOICEVOX
- Koeiromap
- Google Text-to-Speech
- Style-Bert-VITS2
- AivisSpeech
- GSVI TTS
- ElevenLabs
- OpenAI
- Azure OpenAI
- Niji Voice

## Quick Start

### Development Environment

- Node.js: ^20.0.0
- npm: ^10.0.0

### Installation Steps

1. Clone the repository locally.

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. Open the folder.

```bash
cd aituber-kit
```

3. Install packages.

```bash
npm install
```

4. Start the application in development mode.

```bash
npm run dev
```

5. Open the URL: [http://localhost:3000](http://localhost:3000)

6. Create a .env file as needed.

```bash
cp .env.example .env
```

For detailed configuration and usage instructions, please visit the [Documentation Site](https://docs.aituberkit.com/en/).

## ⚠️ Important Security Notice

This repository is intended for personal use and development in local environments, as well as commercial use with appropriate security measures. However, please note the following when deploying to a web environment:

- **API Key Handling**: The system is designed to call AI services (OpenAI, Anthropic, etc.) and TTS services via a backend server, so proper management of API keys is necessary.

### For Production Use

When using in a production environment, we recommend one of the following approaches:

1. **Backend Server Implementation**: Manage API keys on the server side to avoid direct API access from clients
2. **Appropriate Explanation to Users**: If users are using their own API keys, explain security considerations to them
3. **Access Restriction Implementation**: Implement appropriate authentication and authorization mechanisms as needed

## Sponsorship

We are seeking sponsors to continue development.<br>
Your support greatly contributes to the development and improvement of AITuberKit.

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/fdanv1k6iz)

### Contributors (in order of support)

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

Plus multiple private sponsors

## Terms of Use

### License

This project has adopted a **custom license** from version v2.0.0 onwards.

- **Free Use**

  - Free for personal use, educational purposes, and non-profit purposes that are not for commercial purposes.

- **Commercial License**
  - A separate commercial license is required for commercial use.
  - For details, please check [About the License](./license_en.md).

### Others

- [Logo Usage Terms](./logo_licence_en.md)
- [VRM and Live2D Model Usage Terms](./character_model_licence_en.md)

## Priority Implementation

This project accepts paid priority implementation of features.

- Features requested by companies or individuals can be implemented with priority.
- Implemented features will be published as part of this OSS project.
- Fees are individually quoted based on the complexity of the feature and the time required for implementation.
- This priority implementation is separate from the commercial license. If you want to use the implemented features for commercial purposes, you need to obtain a commercial license separately.

For details, please contact support@aituberkit.com.
