# 自動翻訳機能

このドキュメントでは、GitHub Actionsを使用した自動翻訳機能の概要と設定方法について説明します。

## 機能概要

この自動翻訳機能は、特定のファイルが変更された際に、対応する多言語版ファイルを自動的に更新するものです。翻訳にはAnthropicのClaude AIを使用しています。

### 主な特徴

- 指定された元ファイルの変更を検知
- 対応する翻訳先ファイルを自動的に更新
- 翻訳が必要かどうかをAIが判断
- 翻訳結果をPRにコメントとして追加

## 対象ファイルと翻訳先

現在、以下のファイルが自動翻訳の対象となっています：

1. 元ファイル: `README.md`

   - 翻訳先: `docs/README_*.md`（各言語版）

2. 元ファイル: `docs/logo_license.md`

   - 翻訳先: `docs/logo_license_*.md`（各言語版）

3. 元ファイル: `docs/license-faq.md`

   - 翻訳先: `docs/license-faq_*.md`（各言語版）

4. 元ファイル: `docs/license.md`

   - 翻訳先: `docs/license_*.md`（各言語版）

5. 元ファイル: `docs/character_model_licence.md`

   - 翻訳先: `docs/character_model_licence_*.md`（各言語版）

6. 元ファイル: `locales/ja/translation.json`
   - 翻訳先: `locales/*/translation.json`（各言語版）

対象言語は現在、英語（en）、中国語（zh）、韓国語（ko）です。

## 実行タイミング

自動翻訳は以下のタイミングで実行されます：

- developブランチへのプルリクエストが作成された時
- developブランチへのプルリクエストが更新された時
- developブランチへのプルリクエストが再オープンされた時

## 設定方法

### 必要な環境変数

自動翻訳機能を使用するには、以下の環境変数をGitHub Secretsに設定する必要があります：

- `ANTHROPIC_API_KEY`: AnthropicのAPI Key

### 対象ファイルの追加・変更

対象ファイルを追加・変更するには、`scripts/auto_translate.py`の`FILE_MAPPINGS`変数を編集します：

```python
FILE_MAPPINGS = {
    "元ファイルのパス": {
        "pattern": "翻訳先ファイルのパターン（{}は言語コードに置換されます）",
        "type": "ファイルタイプ（markdown または json）"
    },
    # 他のファイルマッピングを追加
}
```

### 対象言語の追加・変更

対象言語を追加・変更するには、`scripts/auto_translate.py`の`TARGET_LANGUAGES`変数を編集します：

```python
TARGET_LANGUAGES = ["en", "zh", "ko"]  # 言語コードを追加・変更
```

## 動作の仕組み

1. PRで変更されたファイルを検出
2. 対象の元ファイルが変更されているか確認
3. 変更された元ファイルに対応する翻訳先ファイルを特定
4. 元ファイルと翻訳先ファイルの内容を比較
   - 翻訳先ファイルが存在しない場合は翻訳を実行
   - 翻訳先ファイルが存在する場合は、AIが翻訳の必要性を判断
5. 必要に応じてAIを使用して翻訳を生成
6. 翻訳先ファイルを更新
7. 翻訳結果をPRにコメントとして追加

## トラブルシューティング

### 翻訳が実行されない

- PRが正しくdevelopブランチに向いているか確認してください
- 対象ファイルが正しく設定されているか確認してください
- GitHub Actionsのログを確認して、エラーが発生していないか確認してください

### 翻訳品質に問題がある

- 翻訳プロンプトを調整することで、翻訳品質を向上させることができます
- `scripts/auto_translate.py`の`translate_markdown`関数と`translate_json`関数のプロンプトを編集してください
