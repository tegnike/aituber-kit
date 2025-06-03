# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AITuberKit is a web application toolkit for creating interactive AI characters with VTuber capabilities. It supports multiple AI providers, character models (VRM/Live2D), and voice synthesis engines.

## Common Commands

### Development

```bash
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Build for production
npm run start       # Start production server
npm run desktop     # Run as Electron desktop app
```

### Testing & Quality

```bash
npm test           # Run all tests
npm run lint       # Run ESLint
```

### Setup

```bash
npm install        # Install dependencies (requires Node.js 20.0.0+, npm 10.0.0+)
cp .env.example .env  # Configure environment variables
```

## Architecture

### Tech Stack

- **Framework**: Next.js 14.2.5 with React 18.3.1
- **Language**: TypeScript 5.0.2 (strict mode)
- **Styling**: Tailwind CSS 3.4.14
- **State**: Zustand 4.5.4
- **Testing**: Jest with React Testing Library

### Key Directories

- `/src/components/` - React components (VRM viewer, Live2D, chat UI)
- `/src/features/` - Core logic (chat, voice synthesis, messages)
- `/src/pages/api/` - Next.js API routes
- `/src/stores/` - Zustand state management
- `/public/` - Static assets (models, backgrounds)

### AI Integration Points

- **Chat**: `/src/features/chat/` - Factory pattern for multiple providers
- **Voice**: `/src/features/messages/synthesizeVoice*.ts` - 13 TTS engines
- **Models**: VRM (3D) in `/src/features/vrmViewer/`, Live2D (2D) support

### Important Patterns

1. **AI Provider Factory**: `aiChatFactory.ts` manages different LLM providers with dynamic attribute-based model management via `/src/features/constants/aiModels.ts`
2. **Message Queue**: `speakQueue.ts` handles TTS playback sequentially with dynamic model attribute checking for multimodal support
3. **WebSocket**: Real-time features in `/src/utils/WebSocketManager.ts`
4. **i18n**: Multi-language support via `next-i18next`

## Development Guidelines

### From .cursorrules

- Maintain existing UI/UX design without unauthorized changes
- Don't upgrade package versions without explicit approval
- Check for duplicate implementations before adding features
- Follow the established directory structure
- API clients should be centralized in `app/lib/api/client.ts`

### Testing

- Place tests in `__tests__` directories
- Mock canvas for Node.js environment (already configured)
- Run specific tests with Jest pattern matching

### Environment Variables

Required API keys vary by features used (OpenAI, Google, Azure, etc.). Check `.env.example` for all available options.

## License Considerations

- Custom license from v2.0.0+
- Free for non-commercial use
- Commercial license required for business use
- Character model usage requires separate licensing
