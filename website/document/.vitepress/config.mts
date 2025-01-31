import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'AITuberKit',
  description:
    'A web application for chatting with AI characters that anyone can easily set up and deploy.',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.png',
    nav: [
      { text: '使い方', link: '/guide/introduction' },
      { text: 'デモサイト', link: 'https://aituberkit.com/' },
    ],

    sidebar: [
      {
        items: [
          {
            text: '使い方',
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
            text: 'キャラ設定',
            items: [
              { text: '共通設定', link: '/guide/character/common' },
              { text: 'VRM', link: '/guide/character/vrm' },
              { text: 'Live2D', link: '/guide/character/live2d' },
            ],
          },
          {
            text: 'AI設定',
            items: [
              { text: '共通設定', link: '/guide/ai/common' },
              { text: 'マルチモーダル', link: '/guide/ai/multimodal' },
              { text: 'RealtimeAPI', link: '/guide/ai/realtime-api' },
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
            text: 'その他',
            link: '/guide/others',
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
