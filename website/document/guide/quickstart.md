# クイックスタート

## 事前準備

AITuberKitを使用するには、以下のソフトウェアが必要です：

- Node.js: ^20.0.0
- npm: ^10.0.0

## インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/tegnike/aituber-kit.git
cd aituber-kit
```

### 2. パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定（任意）

必要に応じて、`.env.example`ファイルを`.env`にコピーし、環境変数を設定します。

```bash
cp .env.example .env
```

::: info
環境変数で設定した値は、設定画面で入力した値よりも優先度が低くなります。
:::

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて、AITuberKitを使い始めることができます。

## 基本的な使い方

### AIキャラとの対話

1. 設定画面で選択したLLMのAPIキーを入力します
2. 必要に応じてキャラクターの設定プロンプトを編集します
3. 必要に応じてキャラクターのVRMファイルまたはLive2Dファイル、および背景ファイルをアップロードします
4. 音声合成エンジンを選択し、必要に応じて声の設定を行います
5. 入力フォームからキャラクターと会話を開始します。マイク入力も可能です

### AITuber配信

1. 設定画面でYoutubeモードをONにします
2. Youtube APIキーとYoutube Live IDを入力します
3. 他の設定は"AIキャラとの対話"と同様に行います
4. Youtubeの配信を開始し、キャラクターがコメントに反応するのを確認します
5. 会話継続モードをONにすると、コメントが無いときにAIが自ら発言することができます

## 次のステップ

- [基本設定](/guide/basic-settings)で詳細な設定を行う
- [キャラクター設定](/guide/character/common)でAIキャラクターをカスタマイズ
- [AI設定](/guide/ai/common)でAIの動作を調整
- [合成音声設定](/guide/voice-settings)で合成音声の設定を行う
- [音声入力設定](/guide/speech-input-settings)で音声入力の設定を行う
- [Youtube設定](/guide/youtube-settings)でAITuber配信の設定を行う
- [スライド設定](/guide/slide-settings)でスライドモードの設定を行う
