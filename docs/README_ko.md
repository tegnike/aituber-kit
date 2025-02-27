# AITuberKit

<img style="max-width: 100%;" src="./docs/logo.png">

**공지: 이 프로젝트는 버전 v2.0.0 이후부터 커스텀 라이선스를 채택하고 있습니다. 상업적 목적으로 사용하실 경우, [이용 약관](#이용-약관) 섹션을 확인해 주세요.**

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
      🌟 <a href="https://aituberkit.com">데모 사이트로</a> 🌟
   </h3>
</div>

<h3 align="center">
   <a href="./docs/README_en.md">English</a>｜
   <a href="./docs/README_zh.md">中文</a>｜
   <a href="./docs/README_ko.md">한국어</a>
</h3>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tegnike/aituber-kit&type=Date)](https://star-history.com/#tegnike/aituber-kit&Date)

## 개요

주로 다음 두 가지 기능이 있습니다.

1. AI 캐릭터와의 대화
2. AITuber 방송

아래 기사에 자세한 사용 방법을 기재했습니다.

[![오늘부터 당신도 AITuber 개발자｜니케짱](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## ⚠️ 보안에 관한 중요한 주의사항

이 리포지토리는 개인 사용이나 로컬 환경에서의 개발은 물론, 적절한 보안 대책을 강구한 후의 상업적 사용도 상정하고 있습니다. 단, 웹 환경에 배포할 때는 다음 사항에 주의해 주세요:

- **API 키의 취급**: 백엔드 서버를 경유하여 AI 서비스(OpenAI, Anthropic 등)나 TTS 서비스의 API를 호출하는 사양이므로, API 키의 적절한 관리가 필요합니다.

### 본 환경에서의 사용에 대하여

본 환경에서 사용할 경우, 다음 중 하나의 대응을 권장합니다:

1. **백엔드 서버의 구현**: API 키의 관리를 서버 사이드에서 수행하고, 클라이언트로부터의 직접적인 API 접근을 피함
2. **사용자에 대한 적절한 설명**: 각 사용자가 자신의 API 키를 사용할 경우, 보안상의 주의점에 대해 설명
3. **접근 제한의 구현**: 필요에 따라 적절한 인증·인가의 구조를 구현

## 개발 환경

이 프로젝트는 다음 환경에서 개발되었습니다:

- Node.js: ^20.0.0
- npm: 10.8.1

## 공통 사전 준비

1. 리포지토리를 로컬에 클론합니다.

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. 폴더를 엽니다.

```bash
cd aituber-kit
```

3. 패키지를 설치합니다.

```bash
npm install
```

4. 개발 모드로 애플리케이션을 시작합니다.

```bash
npm run dev
```

5. URL을 엽니다. [http://localhost:3000](http://localhost:3000)

6. 필요에 따라 .env 파일을 생성합니다.

```bash
cp .env.example .env
```

## AI 캐릭터와의 대화

- AI 캐릭터와 대화하는 기능입니다.
- 이 리포지토리의 원본인 [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)을 확장한 기능입니다.
- 각종 LLM의 API 키만 있으면 쉽게 시작할 수 있습니다.
- 최근의 대화문을 기억으로 유지합니다.
- 멀티모달로, 카메라에서의 영상이나 업로드한 이미지를 인식하여 답변을 생성할 수 있습니다.

### 사용 방법

1. 설정 화면에서 선택한 LLM의 API 키를 입력합니다.
   - OpenAI
   - Anthropic
   - Google Gemini
   - Azure OpenAI
   - Groq
   - Cohere
   - Mistral AI
   - Perplexity
   - Fireworks
   - 로컬 LLM
   - Dify (Chatbot or Agent)
2. 필요에 따라 캐릭터의 설정 프롬프트를 편집합니다.
3. 필요에 따라 캐릭터의 VRM 파일 또는 Live2D 파일, 그리고 배경 파일을 업로드합니다.
4. 음성 합성 엔진을 선택하고, 필요에 따라 목소리 설정을 합니다.
   - VOICEVOX: 여러 선택지에서 화자를 선택할 수 있습니다. 미리 VOICEVOX 앱을 실행해 두어야 합니다.
   - Koeiromap: 세밀하게 음성을 조정할 수 있습니다. API 키 입력이 필요합니다.
   - Google TTS: 일본어 외의 언어도 선택 가능합니다. credential 정보가 필요합니다.
   - Style-Bert-VITS2: 로컬 API 서버를 실행해 두어야 합니다.
   - AivisSpeech: 미리 AivisSpeech 앱을 실행해 두어야 합니다.
   - GSVI TTS: 로컬 API 서버를 실행해 두어야 합니다.
   - ElevenLabs: 다양한 언어 선택이 가능합니다. API 키 입력이 필요합니다.
   - OpenAI: API 키 입력이 필요합니다.
   - Azure OpenAI: API 키 입력이 필요합니다.
   - 니지 보이스: API 키 입력이 필요합니다.
5. 입력 폼에서 캐릭터와 대화를 시작합니다. 마이크 입력도 가능합니다.

## AITuber 방송

- 유튜브의 방송 댓글을 가져와 발언할 수 있습니다.
- 유튜브 API 키가 필요합니다.
- "#"로 시작하는 댓글은 읽지 않습니다.

### 사용 방법

1. 설정 화면에서 유튜브 모드를 ON으로 합니다.
2. 유튜브 API 키와 유튜브 라이브 ID를 입력합니다.
3. 다른 설정은 "AI 캐릭터와의 대화"와 동일하게 진행합니다.
4. 유튜브 방송을 시작하고, 캐릭터가 댓글에 반응하는 것을 확인합니다.
5. 대화 지속 모드를 ON으로 하면, 댓글이 없을 때 AI가 스스로 발언할 수 있습니다.

## 기타 기능

### 외부 연계 모드

- WebSocket으로 서버 애플리케이션에 요청을 보내고, 응답을 받을 수 있습니다.
- 별도로 서버 애플리케이션을 준비해야 합니다.

#### 사용 방법

1. 서버 애플리케이션을 시작하고, `ws://127.0.0.1:8000/ws` 엔드포인트를 엽니다.
2. 설정 화면에서 외부 연계 모드를 ON으로 합니다.
3. 다른 설정은 "AI 캐릭터와의 대화"와 동일하게 진행합니다.
4. 입력 폼에서 요청을 보내고, 서버 애플리케이션에서의 요청이 반환되는 것을 확인합니다.

#### 관련

- 이 서버 애플리케이션의 리포지토리에서 바로 시도할 수 있습니다. [tegnike/aituber-server](https://github.com/tegnike/aituber-server)
- 자세한 설정은 "[미소녀와 함께 개발하자!!【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)"를 읽어주세요.

### 슬라이드 모드

- 슬라이드를 AI 캐릭터가 자동으로 발표하는 모드입니다.
- 미리 슬라이드와 대본 파일을 준비해 두어야 합니다.

#### 사용 방법

1. AI 캐릭터와 대화할 수 있는 단계까지 진행합니다.
2. 슬라이드 폴더와 대본 파일을 지정된 폴더에 배치합니다.
3. 설정 화면에서 슬라이드 모드를 ON으로 합니다.
4. 슬라이드 시작 버튼을 눌러 발표를 시작합니다.

#### 관련

- 자세한 설정은 "[슬라이드 발표는 AI가 하는 시대!!!!](https://note.com/nike_cha_n/n/n867081a598f1)"를 읽어주세요.

### Realtime API 모드

- OpenAI의 Realtime API를 사용하여, 저지연으로 캐릭터와 대화할 수 있는 모드입니다.
- 함수 실행을 정의할 수 있습니다.

#### 사용 방법

1. AI 서비스에서 OpenAI 또는 Azure OpenAI를 선택합니다.
2. Realtime API 모드를 ON으로 합니다.
3. 마이크를 사용하여 말을 겁니다.

#### 함수 실행

- src/components/realtimeAPITools.tsx, src/components/realtimeAPITools.json에 새로운 함수를 정의합니다.
- 기존의 get_current_weather 함수를 참고하세요.

## TIPS

### Live2D의 사양에 대하여

Live2D 표시를 위해 비공식 라이브러리인 [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display)를 사용하고 있습니다.

Live2D는 개발용 SDK로 Cubism이라는 라이브러리가 제공되고 있으며, 현재 Cubism 2.1, Cubism 3, Cubism 4, 그리고 Cubism 5가 존재합니다. Cubism 4는 Cubism 3의 모델과 호환성이 있으며, 최신의 Cubism 5는 Cubism 4와 호환성이 있습니다.

Cubism 2.1과 Cubism 4/5를 사용하여, 모든 변형의 Live2D 모델을 지원하고 있습니다.

#### Cubism Core

이 기능을 사용하기 전에, 다음의 Cubism Core(Cubism 런타임 라이브러리) 파일을 모두 `public/scripts`에 설치해야 합니다:

1. `live2dcubismcore.min.js` (Cubism 4/5용)

   - [공식 사이트](https://www.live2d.com/sdk/download/web/)에서 다운로드 가능
   - 또는 [여기](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)에서 입수 가능 (주의: 본 환경에서의 사용은 권장되지 않습니다)

2. `live2d.min.js` (Cubism 2.1용)
   - 2019년 9월 4일 이후, 공식 사이트에서 다운로드할 수 없게 되었지만, 아래에서 입수 가능:
     - GitHub: [dylanNew/live2d](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib)
     - CDN: https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js

두 파일을 설치함으로써, 모든 버전의 Live2D 모델을 지원할 수 있습니다.

### 배경 이미지 설정

- 배경 이미지는 `public/bg-c.png`의 이미지를 변경해 주세요. 이름은 변경하지 마세요.

### 환경 변수 설정

- 일부 설정 값은 `.env` 파일의 내용을 참조할 수 있습니다.
- 설정 화면에서 입력한 경우, 환경 변수로 지정된 값보다 우선됩니다.

### 마이크 입력 방법 (2가지 패턴)

1. Alt (또는 option) 키를 누르고 있는 동안 입력 수신 => 놓으면 전송
2. 마이크 버튼을 클릭 (한 번 누르면 입력 수신) => 다시 클릭하여 전송

### 기타

- 설정 정보·대화 기록은 설정 화면에서 리셋할 수 있습니다.
- 각종 설정 항목은 브라우저에 로컬 스토리지로 저장됩니다.
- 코드 블록으로 감싸진 요소는 TTS로 읽히지 않습니다.

## 관련 기사

- [오늘부터 당신도 AITuber 개발자｜니케짱](https://note.com/nike_cha_n/n/ne98acb25e00f)
- [미소녀와 함께 개발하자!!【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)
- [슬라이드 발표는 AI가 하는 시대!!!!](https://note.com/nike_cha_n/n/n867081a598f1)
- [AITuberKit에 멀티모달 기능을 추가하여 AI 캐릭터와 집에서 술 마시기](https://note.com/nike_cha_n/n/n6d8e330561e4)
- [AITuberKit × Dify로 초간단 챗봇 구축](https://note.com/nike_cha_n/n/n13cd8b3cf88a)
- [Dify를 Xserver로 인터넷에 공개하기](https://note.com/nike_cha_n/n/n23467824b22b)
- [고급 음성 모드, 즉 Realtime API를 시도해보기](https://note.com/nike_cha_n/n/ne51c16ddadd0)

## 스폰서 모집

개발을 지속하기 위해 스폰서를 모집하고 있습니다.<br>
당신의 지원은 AITuber 키트의 개발과 개선에 크게 기여합니다.

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/fdanv1k6iz)

### 협력자 여러분 (지원해 주신 순서)

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

기타, 개인 스폰서 여러 명

## 이용 약관

### 라이선스

이 프로젝트는 버전 v2.0.0 이후, **커스텀 라이선스**를 채택하고 있습니다.

- **무상 이용**

  - 영리 목적이 아닌 개인 이용, 교육 목적, 비영리 목적으로의 사용은 무상으로 이용 가능합니다.

- **상업 라이선스**
  - 상업적 목적으로의 사용에 대해서는 별도의 상업 라이선스 취득이 필요합니다.
  - 자세한 내용은, [라이선스에 대하여](./docs/license.md)를 확인해 주세요.

## 우선 구현에 대하여

이 프로젝트에서는 유상으로 기능 우선 구현을 받고 있습니다.

- 기업이나 개인의 요청이 있는 기능을 우선적으로 구현할 수 있습니다.
- 구현된 기능은 본 OSS 프로젝트의 일부로 공개됩니다.
- 요금은 기능의 복잡성이나 구현에 소요되는 시간에 따라 개별 견적이 됩니다.
- 이 우선 구현은 상업 라이선스와는 별도의 접근입니다. 구현된 기능을 상업적으로 이용할 경우, 별도의 상업 라이선스 취득이 필요합니다.

자세한 내용은 support@aituberkit.com으로 문의해 주세요.

### 기타

- [로고의 이용 약관](./docs/logo_licence.md)
- [VRM 및 Live2D 모델의 이용 약관](./docs/character_model_licence.md)