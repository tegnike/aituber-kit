# OBS連携機能

AITuberKitはOBS Studioと連携してスライドショーの録画を自動化できます。以下の環境変数を設定することで、OBS WebSocketへの接続設定を行います。

```
# .envファイルに追加
NEXT_PUBLIC_OBS_WEBSOCKET_URL=ws://localhost:4455
NEXT_PUBLIC_OBS_WEBSOCKET_PASSWORD=yourpassword
```

設定方法:
1. OBS Studioを起動し、「ツール」→「WebSocket Server Settings」を開きます
2. 「Enable WebSocket Server」にチェックを入れます
3. 必要に応じてパスワードを設定します（パスワードを設定しない場合は空白にします）
4. 上記の環境変数を.envファイルに追加し、URLとパスワードを設定します

スライドの自動再生URLパラメータ:
```
http://localhost:3000?slide=スライド名&autoplay=true
```
