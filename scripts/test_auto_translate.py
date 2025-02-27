import unittest
from unittest.mock import patch, MagicMock
import os
import json
import requests
import base64
import dotenv

# .envファイルから環境変数を読み込む
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# GitHub関連の環境変数のみモック
if not os.getenv("GITHUB_TOKEN"):
    os.environ["GITHUB_TOKEN"] = "dummy_token"
if not os.getenv("PR_NUMBER"):
    os.environ["PR_NUMBER"] = "123"
if not os.getenv("REPO_FULL_NAME"):
    os.environ["REPO_FULL_NAME"] = "test/repo"

# OpenAI APIキーが設定されているか確認
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError(
        "環境変数 'OPENAI_API_KEY' が設定されていません。.envファイルを確認してください。"
    )

# テスト対象のモジュールをインポート
import auto_translate
from auto_translate import (
    get_pr_files,
    get_file_content,
    create_or_update_file,
    check_translation_needs,
    translate_markdown,
    translate_json,
    finalize_translation,
    FileInfo,
    TranslationState,
    GITHUB_API_BASE,
    headers,
)


class TestAutoTranslate(unittest.TestCase):
    """自動翻訳スクリプトの単体テスト"""

    def setUp(self):
        """テスト前の準備"""
        # GitHub関連の環境変数のみモック
        self.env_patcher = patch.dict(
            "os.environ",
            {
                "GITHUB_TOKEN": os.environ.get("GITHUB_TOKEN", "dummy_token"),
                "PR_NUMBER": os.environ.get("PR_NUMBER", "123"),
                "REPO_FULL_NAME": os.environ.get("REPO_FULL_NAME", "test/repo"),
            },
        )
        self.env_patcher.start()

    def tearDown(self):
        """テスト後のクリーンアップ"""
        self.env_patcher.stop()

    @patch("requests.get")
    def test_get_pr_files(self, mock_get):
        """PRファイル取得のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"filename": "README.md", "status": "modified"}
        ]
        mock_get.return_value = mock_response

        # 関数の実行
        result = get_pr_files()

        # アサーション
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["filename"], "README.md")
        mock_get.assert_called_once_with(
            f"{GITHUB_API_BASE}/repos/test/repo/pulls/123/files",
            headers=headers,
        )

    @patch("requests.get")
    def test_get_file_content_success(self, mock_get):
        """ファイル内容取得成功のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        # Base64でエンコードされた "テスト内容"
        mock_response.json.return_value = {"content": "44OG44K544OI5YaF5a65"}
        mock_get.return_value = mock_response

        # 関数の実行
        result = get_file_content("test.md")

        # アサーション
        self.assertEqual(result, "テスト内容")
        mock_get.assert_called_once()

    @patch("requests.get")
    def test_get_file_content_not_found(self, mock_get):
        """ファイルが存在しない場合のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        # 関数の実行
        result = get_file_content("not_exist.md")

        # アサーション
        self.assertEqual(result, "")

    @patch("requests.put")
    @patch("requests.get")
    def test_create_or_update_file_create(self, mock_get, mock_put):
        """ファイル作成のテスト"""
        # GETリクエストでファイルが見つからない場合
        mock_get_response = MagicMock()
        mock_get_response.status_code = 404

        # HTTPErrorを適切に設定
        http_error = requests.exceptions.HTTPError()
        http_error.response = MagicMock()
        http_error.response.status_code = 404
        mock_get_response.raise_for_status.side_effect = http_error

        mock_get.return_value = mock_get_response

        # PUTリクエストの成功レスポンス
        mock_put_response = MagicMock()
        mock_put_response.json.return_value = {"content": {"path": "test.md"}}
        mock_put.return_value = mock_put_response

        # 関数の実行
        result = create_or_update_file(
            "test.md", "テスト内容", "テストコミット", "main"
        )

        # アサーション
        self.assertEqual(result["content"]["path"], "test.md")
        mock_put.assert_called_once()
        # Base64エンコードされた内容が含まれていることを確認
        call_args = mock_put.call_args[1]["json"]
        self.assertIn("content", call_args)
        self.assertNotIn("sha", call_args)

    @patch("requests.put")
    @patch("requests.get")
    def test_create_or_update_file_update(self, mock_get, mock_put):
        """ファイル更新のテスト"""
        # GETリクエストでファイルが見つかる場合
        mock_get_response = MagicMock()
        mock_get_response.json.return_value = {"sha": "abc123"}
        mock_get.return_value = mock_get_response

        # PUTリクエストの成功レスポンス
        mock_put_response = MagicMock()
        mock_put_response.json.return_value = {"content": {"path": "test.md"}}
        mock_put.return_value = mock_put_response

        # 関数の実行
        result = create_or_update_file(
            "test.md", "テスト内容", "テストコミット", "main"
        )

        # アサーション
        self.assertEqual(result["content"]["path"], "test.md")
        mock_put.assert_called_once()
        # Base64エンコードされた内容とSHAが含まれていることを確認
        call_args = mock_put.call_args[1]["json"]
        self.assertIn("content", call_args)
        self.assertIn("sha", call_args)
        self.assertEqual(call_args["sha"], "abc123")

    @patch("auto_translate.get_llm")
    def test_check_translation_needs_new_file(self, mock_get_llm):
        """新規ファイルの翻訳必要性判断テスト"""
        # モックLLMの設定
        mock_llm = MagicMock()
        mock_get_llm.return_value = mock_llm

        # テスト用の状態を作成
        state = TranslationState()
        target = FileInfo(
            source_file="README.md",
            target_file="docs/README_en.md",
            language="en",
            file_type="markdown",
            source_content="# テスト\nこれはテストです。",
            target_content="",  # 空の内容は新規ファイル
        )
        state.translation_targets = [target]

        # 関数の実行
        result_state = check_translation_needs(state)

        # アサーション
        self.assertTrue(result_state.translation_targets[0].needs_translation)
        # LLMは呼ばれないはず
        mock_llm.invoke.assert_not_called()

    @patch("auto_translate.get_llm")
    def test_check_translation_needs_existing_file(self, mock_get_llm):
        """既存ファイルの翻訳必要性判断テスト"""
        # モックLLMの設定
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "true"
        mock_llm.invoke.return_value = mock_response
        mock_get_llm.return_value = mock_llm

        # テスト用の状態を作成
        state = TranslationState()
        target = FileInfo(
            source_file="README.md",
            target_file="docs/README_en.md",
            language="en",
            file_type="markdown",
            source_content="# テスト\nこれは新しいテストです。",
            target_content="# Test\nThis is a test.",  # 既存の内容
        )
        state.translation_targets = [target]

        # 関数の実行
        result_state = check_translation_needs(state)

        # アサーション
        self.assertTrue(result_state.translation_targets[0].needs_translation)
        mock_llm.invoke.assert_called_once()

    @patch("auto_translate.create_or_update_file")
    @patch("auto_translate.get_llm")
    def test_translate_markdown(self, mock_get_llm, mock_create_or_update):
        """マークダウン翻訳のテスト"""
        # モックLLMの設定
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = "# Test\nThis is a test."
        mock_llm.invoke.return_value = mock_response
        mock_get_llm.return_value = mock_llm

        # テスト用の状態を作成
        state = TranslationState()
        target = FileInfo(
            source_file="README.md",
            target_file="docs/README_en.md",
            language="en",
            file_type="markdown",
            source_content="# テスト\nこれはテストです。",
            needs_translation=True,
        )
        state.translation_targets = [target]
        state.branch = "main"

        # 関数の実行
        result_state = translate_markdown(state)

        # アサーション
        self.assertEqual(result_state.current_file_index, 1)
        self.assertEqual(
            result_state.translation_targets[0].translated_content,
            "# Test\nThis is a test.",
        )
        self.assertEqual(len(result_state.translation_results), 1)
        self.assertEqual(result_state.translation_results[0]["status"], "updated")
        mock_llm.invoke.assert_called_once()
        mock_create_or_update.assert_called_once_with(
            "docs/README_en.md",
            "# Test\nThis is a test.",
            "Auto-translate: Update docs/README_en.md from README.md",
            "main",
        )

    @patch("auto_translate.create_or_update_file")
    @patch("auto_translate.get_llm")
    def test_translate_json(self, mock_get_llm, mock_create_or_update):
        """JSON翻訳のテスト"""
        # モックLLMの設定
        mock_llm = MagicMock()
        mock_response = MagicMock()
        mock_response.content = '{\n  "test": "This is a test"\n}'
        mock_llm.invoke.return_value = mock_response
        mock_get_llm.return_value = mock_llm

        # テスト用の状態を作成
        state = TranslationState()
        target = FileInfo(
            source_file="locales/ja/translation.json",
            target_file="locales/en/translation.json",
            language="en",
            file_type="json",
            source_content='{\n  "test": "これはテストです"\n}',
            needs_translation=True,
        )
        state.translation_targets = [target]
        state.branch = "main"

        # 関数の実行
        result_state = translate_json(state)

        # アサーション
        self.assertEqual(result_state.current_file_index, 1)
        self.assertEqual(
            result_state.translation_targets[0].translated_content,
            '{\n  "test": "This is a test"\n}',
        )
        self.assertEqual(len(result_state.translation_results), 1)
        self.assertEqual(result_state.translation_results[0]["status"], "updated")
        mock_llm.invoke.assert_called_once()
        mock_create_or_update.assert_called_once()

    @patch("auto_translate.add_pr_comment")
    def test_finalize_translation(self, mock_add_pr_comment):
        """翻訳処理完了のテスト"""
        # テスト用の状態を作成
        state = TranslationState()
        state.translation_results = [
            {
                "source_file": "README.md",
                "target_file": "docs/README_en.md",
                "language": "en",
                "status": "updated",
            }
        ]

        # 関数の実行
        result_state = finalize_translation(state)

        # アサーション
        mock_add_pr_comment.assert_called_once_with(state.translation_results)

    @patch("auto_translate.get_pr_files")
    @patch("auto_translate.get_file_content")
    def test_initialize_and_prepare(self, mock_get_file_content, mock_get_pr_files):
        """初期化と準備処理のテスト"""
        # モックの設定
        mock_get_pr_files.return_value = [
            {"filename": "README.md", "status": "modified"}
        ]
        mock_get_file_content.return_value = "# テスト\nこれはテストです。"

        # 初期状態を作成
        state = TranslationState()

        # initialize_stateを実行
        from auto_translate import initialize_state

        state = initialize_state(state)

        # アサーション
        self.assertEqual(len(state.pr_files), 1)
        self.assertEqual(state.pr_files[0]["filename"], "README.md")
        self.assertEqual(state.branch, "refs/pull/123/head")

        # prepare_translation_targetsを実行
        from auto_translate import prepare_translation_targets

        state = prepare_translation_targets(state)

        # アサーション
        self.assertEqual(len(state.translation_targets), 3)  # en, zh, koの3言語
        self.assertEqual(state.translation_targets[0].source_file, "README.md")
        self.assertEqual(state.translation_targets[0].file_type, "markdown")

    @patch("auto_translate.process_translations")
    def test_process_translations_completed(self, mock_process):
        """翻訳処理完了状態のテスト"""
        # 完了状態を設定
        state = TranslationState()
        state.is_completed = True

        # モック関数の戻り値を設定
        mock_process.return_value = {"next": "finalize"}

        # 関数を実行
        result = auto_translate.process_translations(state)

        # アサーション
        self.assertEqual(result, {"next": "finalize"})

    # 実際のOpenAI APIを使用するテスト
    def test_real_openai_translation(self):
        """実際のOpenAI APIを使用した翻訳テスト"""
        # OpenAI APIキーが設定されているか確認
        self.assertIsNotNone(
            os.getenv("OPENAI_API_KEY"), "OpenAI APIキーが設定されていません"
        )

        # 実際のLLMインスタンスを取得
        llm = auto_translate.get_llm()

        # 簡単な翻訳テスト
        messages = [
            {"role": "system", "content": "あなたは翻訳の専門家です。"},
            {
                "role": "user",
                "content": "以下の日本語を英語に翻訳してください：「こんにちは、世界」",
            },
        ]

        # APIを呼び出し
        response = llm.invoke(messages)

        # レスポンスの検証
        self.assertIsNotNone(response)
        self.assertIsNotNone(response.content)
        self.assertIn("hello", response.content.lower())
        print(f"OpenAI API翻訳結果: {response.content}")

    # エラーハンドリングのテスト
    @patch("auto_translate.get_pr_files")
    def test_initialize_state_error_handling(self, mock_get_pr_files):
        """初期化時のエラーハンドリングテスト"""
        # get_pr_filesが例外を発生させるようにモック
        mock_get_pr_files.side_effect = Exception("テスト用エラー")

        # 初期状態を作成
        state = TranslationState()

        # initialize_stateを実行
        from auto_translate import initialize_state

        result_state = initialize_state(state)

        # アサーション
        self.assertTrue(result_state.is_completed)
        self.assertEqual(result_state.pr_files, [])

    @patch("auto_translate.get_llm")
    def test_check_translation_needs_error_handling(self, mock_get_llm):
        """翻訳必要性判断時のエラーハンドリングテスト"""
        # get_llmが例外を発生させるようにモック
        mock_get_llm.side_effect = Exception("テスト用エラー")

        # テスト用の状態を作成
        state = TranslationState()
        target = FileInfo(
            source_file="README.md",
            target_file="docs/README_en.md",
            language="en",
            file_type="markdown",
            source_content="# テスト\nこれはテストです。",
            target_content="# Test\nThis is a test.",
        )
        state.translation_targets = [target]

        # 関数を実行
        from auto_translate import check_translation_needs

        result_state = check_translation_needs(state)

        # アサーション
        self.assertTrue(result_state.is_completed)

    @patch("auto_translate.get_llm")
    def test_translate_markdown_error_handling(self, mock_get_llm):
        """マークダウン翻訳時のエラーハンドリングテスト"""
        # get_llmが例外を発生させるようにモック
        mock_get_llm.side_effect = Exception("テスト用エラー")

        # テスト用の状態を作成
        state = TranslationState()
        target = FileInfo(
            source_file="README.md",
            target_file="docs/README_en.md",
            language="en",
            file_type="markdown",
            source_content="# テスト\nこれはテストです。",
            needs_translation=True,
        )
        state.translation_targets = [target]
        state.current_file_index = 0

        # 関数を実行
        from auto_translate import translate_markdown

        result_state = translate_markdown(state)

        # アサーション
        self.assertEqual(result_state.current_file_index, 1)

    @patch("auto_translate.add_pr_comment")
    def test_finalize_translation_error_handling(self, mock_add_pr_comment):
        """翻訳完了時のエラーハンドリングテスト"""
        # add_pr_commentが例外を発生させるようにモック
        mock_add_pr_comment.side_effect = Exception("テスト用エラー")

        # テスト用の状態を作成
        state = TranslationState()
        state.translation_results = [
            {
                "source_file": "README.md",
                "target_file": "docs/README_en.md",
                "language": "en",
                "status": "updated",
            }
        ]

        # 関数を実行
        from auto_translate import finalize_translation

        result_state = finalize_translation(state)

        # アサーション
        self.assertTrue(result_state.is_completed)


if __name__ == "__main__":
    unittest.main()
