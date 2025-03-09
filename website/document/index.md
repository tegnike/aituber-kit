---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'AITuberKit'
  text: 'AIキャラクターとの対話・AITuber配信を簡単に実現'
  tagline: 'オープンソースのAIキャラクターアプリケーション構築キット'
  image:
    src: /logo.png
    alt: AITuberKit
  actions:
    - theme: brand
      text: はじめに
      link: /guide/introduction
    - theme: brand
      text: クイックスタート
      link: /guide/quickstart
    - theme: alt
      text: デモサイト
      link: https://aituberkit.com/
    - theme: alt
      text: GitHub
      link: https://github.com/tegnike/aituber-kit

features:
  - icon: 🤖
    title: AIキャラとの対話
    details: 各種LLMのAPIキーを使って、AIキャラクターと簡単に会話できます。マルチモーダル対応で、画像認識も可能です。
  - icon: 📺
    title: AITuber配信
    details: YouTubeの配信コメントを取得して、AIキャラクターが自動で応答。会話継続モードでコメントがなくても自発的に発言できます。
  - icon: 🎤
    title: 多彩な音声合成
    details: VOICEVOX、Koeiromap、Google Text-to-Speech、ElevenLabsなど、様々な音声合成エンジンに対応しています。
  - icon: 🎭
    title: VRM/Live2Dサポート
    details: 3DモデルのVRMファイルと2DモデルのLive2Dファイルの両方に対応。お好みのキャラクターを使用できます。
  - icon: 🔄
    title: 外部連携モード
    details: WebSocketでサーバーアプリと連携し、より高度な機能を実現できます。
  - icon: 📊
    title: スライドモード
    details: AIキャラクターがスライドを自動で発表するモードを搭載。プレゼンテーションも任せられます。
---

<div class="custom-block warning">
  <p><strong>セキュリティに関する重要な注意事項</strong>: このリポジトリは、個人利用やローカル環境での開発はもちろん、適切なセキュリティ対策を施した上での商用利用も想定しています。Web環境にデプロイする際は、APIキーの適切な管理が必要です。</p>
</div>

<div class="custom-block info">
  <p><strong>お知らせ</strong>: 本プロジェクトはバージョン v2.0.0 以降、カスタムライセンスを採用しています。商用目的でご利用の場合は、<a href="/guide/license">利用規約</a>セクションをご確認ください。</p>
</div>

## コミュニティに参加する

<div class="vp-doc" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;">
  <a href="https://discord.gg/5rHEue52nZ" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white" alt="Discord" />
  </a>
  <a href="https://x.com/tegnike" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/X-tegnike-1DA1F2?logo=x&style=flat&logoColor=white" alt="X (Twitter)" />
  </a>
  <a href="https://github.com/sponsors/tegnike" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github" alt="GitHub Sponsor" />
  </a>
</div>
