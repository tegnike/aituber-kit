# はじめに

## 概要

AITuberKitは、誰でも簡単にAIキャラクターとチャットできるWebアプリケーションを構築できるオープンソースのツールキットです。AIキャラクターとの対話機能とAITuber配信機能を中心に、様々な拡張機能を備えています。

## 主な機能

### 1. AIキャラとの対話

- 各種LLMのAPIキーを使って、AIキャラクターと簡単に会話できます
- マルチモーダル対応で、カメラからの映像やアップロードした画像を認識して回答を生成
- 直近の会話文を記憶として保持

### 2. AITuber配信

- YouTubeの配信コメントを取得して、AIキャラクターが自動で応答
- 会話継続モードでコメントがなくても自発的に発言可能
- "#"から始まるコメントは読まれない機能

### 3. その他の機能

- **外部連携モード**: WebSocketでサーバーアプリと連携し、より高度な機能を実現
- **スライドモード**: AIキャラクターがスライドを自動で発表するモード
- **Realtime APIモード**: OpenAIのRealtime APIを使用した低遅延対話と関数実行

## 対応キャラクターモデル

- **3Dモデル**: VRMファイル
- **2Dモデル**: Live2Dファイル（Cubism 3以降）

### 対応LLM

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI
- Groq
- Cohere
- Mistral AI
- Perplexity
- Fireworks
- ローカルLLM
- Dify

## 対応音声合成エンジン

- VOICEVOX
- Koeiromap
- Google Text-to-Speech
- Style-Bert-VITS2
- AivisSpeech
- GSVI TTS
- ElevenLabs
- OpenAI
- Azure OpenAI
- にじボイス

## 動作要件

- Node.js: ^20.0.0
- npm: ^10.0.0

## セキュリティに関する注意事項

このリポジトリは、個人利用やローカル環境での開発はもちろん、適切なセキュリティ対策を施した上での商用利用も想定しています。ただし、Web環境にデプロイする際は以下の点にご注意ください：

- **APIキーの取り扱い**: バックエンドサーバーを経由してAIサービス（OpenAI, Anthropic等）やTTSサービスのAPIを呼び出す仕様となっているため、APIキーの適切な管理が必要です。

### 本番環境での利用について

本番環境で利用する場合は、以下のいずれかの対応を推奨します：

1. **バックエンドサーバーの実装**: APIキーの管理をサーバーサイドで行い、クライアントからの直接的なAPIアクセスを避ける
2. **利用者への適切な説明**: 各利用者が自身のAPIキーを使用する場合は、セキュリティ上の注意点について説明する
3. **アクセス制限の実装**: 必要に応じて、適切な認証・認可の仕組みを実装する

## サポートとコミュニティ

- [GitHub](https://github.com/tegnike/aituber-kit)
- [Discord](https://discord.gg/5rHEue52nZ)
- [X (Twitter)](https://x.com/tegnike)

## ライセンス

本プロジェクトは、バージョン v2.0.0 以降、**カスタムライセンス**を採用しています。詳細は[ライセンスページ](/guide/license)をご確認ください。
