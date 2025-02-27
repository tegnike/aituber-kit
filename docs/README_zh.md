# AITuberKit

<img style="max-width: 100%;" src="./docs/logo.png">

**通知: 本项目自版本 v2.0.0 起采用自定义许可证。若用于商业目的，请查看[使用条款](#使用条款)部分。**

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
      🌟 <a href="https://aituberkit.com">访问演示网站</a> 🌟
   </h3>
</div>

<h3 align="center">
   <a href="./docs/README_en.md">English</a>｜
   <a href="./docs/README_zh.md">中文</a>｜
   <a href="./docs/README_ko.md">韩语</a>
</h3>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tegnike/aituber-kit&type=Date)](https://star-history.com/#tegnike/aituber-kit&Date)

## 概要

主要有以下两个功能：

1. 与AI角色对话
2. AITuber直播

详细的使用方法请参阅下文的文章。

[![今日からあなたもAITuberデベロッパー｜ニケちゃん](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## ⚠️ 关于安全的重要注意事项

本仓库不仅适用于个人使用和本地环境开发，也适用于在采取适当安全措施的情况下进行商业使用。但在部署到Web环境时，请注意以下几点：

- **API密钥的处理**: 由于通过后端服务器调用AI服务（如OpenAI, Anthropic等）和TTS服务的API，因此需要妥善管理API密钥。

### 关于生产环境的使用

在生产环境中使用时，建议采取以下措施之一：

1. **实现后端服务器**: 在服务器端管理API密钥，避免客户端直接访问API
2. **向用户提供适当的说明**: 如果每个用户使用自己的API密钥，请说明安全注意事项
3. **实施访问限制**: 根据需要，实施适当的认证和授权机制

## 开发环境

本项目在以下环境中开发：

- Node.js: ^20.0.0
- npm: 10.8.1

## 通用准备步骤

1. 将仓库克隆到本地。

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. 打开文件夹。

```bash
cd aituber-kit
```

3. 安装包。

```bash
npm install
```

4. 在开发模式下启动应用程序。

```bash
npm run dev
```

5. 打开URL。[http://localhost:3000](http://localhost:3000)

6. 根据需要创建.env文件。

```bash
cp .env.example .env
```

## 与AI角色对话

- 与AI角色对话的功能。
- 扩展自此仓库的基础 [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)。
- 只需拥有各类LLM的API密钥即可轻松开始。
- 保持最近的对话作为记忆。
- 多模态，可以识别来自摄像头的图像或上传的图片并生成回答。

### 使用方法

1. 在设置界面输入所选LLM的API密钥。
   - OpenAI
   - Anthropic
   - Google Gemini
   - Azure OpenAI
   - Groq
   - Cohere
   - Mistral AI
   - Perplexity
   - Fireworks
   - 本地LLM
   - Dify（Chatbot或Agent）
2. 根据需要编辑角色的设置提示。
3. 根据需要上传角色的VRM文件或Live2D文件，以及背景文件。
4. 选择语音合成引擎，并根据需要设置声音。
   - VOICEVOX: 可以从多个选项中选择说话者。需要预先启动VOICEVOX应用。
   - Koeiromap: 可以细致调整声音。需要输入API密钥。
   - Google TTS: 可以选择除日语外的其他语言。需要凭证信息。
   - Style-Bert-VITS2: 需要启动本地API服务器。
   - AivisSpeech: 需要预先启动AivisSpeech应用。
   - GSVI TTS: 需要启动本地API服务器。
   - ElevenLabs: 可以选择多种语言。需要输入API密钥。
   - OpenAI: 需要输入API密钥。
   - Azure OpenAI: 需要输入API密钥。
   - にじボイス: 需要输入API密钥。
5. 从输入表单开始与角色对话。也可以使用麦克风输入。

## AITuber直播

- 可以获取YouTube的直播评论并进行发言。
- 需要YouTube API密钥。
- 以"#"开头的评论不会被读取。

### 使用方法

1. 在设置界面开启YouTube模式。
2. 输入YouTube API密钥和YouTube Live ID。
3. 其他设置与“与AI角色对话”相同。
4. 开始YouTube直播，确认角色对评论的反应。
5. 开启对话持续模式时，即使没有评论，AI也可以自行发言。

## 其他功能

### 外部联动模式

- 可以通过WebSocket向服务器应用发送请求并获取响应。
- 需要另行准备服务器应用。

#### 使用方法

1. 启动服务器应用，打开`ws://127.0.0.1:8000/ws`端点。
2. 在设置界面开启外部联动模式。
3. 其他设置与“与AI角色对话”相同。
4. 从输入表单发送请求，确认服务器应用返回的请求。

#### 相关

- 可以立即尝试此服务器应用的仓库。[tegnike/aituber-server](https://github.com/tegnike/aituber-server)
- 详细设置请阅读“[美少女と一緒に開発しようぜ！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)”。

### 幻灯片模式

- AI角色自动展示幻灯片的模式。
- 需要预先准备幻灯片和脚本文件。

#### 使用方法

1. 进行到可以与AI角色对话的步骤。
2. 将幻灯片文件夹和脚本文件放置在指定文件夹中。
3. 在设置界面开启幻灯片模式。
4. 按下幻灯片开始按钮开始展示。

#### 相关

- 详细设置请阅读“[スライド発表はAIがやる時代！！！！](https://note.com/nike_cha_n/n/n867081a598f1)”。

### 实时API模式

- 使用OpenAI的实时API，以低延迟与角色对话的模式。
- 可以定义函数执行。

#### 使用方法

1. 在AI服务中选择OpenAI或Azure OpenAI。
2. 开启实时API模式。
3. 使用麦克风进行对话。

#### 函数执行

- 在src/components/realtimeAPITools.tsx, src/components/realtimeAPITools.json中定义新函数。
- 请参考现有的get_current_weather函数。

## TIPS

### 关于Live2D的使用

为了显示Live2D，使用了非官方库 [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display)。

Live2D作为开发用SDK提供了Cubism库，目前存在Cubism 2.1、Cubism 3、Cubism 4和Cubism 5。Cubism 4与Cubism 3的模型兼容，最新的Cubism 5与Cubism 4兼容。

通过使用Cubism 2.1和Cubism 4/5，可以支持所有变体的Live2D模型。

#### Cubism Core

在使用此功能之前，需要将以下Cubism Core（Cubism运行时库）文件都放置在`public/scripts`中：

1. `live2dcubismcore.min.js`（用于Cubism 4/5）

   - 可从[官方网站](https://www.live2d.com/sdk/download/web/)下载
   - 或从[此处](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)获取（注意：不建议在生产环境中使用）

2. `live2d.min.js`（用于Cubism 2.1）
   - 自2019年9月4日起，无法从官方网站下载，但可从以下获取：
     - GitHub: [dylanNew/live2d](https://github.com/dylanNew/live2d/tree/master/webgl/Live2D/lib)
     - CDN: https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js

通过放置这两个文件，可以支持所有版本的Live2D模型。

### 背景图片设置

- 请更改`public/bg-c.png`的图片。请勿更改名称。

### 环境变量设置

- 部分设置值可以在`.env`文件中指定。
- 如果在设置界面输入，则优先于环境变量中指定的值。

### 麦克风输入方法（2种）

1. 按住Alt（或option）键进行输入 => 松开后发送
2. 点击麦克风按钮（按下一次开始输入）=> 再次点击发送

### 其他

- 可以在设置界面重置设置信息和对话历史。
- 各种设置项作为本地存储保存在浏览器中。
- 用代码块包围的元素不会被TTS读取。

## 相关文章

- [今日からあなたもAITuberデベロッパー｜ニケちゃん](https://note.com/nike_cha_n/n/ne98acb25e00f)
- [美少女と一緒に開発しようぜ！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)
- [スライド発表はAIがやる時代！！！！](https://note.com/nike_cha_n/n/n867081a598f1)
- [AITuberKitにマルチモーダル機能を追加したのでAIキャラと宅飲みしてみる](https://note.com/nike_cha_n/n/n6d8e330561e4)
- [AITuberKit × Dify で超簡単チャットボット構築](https://note.com/nike_cha_n/n/n13cd8b3cf88a)
- [DifyをXserverでインターネットに公開する](https://note.com/nike_cha_n/n/n23467824b22b)
- [高度な音声モード こと Realtime API を試してみる](https://note.com/nike_cha_n/n/ne51c16ddadd0)

## 寻求赞助

为了持续开发，我们正在寻找赞助者。<br>
您的支持将大大促进AITuber Kit的开发和改进。

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/fdanv1k6iz)

### 协作者（按支持顺序）

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

其他，私人赞助者 多名

## 使用条款

### 许可证

本项目自版本 v2.0.0 起采用**自定义许可证**。

- **免费使用**

  - 非营利目的的个人使用、教育目的、非营利目的的使用可以免费使用。

- **商业许可证**
  - 商业目的的使用需要单独获取商业许可证。
  - 详情请查看[关于许可证](./docs/license.md)。

## 优先实现

本项目接受有偿的功能优先实现。

- 可以优先实现企业或个人提出的功能。
- 实现的功能将作为本OSS项目的一部分公开。
- 费用根据功能的复杂性和实现所需时间单独估算。
- 此优先实现与商业许可证是不同的举措。若要商业使用实现的功能，需要单独获取商业许可证。

详情请联系support@aituberkit.com。

### 其他

- [Logo使用条款](./docs/logo_licence.md)
- [VRM及Live2D模型使用条款](./docs/character_model_licence.md)