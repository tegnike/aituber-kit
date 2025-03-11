import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'AITuberKit',
  description:
    'A web application for chatting with AI characters that anyone can easily set up and deploy.',

  head: [
    [
      'script',
      {
        defer: 'true',
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': '{"token": "856b36a915ed49478bd12c3fb8a5fbe4"}',
      },
    ],
  ],

  // デッドリンクチェックを無効化
  ignoreDeadLinks: ['http://localhost:3000'],

  // Multi-language support
  locales: {
    root: {
      label: '日本語',
      lang: 'ja',
      title: 'AITuberKit',
      description:
        'AIキャラクターとの対話・AITuber配信を簡単に実現するWebアプリケーション',
      themeConfig: {
        nav: [
          { text: '使い方', link: '/guide/introduction' },
          { text: 'デモサイト', link: 'https://aituberkit.com/' },
        ],
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      title: 'AITuberKit',
      description:
        'A web application for chatting with AI characters that anyone can easily set up and deploy.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/introduction' },
          { text: 'Demo Site', link: 'https://aituberkit.com/' },
          {
            text: '🌐 Language',
            items: [
              { text: '日本語', link: '/' },
              { text: 'English', link: '/en/' },
              { text: '中文', link: '/zh/' },
            ],
          },
        ],
      },
    },
    zh: {
      label: '中文',
      lang: 'zh',
      title: 'AITuberKit',
      description: '一个可以轻松设置和部署的AI角色聊天Web应用程序',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/introduction' },
          { text: '演示站点', link: 'https://aituberkit.com/' },
          {
            text: '🌐 Language',
            items: [
              { text: '日本語', link: '/' },
              { text: 'English', link: '/en/' },
              { text: '中文', link: '/zh/' },
            ],
          },
        ],
      },
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo2.png',
    siteTitle: false,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tegnike/aituber-kit' },
      { icon: 'x', link: 'https://twitter.com/tegnike' },
      { icon: 'discord', link: 'https://discord.com/invite/5rHEue52nZ' },
    ],

    // 言語ごとのサイドバー設定
    sidebar: {
      '/': [
        {
          items: [
            {
              text: '使い方',
              link: '/guide/introduction',
              items: [
                { text: 'はじめに', link: '/guide/introduction' },
                { text: 'クイックスタート', link: '/guide/quickstart' },
              ],
            },
            {
              text: '基本設定',
              link: '/guide/basic-settings',
            },
            {
              text: 'キャラクター設定',
              link: '/guide/character/common',
              items: [
                { text: '共通設定', link: '/guide/character/common' },
                { text: 'VRM', link: '/guide/character/vrm' },
                { text: 'Live2D', link: '/guide/character/live2d' },
              ],
            },
            {
              text: 'AI設定',
              link: '/guide/ai/common',
              items: [
                { text: '共通設定', link: '/guide/ai/common' },
                { text: 'AIサービス設定', link: '/guide/ai/model-provider' },
                { text: 'マルチモーダル', link: '/guide/ai/multimodal' },
                { text: 'リアルタイムAPI', link: '/guide/ai/realtime-api' },
                { text: 'オーディオモード', link: '/guide/ai/audio-mode' },
                {
                  text: '外部連携モード',
                  link: '/guide/ai/external-linkage',
                },
              ],
            },
            {
              text: '音声設定',
              link: '/guide/voice-settings',
            },
            {
              text: 'Youtube設定',
              link: '/guide/youtube-settings',
            },
            {
              text: 'スライド設定',
              link: '/guide/slide-settings',
            },
            {
              text: '会話履歴',
              link: '/guide/conversation-history',
            },
            {
              text: 'その他',
              link: '/guide/other/advanced-settings',
              items: [
                {
                  text: '高度な設定',
                  link: '/guide/other/advanced-settings',
                },
                {
                  text: 'API設定',
                  link: '/guide/other/message-receiver',
                },
              ],
            },
            {
              text: '環境変数一覧',
              link: '/guide/environment-variables',
            },
            {
              text: '活用TIPS',
              link: '/guide/usage-tips',
            },
            {
              text: '貢献',
              link: '/guide/contributing',
            },
            {
              text: 'ライセンス',
              link: '/guide/license',
            },
            { text: 'デモサイト', link: 'https://aituberkit.com/' },
          ],
        },
      ],
      '/en/': [
        {
          items: [
            {
              text: 'Guide',
              link: '/en/guide/introduction',
              items: [
                { text: 'Introduction', link: '/en/guide/introduction' },
                { text: 'Quick Start', link: '/en/guide/quickstart' },
              ],
            },
            {
              text: 'Basic Settings',
              link: '/en/guide/basic-settings',
            },
            {
              text: 'Character Settings',
              link: '/en/guide/character/common',
              items: [
                {
                  text: 'Common Settings',
                  link: '/en/guide/character/common',
                },
                { text: 'VRM', link: '/en/guide/character/vrm' },
                { text: 'Live2D', link: '/en/guide/character/live2d' },
              ],
            },
            {
              text: 'AI Settings',
              link: '/en/guide/ai/common',
              items: [
                { text: 'Common Settings', link: '/en/guide/ai/common' },
                {
                  text: 'AI Service Settings',
                  link: '/en/guide/ai/model-provider',
                },
                { text: 'Multimodal', link: '/en/guide/ai/multimodal' },
                { text: 'Realtime API', link: '/en/guide/ai/realtime-api' },
                { text: 'Audio Mode', link: '/en/guide/ai/audio-mode' },
                {
                  text: 'External Linkage Mode',
                  link: '/en/guide/ai/external-linkage',
                },
              ],
            },
            {
              text: 'Voice Settings',
              link: '/en/guide/voice-settings',
            },
            {
              text: 'Youtube Settings',
              link: '/en/guide/youtube-settings',
            },
            {
              text: 'Slide Settings',
              link: '/en/guide/slide-settings',
            },
            {
              text: 'Conversation History',
              link: '/en/guide/conversation-history',
            },
            {
              text: 'Others',
              link: '/en/guide/other/advanced-settings',
              items: [
                {
                  text: 'Advanced Settings',
                  link: '/en/guide/other/advanced-settings',
                },
                {
                  text: 'API Settings',
                  link: '/en/guide/other/message-receiver',
                },
              ],
            },
            {
              text: 'Environment Variables',
              link: '/en/guide/environment-variables',
            },
            {
              text: 'Usage Tips',
              link: '/en/guide/usage-tips',
            },
            {
              text: 'Contributing',
              link: '/en/guide/contributing',
            },
            {
              text: 'License',
              link: '/en/guide/license',
            },
            { text: 'Demo Site', link: 'https://aituberkit.com/' },
          ],
        },
      ],
      '/zh/': [
        {
          items: [
            {
              text: '指南',
              link: '/zh/guide/introduction',
              items: [
                { text: '介绍', link: '/zh/guide/introduction' },
                { text: '快速开始', link: '/zh/guide/quickstart' },
              ],
            },
            {
              text: '基本设置',
              link: '/zh/guide/basic-settings',
            },
            {
              text: '角色设置',
              link: '/zh/guide/character/common',
              items: [
                { text: '通用设置', link: '/zh/guide/character/common' },
                { text: 'VRM', link: '/zh/guide/character/vrm' },
                { text: 'Live2D', link: '/zh/guide/character/live2d' },
              ],
            },
            {
              text: 'AI设置',
              link: '/zh/guide/ai/common',
              items: [
                { text: '通用设置', link: '/zh/guide/ai/common' },
                { text: 'AI服务设置', link: '/zh/guide/ai/model-provider' },
                { text: '多模态', link: '/zh/guide/ai/multimodal' },
                { text: '实时API', link: '/zh/guide/ai/realtime-api' },
                { text: '音频模式', link: '/zh/guide/ai/audio-mode' },
                {
                  text: '外部连接模式',
                  link: '/zh/guide/ai/external-linkage',
                },
              ],
            },
            {
              text: '语音设置',
              link: '/zh/guide/voice-settings',
            },
            {
              text: 'Youtube设置',
              link: '/zh/guide/youtube-settings',
            },
            {
              text: '幻灯片设置',
              link: '/zh/guide/slide-settings',
            },
            {
              text: '对话历史',
              link: '/zh/guide/conversation-history',
            },
            {
              text: '其他',
              link: '/zh/guide/other/advanced-settings',
              items: [
                {
                  text: '高级设置',
                  link: '/zh/guide/other/advanced-settings',
                },
                {
                  text: 'API设置',
                  link: '/zh/guide/other/message-receiver',
                },
              ],
            },
            {
              text: '环境变量',
              link: '/zh/guide/environment-variables',
            },
            {
              text: '使用技巧',
              link: '/zh/guide/usage-tips',
            },
            {
              text: '贡献',
              link: '/zh/guide/contributing',
            },
            {
              text: '许可证',
              link: '/zh/guide/license',
            },
            { text: '演示站点', link: 'https://aituberkit.com/' },
          ],
        },
      ],
    },
  },
})
