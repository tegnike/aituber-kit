export const tabsWithRedundantPanelTitle = new Set([
  'character',
  'ai',
  'memory',
  'voice',
  'speechInput',
  'youtube',
  'gameCommentary',
  'slide',
  'images',
  'presence',
  'idle',
  'kiosk',
  'based',
  'other',
])

// タブの定義
export type TabKey =
  | 'quickStart'
  | 'description'
  | 'based'
  | 'character'
  | 'ai'
  | 'voice'
  | 'youtube'
  | 'slide'
  | 'images'
  | 'memory'
  | 'presence'
  | 'idle'
  | 'gameCommentary'
  | 'kiosk'
  | 'other'
  | 'speechInput'

// アイコンのパスマッピング
export const tabIconMapping: Record<TabKey, string> = {
  quickStart: '/images/setting-icons/basic-settings.svg',
  description: '/images/setting-icons/description.svg',
  based: '/images/setting-icons/basic-settings.svg',
  character: '/images/setting-icons/character-settings.svg',
  ai: '/images/setting-icons/ai-settings.svg',
  voice: '/images/setting-icons/voice-settings.svg',
  youtube: '/images/setting-icons/youtube-settings.svg',
  slide: '/images/setting-icons/slide-settings.svg',
  images: '/images/setting-icons/image-settings.svg',
  memory: '/images/setting-icons/memory-settings.svg',
  presence: '/images/setting-icons/presence-settings.svg',
  idle: '/images/setting-icons/idle-settings.svg',
  gameCommentary: '/images/setting-icons/gamecommentary-settings.svg',
  kiosk: '/images/setting-icons/kiosk-settings.svg',
  other: '/images/setting-icons/other-settings.svg',
  speechInput: '/images/setting-icons/microphone-settings.svg',
}

export type TabConfig = {
  key: TabKey
  label: string
  keywords?: string[]
}

export type TabGroup = {
  key: string
  label: string
  tabs: TabConfig[]
}

export const getTabGroups = (t: (key: string) => string): TabGroup[] => [
  {
    key: 'start',
    label: t('SettingsGroupStart'),
    tabs: [
      {
        key: 'quickStart',
        label: t('SettingsEasySetup'),
        keywords: [
          'start',
          'easy',
          'beginner',
          'setup',
          'quick',
          'first',
          'character',
          'ai',
          'voice',
          'message',
          '初心者',
          'かんたん',
          '簡単',
          '最初',
          'はじめ',
          'セットアップ',
          'キャラクター',
          '音声',
          'メッセージ',
        ],
      },
      {
        key: 'character',
        label: t('CharacterSettings'),
        keywords: [
          'character',
          'prompt',
          'vrm',
          'live2d',
          'pngtuber',
          'キャラクター',
          'プロンプト',
          'モデル',
          '見た目',
          '名前',
        ],
      },
    ],
  },
  {
    key: 'conversation',
    label: t('SettingsGroupConversation'),
    tabs: [
      {
        key: 'ai',
        label: t('AISettings'),
        keywords: [
          t('SelectModel'),
          t('MaxTokens'),
          t('MaxPastMessages'),
          t('ConversationHistory'),
          'ai',
          'llm',
          'model',
          'token',
          'message',
          'messages',
          'history',
          'chat',
          'モデル',
          'トークン',
          'メッセージ',
          '履歴',
        ],
      },
      {
        key: 'memory',
        label: t('MemorySettings'),
        keywords: [
          t('MaxPastMessages'),
          t('ConversationHistory'),
          'memory',
          'embedding',
          'message',
          'messages',
          'history',
          'chat',
          '記憶',
          'メッセージ',
          '履歴',
          '会話',
        ],
      },
    ],
  },
  {
    key: 'voiceInput',
    label: t('SettingsGroupVoiceInput'),
    tabs: [
      {
        key: 'voice',
        label: t('VoiceSettings'),
        keywords: ['voice', 'tts', 'speaker', '音声', '話者', '読み上げ', '声'],
      },
      {
        key: 'speechInput',
        label: t('SpeechInputSettings'),
        keywords: [
          'speech',
          'input',
          'stt',
          'microphone',
          'shortcut',
          '音声',
          '入力',
          'マイク',
          '聞く',
          'ショートカット',
        ],
      },
    ],
  },
  {
    key: 'streaming',
    label: t('SettingsGroupStreamingView'),
    tabs: [
      {
        key: 'based',
        label: t('SettingsDisplaySettings'),
        keywords: [
          'display',
          'basic',
          'language',
          'theme',
          'background',
          'assistant text',
          'control panel',
          'shortcut',
          '表示',
          '基本',
          '言語',
          'テーマ',
          '背景',
          'アシスタントテキスト',
          'コントロールパネル',
          'ショートカット',
        ],
      },
      {
        key: 'youtube',
        label: t('YoutubeSettings'),
        keywords: ['youtube', 'comment', 'stream', '配信', 'コメント'],
      },
      {
        key: 'gameCommentary',
        label: t('GameCommentarySettings'),
        keywords: ['game', 'commentary', '実況', 'ゲーム', 'コメント'],
      },
      {
        key: 'slide',
        label: t('SlideSettings'),
        keywords: ['slide', 'presentation', 'スライド', 'プレゼン'],
      },
      {
        key: 'images',
        label: t('ImageSettings'),
        keywords: ['image', 'layer', '画像', 'レイヤー'],
      },
    ],
  },
  {
    key: 'automation',
    label: t('SettingsGroupAutomation'),
    tabs: [
      {
        key: 'presence',
        label: t('PresenceSettings'),
        keywords: ['presence', 'camera', 'face', '人感', 'カメラ', '顔検出'],
      },
      {
        key: 'idle',
        label: t('IdleSettings'),
        keywords: [
          t('IdlePhraseText'),
          'idle',
          'message',
          'phrase',
          'メッセージ',
          'フレーズ',
        ],
      },
      {
        key: 'kiosk',
        label: t('KioskSettings'),
        keywords: ['kiosk', 'demo', 'passcode', 'デモ', '端末', 'パスコード'],
      },
    ],
  },
  {
    key: 'system',
    label: t('OtherSettings'),
    tabs: [
      {
        key: 'other',
        label: t('SettingsAdvancedSettings'),
        keywords: ['system', 'debug', 'other', 'その他', 'システム', '詳細'],
      },
      {
        key: 'description',
        label: t('Description'),
        keywords: ['about', 'app', 'license', 'github', 'アプリ', '説明'],
      },
    ],
  },
]
