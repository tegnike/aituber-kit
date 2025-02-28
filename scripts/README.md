# スクリプトテスト

このディレクトリには、自動翻訳スクリプト（`auto_translate.py`）とそのテスト（`test_auto_translate.py`）が含まれています。

## 環境設定

必要なパッケージをインストールするには、以下のコマンドを実行してください：

```bash
pip install -r requirements.txt
```

## 環境変数

実際のスクリプト実行時には、以下の環境変数を設定する必要があります：

- `GITHUB_TOKEN`: GitHub APIにアクセスするためのトークン
- `OPENAI_API_KEY`: OpenAI APIにアクセスするためのキー
- `PR_NUMBER`: 処理対象のPR番号
- `REPO_FULL_NAME`: リポジトリの完全な名前（例: `owner/repo`）

環境変数は `.env` ファイルに設定することもできます：

```
OPENAI_API_KEY=your_api_key_here
GITHUB_TOKEN=your_github_token_here
PR_NUMBER=123
REPO_FULL_NAME=owner/repo
```

## エラーハンドリング

スクリプトには以下のエラーハンドリング機能が実装されています：

1. **各処理ステップでのエラー捕捉**: 各ノード関数内でエラーが発生した場合でも、処理を継続できるようにtry-except構文で囲んでいます。
2. **状態更新の保証**: langgraphの要件に従い、エラーが発生した場合でも少なくとも1つの状態フィールドを更新するようにしています。
3. **エラーログ**: エラーが発生した場合は、詳細なエラーメッセージを出力します。
4. **グレースフルデグラデーション**: 一部の処理が失敗しても、可能な限り他の処理を続行します。

## テストの実行

テストを実行するには、以下のコマンドを実行してください：

```bash
python -m unittest test_auto_translate.py
```

### テストモード

テストには2つのモードがあります：

1. **モックモード**: デフォルトでは、GitHub APIとOpenAI APIの呼び出しはモックされます。このモードではAPIキーは不要です。

2. **実APIモード**: `.env` ファイルにOpenAI APIキーを設定すると、一部のテストで実際のOpenAI APIが使用されます。このモードでは、実際のAPIコールが行われるため、APIの使用料金が発生する可能性があります。

実APIモードを使用する場合は、`.env` ファイルに有効なOpenAI APIキーを設定してください。

### エラーハンドリングのテスト

エラーハンドリングをテストするための専用のテストケースも含まれています：

- `test_initialize_state_error_handling`: 初期化時のエラー処理をテスト
- `test_check_translation_needs_error_handling`: 翻訳必要性判断時のエラー処理をテスト
- `test_translate_markdown_error_handling`: マークダウン翻訳時のエラー処理をテスト
- `test_finalize_translation_error_handling`: 翻訳完了時のエラー処理をテスト
