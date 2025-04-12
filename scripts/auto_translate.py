import os
import json
import requests
import base64
from typing import Dict, List, Any, Optional, Tuple

from langchain_openai import ChatOpenAI

# GitHub APIのベースURL
GITHUB_API_BASE = "https://api.github.com"

# --- 環境変数読み込み ---
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TARGET_BRANCH = os.getenv("TARGET_BRANCH")
BASE_BRANCH = os.getenv("BASE_BRANCH")
REPO_FULL_NAME = os.getenv("REPO_FULL_NAME")

# --- 環境変数チェック ---
if not GITHUB_TOKEN:
    raise ValueError("環境変数 'GITHUB_TOKEN' が設定されていません。")
if not OPENAI_API_KEY:
    raise ValueError("環境変数 'OPENAI_API_KEY' が設定されていません。")
if not TARGET_BRANCH:
    raise ValueError("環境変数 'TARGET_BRANCH' が設定されていません。")
if not BASE_BRANCH:
    raise ValueError("環境変数 'BASE_BRANCH' が設定されていません。")
if not REPO_FULL_NAME:
    raise ValueError("環境変数 'REPO_FULL_NAME' が設定されていません。")

# GitHub API用のヘッダー
headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}

# 翻訳対象の言語リスト (日本語を除く)
TARGET_LANGUAGES = [
    "en",
    "zh",
    "ko",
    "vi",
    "fr",
    "es",
    "pt",
    "de",
    "ru",
    "it",
    "ar",
    "hi",
    "pl",
    "th",
]  # Add more languages if needed

# 翻訳対象のファイルパス (固定)
SOURCE_JSON_PATH = "locales/ja/translation.json"


# --- LLM ---
def get_llm():
    """LLMインスタンスを取得する"""
    return ChatOpenAI(model="gpt-4o", temperature=0, api_key=OPENAI_API_KEY)


# --- GitHub API 関数 ---
def get_file_content(file_path: str, ref: Optional[str] = None) -> Optional[str]:
    """指定されたファイルの内容を取得する"""
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/contents/{file_path}"
    params = {}
    if ref:
        params["ref"] = ref

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        content = response.json().get("content")
        if content:
            return base64.b64decode(content).decode("utf-8")
        return ""  # ファイルは存在するが空の場合
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"ファイルが見つかりません: {file_path} (ref: {ref})")
            return None  # ファイルが存在しない
        else:
            print(f"ファイル取得エラー ({file_path}, ref: {ref}): {e}")
            raise
    except Exception as e:
        print(f"予期せぬエラー ({file_path}, ref: {ref}): {e}")
        raise


def create_or_update_file(
    file_path: str, content: str, message: str, branch: str
) -> Dict[str, Any]:
    """ファイルを作成または更新する (単一ファイル用)"""
    url = f"{GITHUB_API_BASE}/repos/{REPO_FULL_NAME}/contents/{file_path}"

    # 現在のファイルSHAを取得試行
    sha = None
    try:
        get_response = requests.get(url, headers=headers, params={"ref": branch})
        if get_response.status_code == 200:
            sha = get_response.json().get("sha")
        elif get_response.status_code != 404:
            get_response.raise_for_status()  # 404以外のエラーは発生させる
    except requests.exceptions.HTTPError as e:
        print(f"ファイルSHA取得エラー ({file_path}, branch: {branch}): {e}")
        # SHA取得失敗しても続行（新規作成扱い）

    content_encoded = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    data = {"message": message, "content": content_encoded, "branch": branch}
    if sha:
        data["sha"] = sha

    try:
        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
        print(f"ファイル更新/作成成功: {file_path}")
        return {"status": "success", "path": file_path}
    except requests.exceptions.HTTPError as e:
        print(
            f"ファイル更新/作成失敗 ({file_path}): {e.response.status_code} {e.response.text}"
        )
        return {"status": "error", "path": file_path, "message": str(e)}


def create_or_update_files_batch(
    files_data: List[Dict[str, str]], message: str, branch: str
) -> Dict[str, Any]:
    """複数のファイルを一括でコミット (API制限のため現状は個別呼び出し)"""
    print(f"複数ファイル ({len(files_data)}) の更新/作成を開始します...")
    results = []
    success_count = 0
    error_count = 0

    # GitHub APIには一括更新がないため、ファイルを個別に更新
    for file_info in files_data:
        result = create_or_update_file(
            file_info["path"], file_info["content"], message, branch
        )
        results.append(result)
        if result["status"] == "success":
            success_count += 1
        else:
            error_count += 1

    print(f"ファイル更新/作成完了。成功: {success_count}, 失敗: {error_count}")
    return {
        "status": "error" if error_count > 0 else "success",
        "results": results,
    }


# --- 差分計算 & 翻訳関数 ---
def get_json_diff(
    base_json: Dict[str, Any], target_json: Dict[str, Any]
) -> Dict[str, Any]:
    """2つのJSONオブジェクト間の差分を計算する"""
    base_keys = set(base_json.keys())
    target_keys = set(target_json.keys())

    added_keys = target_keys - base_keys
    deleted_keys = base_keys - target_keys
    common_keys = base_keys & target_keys

    modified_keys = {
        key
        for key in common_keys
        if json.dumps(base_json[key], sort_keys=True)
        != json.dumps(target_json[key], sort_keys=True)
    }

    diff = {
        "added": {key: target_json[key] for key in added_keys},
        "modified": {key: target_json[key] for key in modified_keys},
        "deleted": list(deleted_keys),
    }
    return diff


def translate_text(text: str, target_language: str, llm: ChatOpenAI) -> str:
    """指定されたテキストを翻訳する（JSONの値用）"""
    if not isinstance(text, str) or not text.strip():
        return text  # 文字列でない場合や空文字列はそのまま返す

    # シンプルな翻訳プロンプト
    prompt = (
        f"Translate the following Japanese text to {target_language}. "
        "Preserve variables like '{{variable}}' or '$t(key)' exactly as they are.\n\n"
        f'Japanese text: "{text}"\n\n'
        f"{target_language} translation:"
    )

    messages = [
        {
            "role": "system",
            "content": "You are a helpful translation assistant specializing in software localization.",
        },
        {"role": "user", "content": prompt},
    ]

    try:
        response = llm.invoke(messages)
        translated = response.content.strip().strip('"')  # 前後の引用符を除去
        # 翻訳結果が空文字列の場合があるため、元のテキストを返すなどの考慮が必要かもしれない
        # if not translated:
        #     print(f"警告: 翻訳結果が空です。元テキスト: '{text}'")
        #     return text # 空の場合は元を返す（要検討）
        return translated
    except Exception as e:
        print(f"翻訳エラー: {e}")
        return text  # エラー時は元のテキストを返す


def translate_value(value: Any, target_language: str, llm: ChatOpenAI) -> Any:
    """JSONの値（文字列、リスト、辞書）を再帰的に翻訳する"""
    if isinstance(value, str):
        return translate_text(value, target_language, llm)
    elif isinstance(value, list):
        return [translate_value(item, target_language, llm) for item in value]
    elif isinstance(value, dict):
        return {
            key: translate_value(val, target_language, llm)
            for key, val in value.items()
        }
    else:
        return value  # 文字列、リスト、辞書以外はそのまま返す


# --- メイン処理 ---
def main():
    print(f"ターゲットブランチ: {TARGET_BRANCH}")
    print(f"ベースブランチ: {BASE_BRANCH}")

    # 1. ベースとターゲットの ja/translation.json を取得
    print(f"'{SOURCE_JSON_PATH}' を取得しています...")
    base_ja_content = get_file_content(SOURCE_JSON_PATH, BASE_BRANCH)
    target_ja_content = get_file_content(SOURCE_JSON_PATH, TARGET_BRANCH)

    if target_ja_content is None:
        print(
            f"エラー: ターゲットブランチ '{TARGET_BRANCH}' に '{SOURCE_JSON_PATH}' が見つかりません。"
        )
        exit(1)
    if base_ja_content is None:
        # ベースにファイルがない場合（例: develop初回実行）、ターゲット全体を「追加」とみなす
        print(
            f"警告: ベースブランチ '{BASE_BRANCH}' に '{SOURCE_JSON_PATH}' が見つかりません。ターゲットファイルの全内容を新規追加として扱います。"
        )
        base_ja_content = "{}"  # 空のJSONとして扱う

    # 2. JSONをパース
    try:
        base_ja_json = json.loads(base_ja_content)
        target_ja_json = json.loads(target_ja_content)
    except json.JSONDecodeError as e:
        print(f"エラー: '{SOURCE_JSON_PATH}' のJSONパースに失敗しました。 {e}")
        exit(1)

    # 3. 差分を計算
    print("日本語ファイルの差分を計算しています...")
    diff = get_json_diff(base_ja_json, target_ja_json)

    if not diff["added"] and not diff["modified"] and not diff["deleted"]:
        print("差分はありません。処理を終了します。")
        exit(0)

    print("差分が見つかりました:")
    if diff["added"]:
        print(f"  追加されたキー: {list(diff['added'].keys())}")
    if diff["modified"]:
        print(f"  変更されたキー: {list(diff['modified'].keys())}")
    if diff["deleted"]:
        print(f"  削除されたキー: {diff['deleted']}")

    # 4. 各言語の翻訳ファイルを更新
    llm = get_llm()
    files_to_commit: List[Dict[str, str]] = []

    for lang in TARGET_LANGUAGES:
        print(f"\n--- 言語 '{lang}' の処理を開始 ---")
        target_lang_path = f"locales/{lang}/translation.json"

        # ターゲット言語の現在のファイル内容を取得
        current_lang_content = get_file_content(target_lang_path, TARGET_BRANCH)
        if current_lang_content is None:
            print(f"'{target_lang_path}' は存在しません。新規作成します。")
            current_lang_json = {}
        else:
            try:
                current_lang_json = json.loads(current_lang_content)
            except json.JSONDecodeError:
                print(
                    f"警告: '{target_lang_path}' のJSONパースに失敗しました。空のファイルとして扱います。"
                )
                current_lang_json = {}

        updated_lang_json = current_lang_json.copy()

        # 差分を適用
        # 追加分を翻訳して追加
        if diff["added"]:
            print(f"  '{lang}' にキーを追加しています...")
            for key, value in diff["added"].items():
                translated_value = translate_value(value, lang, llm)
                updated_lang_json[key] = translated_value
                print(f"    + {key}: (翻訳適用)")

        # 変更分を翻訳して更新
        if diff["modified"]:
            print(f"  '{lang}' のキーを更新しています...")
            for key, value in diff["modified"].items():
                translated_value = translate_value(value, lang, llm)
                updated_lang_json[key] = translated_value
                print(f"    * {key}: (翻訳適用)")

        # 削除分を削除
        if diff["deleted"]:
            print(f"  '{lang}' からキーを削除しています...")
            for key in diff["deleted"]:
                if key in updated_lang_json:
                    del updated_lang_json[key]
                    print(f"    - {key}")

        # 変更があったか確認 (元のJSONと比較)
        if json.dumps(current_lang_json, sort_keys=True) != json.dumps(
            updated_lang_json, sort_keys=True
        ):
            print(
                f"  '{target_lang_path}' に変更がありました。コミット対象に追加します。"
            )
            # JSONを整形して文字列化
            updated_content = json.dumps(
                updated_lang_json,
                indent=2,
                ensure_ascii=False,
                sort_keys=True,  # キーでソート
            )
            files_to_commit.append(
                {
                    "path": target_lang_path,
                    "content": updated_content + "\n",
                }  # 末尾に改行追加
            )
        else:
            print(f"  '{target_lang_path}' に変更はありませんでした。")

    # 5. 変更をコミット
    if files_to_commit:
        print("\n変更をコミットしています...")
        commit_message = (
            f"chore(i18n): Update locale files based on changes in {SOURCE_JSON_PATH}\n\n"
            f"Base branch: {BASE_BRANCH}\n"
            f"Target branch: {TARGET_BRANCH}"
        )
        result = create_or_update_files_batch(
            files_to_commit, commit_message, TARGET_BRANCH
        )
        if result["status"] == "error":
            print("エラー: 一部または全てのファイルのコミットに失敗しました。")
            # 必要であればエラーの詳細を出力
            # print(json.dumps(result["results"], indent=2))
            exit(1)
        else:
            print("全ての変更が正常にコミットされました。")
    else:
        print("\nコミットする変更はありませんでした。")

    print("\n処理が正常に完了しました。")


if __name__ == "__main__":
    main()
