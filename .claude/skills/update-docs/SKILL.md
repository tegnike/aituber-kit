---
name: update-docs
description: aituber-kit-docsのドキュメントサイトを最新バージョンに更新する。バージョンごとの差分を分析し、日本語→英語→中国語の順で3言語のドキュメントを更新する。ドキュメント更新、docs更新、バージョンアップ対応、リリースノート反映などの作業で使用する。
user-invocable: true
---

# ドキュメント更新スキル

aituber-kitのリリースバージョンに合わせて、VitePressドキュメントサイト（aituber-kit-docs）を更新する。

## 前提条件

- aituber-kitリポジトリ: `/Users/user/WorkSpace/aituber-kit`
- docsリポジトリ: `/Users/user/WorkSpace/aituber-kit-docs`
- ドキュメントは3言語: 日本語（`/guide/`）、英語（`/en/guide/`）、中国語（`/zh/guide/`）
- 日本語がマスター言語。日本語を先に更新し、その後en/zhに翻訳する

## 実行手順

### Step 1: バージョン差分の分析

現在のドキュメントバージョンと最新バージョンを特定する。

```bash
# docsの現在のバージョンを確認
grep "const version" /Users/user/WorkSpace/aituber-kit-docs/.vitepress/theme/DocVersion.vue

# aituber-kitの利用可能なタグを確認
cd /Users/user/WorkSpace/aituber-kit && git tag --sort=-v:refname | head -10
```

複数バージョンの差がある場合は、**1バージョンずつ順番に**更新する。各バージョンでビルドが通る状態を保つ。

### Step 2: ソースコードの変更点を調査

対象バージョン間の差分を以下のソースファイルから分析する。

#### 主要な情報ソース

| ソースファイル | 確認内容 |
|---|---|
| `.env.example` | 新規・変更・削除された環境変数 |
| `src/features/constants/aiModels.ts` | AIモデルリストの変更 |
| `src/features/constants/settings.ts` | 設定型の追加・変更（AIService, AIVoice等） |
| `src/components/settings/` | 設定UIの変更（新タブ、新セクション） |
| `src/features/stores/settings.ts` | ストアの新規設定項目 |
| `src/pages/api/` | 新規APIルート |

```bash
# .env.exampleの差分（最も重要）
cd /Users/user/WorkSpace/aituber-kit
diff <(git show v{前バージョン}:.env.example) <(git show v{対象バージョン}:.env.example)

# 特定バージョンのファイル内容を確認
git show v{対象バージョン}:src/features/constants/aiModels.ts

# 設定コンポーネントの構造変更
git diff v{前バージョン}..v{対象バージョン} -- src/components/settings/index.tsx
```

#### 変更カテゴリの特定

差分から以下のカテゴリに分類する:

- **AIプロバイダー/モデル**: モデルリスト追加・削除、デフォルトモデル変更
- **キャラクター**: 新モデルタイプ、設定項目の追加
- **音声合成(TTS)**: エンジンの追加・削除
- **音声認識(STT)**: 認識モードの変更
- **YouTube**: 配信連携機能の変更
- **新機能**: キオスクモード、アイドルモード、人感検知など
- **設定UI**: タブ構成の変更、新設定項目
- **その他**: Node.jsバージョン、基本設定の変更

### Step 3: 日本語ドキュメントの更新

#### 更新対象ファイルの対応表

| カテゴリ | ドキュメントファイル |
|---|---|
| クイックスタート | `guide/quickstart.md` |
| キャラクター共通 | `guide/character/common.md` |
| VRM設定 | `guide/character/vrm.md` |
| Live2D設定 | `guide/character/live2d.md` |
| PNGTuber設定 | `guide/character/pngtuber.md` |
| AI共通設定 | `guide/ai/common.md` |
| AIサービス設定 | `guide/ai/model-provider.md` |
| 合成音声設定 | `guide/voice-settings.md` |
| YouTube設定 | `guide/youtube-settings.md` |
| 会話履歴 | `guide/conversation-history.md` |
| 記憶設定 | `guide/memory-settings.md` |
| 環境変数一覧 | `guide/environment-variables.md` |
| 基本設定 | `guide/basic-settings.md` |
| その他 | `guide/other/advanced-settings.md` |

#### 更新ルール

1. **環境変数ブロック**: ソースの`.env.example`と完全に一致させる
2. **AIモデルリスト**: `aiModels.ts`の`modelDefinitions`から正確に転記する
3. **デフォルト値の表記**: モデルリスト内で「（デフォルト）」と明記する
4. **新規ページ作成時**: 既存ページ（VRM, Live2Dなど）の構成に合わせる
5. **セクション削除時**: 関連する環境変数一覧からも削除する

#### 新規ページ追加時のチェックリスト

新しいドキュメントページを作成する場合:

1. `guide/` に新規mdファイルを作成
2. `.vitepress/config.mts` のサイドバー設定に追加（日本語/英語/中国語の3箇所）
3. 環境変数一覧ページにも対応セクションを追加

### Step 4: ビルド検証

```bash
cd /Users/user/WorkSpace/aituber-kit-docs && npm run docs:build
```

ビルドが成功することを必ず確認する。デッドリンクがある場合はエラーになるので修正する。

### Step 5: 環境変数の網羅性チェック

新規追加された環境変数が全てドキュメント化されているか検証する。

```bash
# .env.exampleから新規変数を抽出し、docsに記載があるか確認
cd /Users/user/WorkSpace/aituber-kit-docs
for var in NEXT_PUBLIC_NEW_VAR1 NEXT_PUBLIC_NEW_VAR2; do
  count=$(grep -rl "$var" guide/ | wc -l | tr -d ' ')
  if [ "$count" = "0" ]; then
    echo "MISSING: $var"
  else
    echo "OK ($count files): $var"
  fi
done
```

各変数が**個別設定ページ**と**環境変数一覧ページ**の両方に記載されていること。

### Step 6: 英語・中国語への翻訳

日本語の更新が完了したら、Agentを使って英語と中国語を**並行で**翻訳する。

#### 翻訳ルール

- 環境変数名、モデル名、パス名は翻訳しない（原文のまま）
- コードブロック内のコメントは翻訳する
- 「（デフォルト）」→ 英語: "(default)"、中国語: "（默认）"
- 新規ファイルは `en/guide/` と `zh/guide/` に同名で作成
- 既存ファイルは変更部分のみ更新（変更していない箇所は触らない）

#### 並行翻訳の実行

```
英語翻訳エージェントと中国語翻訳エージェントを同時に起動する。
各エージェントには以下を伝える:
- 変更されたファイルの一覧
- 各ファイルの変更内容の要約
- 日本語ファイルとen/zh対応ファイルの両方を読んでから編集すること
- 完了後にnpm run docs:buildでビルド検証すること
```

### Step 7: DocVersionの更新

```bash
# バージョン表示を更新
# .vitepress/theme/DocVersion.vue の version 定数を更新
```

### Step 8: 最終ビルド検証とコミット

```bash
cd /Users/user/WorkSpace/aituber-kit-docs && npm run docs:build
```

ビルド成功を確認後、コミットする。コミットメッセージの形式:

```
docs: v{バージョン}対応 - {主要変更の要約}（日英中）

{詳細な変更内容をリスト形式で}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## よくある変更パターン

### AIモデルリストの更新

`aiModels.ts` の `modelDefinitions` を読み、以下を更新:
- `guide/ai/model-provider.md` のモデルリスト
- 概要セクションのプロバイダー説明文
- `guide/environment-variables.md` のデフォルトモデル名

### TTSエンジンの追加/削除

1. `guide/voice-settings.md` のエンジンリストと個別セクション
2. `guide/environment-variables.md` の音声合成セクション
3. CLAUDE.mdのTTSテーブルと一致させる

### 新しい設定タブの追加

1. `src/components/settings/index.tsx` で新タブを確認
2. 対応するドキュメントページを新規作成
3. `.vitepress/config.mts` のサイドバーに追加（3言語分）
4. `guide/environment-variables.md` に環境変数セクションを追加

### 既存機能の設定変更

1. 変更された環境変数を特定
2. 該当ページの環境変数ブロックを更新
3. 説明文を必要に応じて更新
4. 環境変数一覧ページも同期

## 注意事項

- **1バージョンずつ更新**: 複数バージョン遅れている場合も、各バージョンごとにビルドが通る状態を保つ
- **ソースコードが正**: ドキュメントの内容は常にソースコードの実装に合わせる
- **既存のUI/UXデザインを変更しない**: ドキュメントの構成やスタイルは既存に合わせる
- **環境変数の二重記載**: 各設定ページと環境変数一覧ページの両方に記載する
