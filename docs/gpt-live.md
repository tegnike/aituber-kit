# GPT-Live-1 音声会話

AI設定でOpenAIを選び、GPT-Live-1をONにする。OpenAI APIキーは既存の入力欄、またはサーバーの `OPENAI_KEY` / `OPENAI_API_KEY` を使用する。GPT-Liveのアクセス権が必要。サーバーのキーを使う場合は、既存の `AITUBERKIT_SERVER_SECRET_ACCESS_MODE` によるアクセス許可も必要（既定値は `disabled`）。拒否された場合は専用エラーを表示する。

- 声: `marin`（初期値）と公式の追加12音声。公式のPresentation分類を女性・男性として併記し、分類未記載の `marin` は未公表と表示する。
- 推論モデル: `gpt-5.6-terra`（初期値）。GPT-LiveのResponses delegationで利用可能なモデルIDを入力する。
- Web検索: 初期値OFF。ON時はバックエンドに `web_search` を設定する。
- 会話画面の「会話を開始」でマイク接続。「会話を終了」でマイク送信を止め、終了通知を待って接続を解放する。開始は自動では行わない。
- キャラクターのシステムプロンプトを音声側と推論側の両方に渡す。言語設定、直近のテキスト履歴も引き継ぐ。設定変更は次回接続から適用。履歴件数は「過去のメッセージ保持数」に従う（API上限128件）。文字列のユーザー・アシスタント発言を直近から選び、本文を切り捨てずに送る。公式上限は履歴合計8,192トークン、プロンプトはアプリの追加指示込みで16,384トークン。文字数への固定換算は行わず、正確な判定はAPIに委ねる。超過時は専用エラーを表示し、自動で履歴を削ったり再試行したりしない。AI設定・記憶設定の件数入力と説明はGPT-Live時のみ上限128件に切り替わる（通常モードの保存値は維持）。
- メイン画面は既存フォームと同じ幅・背景のコンパクトな操作バー。音声の自動再生がブロックされた場合だけ再生ボタンを表示する。

音声は接続時間に応じて課金される。推論モデルと検索には別料金が発生する。WebRTC作成時には15秒分の初期化料金があり、開始後の時間課金に充当される。マイクが無音でも接続中の時間は進む。

## 実装

`/api/ai/live-session` が既存のアクセスポリシーを適用し、`POST https://api.openai.com/v1/live/sessions` へSDPとサーバーで構成したセッションを送る。SDK・依存パッケージの更新は不要。キーとセッション設定を返さず、セッションIDとSDP answerだけ返す。

専用WebRTCクライアントが `session.started` を待つ。マイク入力はアシスタント発話中も維持し、音声はメディアトラックから直接再生する。出力音声の解析値をVRM / Live2D / PNGTuberの口パクへ渡す。音声を既存のTTSキューへ再投入しない。

`session.input_transcript.delta` と `session.output_transcript.delta` は別々に集約し、会話ログへ表示する。1500ms以内の間隔は表示上のまとまりとするが、ターン完了やバックエンド実行のトリガーにはしない。元の断片とセッション内時刻はメッセージの `liveTranscript` に保持する。

終了は `session.close` → `session.closed`。終了通知が15秒以内に来ない場合もローカル資源を解放するが、最終利用時間は未確認と表示する。接続障害時の自動再接続は行わない。

## 範囲と検証

今回はOpenAI管理のResponses delegationを実装。既存Realtimeのfunction calling、他社モデルへのclient delegation、RAG検索、画像入力、テキスト送信は接続していない。競合する音声認識、TTS、自動発話、YouTube、スライド、外部メッセージ受信モードは同時利用しない。

ローカル自動テストはAPIリクエスト形状とアクセス制御、接続中キャンセル・終了通知待ち、字幕の重複・遅延・同時発話、モード排他を検証する。ブラウザテストの接続・字幕はモックであり、実APIの音声品質・日本語会話・割り込み・口パクの実機確認を代替しない。

検証環境の実行ランタイムはNode.js 22.21.1（arm64）。プロジェクトの指定はNode.js 24.xのため、Node 24での実行確認は別途必要。

実API確認時は短い会話で、マイク入力→応答音声→字幕→口パク、発話中の割り込み、推論とWeb検索の結果、終了通知とマイク解放を個別に確認する。

公式資料（2026-09-10確認）:

- https://developers.openai.com/api/docs/guides/live
- https://developers.openai.com/api/docs/guides/voice-webrtc?api=live
- https://developers.openai.com/api/docs/guides/live-delegation
- https://developers.openai.com/api/docs/guides/live-conversations
