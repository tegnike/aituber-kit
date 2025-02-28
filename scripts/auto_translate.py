import os
import json
import requests
import base64
import difflib
import re
from typing import Dict, List, Any, Optional, Tuple

from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

# GitHub APIのベースURL
GITHUB_API_BASE = "https://api.github.com"

# 環境変数から認証情報を取得
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    raise ValueError("環境変数 'GITHUB_TOKEN' が設定されていません。")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("環境変数 'OPENAI_API_KEY' が設定されていません。")

# PR情報を取得
PR_NUMBER = os.getenv("PR_NUMBER")
REPO_FULL_NAME = os.getenv("REPO_FULL_NAME")

# 差分ベース翻訳を使用するかどうか（デフォルトは使用する）
USE_DIFF_BASED_TRANSLATION = (
    os.getenv("USE_DIFF_BASED_TRANSLATION", "true").lower() == "true"
)

# GitHub API用のヘッダーを定義
headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}


# GitHub APIからPRの詳細情報を取得するための関数
def get_pr_details():
    """PRの詳細情報を取得する"""
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/pulls/{PR_NUMBER}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()


# 翻訳対象の言語リスト
TARGET_LANGUAGES = ["en", "zh", "ko"]

# 翻訳対象のファイルマッピング
FILE_MAPPINGS = {
    "README.md": {"pattern": "docs/README_{}.md", "type": "markdown"},
    "docs/logo_license.md": {"pattern": "docs/logo_license_{}.md", "type": "markdown"},
    "docs/license-faq.md": {"pattern": "docs/license-faq_{}.md", "type": "markdown"},
    "docs/license.md": {"pattern": "docs/license_{}.md", "type": "markdown"},
    "docs/character_model_licence.md": {
        "pattern": "docs/character_model_licence_{}.md",
        "type": "markdown",
    },
    "locales/ja/translation.json": {
        "pattern": "locales/{}/translation.json",
        "type": "json",
    },
}


# LangChain用のモデル定義
def get_llm():
    """LLMインスタンスを取得する"""
    return ChatOpenAI(model="gpt-4o", temperature=0, api_key=OPENAI_API_KEY)


# 状態管理用のモデル
class FileInfo(BaseModel):
    source_file: str = Field(description="元ファイルのパス")
    target_file: str = Field(description="翻訳先ファイルのパス")
    language: str = Field(description="翻訳先の言語")
    file_type: str = Field(description="ファイルタイプ（markdown/json）")
    status: str = Field(default="pending", description="処理ステータス")
    source_content: str = Field(default="", description="元ファイルの内容")
    target_content: str = Field(default="", description="翻訳先ファイルの内容")
    translated_content: Optional[str] = Field(
        default=None, description="翻訳された内容"
    )
    needs_translation: bool = Field(default=False, description="翻訳が必要かどうか")
    is_committed: bool = Field(default=False, description="コミット済みかどうか")


class TranslationState(BaseModel):
    # モデルの設定
    model_config = {"arbitrary_types_allowed": True}

    next: Optional[str] = Field(default=None, description="次に実行するノード名")
    pr_files: List[Dict[str, Any]] = Field(
        default_factory=list, description="PRで変更されたファイルのリスト"
    )
    translation_targets: List[FileInfo] = Field(
        default_factory=list, description="翻訳対象のファイルリスト"
    )
    branch: str = Field(default="", description="PRのブランチ名")
    translation_results: List[Dict[str, Any]] = Field(
        default_factory=list, description="翻訳結果のリスト"
    )
    current_file_index: int = Field(
        default=0, description="現在処理中のファイルインデックス"
    )
    is_completed: bool = Field(
        default=False, description="全ての処理が完了したかどうか"
    )
    # 元ファイル単位でコミットをまとめるための辞書
    source_file_translations: Dict[str, List[Dict[str, Any]]] = Field(
        default_factory=dict, description="元ファイル単位の翻訳結果"
    )


# GitHub API関連の関数
def get_pr_files():
    """PRで変更されたファイルのリストを取得する"""
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/pulls/{PR_NUMBER}/files"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()


def get_file_content(file_path, ref=None):
    """指定されたファイルの内容を取得する"""
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/contents/{file_path}"
    if ref:
        url += f"?ref={ref}"

    response = requests.get(url, headers=headers)

    # ファイルが存在しない場合は空文字列を返す
    if response.status_code == 404:
        return ""

    response.raise_for_status()
    content = response.json().get("content", "")
    if content:
        return base64.b64decode(content).decode("utf-8")
    return ""


def create_or_update_file(file_path, content, message, branch):
    """ファイルを作成または更新する"""
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/contents/{file_path}"

    # 現在のファイル内容とSHAを取得
    try:
        response = requests.get(url, headers=headers, params={"ref": branch})
        response.raise_for_status()
        current_file = response.json()
        sha = current_file["sha"]
        update = True
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            # ファイルが存在しない場合は新規作成
            sha = None
            update = False
        else:
            raise

    # ファイルの内容をBase64エンコード
    content_encoded = base64.b64encode(content.encode("utf-8")).decode("utf-8")

    # リクエストデータを作成
    data = {"message": message, "content": content_encoded, "branch": branch}

    if update:
        data["sha"] = sha

    # ファイルを作成または更新
    try:
        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
        print(f"ファイルが正常に更新されました: {file_path}")
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"エラー: ファイルの更新に失敗しました: {file_path}")
        print(f"ステータスコード: {e.response.status_code}")
        print(f"エラーメッセージ: {e.response.text}")
        # エラーを発生させずに辞書を返す
        return {
            "status": "error",
            "message": f"ファイルの更新に失敗しました: {e}",
            "path": file_path,
        }


def create_or_update_files_batch(files_data, message, branch):
    """複数のファイルを一度にコミットする

    Args:
        files_data: List[Dict] - 各ファイルの情報（path, content, sha）のリスト
        message: str - コミットメッセージ
        branch: str - ブランチ名

    Returns:
        Dict - 結果情報
    """
    print(f"複数ファイルを一度にコミットします。ファイル数: {len(files_data)}")

    # 各ファイルの結果を格納する辞書
    results = {}

    # 各ファイルを個別に処理
    for file_data in files_data:
        file_path = file_data["path"]
        content = file_data["content"]

        # 個別のファイルを更新
        result = create_or_update_file(file_path, content, message, branch)
        results[file_path] = result

    return {
        "status": (
            "success"
            if all(r.get("status") != "error" for r in results.values())
            else "partial_success"
        ),
        "results": results,
    }


def add_pr_comment(translation_results):
    """PRにコメントを追加する"""
    # コメント内容を作成
    comment = "## 自動翻訳処理結果\n\n"

    # 更新されたファイル
    updated_files = [
        result for result in translation_results if result["status"] == "updated"
    ]
    if updated_files:
        comment += "### 更新されたファイル\n\n"
        for result in updated_files:
            comment += f"- {result['source_file']} → {result['target_file']} ({result['language']})\n"
        comment += "\n"

    # スキップされたファイル
    skipped_files = [
        result for result in translation_results if result["status"] == "skipped"
    ]
    if skipped_files:
        comment += "### 翻訳不要と判断されたファイル\n\n"
        for result in skipped_files:
            comment += f"- {result['source_file']} → {result['target_file']} ({result['language']})\n"
        comment += "\n"

    # 失敗したファイル
    failed_files = [
        result for result in translation_results if result["status"] == "failed"
    ]
    if failed_files:
        comment += "### 翻訳に失敗したファイル\n\n"
        for result in failed_files:
            comment += f"- {result['source_file']} → {result['target_file']} ({result['language']})\n"
        comment += "\n"

    # PRにコメントを追加
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/issues/{PR_NUMBER}/comments"
    data = {"body": comment}
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    print("PRにコメントを追加しました。")


# LangGraph用のノード関数
def initialize_state_node(state: TranslationState) -> Dict[str, Any]:
    """初期状態を設定する"""
    print("翻訳処理を開始します...")

    # PRの情報を取得
    pr_files = get_pr_files()

    # PRのソースブランチを取得
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/pulls/{PR_NUMBER}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    pr_details = response.json()
    source_branch = pr_details["head"]["ref"]
    print(f"PRのソースブランチ: {source_branch}")

    return {
        "pr_files": pr_files,
        "branch": source_branch,
    }


def prepare_translation_targets_node(state: TranslationState) -> Dict[str, Any]:
    """翻訳対象のファイルを準備する"""
    print("翻訳対象のファイルを準備しています...")

    translation_targets = []

    # 変更されたファイルを処理
    for file_info in state.pr_files:
        file_path = file_info["filename"]

        # 翻訳対象のファイルかどうかを確認
        if file_path in FILE_MAPPINGS:
            mapping = FILE_MAPPINGS[file_path]
            file_type = mapping["type"]

            # 各言語に対して翻訳処理を準備
            for lang in TARGET_LANGUAGES:
                target_file = mapping["pattern"].format(lang)

                # ファイル情報を作成
                translation_targets.append(
                    FileInfo(
                        source_file=file_path,
                        target_file=target_file,
                        language=lang,
                        file_type=file_type,
                    )
                )

    return {
        "translation_targets": translation_targets,
    }


def fetch_file_contents_node(state: TranslationState) -> Dict[str, Any]:
    """ファイルの内容を取得する"""

    if not state.translation_targets:
        print("翻訳対象のファイルがありません。")
        return {
            "is_completed": True,
        }

    print("ファイルの内容を取得しています...")

    updated_targets = []
    for target in state.translation_targets:
        # 元ファイルと翻訳先ファイルの内容を取得
        source_content = get_file_content(target.source_file, state.branch)
        target_content = get_file_content(target.target_file, state.branch)

        # 新しいFileInfoオブジェクトを作成して内容を設定
        updated_target = target.model_copy(deep=True)
        updated_target.source_content = source_content
        updated_target.target_content = target_content
        updated_targets.append(updated_target)

    return {
        "translation_targets": updated_targets,
    }


def check_translation_needs_node(state: TranslationState) -> Dict[str, Any]:
    """翻訳が必要かどうかを判断する"""
    print("翻訳の必要性を判断しています...")

    llm = get_llm()
    updated_targets = []

    for target in state.translation_targets:
        updated_target = target.model_copy(deep=True)

        # 翻訳先ファイルが存在しない場合は翻訳が必要
        if not updated_target.target_content:
            updated_target.needs_translation = True
            updated_targets.append(updated_target)
            continue

        # AIに翻訳が必要かどうかを判断してもらう
        prompt = (
            f"以下の2つのファイルを比較して、翻訳の更新が必要かどうかを判断してください。\n\n"
            f"ファイルタイプ: {updated_target.file_type}\n"
            f"元言語: 日本語\n"
            f"翻訳先言語: {updated_target.language}\n\n"
            "元ファイルの内容:\n"
            f"{updated_target.source_content}\n\n"
            "翻訳先ファイルの内容:\n"
            f"{updated_target.target_content}\n\n"
            "以下の基準で判断してください：\n"
            "1. 元ファイルに新しい内容が追加されているが、翻訳先ファイルには反映されていない場合\n"
            "2. 元ファイルの内容が変更されているが、翻訳先ファイルには反映されていない場合\n"
            "3. 翻訳先ファイルの翻訳品質が低い場合\n\n"
            "「true」または「false」のみで回答してください。翻訳の更新が必要な場合は「true」、不要な場合は「false」と回答してください。"
        )

        messages = [
            {"role": "system", "content": "あなたは翻訳の専門家です。"},
            {"role": "user", "content": prompt},
        ]

        response = llm.invoke(messages)
        result = response.content.strip().lower()
        updated_target.needs_translation = "true" in result

        updated_targets.append(updated_target)

    return {
        "translation_targets": updated_targets,
    }


def process_translations_node(state: TranslationState) -> Dict[str, Any]:
    """翻訳処理を実行する"""
    if state.is_completed:
        return {"next": "finalize"}

    if state.current_file_index >= len(state.translation_targets):
        return {
            "next": "finalize",
            "is_completed": True,
        }

    current_target = state.translation_targets[state.current_file_index]
    print(f"処理中: {current_target.source_file} -> {current_target.target_file}")

    if not current_target.needs_translation:
        print(f"翻訳は不要です: {current_target.target_file}")
        translation_results = state.translation_results.copy()
        translation_results.append(
            {
                "source_file": current_target.source_file,
                "target_file": current_target.target_file,
                "language": current_target.language,
                "status": "skipped",
            }
        )
        # current_file_indexを更新
        current_file_index = state.current_file_index + 1
        return {
            "next": "process_translations",
            "translation_results": translation_results,
            "current_file_index": current_file_index,
        }

    print(f"翻訳が必要です: {current_target.target_file}")

    # ファイルタイプに応じた翻訳処理を実行
    if current_target.file_type == "markdown":
        return {"next": "translate_markdown"}
    elif current_target.file_type == "json":
        return {"next": "translate_json"}
    else:
        print(f"未対応のファイルタイプ: {current_target.file_type}")
        translation_results = state.translation_results.copy()
        translation_results.append(
            {
                "source_file": current_target.source_file,
                "target_file": current_target.target_file,
                "language": current_target.language,
                "status": "failed",
            }
        )
        # current_file_indexを更新
        current_file_index = state.current_file_index + 1
        return {
            "next": "process_translations",
            "translation_results": translation_results,
            "current_file_index": current_file_index,
        }


def ensure_directory_exists(directory_path):
    """ディレクトリが存在することを確認し、存在しない場合は作成する"""
    # グローバル変数の状態を取得
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/pulls/{PR_NUMBER}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    pr_details = response.json()
    branch = pr_details["head"]["ref"]

    # ディレクトリのルートURLを構築
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/contents/{directory_path}"

    try:
        # ディレクトリの存在を確認
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        # ディレクトリが存在する場合は何もしない
        return True
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            # ディレクトリが存在しない場合
            parent_dir = os.path.dirname(directory_path)
            if parent_dir and parent_dir != "":
                # 親ディレクトリを再帰的に作成
                ensure_directory_exists(parent_dir)

            # ディレクトリを作成するために空のファイルを作成
            placeholder_file = f"{directory_path}/.gitkeep"
            create_or_update_file(
                placeholder_file,
                "",  # 空のコンテンツ
                f"Auto-create directory: {directory_path}",
                branch,
            )
            print(f"ディレクトリを作成しました: {directory_path}")
            return True
        else:
            raise


def get_file_diff(source_file: str, branch: str) -> Tuple[List[str], List[str]]:
    """ファイルの差分を取得する

    Returns:
        Tuple[List[str], List[str]]: 追加された行と変更された行のリスト
    """
    print(f"ファイル {source_file} の差分を取得しています...")

    # PRの詳細情報を取得
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/pulls/{PR_NUMBER}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    pr_details = response.json()

    # ベースブランチとヘッドブランチを取得
    base_branch = pr_details["base"]["ref"]
    head_branch = pr_details["head"]["ref"]

    # ベースブランチのファイル内容を取得
    base_content = get_file_content(source_file, base_branch)
    if not base_content:
        # 新規ファイルの場合は全体を差分として扱う
        head_content = get_file_content(source_file, head_branch)
        return head_content.splitlines(), []

    # ヘッドブランチのファイル内容を取得
    head_content = get_file_content(source_file, head_branch)

    # difflib を使用して差分を取得
    base_lines = base_content.splitlines()
    head_lines = head_content.splitlines()

    differ = difflib.Differ()
    diff = list(differ.compare(base_lines, head_lines))

    # 追加された行と変更された行を抽出
    added_lines = []
    changed_lines = []

    for line in diff:
        if line.startswith("+ "):
            added_lines.append(line[2:])
        elif line.startswith("? "):
            # 変更の詳細情報は無視
            continue
        elif line.startswith("- "):
            # 削除された行は無視
            continue

    return added_lines, changed_lines


def apply_translation_to_existing(
    existing_content: str, source_diff: List[str], translated_diff: List[str]
) -> str:
    """既存の翻訳ファイルに差分の翻訳を適用する

    Args:
        existing_content: 既存の翻訳ファイルの内容
        source_diff: 元ファイルの差分
        translated_diff: 翻訳された差分

    Returns:
        str: 更新された翻訳ファイルの内容
    """
    if not source_diff or not translated_diff:
        return existing_content

    # 既存の翻訳ファイルの行を取得
    existing_lines = existing_content.splitlines()
    result_lines = existing_lines.copy()

    # 差分の数が一致しない場合は安全のため全体を返す
    if len(source_diff) != len(translated_diff):
        print("警告: 差分の行数が一致しません。既存の翻訳を維持します。")
        return existing_content

    # マークダウンの場合、見出しや特定のパターンを手がかりに挿入位置を特定
    # 簡易的な実装として、最後に追加する
    result_lines.extend(translated_diff)

    return "\n".join(result_lines)


def translate_markdown_node(state: TranslationState) -> Dict[str, Any]:
    """マークダウンファイルを翻訳する"""
    updated_state = state.model_copy(deep=True)
    current_target = updated_state.translation_targets[updated_state.current_file_index]
    print(f"マークダウンファイルを翻訳しています: {current_target.target_file}")

    translation_results = updated_state.translation_results.copy()
    translation_targets = updated_state.translation_targets.copy()
    current_file_index = updated_state.current_file_index
    source_file_translations = updated_state.source_file_translations.copy()

    # ターゲットディレクトリの存在を確認
    target_dir = os.path.dirname(current_target.target_file)
    if target_dir:
        try:
            ensure_directory_exists(target_dir)
        except Exception as e:
            print(
                f"警告: ディレクトリの作成中にエラーが発生しましたが、処理を続行します: {e}"
            )

    llm = get_llm()

    # 差分ベースの翻訳を使用する場合
    if USE_DIFF_BASED_TRANSLATION and current_target.target_content:
        # 差分を取得
        added_lines, changed_lines = get_file_diff(
            current_target.source_file, updated_state.branch
        )

        if not added_lines and not changed_lines:
            print(f"差分が検出されませんでした: {current_target.source_file}")
            translation_results.append(
                {
                    "source_file": current_target.source_file,
                    "target_file": current_target.target_file,
                    "language": current_target.language,
                    "status": "skipped",
                }
            )
            current_file_index += 1
            return {
                "translation_targets": translation_targets,
                "translation_results": translation_results,
                "current_file_index": current_file_index,
                "source_file_translations": source_file_translations,
            }

        # 差分のみを翻訳
        diff_content = "\n".join(added_lines)
        print(f"差分ベースの翻訳を実行します。差分行数: {len(added_lines)}")

        prompt = (
            f"以下の日本語のマークダウンの一部を{current_target.language}に翻訳してください。\n\n"
            "翻訳の際は以下のルールに従ってください：\n"
            "1. マークダウンの構造（見出し、リスト、コードブロックなど）を維持してください。\n"
            "2. リンクやイメージの参照は変更しないでください。\n"
            "3. コードブロック内のコードは翻訳しないでください。\n"
            "4. 技術用語は適切に翻訳してください。\n"
            "5. 翻訳後のテキストのみを出力してください。説明や注釈は不要です。\n\n"
            "翻訳対象のマークダウン：\n\n"
            f"{diff_content}"
        )

        messages = [
            {"role": "system", "content": "あなたは翻訳の専門家です。"},
            {"role": "user", "content": prompt},
        ]

        response = llm.invoke(messages)
        translated_diff = response.content.splitlines()

        # 既存の翻訳に差分を適用
        updated_content = apply_translation_to_existing(
            current_target.target_content, added_lines, translated_diff
        )

        # 翻訳結果を保存（コミットはまだ行わない）
        current_target.translated_content = updated_content
        translation_targets[current_file_index] = current_target

        # 元ファイル単位でグループ化
        if current_target.source_file not in source_file_translations:
            source_file_translations[current_target.source_file] = []

        source_file_translations[current_target.source_file].append(
            {
                "path": current_target.target_file,
                "content": updated_content,
                "language": current_target.language,
            }
        )

        # 翻訳結果を記録
        translation_results.append(
            {
                "source_file": current_target.source_file,
                "target_file": current_target.target_file,
                "language": current_target.language,
                "status": "translated",  # まだコミットしていないのでtranslatedステータス
            }
        )
    else:
        # 従来の全体翻訳
        prompt = (
            f"以下の日本語のマークダウンファイルを{current_target.language}に翻訳してください。\n\n"
            "翻訳の際は以下のルールに従ってください：\n"
            "1. マークダウンの構造（見出し、リスト、コードブロックなど）を維持してください。\n"
            "2. リンクやイメージの参照は変更しないでください。\n"
            "3. コードブロック内のコードは翻訳しないでください。\n"
            "4. 技術用語は適切に翻訳してください。\n"
            "5. 翻訳後のテキストのみを出力してください。説明や注釈は不要です。\n\n"
            "翻訳対象のマークダウン：\n\n"
            f"{current_target.source_content}"
        )

        messages = [
            {"role": "system", "content": "あなたは翻訳の専門家です。"},
            {"role": "user", "content": prompt},
        ]

        response = llm.invoke(messages)
        translated_content = response.content

        # 翻訳結果を保存（コミットはまだ行わない）
        current_target.translated_content = translated_content
        translation_targets[current_file_index] = current_target

        # 元ファイル単位でグループ化
        if current_target.source_file not in source_file_translations:
            source_file_translations[current_target.source_file] = []

        source_file_translations[current_target.source_file].append(
            {
                "path": current_target.target_file,
                "content": translated_content,
                "language": current_target.language,
            }
        )

        # 翻訳結果を記録
        translation_results.append(
            {
                "source_file": current_target.source_file,
                "target_file": current_target.target_file,
                "language": current_target.language,
                "status": "translated",  # まだコミットしていないのでtranslatedステータス
            }
        )

    # 必ず現在のファイルインデックスを更新する
    current_file_index += 1

    return {
        "translation_targets": translation_targets,
        "translation_results": translation_results,
        "current_file_index": current_file_index,
        "source_file_translations": source_file_translations,
    }


def translate_json_node(state: TranslationState) -> Dict[str, Any]:
    """JSONファイルを翻訳する"""
    updated_state = state.model_copy(deep=True)
    current_target = updated_state.translation_targets[updated_state.current_file_index]
    print(f"JSONファイルを翻訳しています: {current_target.target_file}")

    translation_results = updated_state.translation_results.copy()
    translation_targets = updated_state.translation_targets.copy()
    current_file_index = updated_state.current_file_index
    source_file_translations = updated_state.source_file_translations.copy()

    # ターゲットディレクトリの存在を確認
    target_dir = os.path.dirname(current_target.target_file)
    if target_dir:
        try:
            ensure_directory_exists(target_dir)
        except Exception as e:
            print(
                f"警告: ディレクトリの作成中にエラーが発生しましたが、処理を続行します: {e}"
            )

    llm = get_llm()

    # 差分ベースの翻訳を使用する場合（JSONの場合は構造が複雑なため、差分の特定と適用が難しい）
    # JSONの場合は、キーの追加や変更を検出して、それらのみを翻訳する
    if USE_DIFF_BASED_TRANSLATION and current_target.target_content:
        try:
            # 元のJSONと翻訳先のJSONをパース
            source_json = json.loads(current_target.source_content)
            target_json = json.loads(current_target.target_content)

            # 差分を特定（新しいキーや変更されたキー）
            diff_json = {}
            for key, value in source_json.items():
                # 新しいキーまたは値が変更されたキー
                if key not in target_json or json.dumps(value) != json.dumps(
                    target_json.get(key, "")
                ):
                    diff_json[key] = value

            if not diff_json:
                print(f"JSONに差分が検出されませんでした: {current_target.source_file}")
                translation_results.append(
                    {
                        "source_file": current_target.source_file,
                        "target_file": current_target.target_file,
                        "language": current_target.language,
                        "status": "skipped",
                    }
                )
                current_file_index += 1
                return {
                    "translation_targets": translation_targets,
                    "translation_results": translation_results,
                    "current_file_index": current_file_index,
                    "source_file_translations": source_file_translations,
                }

            # 差分のみを翻訳
            diff_text = json.dumps(diff_json, indent=2, ensure_ascii=False)
            print(f"JSONの差分ベース翻訳を実行します。差分キー数: {len(diff_json)}")

            prompt = (
                f"以下の日本語のJSONの一部を{current_target.language}に翻訳してください。\n\n"
                "翻訳の際は以下のルールに従ってください：\n"
                "1. JSONの構造を維持してください。\n"
                "2. キーは翻訳せず、値のみを翻訳してください。\n"
                "3. 変数や特殊な記号（{{}}, $t など）は翻訳しないでください。\n"
                "4. 技術用語は適切に翻訳してください。\n"
                "5. 翻訳後のJSONのみを出力してください。説明や注釈は不要です。\n\n"
                "翻訳対象のJSON：\n\n"
                f"{diff_text}"
            )

            messages = [
                {"role": "system", "content": "あなたは翻訳の専門家です。"},
                {"role": "user", "content": prompt},
            ]

            response = llm.invoke(messages)
            translated_text = response.content

            # JSON部分を抽出するために { と } で囲まれた部分を探す
            start = translated_text.find("{")
            end = translated_text.rfind("}") + 1
            json_str = translated_text[start:end]

            # 翻訳された差分をパース
            translated_diff = json.loads(json_str)

            # 既存のJSONに翻訳された差分を適用
            for key, value in translated_diff.items():
                target_json[key] = value

            # 更新されたJSONを文字列に変換
            updated_json = json.dumps(target_json, indent=2, ensure_ascii=False)

            # 翻訳結果を保存（コミットはまだ行わない）
            current_target.translated_content = updated_json
            translation_targets[current_file_index] = current_target

            # 元ファイル単位でグループ化
            if current_target.source_file not in source_file_translations:
                source_file_translations[current_target.source_file] = []

            source_file_translations[current_target.source_file].append(
                {
                    "path": current_target.target_file,
                    "content": updated_json,
                    "language": current_target.language,
                }
            )

            # 翻訳結果を記録
            translation_results.append(
                {
                    "source_file": current_target.source_file,
                    "target_file": current_target.target_file,
                    "language": current_target.language,
                    "status": "translated",  # まだコミットしていないのでtranslatedステータス
                }
            )
        except Exception as e:
            print(f"JSONの差分翻訳中にエラーが発生しました: {e}")
            print("全体翻訳にフォールバックします。")
            # エラーが発生した場合は全体翻訳にフォールバック
            # 以下は従来の全体翻訳処理
            # JSONをパース
            source_json = json.loads(current_target.source_content)

            # 翻訳リクエスト用のテキストを作成
            json_text = json.dumps(source_json, indent=2, ensure_ascii=False)

            prompt = (
                f"以下の日本語のJSONファイルを{current_target.language}に翻訳してください。\n\n"
                "翻訳の際は以下のルールに従ってください：\n"
                "1. JSONの構造を維持してください。\n"
                "2. キーは翻訳せず、値のみを翻訳してください。\n"
                "3. 変数や特殊な記号（{{}}, $t など）は翻訳しないでください。\n"
                "4. 技術用語は適切に翻訳してください。\n"
                "5. 翻訳後のJSONのみを出力してください。説明や注釈は不要です。\n\n"
                "翻訳対象のJSON：\n\n"
                f"{json_text}"
            )

            messages = [
                {"role": "system", "content": "あなたは翻訳の専門家です。"},
                {"role": "user", "content": prompt},
            ]

            response = llm.invoke(messages)
            translated_text = response.content

            # JSON部分を抽出するために { と } で囲まれた部分を探す
            start = translated_text.find("{")
            end = translated_text.rfind("}") + 1
            json_str = translated_text[start:end]
            # JSONとして解析できるか確認
            json.loads(json_str)

            # 翻訳結果を保存（コミットはまだ行わない）
            current_target.translated_content = json_str
            translation_targets[current_file_index] = current_target

            # 元ファイル単位でグループ化
            if current_target.source_file not in source_file_translations:
                source_file_translations[current_target.source_file] = []

            source_file_translations[current_target.source_file].append(
                {
                    "path": current_target.target_file,
                    "content": json_str,
                    "language": current_target.language,
                }
            )

            # 翻訳結果を記録
            translation_results.append(
                {
                    "source_file": current_target.source_file,
                    "target_file": current_target.target_file,
                    "language": current_target.language,
                    "status": "translated",  # まだコミットしていないのでtranslatedステータス
                }
            )
    else:
        # 従来の全体翻訳処理
        # JSONをパース
        source_json = json.loads(current_target.source_content)

        # 翻訳リクエスト用のテキストを作成
        json_text = json.dumps(source_json, indent=2, ensure_ascii=False)

        prompt = (
            f"以下の日本語のJSONファイルを{current_target.language}に翻訳してください。\n\n"
            "翻訳の際は以下のルールに従ってください：\n"
            "1. JSONの構造を維持してください。\n"
            "2. キーは翻訳せず、値のみを翻訳してください。\n"
            "3. 変数や特殊な記号（{{}}, $t など）は翻訳しないでください。\n"
            "4. 技術用語は適切に翻訳してください。\n"
            "5. 翻訳後のJSONのみを出力してください。説明や注釈は不要です。\n\n"
            "翻訳対象のJSON：\n\n"
            f"{json_text}"
        )

        messages = [
            {"role": "system", "content": "あなたは翻訳の専門家です。"},
            {"role": "user", "content": prompt},
        ]

        response = llm.invoke(messages)
        translated_text = response.content

        # JSON部分を抽出するために { と } で囲まれた部分を探す
        start = translated_text.find("{")
        end = translated_text.rfind("}") + 1
        json_str = translated_text[start:end]
        # JSONとして解析できるか確認
        json.loads(json_str)

        # 翻訳結果を保存（コミットはまだ行わない）
        current_target.translated_content = json_str
        translation_targets[current_file_index] = current_target

        # 元ファイル単位でグループ化
        if current_target.source_file not in source_file_translations:
            source_file_translations[current_target.source_file] = []

        source_file_translations[current_target.source_file].append(
            {
                "path": current_target.target_file,
                "content": json_str,
                "language": current_target.language,
            }
        )

        # 翻訳結果を記録
        translation_results.append(
            {
                "source_file": current_target.source_file,
                "target_file": current_target.target_file,
                "language": current_target.language,
                "status": "translated",  # まだコミットしていないのでtranslatedステータス
            }
        )

    # 必ず現在のファイルインデックスを更新する
    current_file_index += 1

    return {
        "translation_targets": translation_targets,
        "translation_results": translation_results,
        "current_file_index": current_file_index,
        "source_file_translations": source_file_translations,
    }


def finalize_translation_node(state: TranslationState) -> Dict[str, Any]:
    """翻訳処理を完了する"""
    print("翻訳処理を完了します...")
    is_completed = True
    updated_translation_results = state.translation_results.copy()

    # 元ファイル単位でコミットを実行
    for source_file, translations in state.source_file_translations.items():
        if not translations:
            continue

        # 翻訳対象の言語をカンマ区切りで列挙
        languages = ", ".join([t["language"] for t in translations])

        # コミットメッセージを作成
        message = f"Auto-translate: Update translations for {source_file} ({languages})"

        # 複数ファイルを一度にコミットする
        files_data = [
            {
                "path": t["path"],
                "content": t["content"],
            }
            for t in translations
        ]

        # コミットを実行
        result = create_or_update_files_batch(files_data, message, state.branch)

        # 結果に基づいてステータスを更新
        for translation in translations:
            target_path = translation["path"]
            file_result = result["results"].get(target_path, {})
            status = "updated" if file_result.get("status") != "error" else "failed"

            # 翻訳結果リストの対応するエントリを更新
            for i, res in enumerate(updated_translation_results):
                if res["target_file"] == target_path:
                    updated_translation_results[i]["status"] = status
                    break

    # 翻訳結果をPRにコメント
    if updated_translation_results:
        add_pr_comment(updated_translation_results)

    # 処理完了フラグを設定
    print("自動翻訳処理が完了しました。")

    return {
        "is_completed": is_completed,
        "translation_results": updated_translation_results,
    }


class AutoTranslator:
    def __init__(self):
        self.workflow = StateGraph(TranslationState)
        self._build_graph()

    def _build_graph(self):
        # ノードの追加
        self.workflow.add_node("initialize", initialize_state_node)
        self.workflow.add_node("prepare_targets", prepare_translation_targets_node)
        self.workflow.add_node("fetch_contents", fetch_file_contents_node)
        self.workflow.add_node("check_needs", check_translation_needs_node)
        self.workflow.add_node("process_translations", process_translations_node)
        self.workflow.add_node("translate_markdown", translate_markdown_node)
        self.workflow.add_node("translate_json", translate_json_node)
        self.workflow.add_node("finalize", finalize_translation_node)

        # エントリーポイントの設定
        self.workflow.set_entry_point("initialize")

        # エッジの追加
        self.workflow.add_edge("initialize", "prepare_targets")
        self.workflow.add_edge("prepare_targets", "fetch_contents")
        self.workflow.add_edge("fetch_contents", "check_needs")
        self.workflow.add_edge("check_needs", "process_translations")

        # 条件分岐
        self.workflow.add_conditional_edges(
            "process_translations",
            lambda x: x.next,
            {
                "process_translations": "process_translations",
                "translate_markdown": "translate_markdown",
                "translate_json": "translate_json",
                "finalize": "finalize",
            },
        )

        self.workflow.add_edge("translate_markdown", "process_translations")
        self.workflow.add_edge("translate_json", "process_translations")
        self.workflow.add_edge("finalize", END)

    def run(self):
        """グラフを実行する"""
        app = self.workflow.compile()
        initial_state = TranslationState()
        final_state = app.invoke(initial_state, {"recursion_limit": 50})

        return final_state


if __name__ == "__main__":
    try:
        translator = AutoTranslator()
        result = translator.run()
        print(f"翻訳結果: {len(result.translation_results)} ファイル処理")
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        raise
