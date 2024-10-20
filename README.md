<h1 align="center">
  <img style="max-width: 100%;" src="./docs/logo.png">
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
   <a href="https://discord.gg/5rHEue52nZ"><img alt="Discord" src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white"/></a>
   <a href="https://github.com/sponsors/tegnike"><img alt="GitHub Sponsor" src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github"/></a>
</p>

<h3 align="center">
   <a href="./docs/README_en.md">English</a>｜
   <a href="./docs/README_zh.md">中文</a>｜
   <a href="./docs/README_ko.md">韓語</a>
</h3>

## 概要

主に以下の2つの機能があります。

1. AIキャラとの対話
2. AITuber配信

下記の記事に詳細な使用方法を記載しました。

[![今日からあなたもAITuberデベロッパー｜ニケちゃん](https://github.com/tegnike/aituber-kit/assets/35606144/a958f505-72f9-4665-ab6c-b57b692bb166)](https://note.com/nike_cha_n/n/ne98acb25e00f)

## 開発環境

このプロジェクトは以下の環境で開発されています：

- Node.js: ^20.0.0
- npm: 10.8.1

## 共通事前準備

1. リポジトリをローカルにクローンします。

```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. フォルダを開きます。

```bash
cd aituber-kit
```

3. パッケージインストールします。

```bash
npm install
```

4. 開発モードでアプリケーションを起動します。

```bash
npm run dev
```

5. URLを開きます。[http://localhost:3000](http://localhost:3000)

## AIキャラとの対話

- AIキャラと会話する機能です。
- このリポジトリの元になっている[pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)を拡張した機能です。
- 各種LLMのAPIキーさえあれば比較的簡単に試すことが可能です。
- 直近の会話文を記憶として保持します。
- マルチモーダルで、カメラからの映像やアップロードした画像を認識して回答を生成することが可能です。

### 使用方法

1. 設定画面で各種LLMのAPIキーを入力します。
   - OpenAI
   - Anthropic
   - Google Gemini
   - Groq
   - ローカルLLM（APIキーは不要ですが、ローカルAPIサーバーを起動しておく必要があります。）
   - Dify Chatbot（APIキーは不要ですが、ローカルAPIサーバーを起動しておく必要があります。）
2. 必要に応じてキャラクターの設定プロンプトを編集します。
3. 用意がある場合は、VRMファイルおよび背景ファイルをアップロードします。
4. 音声合成エンジンを選択し、必要に応じて声の設定を行います。
   - VOICEVOXの場合は複数の選択肢から話者を選ぶことができます。予めVOICEVOXアプリを起動しておく必要があります。
   - Koeiromapの場合は、細かく音声を調整することが可能です。APIキーの入力が必要です。
   - Google TTSの場合は日本語以外の言語も選択可能です。credential情報が必要です。
   - Style-Bert-VITS2は、ローカルAPIサーバーを起動しておく必要があります。
   - GSVI TTSは、ローカルAPIサーバーを起動しておく必要があります。
   - ElevenLabsは様々な言語の選択が可能です。APIキーを入力してください。
5. 入力フォームからキャラクターと会話を開始します。マイク入力も可能。

## AITuber配信

- Youtubeの配信コメントを取得して発言することが可能です。
- Youtube APIキーが必要です。
- 「#」から始まるコメントは読まれません。

### 使用方法

1. 設定画面でYoutubeモードをONにします。
2. Youtube APIキーとYoutube Live IDを入力します。
3. 他の設定は「AIキャラとの対話」と同様に行います。
4. Youtubeの配信を開始し、キャラクターがコメントに反応するのを確認します。
5. 会話継続モードをONにすると、コメントが無いときにAIが自ら発言することができます。

## その他の機能

### 外部連携モード（β版）

- WebSocketでサーバーアプリにメッセージを送信して、レスポンスを取得することができます。
- 上記2つと異なり、フロントアプリで完結しないため少し難易度が高いです。
- ⚠ 現在メンテナンスしきれていないため、動かない可能性があります。

#### 使用方法

1. サーバーアプリを起動し、`ws://127.0.0.1:8000/ws` エンドポイントを開きます。
2. 設定画面でWebSocketモードをONにします。
3. 他の設定は「AIキャラとの対話」と同様に行います。
4. サーバーアプリからのメッセージを待ち、キャラクターが反応するのを確認します。

#### 関連

- 私が作成したサーバーアプリのリポジトリで試すことが可能です。[tegnike/aituber-server](https://github.com/tegnike/aituber-server)
- 詳しい設定は「[美少女と一緒に開発しようぜ！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)」を読んでください。

### スライドモード

- スライドをAIキャラが自動で発表するモードです。
- 予めスライドと台本ファイルを用意しておく必要があります。

#### 使用方法

1. 予めAIキャラと対話できるところまで進めておきます。
2. スライドフォルダと台本ファイルを指定のフォルダに配置します。
3. 設定画面でスライドモードをONにします。
4. スライド開始ボタンを押して発表を開始します。

## TIPS

### VRMモデル、背景固定方法

- VRMモデルは `public/AvatarSample_B.vrm` のデータを変更してください。名称は変更しないでください。
- 背景画像は `public/bg-c.jpg` の画像を変更してください。名称は変更しないでください。

### 環境変数の設定

- 一部の設定値は `.env` ファイルの内容を参照することができます。
- 設定画面で入力した場合は、その値が優先されます。

### その他

- 会話履歴は設定画面でリセットすることができます。
- 各種設定項目はブラウザに保存されます。
- コードブロックで囲まれた要素はTTSで読まれません。

## スポンサー募集

開発を継続するためにスポンサーの方を募集しています。<br>
あなたの支援は、AITuberキットの開発と改善に大きく貢献します。

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

### 協力者の皆様（ご支援いただいた順）

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

他、プライベートスポンサー 複数名

## 利用規約

- ライセンスは [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM) に準拠し、MITライセンスとしています。
- [ロゴの利用規約](./docs/logo_licence.md)
- [VRMモデルの利用規約](./docs/vrm_licence.md)

## コントリビューター用TIPS

### 新しい言語の追加方法

新しい言語をプロジェクトに追加するには、以下の手順に従ってください。

1. **言語ファイルの追加**:

   - `locales` ディレクトリに新しい言語のディレクトリを作成し、その中に `translation.json` ファイルを作成します。
   - 例: `locales/fr/translation.json` (フランス語の場合)

2. **翻訳の追加**:

   - `translation.json` ファイルに、既存の言語ファイルを参考にして翻訳を追加します。

3. **言語設定の更新**:

   - `src/lib/i18n.js` ファイルを開き、`resources` オブジェクトに新しい言語を追加します。

   ```javascript:src/lib/i18n.js
   resources: {
     ...,
     fr: {  // 新しい言語コード
       translation: require("../../locales/fr/translation.json"),
     },
   },
   ```

4. **言語選択オプションの追加**:

   - ユーザーが言語を選択できるように、UIの適切な部分（例えば設定画面の言語選択ドロップダウン）に新しい言語オプションを追加します。

   ```typescript:src/components/settings.tsx
   <select>
     ...,
     <option value="FR">フランス語 - French</option>
   </select>
   ```

5. **テスト**:
   - 新しい言語でアプリケーションが正しく表示されるかテストします。

これで新しい言語のサポートがプロジェクトに追加されます。

#### 音声言語コードの追加

- 音声言語コードの対応も追加する必要があります。
- `Introduction` コンポーネント内の `getVoiceLanguageCode` 関数に新しい言語コードを追加します。

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

#### READMEの追加

- 新しい言語のREADME (`README_fr.md`), ロゴ利用規約 (`logo_licence_fr.md`), VRMモデル利用規約 (`vrm_licence_fr.md`) を `docs` ディレクトリに追加してください。
