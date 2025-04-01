# 快速开始

## 准备工作

使用AITuberKit需要以下软件：

- Node.js: ^20.0.0
- npm: ^10.0.0

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/tegnike/aituber-kit.git
cd aituber-kit
```

### 2. 安装依赖包

```bash
npm install
```

### 3. 设置环境变量（可选）

如有需要，将`.env.example`文件复制为`.env`并设置环境变量。

```bash
cp .env.example .env
```

::: info
环境变量中设置的值优先级低于在设置界面输入的值。
:::

## 启动开发服务器

```bash
npm run dev
```

在浏览器中打开[http://localhost:3000](http://localhost:3000)即可开始使用AITuberKit。

## 基本使用方法

### 与AI角色互动

1. 在设置界面输入所选LLM的API密钥
2. 根据需要编辑角色的设定提示
3. 根据需要上传角色的VRM文件或Live2D文件，以及背景文件
4. 选择语音合成引擎，并根据需要进行声音设置
5. 通过输入表单开始与角色对话。也可以使用麦克风输入

### AITuber直播

1. 在设置界面打开Youtube模式
2. 输入Youtube API密钥和Youtube Live ID
3. 其他设置与"与AI角色互动"类似
4. 开始Youtube直播，确认角色能够响应评论
5. 打开对话持续模式，使AI在没有评论时也能主动发言

## 下一步

- 在[基本设置](/zh/guide/basic-settings)中进行详细设置
- 在[角色设置](/zh/guide/character/common)中自定义AI角色
- 在[AI设置](/zh/guide/ai/common)中调整AI行为
- 在[语音设置](/zh/guide/voice-settings)中配置语音合成
- 在[音声入力设置](/zh/guide/speech-input-settings)中配置音声输入
- 在[Youtube设置](/zh/guide/youtube-settings)中设置AITuber直播
- 在[幻灯片设置](/zh/guide/slide-settings)中配置幻灯片模式
