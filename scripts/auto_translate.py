import os
import json
import requests
import base64
from anthropic import Anthropic

# GitHub APIのベースURL
GITHUB_API_BASE = "https://api.github.com"

# 環境変数から認証情報を取得
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    raise ValueError("環境変数 'GITHUB_TOKEN' が設定されていません。")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("環境変数 'ANTHROPIC_API_KEY' が設定されていません。")

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

# Claude APIクライアントを初期化
anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)


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


def translate_markdown(source_content, target_language):
    """マークダウンファイルを翻訳する"""
    try:
        response = anthropic.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"以下の日本語のマークダウンファイルを{target_language}に翻訳してください。\n\n"
                        "翻訳の際は以下のルールに従ってください：\n"
                        "1. マークダウンの構造（見出し、リスト、コードブロックなど）を維持してください。\n"
                        "2. リンクやイメージの参照は変更しないでください。\n"
                        "3. コードブロック内のコードは翻訳しないでください。\n"
                        "4. 技術用語は適切に翻訳してください。\n"
                        "5. 翻訳後のテキストのみを出力してください。説明や注釈は不要です。\n\n"
                        "翻訳対象のマークダウン：\n\n"
                        f"{source_content}"
                    ),
                },
            ],
        )
        return response.content
    except Exception as e:
        print(f"翻訳に失敗しました。エラー: {e}")
        return None


def translate_json(source_content, target_language):
    """JSONファイルを翻訳する"""
    try:
        # JSONをパース
        source_json = json.loads(source_content)

        # 翻訳リクエスト用のテキストを作成
        json_text = json.dumps(source_json, indent=2, ensure_ascii=False)

        response = anthropic.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"以下の日本語のJSONファイルを{target_language}に翻訳してください。\n\n"
                        "翻訳の際は以下のルールに従ってください：\n"
                        "1. JSONの構造を維持してください。\n"
                        "2. キーは翻訳せず、値のみを翻訳してください。\n"
                        "3. 変数や特殊な記号（{{}}, $t など）は翻訳しないでください。\n"
                        "4. 技術用語は適切に翻訳してください。\n"
                        "5. 翻訳後のJSONのみを出力してください。説明や注釈は不要です。\n\n"
                        "翻訳対象のJSON：\n\n"
                        f"{json_text}"
                    ),
                },
            ],
        )

        # レスポンスからJSONを抽出
        translated_text = response.content

        # JSON部分を抽出するために { と } で囲まれた部分を探す
        start = translated_text.find("{")
        end = translated_text.rfind("}") + 1
        if start != -1 and end != -1:
            json_str = translated_text[start:end]
            # JSONとして解析できるか確認
            json.loads(json_str)
            return json_str
        else:
            raise ValueError("翻訳結果からJSONを抽出できませんでした。")
    except Exception as e:
        print(f"JSON翻訳に失敗しました。エラー: {e}")
        return None


def compare_and_translate(source_file, target_file, file_type, target_language, branch):
    """元ファイルと翻訳先ファイルを比較し、必要に応じて翻訳を行う"""
    print(f"処理中: {source_file} -> {target_file}")

    # 元ファイルと翻訳先ファイルの内容を取得
    source_content = get_file_content(source_file, branch)
    target_content = get_file_content(target_file, branch)

    # 翻訳先ファイルが存在しない場合、または内容が大きく異なる場合は翻訳を実行
    if not target_content or needs_translation(
        source_content, target_content, file_type, target_language
    ):
        print(f"翻訳が必要です: {target_file}")

        # ファイルタイプに応じた翻訳処理を実行
        if file_type == "markdown":
            translated_content = translate_markdown(source_content, target_language)
        elif file_type == "json":
            translated_content = translate_json(source_content, target_language)
        else:
            print(f"未対応のファイルタイプ: {file_type}")
            return None

        if translated_content:
            # 翻訳結果をファイルに書き込む
            message = f"Auto-translate: Update {target_file} from {source_file}"
            create_or_update_file(target_file, translated_content, message, branch)
            print(f"翻訳完了: {target_file}")
            return {
                "source_file": source_file,
                "target_file": target_file,
                "language": target_language,
                "status": "updated",
            }
        else:
            print(f"翻訳に失敗しました: {target_file}")
            return {
                "source_file": source_file,
                "target_file": target_file,
                "language": target_language,
                "status": "failed",
            }
    else:
        print(f"翻訳は不要です: {target_file}")
        return {
            "source_file": source_file,
            "target_file": target_file,
            "language": target_language,
            "status": "skipped",
        }


def needs_translation(source_content, target_content, file_type, target_language):
    """翻訳が必要かどうかを判断する"""
    # 翻訳先ファイルが存在しない場合は翻訳が必要
    if not target_content:
        return True

    try:
        # AIに翻訳が必要かどうかを判断してもらう
        response = anthropic.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"以下の2つのファイルを比較して、翻訳の更新が必要かどうかを判断してください。\n\n"
                        f"ファイルタイプ: {file_type}\n"
                        f"元言語: 日本語\n"
                        f"翻訳先言語: {target_language}\n\n"
                        "元ファイルの内容:\n"
                        f"{source_content}\n\n"
                        "翻訳先ファイルの内容:\n"
                        f"{target_content}\n\n"
                        "以下の基準で判断してください：\n"
                        "1. 元ファイルに新しい内容が追加されているが、翻訳先ファイルには反映されていない場合\n"
                        "2. 元ファイルの内容が変更されているが、翻訳先ファイルには反映されていない場合\n"
                        "3. 翻訳先ファイルの翻訳品質が低い場合\n\n"
                        "「true」または「false」のみで回答してください。翻訳の更新が必要な場合は「true」、不要な場合は「false」と回答してください。"
                    ),
                },
            ],
        )

        result = response.content.strip().lower()
        return "true" in result
    except Exception as e:
        print(f"翻訳必要性の判断に失敗しました。エラー: {e}")
        # エラーが発生した場合は安全のため翻訳を実行する
        return True


def main():
    """メイン処理"""
    try:
        # PRの情報を取得
        pr_files = get_pr_files()
        branch = f"refs/pull/{PR_NUMBER}/head"

        # 翻訳結果を記録するリスト
        translation_results = []

        # 変更されたファイルを処理
        for file_info in pr_files:
            file_path = file_info["filename"]

            # 翻訳対象のファイルかどうかを確認
            if file_path in FILE_MAPPINGS:
                mapping = FILE_MAPPINGS[file_path]
                file_type = mapping["type"]

                # 各言語に対して翻訳処理を実行
                for lang in TARGET_LANGUAGES:
                    target_file = mapping["pattern"].format(lang)
                    result = compare_and_translate(
                        file_path, target_file, file_type, lang, branch
                    )
                    if result:
                        translation_results.append(result)

        # 翻訳結果をPRにコメント
        if translation_results:
            add_pr_comment(translation_results)

        print("自動翻訳処理が完了しました。")
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        raise


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


if __name__ == "__main__":
    main()
