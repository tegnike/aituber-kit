# AITuberKit

<img style="max-width: 100%;" src="./public/ogp.png">

**お知らせ: 本プロジェクトはバージョン v2.0.0 以降、カスタムライセンスを採用しています。商用目的でご利用の場合は、[利用規約](#利用規約) セクションをご確認ください。**

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
      🌟 <a href="https://aituberkit.com">デモサイトへ</a> 🌟
   </h3>
</div>

<div align="center">
   <h3>
      📚 <a href="https://docs.aituberkit.com/">ドキュメントサイトへ</a> 📚
   </h3>
</div>

<h3 align="center">
   <a href="./docs/README_en.md">English</a>｜
   <a href="./docs/README_zh.md">中文</a>｜
   <a href="./docs/README_ko.md">韓語</a>
</h3>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tegnike/aituber-kit&type=Date)](https://www.star-history.com/#tegnike/aituber-kit&Date)

## 概要

AITuberKitは、誰でも簡単にAIキャラクターとチャットできるWebアプリケーションを構築できるオープンソースのツールキットです。主に以下の機能があります：

1. **AIキャラとの対話** - AIキャラクターと会話する機能
2. **AITuber配信** - YouTubeの配信コメントを取得して自動応答する機能
3. **その他の拡張機能** - 外部連携モード、スライドモード、Realtime APIモードなど

詳細な機能や使用方法については、[ドキュメントサイト](https://docs.aituberkit.com/)をご覧ください。

## ⚠️ セキュリティに関する重要な注意事項

このリポジトリは、個人利用やローカル環境での開発はもちろん、適切なセキュリティ対策を施した上での商用利用も想定しています。ただし、Web環境にデプロイする際は以下の点にご注意ください：

- **APIキーの取り扱い**: バックエンドサーバーを経由してAIサービス（OpenAI, Anthropic等）やTTSサービスのAPIを呼び出す仕様となっているため、APIキーの適切な管理が必要です。

本番環境での利用については、[セキュリティガイド](https://docs.aituberkit.com/guide/introduction#セキュリティに関する注意事項)をご確認ください。

## クイックスタート

### 開発環境

- Node.js: ^20.0.0
- npm: ^10.0.0

### インストール手順

1. リポジトリをクローンします

```bash
git clone https://github.com/tegnike/aituber-kit.git
cd aituber-kit
```

2. パッケージをインストールします

```bash
npm install
```

3. 開発サーバーを起動します

```bash
npm run dev
```

4. ブラウザで [http://localhost:3000](http://localhost:3000) を開きます

5. 必要に応じて環境変数を設定します

```bash
cp .env.example .env
```

詳細な設定方法や使い方については、[ドキュメントサイト](https://docs.aituberkit.com/)の[クイックスタートガイド](https://docs.aituberkit.com/guide/quickstart)をご覧ください。

## スポンサー募集

開発を継続するためにスポンサーの方を募集しています。<br>
あなたの支援は、AITuberキットの開発と改善に大きく貢献します。

[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/tegnike)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/fdanv1k6iz)

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

他、プライベートスポンサー 複数名

## 利用規約

### ライセンス

本プロジェクトは、バージョン v2.0.0 以降、**カスタムライセンス**を採用しています。

- **無償利用**: 営利目的以外での個人利用、教育目的、非営利目的での使用は無償で利用可能です。
- **商用ライセンス**: 商用目的での使用に関しては、別途商用ライセンスの取得が必要です。

詳細は、[ライセンスページ](https://docs.aituberkit.com/guide/license)をご確認ください。

## 優先実装について

本プロジェクトでは、有償での機能優先実装を受け付けています。詳細については、support@aituberkit.com までお問い合わせください。

### その他

- [ロゴの利用規約](./docs/logo_licence.md)
- [VRMおよびLive2Dモデルの利用規約](./docs/character_model_licence.md)
