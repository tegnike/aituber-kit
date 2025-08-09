# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

#### Aivis Cloud API重複音声再生問題の修正 (2025-08-08)

**問題**: Aivis Cloud APIのストリーミング機能を有効にした際、同じ音声が2回再生される問題が発生していました。

**原因**:

- ストリーミング実装(`synthesizeVoiceAivisCloudApiStreaming`)が音声を直接再生
- 同時にArrayBufferも返すため、従来のキューシステムでも同じ音声を再生
- この結果、音声の重複再生が発生

**修正内容**:

- `synthesizeVoiceAivisCloudApiStreaming`の戻り値を`Promise<ArrayBuffer>`から`Promise<void>`に変更
- ストリーミング有効時は`speakCharacter.ts`でnullを返してキューシステムをバイパス
- ストリーミング実装内でのみ音声を再生し、重複を排除

**影響ファイル**:

- `src/features/messages/synthesizeVoiceAivisCloudApi.ts`
- `src/features/messages/speakCharacter.ts`

**結果**: Aivis Cloud APIのストリーミング機能使用時に正常な単一音声再生が実現されました。

---

_Note: このCHANGELOG.mdは2025年8月8日に新規作成されました。今後のバージョンアップデートや修正はこちらに記録されます。_
