# AITuber Kit

AIキャラクターとの会話を楽しめるWebアプリケーション。VRM/Live2Dアバター、複数のAIサービス（OpenAI、Anthropic、Google等）、音声認識・合成に対応。

## Technology Stack

- **Framework**: Next.js 14 / React 18 / TypeScript 5
- **State**: Zustand
- **Styling**: Tailwind CSS / SASS
- **3D/2D**: Three.js / PixiJS / @pixiv/three-vrm / pixi-live2d-display
- **AI SDK**: Vercel AI SDK (ai) + 各社SDK
- **Testing**: Jest / React Testing Library
- **Electron**: デスクトップアプリ対応

## Project Structure

```
src/
├── components/     # UIコンポーネント
├── features/       # 機能別モジュール
│   ├── chat/       # チャット機能
│   ├── memory/     # メモリ機能（RAG）
│   ├── messages/   # メッセージ処理
│   ├── stores/     # Zustandストア
│   └── ...
├── hooks/          # カスタムフック
├── pages/          # Next.jsページ / APIルート
├── lib/            # ユーティリティライブラリ
└── utils/          # ヘルパー関数
```

## Commands

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run lint:fix     # ESLint自動修正
npm run format       # Prettier実行
npm test             # テスト実行
npm run test:watch   # テストウォッチモード
npm run desktop      # Electronアプリ起動
```

---

# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

## Development Guidelines

- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow

- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)

## Custom Subagents

### playwright-reporter

Playwrightを使用したブラウザ自動化・テスト実行時は、必ず`playwright-reporter`サブエージェントを使用すること。

**使用方法**: Task toolで `subagent_type: "playwright-reporter"` を指定

**機能**:

- ブラウザ自動化とテスト実行
- 詳細な実行レポートを`reports/playwright/`に自動生成
- スクリーンショットの保存と管理

**注意**: `reports/`フォルダはgitignore対象のため、レポートはローカルのみに保存されます。

---

## Coding Conventions

### TypeScript / React

- 関数コンポーネント + hooksを使用
- 型定義は明示的に（`any`は避ける）
- Zustandでグローバル状態管理（`src/features/stores/`）

### ファイル命名

- コンポーネント: `camelCase.tsx` (例: `messageInput.tsx`)
- フック: `use*.ts` (例: `useVoiceRecognition.ts`)
- ストア: `*.ts` (例: `settings.ts`, `home.ts`)

### テスト

- テストファイル: `src/__tests__/` 配下に配置
- 命名: `*.test.ts` または `*.test.tsx`
- モック: `src/__mocks__/` 配下

### 重要なファイル

- `src/features/stores/settings.ts` - アプリ設定のストア
- `src/features/stores/home.ts` - ホーム画面の状態
- `src/pages/api/` - APIエンドポイント
- `locales/` - i18n翻訳ファイル（ja/en）
