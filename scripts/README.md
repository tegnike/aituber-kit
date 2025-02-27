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
