# face-api.js を @vladmandic/face-api に移行する

**ステータス: 完了**

## 概要

人感検知機能で使用している `face-api.js`（v0.22.2）は2020年4月を最後にメンテナンスが停止しており、TensorFlow.js 2.0以降との互換性問題が報告されている。フォーク `@vladmandic/face-api` v1.7.14 へ移行した。

> **注意**: `@vladmandic/face-api` のGitHubリポジトリは2025-02-05にアーカイブ済み。
> バージョンをピン固定（1.7.14）して使用している。将来的にはより積極的にメンテナンスされている
> ライブラリへの移行を検討すること（後述の「将来的な代替候補」を参照）。

## 背景

- **最終リリース**: 2020年3月（v0.22.2）
- **最終コミット**: 2020年4月
- **オープンイシュー**: 約452件
- **オープンPR**: 約23件
- **問題**: TensorFlow.js 2.0以降との互換性がない
- **指摘元**: PR #497 CodeRabbitレビュー（package.json:52）

## 影響範囲

### 変更したファイル

| ファイル                                                          | 変更内容                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `package.json`                                                    | `"face-api.js": "^0.22.2"` → `"@vladmandic/face-api": "1.7.14"` （ピン固定） |
| `src/hooks/usePresenceDetection.ts`                               | import先を `@vladmandic/face-api` に変更                                     |
| `src/__tests__/hooks/usePresenceDetection.test.ts`                | mock/requireMock対象を `@vladmandic/face-api` に変更                         |
| `src/__tests__/integration/presenceDetectionIntegration.test.tsx` | 同上                                                                         |
| `CLAUDE.md`                                                       | ドキュメント内の参照を更新                                                   |

### 使用しているAPI

現在のコードが利用しているAPIは以下の3つのみ（移行後も完全互換）:

1. `faceapi.nets.tinyFaceDetector.loadFromUri('/models')` — モデルロード
2. `faceapi.detectSingleFace(videoElement, options)` — 顔検出
3. `new faceapi.TinyFaceDetectorOptions()` — 検出オプション

### モデルファイル

`public/models/` に格納されているTinyFaceDetectorモデルファイル（変更なし）:

- `tiny_face_detector_model-shard1`（193KB）
- `tiny_face_detector_model-weights_manifest.json`（4.9KB）

## リスク評価

| リスク                                 | 重要度 | 状況                                                             |
| -------------------------------------- | ------ | ---------------------------------------------------------------- |
| リポジトリが2025-02-05にアーカイブ済み | Medium | バージョンピン固定で対応。将来的には代替ライブラリへの移行を検討 |
| TFJS同梱によるバンドルサイズ増加       | Medium | デフォルトのESM版がTFJS 4.xを内包。ビルドサイズ確認が必要        |
| ES2018ターゲット（古いブラウザ非対応） | Low    | 本プロジェクトはモダンブラウザ前提のため問題なし                 |
| mtcnn/tinyYolov2モデルが削除済み       | Low    | tinyFaceDetectorのみ使用しているため影響なし                     |

## 将来的な代替候補

より保守性の高いライブラリへの移行が必要になった場合の候補:

| ライブラリ                | メンテナンス状況               | 特徴                                                                                |
| ------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `@mediapipe/tasks-vision` | Googleが積極的にメンテナンス   | WASMベース、軽量、クリーンなAPI。FaceDetectorクラスで顔検出可能                     |
| `@vladmandic/human`       | 積極的にメンテナンス（v3.3.x） | face-apiの後継。多機能（顔+体+手+ジェスチャー）だが単純な顔検出にはオーバースペック |
