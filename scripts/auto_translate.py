import os
import json
import requests
import base64
from typing import Dict, List, Any, Optional

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

# GitHub API用のヘッダーを定義
headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}

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
    response = requests.put(url, headers=headers, json=data)
    response.raise_for_status()
    return response.json()


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
    branch = f"refs/pull/{PR_NUMBER}/head"

    return {
        "pr_files": pr_files,
        "branch": branch,
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
        return {
            "next": "process_translations",
            "translation_results": translation_results,
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
        return {
            "next": "process_translations",
            "translation_results": translation_results,
        }


def translate_markdown_node(state: TranslationState) -> Dict[str, Any]:
    """マークダウンファイルを翻訳する"""
    updated_state = state.model_copy(deep=True)
    current_target = updated_state.translation_targets[updated_state.current_file_index]
    print(f"マークダウンファイルを翻訳しています: {current_target.target_file}")

    translation_results = updated_state.translation_results.copy()
    translation_targets = updated_state.translation_targets.copy()
    current_file_index = updated_state.current_file_index

    llm = get_llm()

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

    # 翻訳結果をファイルに書き込む
    message = f"Auto-translate: Update {current_target.target_file} from {current_target.source_file}"
    create_or_update_file(
        current_target.target_file,
        translated_content,
        message,
        updated_state.branch,
    )

    print(f"翻訳完了: {current_target.target_file}")
    translation_results.append(
        {
            "source_file": current_target.source_file,
            "target_file": current_target.target_file,
            "language": current_target.language,
            "status": "updated",
        }
    )

    # 必ず現在のファイルインデックスを更新する
    current_file_index += 1

    return {
        "translation_targets": translation_targets,
        "translation_results": translation_results,
        "current_file_index": current_file_index,
    }


def translate_json_node(state: TranslationState) -> Dict[str, Any]:
    """JSONファイルを翻訳する"""
    updated_state = state.model_copy(deep=True)
    current_target = updated_state.translation_targets[updated_state.current_file_index]
    print(f"JSONファイルを翻訳しています: {current_target.target_file}")

    translation_results = updated_state.translation_results.copy()
    translation_targets = updated_state.translation_targets.copy()
    current_file_index = updated_state.current_file_index

    llm = get_llm()

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

    # 翻訳結果をファイルに書き込む
    message = f"Auto-translate: Update {current_target.target_file} from {current_target.source_file}"
    create_or_update_file(
        current_target.target_file,
        json_str,
        message,
        updated_state.branch,
    )

    print(f"翻訳完了: {current_target.target_file}")
    translation_results.append(
        {
            "source_file": current_target.source_file,
            "target_file": current_target.target_file,
            "language": current_target.language,
            "status": "updated",
        }
    )

    # 必ず現在のファイルインデックスを更新する
    current_file_index += 1

    return {
        "translation_targets": translation_targets,
        "translation_results": translation_results,
        "current_file_index": current_file_index,
    }


def finalize_translation_node(state: TranslationState) -> Dict[str, Any]:
    """翻訳処理を完了する"""
    print("翻訳処理を完了します...")
    is_completed = True

    # 翻訳結果をPRにコメント
    if state.translation_results:
        add_pr_comment(state.translation_results)

    # 処理完了フラグを設定
    print("自動翻訳処理が完了しました。")

    return {
        "is_completed": is_completed,
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
            lambda x: x["next"],
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
        final_state = app.invoke(initial_state)

        return final_state


if __name__ == "__main__":
    try:
        translator = AutoTranslator()
        result = translator.run()
        print(f"翻訳結果: {len(result.translation_results)} ファイル処理")
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        raise
