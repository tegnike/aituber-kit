<h1 align="center">
  <img style="max-width: 100%;" src="./logo.png">
</h1>

<p align="center">
   <a href="https://github.com/tegnike/aituber-kit"><img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit"><img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/tegnike/aituber-kit"></a>
   <img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/tegnike/aituber-kit?sort=semver&color=orange">
   <a href="https://github.com/tegnike/aituber-kit/blob/main/LICENSE"><img alt="GitHub license" src="https://img.shields.io/github/license/tegnike/aituber-kit"></a>
</p>
<p align="center">
   <a href="https://github.com/tegnike/aituber-kit/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/network/members"><img alt="GitHub forks" src="https://img.shields.io/github/forks/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/tegnike/aituber-kit"></a>
   <a href="https://github.com/tegnike/aituber-kit/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/tegnike/aituber-kit"></a>
</p>
<p align="center">
   <a href="https://x.com/tegnike"><img alt="X (Twitter)" src="https://img.shields.io/badge/X-tegnike-1DA1F2?logo=x&style=flat&logoColor=white"/></a>
   <img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/tegnike/aituber-kit?sort=semver&color=orange">
   <a href="https://discord.gg/5rHEue52nZ"><img alt="Discord" src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white"/></a>
   <a href="https://github.com/sponsors/tegnike"><img alt="GitHub Sponsor" src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github"/></a>
</p>

<h3 align="center">
   <a href="../README.md">【Japanese】</a>｜
   <a href="./README_zh.md">【Chinese】</a>｜
   <a href="./README_ko.md">【Korean】</a>
</h3>

## Overview

This repository has mainly the following 2 features:

1. Conversation with AI character
2. AITuber streaming

I've written a detailed usage guide in the article below:

[![You are AITuber Developer from Today | Nike-chan](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## Development Environment

This project is developed in the following environment:

- Node.js: ^20.0.0
- npm: 10.8.1

## Common Preparations

1. Clone the repository to your local machine.

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

5. Open the URL [http://localhost:3000](http://localhost:3000)

## Conversation with AI Character

- This is a feature to converse with an AI character.
- It is an extended feature of [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM), which is the basis of this repository.
- It can be tried relatively easily as long as you have an API key for various LLMs.
- The recent conversation sentences are retained as memory.
- It is multimodal, capable of recognizing images from the camera or uploaded images to generate responses.

### Usage

1. Enter your API key for various LLMs in the settings screen.
   - OpenAI
   - Anthropic
   - Google Gemini
   - Groq
   - Local LLM (No API key is required, but a local API server needs to be running.)
   - Dify Chatbot (No API key is required, but a local API server needs to be running.)
2. Edit the character's setting prompt if necessary.
3. Load a VRM file and background file if available.
4. Select a speech synthesis engine and configure voice settings if necessary.
   - For VOICEVOX, you can select a speaker from multiple options. The VOICEVOX app needs to be running beforehand.
   - For Koeiromap, you can finely adjust the voice. An API key is required.
   - For Google TTS, languages other than Japanese can also be selected. Credential information is required.
   - For Style-Bert-VITS2, a local API server needs to be running.
   - For GSVI TTS, a local API server needs to be running.
   - ElevenLabs supports various language selection. Please enter the API key.
5. Start conversing with the character from the input form. Microphone input is also possible.

## AITuber Streaming

- It is possible to retrieve YouTube streaming comments and have the character speak.
- A YouTube API key is required.
- Comments starting with '#' are not read.

### Usage

1. Turn on YouTube mode in the settings screen.
2. Enter your YouTube API key and YouTube Live ID.
3. Configure other settings the same way as "Conversation with AI Character".
4. Start streaming on YouTube and confirm that the character reacts to comments.
5. Turn on the conversation continuity mode to be able to speak even if there are no comments.

## Other Features

### External Integration Mode (β version)

- You can send messages to the server app via WebSocket and get a response.
- Unlike the above two, it does not complete within the front-end app, so the difficulty level is a bit higher.
- ⚠ This mode is currently not fully maintained, so it may not work.

#### Usage

1. Start the server app and open the `ws://127.0.0.1:8000/ws` endpoint.
2. Turn on WebSocket mode in the settings screen.
3. Configure other settings the same way as "Conversation with AI Character".
4. Wait for messages from the server app and confirm that the character reacts.

#### Related

- You can try it with the server app repository I created. [tegnike/aituber-server](https://github.com/tegnike/
  aituber-server)
- For detailed settings, please read "[Let's develop with a beautiful girl!! [Open Interpreter]](https://note.
  com/nike_cha_n/n/nabcfeb7aaf3f)".

### Slide Mode

- This is a mode where the AI character automatically presents slides.
- You need to prepare slides and script files in advance.

#### Usage

1. Proceed to the point where you can interact with the AI character.
2. Place the slide folder and script file in the designated folder.
3. Turn on Slide Mode in the settings screen.
4. Press the Start Slide button to begin the presentation.

## TIPS

### VRM Model and Background Fixing Method

- Change the VRM model data at `public/AvatarSample_B.vrm`. Do not change the name.
- Change the background image at `public/bg-c.jpg`. Do not change the name.

### Setting Environment Variables

- Some configuration values can be referenced from the `.env` file contents.
- If entered in the settings screen, that value takes precedence.

### Other

- Conversation history can be reset in the settings screen.
- Various settings are stored in the browser.
- Elements enclosed in code blocks are not read by TTS.

## Seeking Sponsors

We are seeking sponsors to continue our development efforts.<br>
Your support will greatly contribute to the development and improvement of the AITuber Kit.

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

### Our Supporters (in order of support)

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
</p>

Plus multiple private sponsors

## Usage Agreement

- The license adheres to [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM) and is under the MIT License.
- [Logo Usage Agreement](./logo_licence_en.md)
- [VRM Model Usage Agreement](./vrm_licence_en.md)

## Tips for Contributors

### How to Add a New Language

To add a new language to the project, follow these steps:

1. **Add Language File**:

   - Create a new language directory in the `locales` directory and create a `translation.json` file inside it.
   - Example: `locales/fr/translation.json` (for French)

2. **Add Translations**:

   - Add translations to the `translation.json` file, referring to existing language files.

3. **Update Language Settings**:

   - Open the `src/lib/i18n.js` file and add the new language to the `resources` object.

   ```javascript:src/lib/i18n.js
   resources: {
     ...,
     fr: {  // New language code
       translation: require("../../locales/fr/translation.json"),
     },
   },
   ```

4. **Add Language Selection Option**:

   - Add a new language option to the appropriate part of the UI (e.g., language selection dropdown in the settings screen) so users can select the language.

   ```typescript:src/components/settings.tsx
   <select>
     ...,
     <option value="FR">French - Français</option>
   </select>
   ```

5. **Test**:
   - Test if the application displays correctly in the new language.

This will add support for the new language to the project.

#### Adding Voice Language Code

- You also need to add support for the voice language code.
- Add the new language code to the `getVoiceLanguageCode` function in the `Introduction` component.

```typescript:nike-ChatVRM/src/components/introduction.tsx
const getVoiceLanguageCode = (selectLanguage: string) => {
  switch (selectLanguage) {
    case 'JP':
      return 'ja-JP';
    case 'EN':
      return 'en-US';
    case 'ZH':
      return 'zh-TW';
    case 'zh-TW':
      return 'zh-TW';
    case 'KO':
      return 'ko-KR';
    case 'FR':
      return 'fr-FR';
    default:
      return 'ja-JP';
  }
}
```

#### Adding README

- Add a new language README (`README_fr.md`), logo usage terms (`logo_licence_fr.md`), and VRM model usage terms (`vrm_licence_fr.md`) to the `docs` directory.
