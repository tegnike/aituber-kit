<h1 align="center">AITuber套件</h1>

<p align="center">
  <img style="max-width: 100%;" src="https://github.com/tegnike/nike-ChatVRM/assets/35606144/04e073de-ef99-4585-8bfa-aaf936409e79">
</p>

<p align="center">
   <a href="https://github.com/tegnike/nike-ChatVRM"><img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/tegnike/nike-ChatVRM"></a>
   <a href="https://github.com/tegnike/nike-ChatVRM"><img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/tegnike/nike-ChatVRM"></a>
   <img alt="GitHub Tag" src="https://img.shields.io/github/v/tag/tegnike/nike-ChatVRM?sort=semver&color=orange">
</p>

<h3 align="center">
   <a href="./README.md">【日本語】</a>
   <a href="./en_README.md">【英語】</a>
</h3>

## 概覽

此存儲庫具有以下3個功能：

1. 與AI角色對話
2. AITuber直播
3. 外部整合模式

我在下面的文章中寫了詳細的使用指南：

[![今天成為AITuber開發者 | Nike-chan](https://github.com/tegnike/nike-ChatVRM/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

### 共同準備

1. 安裝包
```bash
npm install
```

2. 以開發模式啟動應用程序

```bash
npm run dev
```

3. 打開URL [http://localhost:3000](http://localhost:3000)

## 與AI角色對話

- 這是與AI角色對話的功能。
- 它是此存儲庫的基礎[pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)的功能。
- 只要您有各種LLM的API密鑰，就可以相對輕鬆地嘗試。
- 最近的10個對話句子作為記憶保留。（未來更新可以指定數字）

### 使用方法

1. 在設置屏幕中輸入各種LLM的API密鑰。
   - OpenAI
   - Anthropic
   - Google Gemini
   - Groq
   - Local LLM（不需要API密鑰，但需要運行本地API服務器。）
   - Dify Chatbot（不需要API密鑰，但需要運行本地API服務器。）
2. 如有必要，編輯角色的設置提示。
3. 如有必要，加載VRM文件。
4. 選擇語音合成引擎並根據需要配置語音設置。
   - 對於VOICEVOX，您可以從多個選項中選擇發言者。需要事先運行VOICEVOX應用程序。
   - 對於Koeiromap，您可以細微調整語音。需要API密鑰。
   - 對於Google TTS，還可以選擇日語以外的語言。需要憑證信息。
   - 對於Style-Bert-VITS2，需要運行本地API服務器。
   - GSVI TTS，需要運行本地API服務器。
5. 從輸入表單開始與角色對話。也可以使用麥克風輸入。

## AITuber直播

- 可以檢索YouTube直播評論並讓角色發言。
- 需要YouTube API密鑰。
- 以「#」開頭的評論不會被讀取。（未來更新可以指定字符串）

### 使用方法

1. 在設置屏幕中打開YouTube模式。
2. 輸入您的YouTube API密鑰和YouTube Live ID。
3. 與“與AI角色對話”相同的方式配置其他設置。
4. 開始在YouTube上直播並確認角色對評論的反應。
5. 開啟会話継続模式，在沒有評論時，AI可以自動發言。

## 外部整合模式

- 您可以通過WebSocket向服務器應用程序發送消息並獲得響應。
- 與上述兩者不同，它不在前端應用程序中完成，因此難度略高。

### 使用方法

1. 啟動服務器應用程序並打開 `ws://127.0.0.1:8000/ws` 端點。
2. 在設置屏幕中打開WebSocket模式。
3. 與“與AI角色對話”相同的方式配置其他設置。
4. 等待服務器應用程序的消息並確認角色的反應。

### 相關

- 您可以嘗試我創建的服務器應用程序存儲庫。[tegnike/nike-open-interpreter](https://github.com/tegnike/nike-open-interpreter)
- 請閱讀“[與美少女一起開發吧！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)”以獲得詳細設置。

## 小貼士

### VRM模型和背景固定方法

- 在 `public/AvatarSample_B.vrm` 更改VRM模型數據。請不要更改名稱。
- 在 `public/bg-c.jpg` 更改背景圖片。請不要更改名稱。

## 其他

- 許可證遵循 [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)。
- 語言設置支持日語、英語和繁體中文。您可以在設置屏幕中切換。
- 可以在設置屏幕中重置對話歷史。
- 各種設置存儲在瀏覽器中。

## 使用协议

- [商标使用协议](./docs/logo_licence_zh.md)
- [VRM模型使用协议](./docs/vrm_licence_zh.md)
