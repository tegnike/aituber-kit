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

# GitHubイベントの情報を取得
if "GITHUB_EVENT_PATH" in os.environ:
    with open(os.environ["GITHUB_EVENT_PATH"]) as event_file:
        github_event = json.load(event_file)

    if "issue" in github_event:
        issue_number = github_event["issue"]["number"]
        issue_title = github_event["issue"]["title"]
        issue_body = github_event["issue"]["body"]
        repo_full_name = github_event["repository"]["full_name"]
    else:
        # workflow_dispatch からの入力を使用
        issue_number = os.environ["ISSUE_NUMBER"]
        issue_title = os.environ["ISSUE_TITLE"]
        issue_body = os.environ["ISSUE_BODY"]
        repo_full_name = os.environ["GITHUB_REPOSITORY"]
else:
    # workflow_dispatch からの入力を使用
    issue_number = os.environ["ISSUE_NUMBER"]
    issue_title = os.environ["ISSUE_TITLE"]
    issue_body = os.environ["ISSUE_BODY"]
    repo_full_name = os.environ["GITHUB_REPOSITORY"]

# サマリーファイルの内容を読み込む
with open("docs/summary.md") as summary_file:
    summary_content = summary_file.read()

# Claude APIクライアントを初期化
anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)

# GitHub API用のヘッダーを定義
headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
}

# 関連ファイルを特定するためのClaude API呼び出し
try:
    response = anthropic.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=1024,
        system=(
            "以下はGitHubで作成されたIssueとサマリーファイルの内容です。\n"
            "このIssueに関連すると考えられるファイルを以下のJSONの形式で5-30つ出力してください。\n"
            "候補はできるだけ多いほうがいいです。\n"
            '[{"file_path": str, "reason": str}]\n'
            "必ずJSONのみ出力すること。日本語で回答してください。"
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Issue:\nタイトル: {issue_title}\n本文: {issue_body}\n\n"
                    f"サマリーファイル内容:\n{summary_content}\n"
                ),
            },
        ],
    )

    # Claude APIの応答を出力
    print("Claude APIの応答:")
    print(response.content[0].text)

    # Claude APIの応答をパースしてJSONを抽出
    content = response.content[0].text
    # JSON部分を抽出するために [ と ] で囲まれた部分を探す
    start = content.find("[")
    end = content.rfind("]") + 1
    if start != -1 and end != -1:
        json_str = content[start:end]
        analysis_result = json.loads(json_str)
    else:
        raise ValueError("Claude APIの応答からJSONを抽出できませんでした。")

except json.JSONDecodeError as e:
    print(f"JSONのパースに失敗しました。エラー: {e}")
    print(f"Claude APIの応答: {content}")
    exit(1)
except Exception as e:
    print(f"Claude APIリクエストに失敗しました。エラー: {e}")
    exit(1)

# 関連ファイルのコードを取得
file_contents = {}
for file_info in analysis_result:
    file_path = file_info["file_path"]
    file_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/contents/{file_path}"
    file_response = requests.get(file_url, headers=headers)
    if file_response.status_code == 200:
        file_content = file_response.json()["content"]
        decoded_content = base64.b64decode(file_content).decode("utf-8")
        file_contents[
            file_path
        ] = f"File Path: {file_path}\n\nContent:\n{decoded_content}"
    else:
        print(f"ファイル {file_path} の取得に失敗しました。ステータスコード: {file_response.status_code}")

# コード改善案を求めるためのClaude API呼び出し
try:
    improvement_response = anthropic.messages.create(
        model="claude-3-5-sonnet-20240620",
        max_tokens=2048,
        system="次のIssueと関連するファイルのコードを分析し、具体的なコードの改善案を説明と共に提示してください。必ず日本語で回答してください。",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Issue:\nタイトル: {issue_title}\n本文: {issue_body}\n\n"
                    "関連するファイルのコード:\n"
                    f"{json.dumps(file_contents, indent=2, ensure_ascii=False)}"
                ),
            },
        ],
    )
    improvement_result = improvement_response.content[0].text
except Exception as e:
    print(f"Claude APIリクエストに失敗しました。エラー: {e}")
    exit(1)

# GitHubのIssueにコメントを追加
comment_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/issues/{issue_number}/comments"
comment_data = {
    "body": f"## Issue分析結果:\n\n```json\n{json.dumps(analysis_result, indent=2, ensure_ascii=False)}\n```\n\n## コード改善案:\n\n{improvement_result}"
}

response = requests.post(comment_url, headers=headers, json=comment_data)

if response.status_code == 201:
    print("分析結果とコード改善案をIssueにコメントとして追加しました。")
else:
    print(f"コメントの追加に失敗しました。ステータスコード: {response.status_code}")
    print(response.text)
