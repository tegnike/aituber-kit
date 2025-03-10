---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'AITuberKit'
  text: '轻松实现AI角色互动和AITuber直播'
  tagline: '开源AI角色应用构建工具包'
  image:
    src: /logo.png
    alt: AITuberKit
  actions:
    - theme: brand
      text: 介绍
      link: /zh/guide/introduction
    - theme: brand
      text: 快速开始
      link: /zh/guide/quickstart
    - theme: alt
      text: 演示站点
      link: https://aituberkit.com/
    - theme: alt
      text: GitHub
      link: https://github.com/tegnike/aituber-kit

features:
  - icon: 🤖
    title: AI角色互动
    details: 使用各种LLM API密钥轻松与AI角色聊天。支持多模态，能够识别图像。
  - icon: 📺
    title: AITuber直播
    details: 自动获取YouTube直播评论并由AI角色回应。对话持续模式使角色即使在没有评论时也能主动发言。
  - icon: 🎤
    title: 多样化语音合成
    details: 支持VOICEVOX、Koeiromap、Google Text-to-Speech、ElevenLabs等多种语音合成引擎。
  - icon: 🎭
    title: VRM/Live2D支持
    details: 同时兼容3D VRM文件和2D Live2D文件。可使用您喜欢的角色。
  - icon: 🔄
    title: 外部连接模式
    details: 通过WebSocket与服务器应用程序连接，实现更高级的功能。
  - icon: 📊
    title: 幻灯片模式
    details: 配备AI角色自动展示幻灯片的模式。可以委托进行演示。
---

<div class="custom-block warning">
  <p><strong>重要安全提示</strong>: 本仓库适用于个人使用、本地开发，以及采取适当安全措施的商业用途。在部署到Web环境时，需要妥善管理API密钥。</p>
</div>

<div class="custom-block info">
  <p><strong>公告</strong>: 本项目从v2.0.0版本开始采用自定义许可证。如果您出于商业目的使用，请查看<a href="/zh/guide/license">使用条款</a>部分。</p>
</div>

## 加入社区

<div class="vp-doc" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;">
  <a href="https://discord.gg/5rHEue52nZ" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/Discord-AITuberKit-7289DA?logo=discord&style=flat&logoColor=white" alt="Discord" />
  </a>
  <a href="https://x.com/tegnike" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/X-tegnike-1DA1F2?logo=x&style=flat&logoColor=white" alt="X (Twitter)" />
  </a>
  <a href="https://github.com/sponsors/tegnike" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=flat&logo=github" alt="GitHub Sponsor" />
  </a>
</div>
