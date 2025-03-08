import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'AITuberKit',
  description:
    'A web application for chatting with AI characters that anyone can easily set up and deploy.',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo2.png',
    siteTitle: false,
    nav: [
      { text: '使い方', link: '/guide/introduction' },
      { text: 'デモサイト', link: 'https://aituberkit.com/' },
    ],

    sidebar: [
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
              { text: '外部連携モード', link: '/guide/ai/external-linkage' },
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
            text: 'その他の設定',
            link: '/guide/other-settings',
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tegnike/aituber-kit' },
      { icon: 'x', link: 'https://twitter.com/tegnike' },
      { icon: 'discord', link: 'https://discord.com/invite/5rHEue52nZ' },
    ],
  },
})
