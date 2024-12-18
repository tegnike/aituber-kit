# AITuberKit

<img style="max-width: 100%;" src="./logo.png">

**通知：从版本v2.0.0开始，本项目采用自定义许可方式。如果您计划将其用于商业目的，请查看[使用协议](#使用协议)部分。**

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
   <img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/tegnike/aituber-kit?sort=semver&color=orange">
   <a href="https://discord.gg/5rHEue52nZ"><img alt="Discord" src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white"/></a>
   <a href="https://github.com/sponsors/tegnike"><img alt="GitHub Sponsor" src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github"/></a>
</p>

<h3 align="center">
   <a href="../README.md">【日本語】</a>｜
   <a href="./README_en.md">【英語】</a>｜
   <a href="./README_ko.md">【韓語】</a>
</h3>
## 概覽

此存儲庫主要具有以下2個功能：

1. 與AI角色對話
2. AITuber直播

我在下面的文章中寫了詳細的使用指南：

[![今天成為AITuber開發者 | Nike-chan](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## ⚠️ 安全性相關重要注意事項

本存儲庫不僅考慮個人使用和本地環境開發，還考慮在採取適當安全措施的情況下進行商業使用。但是，在部署到Web環境時，請注意以下幾點：

- **API密鑰的處理**: 由於系統設計需要通過後端服務器調用AI服務（如OpenAI、Anthropic等）和TTS服務的API，因此需要適當管理API密鑰。

### 關於生產環境的使用

在生產環境中使用時，建議採取以下其中一種方案：

1. **實現後端服務器**: 在服務器端管理API密鑰，避免客戶端直接訪問API
2. **向用戶提供適當說明**: 當用戶使用自己的API密鑰時，需要說明安全注意事項
3. **實現訪問限制**: 根據需要實現適當的身份驗證和授權機制

## 開發環境

此項目在以下環境中開發：

- Node.js: ^20.0.0
- npm: 10.8.1

## 共同準備

1. 將存儲庫克隆到本地。

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. 打開文件夾。

```bash
cd aituber-kit
```

3. 安裝包。

```bash
npm install
```

4. 以開發模式啟動應用程序。

```bash
npm run dev
```

5. 打開URL [http://localhost:3000](http://localhost:3000)

6. 必要時，創建.env文件。

```bash
cp .env.example .env
```

## 與AI角色對話

- 這是與AI角色對話的功能。
- 它是此存儲庫的基礎[pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)的擴展功能。
- 只要您有各種LLM的API密鑰，就可以輕鬆開始使用。
- 最近的對話句子作為記憶保留。
- 它是多模態的，能夠識別來自攝像頭的圖像或上傳的圖像來生成回應。

### 使用方法

1. 在設置屏幕中輸入各種LLM的API密鑰。
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
2. 如有必要，編輯角色的設置提示。
3. 如有需要，加載VRM文件和背景文件。
4. 選擇語音合成引擎並根據需要配置語音設置。
   - VOICEVOX：您可以從多個選項中選擇發言者。需要事先運行VOICEVOX應用程序。
   - Koeiromap：您可以細微調整語音。需要API密鑰。
   - Google TTS：還可以選擇日語以外的語言。需要憑證信息。
   - Style-Bert-VITS2：需要運行本地API服務器。
   - AivisSpeech: 需要事先運行AivisSpeech應用程序。
   - GSVI TTS：需要運行本地API服務器。
   - ElevenLabs：支持多種語言選擇。需要輸入API密鑰。
   - OpenAI：需要API密鑰。
   - Azure OpenAI：需要API密鑰。
   - Nijivoice：需要API密鑰。
5. 從輸入表單開始與角色對話。也可以使用麥克風輸入。

## AITuber直播

- 可以檢索YouTube直播評論並讓角色發言。
- 需要YouTube API密鑰。
- 以「#」開頭的評論不會被讀取。

### 使用方法

1. 在設置屏幕中打開YouTube模式。
2. 輸入您的YouTube API密鑰和YouTube Live ID。
3. 與"與AI角色對話"相同的方式配置其他設置。
4. 開始在YouTube上直播並確認角色對評論的反應。
5. 開啟会話継続模式，在沒有評論時，AI可以自動發言。

## 其他功能

### 外部整合模式

- 您可以通過WebSocket向服務器應用程序發送請求並獲得響應。
- 需要另外準備服務器應用程序。

#### 使用方法

1. 啟動服務器應用程序並打開 `ws://127.0.0.1:8000/ws` 端點。
2. 在設置屏幕中打開外部整合模式。
3. 與"與AI角色對話"相同的方式配置其他設置。
4. 從輸入表單發送請求，並確認從服務器應用程序返回響應。

#### 相關

- 您可以使用此服務器應用程序存儲庫立即進行嘗試。[tegnike/aituber-server](https://github.com/tegnike/aituber-server)
- 請閱讀"[與美少女一起開發吧！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)"以獲得詳細設置。

### 幻燈片模式

- 這是AI角色自動展示幻燈片的模式。
- 您需要提前準備幻燈片和腳本文件。

#### 使用方法

1. 進行到可以與AI角色互動的階段。
2. 將幻燈片文件夾和腳本文件放在指定的文件夾中。
3. 在設置屏幕中打開幻燈片模式。
4. 按下開始幻燈片按鈕開始演示。

### Realtime API模式

- 使用OpenAI的Realtime API，可以以低延遲與角色對話。
- 可以定義函數執行。

#### 使用方法

1. 在AI服務中選擇OpenAI或Azure OpenAI。
2. 打開Realtime API模式。
3. 使用麥克風進行對話。

#### 函數執行

- 在src/components/realtimeAPITools.tsx和src/components/realtimeAPITools.json中定義新函數。
- 請參考現有的get_current_weather函數。

## 小貼士

### 背景固定方法

- 在 `public/bg-c.png` 更改背景圖片。請不要更改名稱。

### 設置環境變量

- 某些配置值可以從 `.env` 文件內容中參考。
- 如果在設置屏幕中輸入，則該值優先。

### 麥克風輸入方法（2種模式）

1. 按住Alt（或option）鍵進行輸入 => 釋放發送
2. 點擊麥克風按鈕（點擊一次開始錄音）=> 再次點擊發送

### 其他

- 設置信息和對話歷史可以在設置屏幕中重置。
- 各種設置項目保存在瀏覽器的本地存儲中。
- 代碼塊中的元素不會被TTS讀取。

## 相關文章

- [今天成為AITuber開發者 | Nike-chan](https://note.com/nike_cha_n/n/ne98acb25e00f)
- [與美少女一起開發吧！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)
- [AI時代的幻燈片演示！！！！](https://note.com/nike_cha_n/n/n867081a598f1)
- [AITuberKit添加了多模態功能，讓我們與AI角色一起在家喝一杯](https://note.com/nike_cha_n/n/n6d8e330561e4)
- [AITuberKit × Dify 超簡單聊天機器人構建](https://note.com/nike_cha_n/n/n13cd8b3cf88a)
- [在Xserver上公開Dify](https://note.com/nike_cha_n/n/n23467824b22b)
- [嘗試高級語音模式 Realtime API](https://note.com/nike_cha_n/n/ne51c16ddadd0)

## 尋求贊助

我們正在尋求贊助者以繼續我們的開發工作。<br>
您的支持將極大地促進AITuber套件的開發和改進。

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

### 我們的支持者（按支持順序排列）

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
</p>

以及多位匿名贊助者

## 使用协议

### 许可证

从版本v2.0.0开始，本项目采用**自定义许可方式**。

- **无偿使用**

  - 非营利目的的个人使用、教育目的和非营利目的的使用是无偿的。

- **商业许可证**
  - 商业目的的使用需要另外获取商业许可证。
  - 详细信息请查看[关于许可证](./license_en.md)。

### 其他

- [标志使用协议](./logo_licence_en.md)
- [VRM模型使用协议](./vrm_licence_en.md)
