# プリセットファイル

アプリケーションの初期プロンプトを定義するテキストファイルです。
ストアに値が未設定（空文字）の場合、起動時にこれらのファイルから自動的に読み込まれます。

環境変数（`NEXT_PUBLIC_*`）が設定されている場合はそちらが優先され、ファイルからの読み込みは行われません。

## キャラクタープリセット

| ファイル      | 設定キー           | 説明                                          |
| ------------- | ------------------ | --------------------------------------------- |
| `preset1.txt` | `characterPreset1` | キャラクタープリセット1（システムプロンプト） |
| `preset2.txt` | `characterPreset2` | キャラクタープリセット2                       |
| `preset3.txt` | `characterPreset3` | キャラクタープリセット3                       |
| `preset4.txt` | `characterPreset4` | キャラクタープリセット4                       |
| `preset5.txt` | `characterPreset5` | キャラクタープリセット5                       |

## プロンプトプリセット

| ファイル                            | 設定キー                                    | 説明                                            |
| ----------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| `idle-ai-prompt-template.txt`       | `idleAiPromptTemplate`                      | アイドルモード - AIによるセリフ生成用プロンプト |
| `youtube-prompt-evaluate.txt`       | `conversationContinuityPromptEvaluate`      | YouTube会話継続 - 状態判定プロンプト            |
| `youtube-prompt-continuation.txt`   | `conversationContinuityPromptContinuation`  | YouTube会話継続 - 継続発話プロンプト            |
| `youtube-prompt-sleep.txt`          | `conversationContinuityPromptSleep`         | YouTube会話継続 - スリープ移行プロンプト        |
| `youtube-prompt-new-topic.txt`      | `conversationContinuityPromptNewTopic`      | YouTube会話継続 - 新トピック生成プロンプト      |
| `youtube-prompt-select-comment.txt` | `conversationContinuityPromptSelectComment` | YouTube会話継続 - コメント選択プロンプト        |
| `multimodal-ai-decision-prompt.txt` | `multiModalAiDecisionPrompt`                | マルチモーダルAI画像判定プロンプト              |
