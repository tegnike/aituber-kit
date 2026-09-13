# 同梱Live2Dモデルのnike03素材への更新

更新日: 2026-09-13

Live Studioで2026-08-27に現行版となったnike03の実行用素材を取り込んだ。
既存の保存済み設定との互換性のため、公開パスは `/live2d/nike01/nike01.model3.json` のまま維持する。

## 取り込み内容

- `nike03.moc3`、physics、parameter表示情報を `nike01` 名で配置。
- texture・physics・parameter表示情報は既存版と内容が同一で、Git差分はない。
- nike03の17個のExpressionを登録。既存の `Neutral`、`Happy`、`Sad2` も互換性のため保持。
- AITuberKit独自の既存motionファイルとmotion group、LipSync・EyeBlink groupを維持。
- Cubism編集用 `.cmo3`、VTube Studio固有の配置・入力mapping・モデルIDは配布対象に含めない。

## 制御の範囲

この更新はモデル素材の取り込みである。Live Studioの7状態の演技profile、独立Body入力制御、24秒の待機演技、五母音の時刻同期、VTube Studioの自動まばたき設定は別のruntime実装であり、コピーだけではAITuberKitへ移植されない。AITuberKitでは既存の表情選択・motion group・口パク・EyeBlink制御を継続する。

腕上げの試作モデルは取り込んでいない。バージョン更新・push・タグ・GitHub Releaseは保留。

## 取り込み元

T7上の `Live2D/nike03/vtube-studio/nike03/`。
Live Studio側の `docs/live2d-model-catalog.md` と `docs/nike03-non-arm-motion-validation.md` を参照。

主要ファイルの取り込み元SHA-256:

- `nike03.moc3`: `5a077c5c58d520b6215ff39632deb40a69c6611494a48c6d13060f6dfb23cf86`
- `nike03.physics3.json`: `b6f93081dc99d40594c40dcf6135323e4737ab0832bf79b18ee04c4a65364527`
- `nike03.cdi3.json`: `356d815d9b191a682e4efdfe292e8ed73dca60fbb40296d9df55a9a63ba45084`
- `nike03.8192/texture_00.png`: `ebbfee0c5edbfccaf61dd81b3b32a679e3bec099a134d7e0767b9759af6c6e20`

## 検証

- 38件のモデル参照先がすべて存在し、20表情が登録されていることを確認。
- moc3・textureは取り込み元とのバイト一致、physics・表示情報・17表情はJSON内容一致を確認。
- 既存表情名、motion group、LipSync・EyeBlink groupの互換性を確認。
- Live2D関連の既存テスト: 3 suites / 18 tests passed。
- この作業コピーには `public/scripts/live2dcubismcore.min.js` がないため、ブラウザでのモデル描画・実音声との同時再生は未検証。リリース再開前にCoreを用意して実機確認が必要。
