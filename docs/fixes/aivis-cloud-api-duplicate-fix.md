# Aivis Cloud API重複音声再生問題の修正

## 概要

AITuberKitでAivis Cloud APIのストリーミング機能を使用した際に、同じ音声が2回再生される問題を修正しました。

- **修正日**: 2025年8月8日
- **影響範囲**: Aivis Cloud APIのストリーミング機能使用時
- **修正タイプ**: バグ修正

## 問題の詳細

### 症状

Aivis Cloud APIで「リアルタイムストリーミング」機能を有効にした際、AIキャラクターが同じ発言を2回繰り返す現象が発生していました。

### 原因分析

問題の根本原因は、音声合成の処理フローにおける重複処理でした：

1. **ストリーミング実装**(`synthesizeVoiceAivisCloudApiStreaming`)

   - MediaSource APIを使用して音声をリアルタイム再生
   - 同時にArrayBufferも戻り値として返却

2. **従来のキューシステム**

   - 音声合成関数から返されたArrayBufferを受け取り
   - キューシステム経由で音声を再度再生

3. **結果**
   - ストリーミング実装での再生 + キューシステムでの再生 = 重複再生

## 修正内容

### 変更されたファイル

#### 1. `src/features/messages/synthesizeVoiceAivisCloudApi.ts`

**変更前:**

```typescript
export async function synthesizeVoiceAivisCloudApiStreaming(): Promise<ArrayBuffer> {
// ... parameters
  // ... streaming implementation
  resolve(result.buffer) // ArrayBufferを返却
}
```

**変更後:**

```typescript
export async function synthesizeVoiceAivisCloudApiStreaming(): Promise<void> {
// ... parameters
  // ... streaming implementation
  resolve() // voidを返却（音声は実装内で再生済み）
}
```

#### 2. `src/features/messages/speakCharacter.ts`

**変更前:**

```typescript
case 'aivis_cloud_api':
  if (ss.aivisCloudStreamingEnabled) {
    return await synthesizeVoiceAivisCloudApiStreaming(/* ... */)
    // ArrayBufferが返される → キューシステムで再度再生される
  }
```

**変更後:**

```typescript
case 'aivis_cloud_api':
  if (ss.aivisCloudStreamingEnabled) {
    await synthesizeVoiceAivisCloudApiStreaming(/* ... */)
    return null // キューシステムをバイパス
  }
```

## 技術的詳細

### MediaSource API実装の保持

今回の修正では、既存のMediaSource APIを使用したストリーミング機能は完全に保持されています：

- リアルタイム音声生成と再生
- プログレス表示機能
- チャンク単位での音声配信
- Live2D/VRMモデルとの同期

### キューシステムとの関係

修正により、ストリーミング有効時とレガシーモード時の処理が明確に分離されました：

- **ストリーミング有効時**: MediaSource APIで直接再生、キューシステムはバイパス
- **ストリーミング無効時**: 従来通りキューシステム経由で再生

## テスト方法

修正が正しく適用されているかは以下の手順でテストできます：

1. AITuberKitを起動
2. 音声設定で「Aivis Cloud API」を選択
3. 「リアルタイムストリーミング」のチェックボックスを有効化
4. AIキャラクターと対話し、音声が1回のみ再生されることを確認

## 今後の開発への影響

この修正により、新しい音声合成エンジンを追加する際の指針が明確になりました：

- **ストリーミング対応エンジン**: `Promise<void>`を返し、内部で音声再生を完結させる
- **従来型エンジン**: `Promise<ArrayBuffer>`を返し、キューシステムに処理を委譲する

## 関連する設定

この修正に関連する設定項目：

- **音声合成エンジン**: Aivis Cloud API
- **ストリーミング設定**: 音声設定画面の「リアルタイムストリーミング」チェックボックス
- **API設定**: Aivis Cloud APIのAPIキー、モデル、スタイル設定

---

この修正により、Aivis Cloud APIの優れたストリーミング機能を快適にご利用いただけるようになりました。
