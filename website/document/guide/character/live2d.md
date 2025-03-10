# Live2Dの設定

## 概要

Live2Dは2Dイラストにリアルな動きを付けることができるモデル形式で、AITuberKitではLive2Dモデルを使用してAIキャラクターを表示することができます。

**環境変数**:

```bash
# 選択するLive2Dモデルのモデルファイルのパス
NEXT_PUBLIC_SELECTED_LIVE2D_PATH=/live2d/modername/model3.json

# 感情設定（カンマ区切りで複数指定可能）
NEXT_PUBLIC_NEUTRAL_EMOTIONS=Neutral
NEXT_PUBLIC_HAPPY_EMOTIONS=Happy,Happy2
NEXT_PUBLIC_SAD_EMOTIONS=Sad,Sad2,Troubled
NEXT_PUBLIC_ANGRY_EMOTIONS=Angry,Focus
NEXT_PUBLIC_RELAXED_EMOTIONS=Relaxed

# モーショングループ設定
NEXT_PUBLIC_IDLE_MOTION_GROUP=Idle
NEXT_PUBLIC_NEUTRAL_MOTION_GROUP=Neutral
NEXT_PUBLIC_HAPPY_MOTION_GROUP=Happy
NEXT_PUBLIC_SAD_MOTION_GROUP=Sad
NEXT_PUBLIC_ANGRY_MOTION_GROUP=Angry
NEXT_PUBLIC_RELAXED_MOTION_GROUP=Relaxed
```

## 技術的な実装について

Live2D表示のために非公式ライブラリの [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display) を使用しています。
Live2Dは開発用SDKとしてCubismというライブラリが提供されており、AITuberKitでは、Live2D社の許可を得て、公式SDKを使用しています。

### Cubism Coreのセットアップ

Live2D機能を利用する場合、以下のファイルを `public/scripts` に設置してください：

`live2dcubismcore.min.js`（Cubism 4/5用）

- [公式サイト](https://www.live2d.com/sdk/download/web/)からダウンロード可能
- または[こちら](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)から入手可能（注：本番環境での使用は推奨されません）

Live2D社のCubism SDKを組み込んだソフトウェアを公開する際にはLive2D社との出版許諾契約の締結が必要になる可能性があります。詳しくは下記ページをご参照ください。
https://www.live2d.com/sdk/license/

## Live2Dモデルの準備

AITuberKitでは、Live2D Cubism 3以降のモデルに対応しています。Live2Dモデルを使用するには、以下の手順に従ってください：

1. Live2Dモデルのフォルダを準備します
2. モデルフォルダを `public/live2d` ディレクトリに配置します（このフォルダの直下に`model3.json`ファイルが存在する必要があります）
3. アプリケーション上でLive2Dモデルを選択します

## モデルの選択

アプリケーション内で利用可能なLive2Dモデルは、ドロップダウンメニューから選択できます。選択するとリアルタイムでモデルが切り替わります。

## モデルの操作方法

2Dモデルは以下のマウス操作で自由に調整できます：

### 位置・サイズの調整

- **左クリック または 右クリック + ドラッグ**：キャラクターの位置を移動できます
- **マウスホイールのスクロール**：キャラクターのサイズを拡大・縮小できます

これらの操作を組み合わせることで、画面内のキャラクターの配置を最適な状態に調整できます。配信画面のレイアウトに合わせてキャラクターの見え方を自由にカスタマイズしましょう。

## 表情設定

Live2Dモデルの表情を5つの感情カテゴリに分けて設定できます：

- **通常（Neutral）**: 会話完了後などに表示される通常の表情
- **嬉しい（Happy）**: 喜びや楽しさを表現する表情
- **悲しい（Sad）**: 悲しみや困惑を表現する表情
- **怒り（Angry）**: 怒りや集中を表現する表情
- **リラックス（Relaxed）**: リラックスした状態を表現する表情

各感情カテゴリでは、モデルが持つ表情からいくつでも割り当てることができます。カンマ区切りで複数指定した場合は、ランダムに選択されます。

## モーショングループ設定

Live2Dモデルのモーションを6つのカテゴリに分けて設定できます：

- **アイドル時（Idle）**: 会話完了後などに表示されるアイドル状態のモーション
- **通常（Neutral）**: 通常の感情状態のモーション
- **嬉しい（Happy）**: 喜びの感情状態のモーション
- **悲しい（Sad）**: 悲しみの感情状態のモーション
- **怒り（Angry）**: 怒りの感情状態のモーション
- **リラックス（Relaxed）**: リラックスした感情状態のモーション

各カテゴリには、モデルが持つモーショングループから1つ選択できます。

## モデルについての注意点

- モデルによっては読み込みに時間がかかる場合があります
- オリジナルのLive2Dモデルを使用する場合は、ご自身のモデルに合わせて表情やモーショングループの設定をカスタマイズしてください
- 初期値はAITuberKitで用意しているモデルに対応したものです

### モデルの互換性について

AITuberKitではCubism 3以降のモデルに対応していますが、モデルによっては互換性の問題で正常に動作しない場合があります。

- Boothなどで配布されているフリーLive2Dモデルの多くは動作確認済みですが、一部のモデルでは原因不明で動作しないケースがあります
- Cubism Editorのバージョンについては、バージョン4までのモデルはほぼ対応しているという報告がありますが、最新のバージョン5のモデルについては完全な互換性を保証できません

## Live2Dモデルのライセンスについて

使用するLive2Dモデルのライセンスを必ず確認してください。商用利用や再配布が制限されている場合があります。Live2Dモデルを使用する際は、作者の利用規約に従ってください。

## 商用利用時の注意点

AITuberKitでLive2Dモデルを商用利用する場合は、以下の点にご注意ください：

### Live2D社のライセンスについて

Live2Dを商用利用する場合、Live2D社のライセンス購入が必要になる場合があります。

- 商用利用の条件や詳細は公式サイトでご確認ください：
  [Live2D SDK ライセンス](https://www.live2d.com/sdk/license/)

- ライセンス購入が必要な条件に該当する場合、AITuberKitの販売元にも支払い義務が発生するため、25%の料金上乗せが発生します

- Live2Dのライセンスに関する詳細な質問は、Live2D社に直接お問い合わせください

なお、上記の内容は変更される可能性があるため、最新の情報は必ずLive2D社の公式サイトでご確認ください。
