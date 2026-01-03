---
marp: true
theme: custom
paginate: true
---

<!-- _class: title -->

# AITuber時代のWebポートフォリオの制作

**オープンソース技術とGitHubを使って**

**AITuber時代のオリジナルサイトを制作して公開!**

全力肯定彼氏くん **LuC4** と一緒に学ぼう！

---

# 今日の全体像

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides2.png)

**Part 1：GitHub入門**

- GitHubアカウント作成〜GitHub Pages

**Part 2：AITuber Kit セットアップ**

- Fork、環境変数、デプロイ

**Part 3：カスタマイズ**

- VRM、音声、キャラクター性格

**Part 4：プレゼンテーションモード**

- シナリオ作成、イテレーション

---

<!-- _class: title -->

# Part 1: GitHub入門編

GitHubを使ってWebサイトを公開しよう！

---

# GitHubとは？

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides11.png)

- **Git** = バージョン管理システム
- **GitHub** = Gitを使ったWebサービス

**できること：**

- ソースコードの保管・共有
- 変更履歴の管理
- チーム開発
- **Webサイトの公開（GitHub Pages）**

---

# GitHubアカウントを作る

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides11.png)

## https://github.com にアクセス

1. **Sign up** をクリック
2. メールアドレスを入力
3. パスワードを設定
4. ユーザー名を決める ← **重要！**

> ユーザー名は後から変更できないから、
> よく考えて決めてね！

---

# ユーザー名の決め方

**良い例：**

- `taro-yamada` （名前ベース）
- `creative-dev` （スキルベース）
- `kaitas` （短くて覚えやすい）

**避けた方がいい：**

- 数字だけ `12345`
- 長すぎる名前
- 読めない記号の羅列

> これが君のプログラマーとしての
> アイデンティティになるんだ！

---

# GitHub Pagesとは？

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides12.png)

**無料でWebサイトを公開できる!**

- HTMLファイルを置くだけ
- `https://username.github.io` でアクセス
- カスタムドメインも設定可能
- SSL証明書も自動（https対応）

**制限：**

- 静的サイトのみ（HTML/CSS/JS）
- サーバーサイド処理は不可

---

# リポジトリを作成する

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides12.png)

## Repositories → New

1. GitHubにログイン
2. 右上の **+** → **New repository**
3. または **Repositories** タブ → **New**

---

# リポジトリ名を設定

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides13.png)

## `<username>.github.io` 形式

**Repository name:**

```
kaitas.github.io
```

**設定：**

- ✅ **Public** を選択
- ✅ **Add a README file** をオン

> この名前にすると、そのままURLになるよ！

---

# リポジトリ作成完了

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides14.png)

**Create repository** をクリック！

これで君専用のリポジトリが作られた！

**次のステップ：**
GitHub Pages の設定をしていこう

---

# Settings → Pages

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides15.png)

1. リポジトリの **Settings** タブ
2. 左メニューの **Pages** をクリック
3. **Build and deployment** セクションへ

---

# Source を GitHub Actions に

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides15.png)

## Build and deployment

**Source:** `GitHub Actions` を選択

すると下に選択肢が出てくる：

- Jekyll
- **Static HTML** ← これを選ぶ

---

# Static HTML を Configure

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides15.png)

**Static HTML** の **Configure** をクリック

これで `.github/workflows/static.yml` が
自動生成されるよ！

---

# static.yml を Commit

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides16.png)

ファイルの内容はそのままでOK！

1. 右上の **Commit changes...** をクリック
2. コミットメッセージはデフォルトでOK
3. **Commit changes** をクリック

---

# GitHub Actions が動き出す

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides17.png)

## Actions タブを確認

黄色い ⏳ がぐるぐる回ってたら
ビルド中だよ！

**待ってる間にコーヒーでも飲んでてね** ☕

---

# デプロイ完了！

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides18.png)

緑の ✅ チェックマークが出たら完了！

**deploy** のところにURLが表示される：

```
https://kaitas.github.io/
```

> あれ、404エラー？
> 大丈夫、まだindex.htmlがないからだよ！

---

# index.html を作る

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides19.png)

## 最小限のHTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>僕のポートフォリオ</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>僕のWebサイトへようこそ！</p>
  </body>
</html>
```

---

# 編集方法は2つ

## 方法1: GitHub上で直接編集

- ブラウザだけでOK
- 簡単な修正向き

## 方法2: ローカルで編集（おすすめ）

- GitHub Desktop + VS Code
- 本格的な開発向き

**今日は方法2をやってみよう！**

---

# 必要なツールをインストール

## 1. GitHub Desktop

https://github.com/apps/desktop

## 2. Visual Studio Code

https://code.visualstudio.com/download

どちらも **無料** で使えるよ！

---

# GitHub Desktop で Clone

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides20.png)

## Code → Open with GitHub Desktop

1. リポジトリページで **Code** ボタン
2. **Open with GitHub Desktop** を選択
3. ブラウザがGitHub Desktopを開く

---

# Clone とは？

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides21.png)

**GitHubのコードを自分のPCにコピーすること**

- リモート（GitHub）→ ローカル（PC）
- 編集は自分のPC上で行う
- 完了したらPushで戻す

**保存先のおすすめ：**

- クラウド同期してない場所
- 例: `~/git.local/` や `C:\git\`

---

# Clone を実行

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides21.png)

1. **Local Path** を確認
2. **Clone** ボタンをクリック
3. ダウンロード完了を待つ

これで自分のPCにコードがコピーされました！

---

# VS Code で開く

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides22.png)

## GitHub Desktop から起動

1. **Current Repository** を右クリック
2. **Open in Visual Studio Code** を選択

または：
**Repository** メニュー → **Open in Visual Studio Code**

---

# フォルダを信頼する

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides23.png)

初回起動時に聞かれる：

> このフォルダーのファイルの作成者を
> 信頼しますか？

**「はい、作成者を信頼します」** をクリックしてOK

自分で作ったリポジトリだから安心してね！

---

# VS Code の画面説明

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides24.png)

**左サイドバー：**

- 📁 エクスプローラー（ファイル一覧）
- 🔍 検索
- 🔀 ソース管理（Git）
- 🧩 拡張機能

**覚えておくと便利：**

- Cmd/Ctrl + + 拡大
- Cmd/Ctrl + ` ターミナル

---

# ファイルを編集してみよう

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides26.png)

## README.md を開く

左のエクスプローラーから
`README.md` をクリック

**Markdown記法：**

```markdown
# 見出し1

## 見出し2

[リンク](https://example.com)
![画像](image.png)
```

---

# 変更を保存

## Cmd/Ctrl + S で保存

ファイル名の横に **●** があったら
未保存の状態だよ！

保存すると消える ✅

---

# GitHub Desktop で変更を確認

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides27.png)

**Changes** タブを見てみよう

- 左側：変更されたファイル一覧
- 右側：何が変わったか（差分）
  - 🟢 緑 = 追加
  - 🔴 赤 = 削除

---

# Commit（コミット）

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides27.png)

## 変更を記録する

1. **Summary** にコミットメッセージを入力
   例：「README.mdを更新」
2. **Commit to main** をクリック

> メッセージは何を変更したか
> 分かるように書こうね！

---

# Push（プッシュ）する

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides28.png)

## GitHubに送信する

**Push origin** ボタンをクリック！

これでローカルの変更が
GitHubサーバーにアップロードされる

**世界中からアクセスできるようになった！**

---

# GitHub Actions が再度実行

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides29.png)

Pushすると自動でビルドが始まる！

**Actions** タブで確認：

- ⏳ 黄色 = ビルド中
- ✅ 緑 = 完了
- ❌ 赤 = エラー

---

# Codespace を使う方法

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides30.png)

## ブラウザだけで開発できる！

1. 緑の **Code** ボタン → **Codespaces**
2. **Create codespace on main**
3. VS Code がブラウザで起動！

**インストール不要で便利！**

---

# Codespace での編集

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides32.png)

VS Code と同じ操作感：

1. ファイルを編集
2. 左の **ソース管理** アイコン
3. コミットメッセージを入力
4. **コミット** → **変更の同期**

---

# GitHub Pages vs Vercel

## どっちを使えばいい？

公開するためのサーバーを選ぼう

- **静的サイト（HTML/CSS/JS）** → GitHub Pages
- **Next.js アプリ** → **Vercel**
- **AITuber Kit** → **Vercel**

> AITuber Kit は Next.js で作られてるから
> Vercel を使うんだ！

---

# なぜ AITuber Kit に Vercel？

**AITuber Kit の技術構成：**

1. **Next.js** フレームワーク
2. **API Routes** でサーバー処理
   - `/api/chat` - AI会話
   - `/api/tts` - 音声合成
3. **環境変数** の安全な管理

GitHub Pages は静的サイトのみ対応
→ サーバー処理ができない！

---

<!-- _class: title -->

# Part 2: AITuber Kit セットアップ編

Fork → 環境変数 → デプロイ！

---

# Fork とは？

**他人のリポジトリを自分のアカウントにコピーすること**

- 本家のコードをベースに
- 自分だけのカスタマイズができる
- 元のリポジトリに影響しない

> Clone は「PCにコピー」
> Fork は「GitHubアカウントにコピー」

---

# AITuber Kit を Fork する

## https://github.com/tegnike/aituber-kit

1. 上記URLにアクセス
2. 右上の **Fork** ボタンをクリック
3. **Create fork** をクリック

これで `あなたのID/aituber-kit` が作られる！

---

# Fork 完了！

フォークが完了すると
`yourname/aituber-kit` というリポジトリが
自分のアカウントに作られるよ！

---

# ソースコードのカスタマイズ

## デプロイ前に知っておこう

AITuber Kit はオープンソース！
**ソースコードを自由に編集できる**

- 見た目の変更（CSS）
- 機能の追加・修正（TypeScript）
- 新しいページの追加

> まずはデプロイして動かしてから
> カスタマイズするのがおすすめ！

---

# カスタマイズできる場所

![bg right:50% top contain](/slides/DHGSVR25-3/gitpush.png)

## 主要なフォルダ構成

- `/src/components/` → UI
- `/src/features/` → 機能
- `/src/pages/` → ページ定義
- `/public/` → 静的ファイル

## よくあるカスタマイズ

- `/public/vrm/` VRMモデル
- `/public/backgrounds/` 背景
- `.env` で各種設定を変更

---

# カスタマイズの流れ

## 基本的な手順

1. **GitHub** でコードを編集
2. **Commit** で変更を保存
3. **Push** でGitHubに反映
4. **Vercel が自動でデプロイ**

> GitHubにPushすると
> Vercelが自動でビルド＆デプロイ！

これを「CI/CD」と呼びます

---

# Vercel アカウント作成

NextJS使いなら絶対おすすめ

ホビープランは無料(非営利/個人)

## https://vercel.com

1. **Sign Up** をクリック
2. **Continue with GitHub** を選択
3. GitHubとの連携を許可
4. アカウント作成完了！

> GitHubアカウントで連携すると
> リポジトリが自動で見えるよ！

---

# プロジェクトをインポート

![bg right:50% top contain](/slides/DHGSVR25-3/Vercel1.png)

## Add New → Project

1. Vercel ダッシュボードで
2. **Add New** → **Project**
3. **Import Git Repository** から
4. フォークした **aituber-kit** を選択
5. **Import** をクリック
6. **New Project** から **Deploy**

---

# Vercelのデプロイエラー

![bg right:50% top contain](/slides/DHGSVR25-3/Vercel2.png)

## エラーが出たら、AIに聞こう！

黒くて怖い画面がでてくるかもしれないけど、
エラーメッセージをコピーして貼り付ければ
大体解決するよ！

---

# デプロイ成功！

![bg right:50% top contain](/slides/DHGSVR25-3/Vercel3.png)

## Production Deployment

- **Status**: Ready ✅
- **Domain**: your-project.vercel.app
- ブラウザでアクセスして確認！

> まだ設定が足りないから
> 画面は真っ白かも？

---

# 環境変数を設定しよう

## Deploy 前に Environment Variables

1. **Project Settings** をクリック
2. **Environment Variables** を選択
3. **Key** と **Value** を入力
4. **Add** をクリック

> 最低限 **GOOGLE_API_KEY** だけでOK！

---

# 環境変数（.env）とは？

**アプリの設定値を外部ファイルで管理する仕組み**

```env
OPENAI_API_KEY=sk-xxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**なぜ必要？**

- APIキーをコードに直接書かない
- 環境ごとに設定を変えられる
- セキュリティを保てる

---

# 必要な環境変数

## 全部必要なの？ → **いいえ！**

**必須（どれか1つだけでOK）：**

- `OPENAI_API_KEY` → OpenAI (GPT-4等)
- `ANTHROPIC_API_KEY` → Anthropic (Claude)
- `GOOGLE_API_KEY` → Google (Gemini)

> 使いたいAIのキーだけあればOKだよ！

---

# APIキーの取得方法

- **OpenAI** → platform.openai.com/api-keys
- **Anthropic** → console.anthropic.com
- **Google** → aistudio.google.com/apikey

**手順：**

1. 各サイトでアカウント作成
2. APIキーを発行
3. キーをコピーして保存

---

<!-- _class: title -->

# ⚠️ APIキーの取り扱い注意！

絶対に守ってほしいこと

---

# 何が「秘密」なの？

## 🔴 絶対に公開しちゃダメなもの

- **APIキー** (`sk-xxxx`, `sk-ant-xxxx`)
- **パスワード**
- **アクセストークン**

## 🟢 公開してOKなもの

- ソースコード（.envファイル以外）
- 設定ファイルのテンプレート

---

# APIキーを漏らすとどうなる？

**他人があなたのAPIキーを使う**
↓
**あなたのアカウントに請求が来る！**

- OpenAI: 1回の呼び出しで数円〜数十円
- 大量に使われると数万円の請求も...

> GitHubに公開したら
> 数分で悪用されることもあるよ！

---

# どこに置けば安全？

## ✅ 安全な場所

- **Vercel 環境変数** → 暗号化されて保存
- **ローカルの .env** → .gitignore で除外

## ❌ 危険な場所

- ソースコード内 → GitHubで公開される
- コミットメッセージ → 履歴に残る
- スクリーンショット → SNSで拡散される

---

# .gitignore の役割

## .env ファイルを Git から除外

```gitignore
# .gitignore ファイルの中身
.env
.env.local
.env.*.local
```

これがあるから `.env` は
**GitHubにプッシュされない**

> AITuber Kit には最初から設定済みだよ！

> ★ (.)ドットで始まるファイル名は「見えないファイル」だけど VS Code や GitHub では見れるはずだよ

---

# Vercel で環境変数を設定

![bg right:50% top contain](/slides/DHGSVR25-3/Vercel4.png)

## Project Settings → Environment Variables

1. **Key** に変数名を入力
   例：`GOOGLE_API_KEY`
2. **Value** にAPIキーを入力
3. **Add** をクリック

Vercelなら暗号化されて安全！

> 慣れたらローカルの.envファイルをアップロードして全項目を反映できるよ

---

# Node.js のインストール

ローカルでのカスタマイズ結果を確認するために、ローカル環境にNode.jsをインストールしよう。

## https://nodejs.org/

**LTS版（推奨）** をダウンロード

**必要なバージョン：**

- Node.js **20.0.0** 以上
- npm **10.0.0** 以上

---

# Mac での Node.js インストール

## 方法1: 公式インストーラー

1. https://nodejs.org/ からダウンロード
2. `.pkg` ファイルを実行

## 方法2: Homebrew（おすすめ）

```bash
brew install node
```

**確認：**

```bash
node --version  # v20.x.x
npm --version   # 10.x.x
```

---

# Windows での Node.js インストール

## 公式インストーラー

1. https://nodejs.org/ からダウンロード
2. `.msi` ファイルを実行
3. インストーラーの指示に従う
4. **「Add to PATH」にチェック**

**確認（PowerShell/コマンドプロンプト）：**

```cmd
node --version
npm --version
```

---

# ローカル環境のセットアップ

## コマンド一覧

```bash
# 1. クローン
git clone https://github.com/YOUR_NAME/aituber-kit.git
# 2. ディレクトリ移動
cd aituber-kit
# 3. 環境変数ファイル作成
cp .env.example .env  # Mac/Linux
copy .env.example .env  # Windows
# 4. .env を編集してAPIキーを設定
# 5. パッケージインストール
npm install
```

---

# `npm install`

## 依存パッケージをインストール

```bash
npm install
```

**何が起こる？**

- `package.json` に書かれた全パッケージをダウンロード
- `node_modules` フォルダが作られる

**初回は 2-5分 かかるよ！**

---

# `.env` ファイルを編集

## APIキーを設定する

```bash
# .env ファイルを開く
code .env  # VS Code で開く
```

**安心ポイント：**

- `.env` は `.gitignore` に含まれている
- **GitHubにはアップロードされない！**

---

# Google API キーの取得

## https://aistudio.google.com/apikey

1. Google アカウントでログイン
2. **Create API Key** をクリック
3. キーをコピー

**⚠️ 重要：**

- **使いまわさない！** プロジェクトごとに新規作成
- 漏れたときの被害を最小限に

---

# `.env` の設定例（1/2）

## デフォルトから変更する設定

```env
# 言語設定
NEXT_PUBLIC_SELECT_LANGUAGE="ja"

# キャラクター設定
NEXT_PUBLIC_CHARACTER_NAME="全力肯定彼氏くん[LuC4]"
NEXT_PUBLIC_SELECTED_VRM_PATH="/vrm/LuC4.vrm"

# VRMファイルは public/vrm/ に配置
```

---

# `.env` の設定例（2/2）

## APIキーとスライドモード

```env
# Google API Key
GOOGLE_API_KEY="AIza..."

# スライドモードをデフォルトON
NEXT_PUBLIC_SLIDE_MODE="true"
```

---

# Google TTS の設定（1/2）

![bg right:50% top contain](/slides/DHGSVR25-3/TTS.png)

## ⚠️ 重要：別のAPIキーが必要！

AI Studio のキーは **Gemini専用**
Cloud TTS には **別のキー** が必要

**手順：**

1. https://console.cloud.google.com/apis/credentials
2. 「+ 認証情報を作成」→「APIキー」
3. Cloud Text-to-Speech API を有効化
4. 新しいキーを `GOOGLE_TTS_KEY` に設定

---

# Google TTS の設定（2/2）

![bg right:50% top contain](/slides/DHGSVR25-3/TTS-API.png)

## .env の設定

```env
NEXT_PUBLIC_SELECT_VOICE="google"
GOOGLE_TTS_KEY="新しいAPIキー"
NEXT_PUBLIC_GOOGLE_TTS_TYPE="ja-JP-Chirp3-HD-Puck"
```

## おすすめボイス（Chirp3-HD）

- `ja-JP-Chirp3-HD-Puck` → 男性・最新高品質
- `ja-JP-Chirp3-HD-Kore` → 女性・最新高品質
- `ja-JP-Neural2-B` → 女性・安定

---

# ローカルで動作確認

## 開発サーバーを起動

```bash
npm run dev
```

ブラウザで開く：

```
http://localhost:3000
```

**確認ポイント：**

- キャラクターが表示される
- チャットで返答が来る
- 音声が再生される

---

# 初期デプロイ（Vercel）

1. 環境変数を設定したら
2. **Deploy** ボタンをクリック
3. ビルドが始まる（2-3分）
4. 完了したらURLが発行！

```
https://your-project.vercel.app
```

---

# デプロイ完了！

[public/slides/DHGSVR25-3/nike.png]

🎉 **Congratulations!**

URLにアクセスして
AIキャラクターが表示されたら成功！

---

<!-- _class: title -->

# Part 3: カスタマイズ編

VRM・音声・性格を設定しよう！

---

# カスタマイズでできること

1. **VRMモデル** を変更

   - 自分で作ったキャラクター
   - VRoid Studio で作成

2. **音声** を選ぶ

   - 多彩な音声合成エンジン

3. **性格** を設定
   - システムプロンプトで調整

---

# VRM を配置する

## VRM ファイルとは？

**3Dアバターの標準フォーマット**

- VRoid Studio で作成できる
- `.vrm` 拡張子

## 配置場所

```
/public/vrm/
├── nikechan_v1.vrm（デフォルト）
├── nikechan_v2.vrm
└── あなたのモデル.vrm ← ここに追加！
```

---

# VRM の設定方法

## 設定画面から選択

1. ⚙️ 設定アイコンをクリック
2. **キャラクターモデル** セクション
3. **VRM** タブを選択
4. アップロードまたはURL指定

> VRoid Hub のURLも使えるよ！

---

# 音声を選ぶ

![bg right:50% top contain](/slides/DHGSVR25-3/LuC4-1.png)

## 対応音声合成エンジン

- **VOICEVOX** → 無料、日本語特化
- **ElevenLabs** → 高品質、多言語
- **Style-Bert-VITS2** → カスタム可能
- **Google TTS** → 安定、多言語
- **OpenAI TTS** → 自然な発話

> まずは **VOICEVOX** がおすすめ！

---

# 音声の設定方法

## 設定画面から選択

1. ⚙️ 設定アイコンをクリック
2. **音声合成** セクション
3. エンジンを選択
4. 声のスタイルを選択

**VOICEVOX の場合：**

- ずんだもん、四国めたん など
- 話速、ピッチも調整可能

---

# キャラクターの性格を設定

![bg right:50% top contain](/slides/DHGSVR25-3/LuC4-2.png)

## システムプロンプトとは？

**AIに「あなたはこういうキャラクターです」と伝える文章**

これで性格、口調、知識が決まる！

---

# システムプロンプトの例

```text
あなたは「ニケちゃん」です。

## 基本設定
- 一人称: 私
- 口調: タメ口（敬語は使わない）
- 性格: フレンドリー、明るい

## 発言例
「こんにちは！元気だった？」
「えー！そうなんだ！すごいね！」
「うーん、それはちょっと難しいかも」
```

---

# 性格設定のポイント

**含めるべき要素：**

1. **一人称** - 私、僕、俺、わたくし など
2. **口調** - 敬語、タメ口、方言 など
3. **性格特性** - 明るい、クール、優しい など
4. **発言例** - 具体的なセリフ
5. **NGワード** - 言わないこと

> 発言例を入れると
> AIが雰囲気を掴みやすいよ！

---

<!-- _class: title -->

# Part 4: プレゼンテーションモード編

スライドを自動プレゼンさせよう！

---

# プレゼンテーションモードとは？

**AIキャラクターが自動でスライドを説明！**

- Marp形式のスライドを読み込み
- 各ページのセリフを自動再生
- 音声合成でしゃべる
- 感情表現も可能

> 授業、発表、配信に使えるよ！

---

# 必要なファイル

## スライドディレクトリ構成

```
/public/slides/あなたのスライド/
├── slides.md      # スライド本体
├── scripts.json   # セリフデータ
├── theme.css      # テーマ（任意）
└── images/        # 画像（任意）
```

---

# slides.md の役割

## Marp形式のスライド

```markdown
---
marp: true
theme: custom
paginate: true
---

# スライドタイトル

内容をここに書く

---

# 次のスライド

- 箇条書き
- も使える
```

**`---` で区切ると次のページ**

---

# scripts.json の役割

## 各ページのセリフを定義

```json
[
  {
    "page": 0,
    "line": "[happy]こんにちは！今日の発表を始めるよ！",
    "notes": "タイトルスライド"
  },
  {
    "page": 1,
    "line": "[neutral]今日のテーマはこちら。[happy]楽しんでいってね！",
    "notes": "概要説明"
  }
]
```

---

# 感情タグの使い方

## セリフに感情を付ける

- `[neutral]` → 通常（説明、解説）
- `[happy]` → 喜び（良いニュース）
- `[sad]` → 悲しみ（残念な話）
- `[angry]` → 怒り（注意喚起）
- `[surprised]` → 驚き（意外な事実）
- `[relaxed]` → 安らぎ（励まし）

---

# セリフの書き方例

```json
{
  "line": "[happy]やあ、みんな！[neutral]今日はGitHubについて学ぶよ。[relaxed]難しそうに見えるかもしれないけど、大丈夫、僕がついてるから！"
}
```

**ポイント：**

- 1つのセリフに複数の感情を混ぜてOK
- 感情が変わるタイミングで自然に

---

# シナリオを Claude に書いてもらう

## プロンプト例

```text
以下のスライド内容について、
「LuC4」というキャラクターのセリフを
scripts.json形式で作成してください。

- 一人称: 僕
- 口調: タメ口、全力肯定
- 感情タグを適切に使用

[スライドの内容をここに貼り付け]
```

---

# Claude への指示のコツ

**含めるべき情報：**

1. **キャラクター設定**
   - 名前、性格、口調
2. **出力形式**
   - JSON形式で
3. **スライド内容**
   - テキストをそのまま貼る
4. **補足指示**
   - 「1ページ30秒程度」など

---

# イテレーションを回す

## 完璧を目指さない！

1. **まず動かす**

   - 最小限のスライドとセリフで

2. **確認する**

   - 実際に再生してみる

3. **改善する**

   - 気になる部分を修正

4. **繰り返す**
   - 少しずつ良くしていく

---

# イテレーションの具体例

```text
【1回目】
- スライド5枚、セリフざっくり
- → 「ここ長すぎるな」

【2回目】
- セリフを短く調整
- → 「感情が単調だな」

【3回目】
- 感情タグを追加
- → 「いい感じ！」

【4回目】
- 画像を追加して完成！
```

---

# プレゼンモードの起動方法

## 設定画面から

1. ⚙️ 設定アイコンをクリック
2. **スライドモード** をオン
3. スライドフォルダを選択
4. **開始** をクリック

自動でプレゼンが始まる！

---

<!-- _class: title -->

# まとめ

---

# 今日学んだこと

✅ **GitHub の基本**

- アカウント作成、Clone, Commit, Push

✅ **AITuber Kit セットアップ**

- Fork、環境変数、デプロイ

✅ **カスタマイズ**

- VRM、音声、性格設定

✅ **プレゼンテーションモード**

- slides.md、scripts.json、イテレーション

---

# 制作のヒント

1. **まずデプロイ** - 動く状態を作る
2. **少しずつ変更** - 一度に変えすぎない
3. **こまめにコミット** - 戻れるように
4. **困ったら質問** - GitHub Issues へ

> 完璧を目指さず、
> まず動くものを作ろう！

---

<!-- _class: end -->

# 皆さんの作品を

# 楽しみにしています！

---

# リソース

![bg right:50% top contain](/slides/DHGSVR25-3/DHGS25Slides35.png)

**AITuber Kit**
https://github.com/tegnike/aituber-kit

**このデモのGitHub(fork):**
https://github.com/kaitas/aituber-kit

**デジタルハリウッド大学院講義「DHGSVR」**
https://akihiko.shirai.as/DHGSVR/

他の受講生が作った作品も見れるかも？

**LuC4 公式サイト**
https://luc4.aicu.jp/

---

<!-- _class: title -->

# 次回予告：第4回 クリエイティブAI

画像生成、音声合成、AIキャラクターのカスタマイズ

**自分だけのAITuberを作ろう！**

---

<!-- _class: end -->

# お疲れさま！

最後まで、よく頑張ったね！
質問があったらいつでも聞いてね

**しらいはかせのX :** X@o_ob

**LuC4公式:** https://luc4.aicu.jp/
