# トラブルシューティング

## 概要

AITuberKit の利用中に遭遇しやすい問題とその解決策をまとめます。本ページでは、一般的なエラーや問題の原因と対処法を順次追加し、具体的な事例をもとに解決策を詳細に解説することで、スムーズな利用をサポートします。

## Live2Dモデル読み込み時の TypeError: \_currentFrameNo

::: warning 症状
AITuberKit で自作 Live2D モデルを選択すると、以下のエラーが表示されモデルが描画されない。

```text
Unhandled Runtime Error
TypeError: Cannot set properties of undefined (setting '_currentFrameNo')
  at Cubism4InternalModel.updateWebGLContext (...)
  ...
```

:::

### 原因

- `pixi-live2d-display` 系ライブラリの既知バグ。
- モデルにクリッピングマスク（ArtMesh ▶ 描画 ▶ マスクを生成）が 1 枚も無い場合、`_clippingManager` が生成されず `undefined` となる。
- `Cubism4InternalModel.updateWebGLContext` 内で `this._clippingManager._currentFrameNo = ++frame;` が実行され TypeError が発生。
- さらに Cubism 5 形式（.moc3 v4）でエクスポートされたモデルは AITuberKit 付属ライブラリと互換性がない。

### 解決方法

1. Live2D Cubism Editor でモデルを開く。
2. 任意の ArtMesh を選択し、[インスペクタ] ▶ [描画] ▶ **マスクを生成** を ON にする。
3. [ファイル] ▶ [エクスポート] ▶ **モデル(.moc3)** を選択し、ダイアログで次を指定してエクスポート。
   - **SDK**: SDK for Web
   - **バージョン**: Cubism 4.2（または 4.0/4.1）
4. 出力フォルダを `public/live2d/モデル名/` に配置し、`モデル名.model3.json` を AITuberKit で再選択。
5. 口パクを有効にする場合は、model3.json の **Groups** に `LipSync` を追加。

::: tip ヒント
眉やハイライトなどの軽量メッシュにマスクを付与するだけでも問題は解消します。視覚的な影響を避けたい場合は、見えない小さなメッシュを新規作成してマスクを生成しても構いません。
:::

### 影響する Live2D 側の設定早見表

| 設定箇所                        | 正常動作に必要なポイント                 | 備考                                                     |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| ArtMesh ▶ 描画 ▶ マスクを生成 | 最低 1 枚 ON                             | パーツは任意（眉・髪ハイライトなど）                     |
| モデル書き出し                  | **SDK for Web / Cubism 4.2 以前** を選択 | Cubism 5 形式 (.moc3 v4) は非対応                        |
| model3.json → Groups            | EyeBlink と LipSync を追加               | 追加しなくてもエラーは起きないが表情・口パクが動作しない |

以上の手順後、AITuberKit でモデルが正しく描画されれば完了です。
Live2D の設定は[こちら](character/live2d.md)を参照してください。
