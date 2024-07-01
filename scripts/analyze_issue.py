import os
import json
import requests
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
with open(os.environ["GITHUB_EVENT_PATH"]) as event_file:
    github_event = json.load(event_file)

issue_number = github_event["issue"]["number"]
issue_title = github_event["issue"]["title"]
issue_body = github_event["issue"]["body"]
repo_full_name = github_event["repository"]["full_name"]

# サマリーファイルの内容を読み込む
with open("docs/summary.md") as summary_file:
    summary_content = summary_file.read()

# Claude APIクライアントを初期化
anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)

# Claude APIに問い合わせ
response = anthropic.messages.create(
    model="claude-3-5-sonnet-20240620",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": (
            f"以下はGitHubで作成されたIssueとサマリーファイルの内容です。"
            f"このIssueに関連すると考えられるファイルを以下のJSONの形式で5-10つ出力してください。\n\n"
            f"[{{'file_path': str, 'reason': str}}]\n\n"
            f"Issue:\nタイトル: {issue_title}\n本文: {issue_body}\n\n"
            f"サマリーファイル内容:\n{summary_content}\n"
        )}
    ]
)

analysis_result = response.content[0].text

# GitHubのIssueにコメントを追加
headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

comment_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/issues/{issue_number}/comments"
comment_data = {
    "body": f"Issue分析結果:\n\n{analysis_result}"
}

response = requests.post(comment_url, headers=headers, json=comment_data)

if response.status_code == 201:
    print("分析結果をIssueにコメントとして追加しました。")
else:
    print(f"コメントの追加に失敗しました。ステータスコード: {response.status_code}")
    print(response.text)
