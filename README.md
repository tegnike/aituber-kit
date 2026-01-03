# DHGSVR25 講義解説生成システム

> **本リポジトリは [AITuber-kit](https://github.com/tegnike/aituber-kit) をベースにした講義解説生成システムです。**
>
> デジタルハリウッド大学大学院「テクノロジー特論D：人工現実（DHGSVR）」にて運用されています。

## 概要

AIキャラクター「LuC4（全力肯定彼氏くん）」が講義スライドを自動でプレゼンテーションするシステムです。

- **プレゼンター**: LuC4 - https://luc4.aicu.jp/
- **制作**: AICU Inc.
- **講義**: DHGSVR25（人工現実2025）

## クイックスタート

### 必要環境

- Node.js 20.0.0 以上
- npm 10.0.0 以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_NAME/aituber-kit.git
cd aituber-kit

# 環境変数ファイルを作成
cp .env.example .env

# .env を編集してAPIキーを設定（どれか1つでOK）
# OPENAI_API_KEY=sk-xxxxx
# ANTHROPIC_API_KEY=sk-ant-xxxxx
# GOOGLE_API_KEY=AIzaxxxxx

# パッケージインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

### その他のコマンド

```bash
npm run build    # 本番用ビルド
npm run lint     # コード品質チェック
npm test         # テスト実行
```

## 講義スライド

| 回 | タイトル | フォルダ |
|----|---------|---------|
| 第3回 | Webポートフォリオの制作 | `/public/slides/DHGSVR25-3/` |

### スライド構成

```
/public/slides/DHGSVR25-{回}/
├── slides.md           # Marp形式スライド
├── scripts.json        # セリフデータ（感情タグ付き）
├── supplement.txt      # Q&A用補足情報
├── theme.css           # カスタムテーマ
└── DHGS25Slides{n}.png # スライド画像
```

## プレゼンテーションモード

1. 設定画面（⚙️）を開く
2. **スライドモード** をオン
3. スライドフォルダを選択
4. **開始** をクリック

LuC4が自動でスライドを説明します。

## 本家 AITuber-kit について

詳細な機能、設定、カスタマイズについては本家リポジトリを参照してください。

- **GitHub**: https://github.com/tegnike/aituber-kit
- **ドキュメント**: https://docs.aituberkit.com/
- **デモサイト**: https://aituberkit.com

### 主な機能

- AIキャラクターとの対話
- VRM/Live2D キャラクターモデル
- 複数のLLMプロバイダー対応
- 多彩な音声合成エンジン

## ライセンス

本家 AITuber-kit のライセンスに準拠します。

- 非商用利用: 無料
- 商用利用: 別途ライセンス必要

詳細: https://github.com/tegnike/aituber-kit/blob/main/LICENSE

## リンク

- **本家 AITuber-kit**: https://github.com/tegnike/aituber-kit
- **LuC4 公式**: https://luc4.aicu.jp/
- **AICU Inc.**: https://corp.aicu.ai/
