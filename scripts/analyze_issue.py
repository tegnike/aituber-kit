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
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": (
                    "あなたは、GitHubリポジトリの内容を深く理解し、Issueと関連するファイルを特定する能力を持つAIアシスタントです。以下の指示に従って、与えられたIssueに関連するファイルを特定し、JSONフォーマットで出力してください。\n\n"
                    "まず、GitHubで作成されたIssueの内容を確認してください：\n\n"
                    "<issue_title>\n"
                    f"{issue_title}\n"
                    "</issue_title>\n\n"
                    "<issue_body>\n"
                    f"{issue_body}\n"
                    "</issue_body>\n\n"
                    "次に、サマリーファイルの内容を確認してください：\n\n"
                    "<summary_content>\n"
                    f"{summary_content}\n"
                    "</summary_content>\n\n"
                    "あなたの課題は、このIssueに関連すると考えられるファイルを特定し、以下のJSONフォーマットで出力することです：\n\n"
                    "[\n"
                    "  {\n"
                    '    "file_path": "ファイルパス",\n'
                    '    "reason": "このファイルが関連すると考えられる理由"\n'
                    "  },\n"
                    "  ...\n"
                    "]\n\n"
                    "ファイルの選択と出力に関する重要なガイドライン：\n\n"
                    "1. 関連するファイルを5つから30つ選択してください。\n"
                    "2. できるだけ多くの候補を挙げることが望ましいです。\n"
                    "3. 各ファイルについて、そのファイルがIssueに関連すると考えられる具体的な理由を日本語で説明してください。\n"
                    "4. ファイルパスは、リポジトリのルートからの相対パスで指定してください。\n"
                    "5. Issueの内容、サマリーファイルの情報、およびソフトウェア開発の一般的な知識を活用して、関連性の高いファイルを選択してください。\n\n"
                    "出力に関する注意事項：\n"
                    "- 必ずJSONフォーマットのみで出力してください。\n"
                    "- JSONの前後に説明文や追加のテキストを含めないでください。\n"
                    '- すべての説明（"reason"フィールド）は日本語で記述してください。\n\n'
                    "それでは、Issueの内容とサマリーファイルの情報を分析し、関連するファイルをJSONフォーマットで出力してください。"
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
        messages=[
            {
                "role": "user",
                "content": (
                    "あなたは、ソフトウェア開発プロジェクトの問題を分析し、コードの改善案を提案する優秀なプログラマーです。与えられた情報を基に、具体的なコードの改善案を日本語で提示してください。\n\n"
                    "まず、以下のIssue情報を確認してください：\n\n"
                    "<issue>\n"
                    f"タイトル: {issue_title}\n"
                    f"本文: {issue_body}\n"
                    "</issue>\n\n"
                    "次に、このIssueに関連するファイルのコードを確認してください：\n\n"
                    "<file_contents>\n"
                    f"{json.dumps(file_contents, indent=2, ensure_ascii=False)}\n"
                    "</file_contents>\n\n"
                    "以下の手順に従って、コードを分析し改善案を作成してください：\n\n"
                    "1. Issueの内容とコードを注意深く読み、問題点を特定してください。\n"
                    "2. コードの構造、パフォーマンス、可読性、保守性などの観点から改善が必要な箇所を見つけてください。\n"
                    "3. 特定した問題点に対する具体的な改善案を考えてください。\n"
                    "4. 各改善案について、なぜその改善が必要か、どのような利点があるかを説明してください。\n"
                    "5. 可能であれば、改善後のコードの例を提示してください。\n\n"
                    "あなたの回答は以下の形式で提示してください：\n\n"
                    "<analysis>\n"
                    "[コードの分析結果と全体的な所見をここに記述してください]\n"
                    "</analysis>\n\n"
                    "<improvements>\n"
                    "[改善案を以下の形式で列挙してください]\n"
                    "1. [改善案1]\n"
                    "   説明: [なぜこの改善が必要か、どのような利点があるかの説明]\n"
                    "   改善後のコード例:\n"
                    "   ```\n"
                    "   [コードスニペット]\n"
                    "   ```\n\n"
                    "2. [改善案2]\n"
                    "   説明: [なぜこの改善が必要か、どのような利点があるかの説明]\n"
                    "   改善後のコード例:\n"
                    "   ```\n"
                    "   [コードスニペット]\n"
                    "   ```\n\n"
                    "[必要に応じて追加の改善案を記述してください]\n"
                    "</improvements>\n\n"
                    "<conclusion>\n"
                    "[全体的な結論と、これらの改善によって期待される効果をまとめてください]\n"
                    "</conclusion>\n\n"
                    "必ず日本語で回答し、専門的な用語や概念については適切に説明を加えてください。改善案は具体的で実行可能なものにし、コードの品質向上に貢献する内容にしてください。"
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
