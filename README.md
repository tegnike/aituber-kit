# 美少女OPInterpreter フロントサイド 公開用
[English version](./en_README.md)

## 関連

- サーバーサイドリポジトリ -> [tegnike/nike-open-interpreter](https://github.com/tegnike/nike-open-interpreter)

## できること

1. ChatVRMも全機能がそのまま使えます。
2. 加えて、WebSocketでサーバー側にメッセージを送信して、レスポンスを取得することができます。

## 事前準備

1. 本リポジトリはWebSocketでの動作を前提としているため、ご自身の環境に合わせて接続先を準備してください。
2. 接続URLはデフォルトで`ws://127.0.0.1:8000/ws`です。

## 実行方法

1. パッケージインストール
```bash
npm install
```

2. サーバー起動
```bash
npm run dev
```

3. URLを開く
[http://localhost:3000](http://localhost:3000) 

## コード解説

下記に詳細を記載しました。

- [美少女と一緒に開発しようぜ！！【Open Interpreter】](https://note.com/nike_cha_n/n/nabcfeb7aaf3f)

## その他

1. ライセンスは[pixiv/ChatVRM](https://github.com/pixiv/ChatVRM)に準拠します。
