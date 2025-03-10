# 语音设置

## 概述

在语音设置中，您可以配置与AI角色语音合成相关的设置。您可以选择各种语音合成引擎，并调整音质和参数。

```bash
# 使用的语音合成引擎
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

::: warning 注意
如果启用了实时API模式或音频模式，则不会使用语音设置。
:::

## 选择语音合成引擎

选择AI角色使用的语音合成引擎。支持以下引擎：

- VOICEVOX：专为日语设计的高质量语音合成引擎
- Koeiromap：具有丰富情感表达的日语语音合成引擎
- Google Text-to-Speech：支持多种语言的Google Cloud Text-to-Speech服务
- Style-Bert-VITS2：可控制风格的高质量语音合成引擎（支持日语、英语、中文）
- AivisSpeech：使Style-Bert-VITS2模型易于使用的日语语音合成引擎
- GSVI TTS：可定制的语音合成引擎
- ElevenLabs：支持多种语言的高质量语音合成服务
- OpenAI TTS：OpenAI提供的支持多种语言的语音合成服务
- Azure TTS：Microsoft Azure提供的多语言语音合成服务
- Nijivoice：提供100多种声音的日语语音合成服务

## VOICEVOX

```bash
# 服务器URL
VOICEVOX_SERVER_URL=http://localhost:50021
# 说话者ID
NEXT_PUBLIC_VOICEVOX_SPEAKER=46
# 速度
NEXT_PUBLIC_VOICEVOX_SPEED=1.0
# 音高
NEXT_PUBLIC_VOICEVOX_PITCH=0.0
# 语调
NEXT_PUBLIC_VOICEVOX_INTONATION=1.0
```

[VOICEVOX](https://voicevox.hiroshiba.jp/)是专为日语设计的高质量语音合成引擎。

### 服务器URL

设置访问VOICEVOX Engine API的URL。本地运行VOICEVOX的标准URL是`http://localhost:50021`。

### 说话者选择

从VOICEVOX中可用的说话者中选择。您可以使用"测试语音"按钮测试所选说话者的声音。

### 语音参数调整

- **速度**：可在0.5至2.0范围内调整（值越大，说话越快）
- **音高**：可在-0.15至0.15范围内调整（值越大，声音越高）
- **语调**：可在0.0至2.0范围内调整（值越大，语调越强）

## Koeiromap

```bash
# API密钥
NEXT_PUBLIC_KOEIROMAP_KEY=
```

[Koeiromap](https://koemotion.rinna.co.jp)是一种具有丰富情感表达的日语语音合成引擎。现已更名为Koemotion。

### API密钥

设置使用Koeiromap API的API密钥。可以从[Koemotion](https://koemotion.rinna.co.jp)获取API密钥。

### 预设和调整

- **预设**：您可以从"可爱"、"有活力"、"酷"和"深沉"等预设中选择
- **X轴**：在-10至10范围内调整音质
- **Y轴**：在-10至10范围内调整音质

## Google Text-to-Speech

```bash
# 认证JSON文件的路径
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
# API密钥
GOOGLE_TTS_KEY=""
# 语言/模型设置
NEXT_PUBLIC_GOOGLE_TTS_TYPE=
```

Google Cloud Text-to-Speech是支持多种语言的语音合成服务。

### 设置

- **语言选择**：设置要使用的语言/语音模型
- **认证**：需要API密钥或认证JSON文件（credentials.json）

有关详细的语音模型，请参阅[Google Cloud官方文档](https://cloud.google.com/text-to-speech/docs/voices)。

## ElevenLabs

```bash
# API密钥
ELEVENLABS_API_KEY=""
# 语音ID
ELEVENLABS_VOICE_ID=""
```

[ElevenLabs](https://elevenlabs.io/api)是支持多种语言的高质量语音合成服务。

### API密钥

设置使用ElevenLabs API的API密钥。

### 语音ID

设置要使用的语音ID（可以从[ElevenLabs API](https://api.elevenlabs.io/v1/voices)查看）

## OpenAI TTS

```bash
# API密钥
OPENAI_TTS_KEY=""
# 语音类型
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 模型
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# 速度
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

OpenAI提供的支持多种语言的语音合成服务。

### API密钥

设置使用OpenAI API的API密钥。

### 语音参数调整

- **语音类型**：从alloy、echo、fable、onyx、nova、shimmer中选择
- **模型**：从tts-1（标准）或tts-1-hd（高质量）中选择
- **速度**：可在0.25至4.0范围内调整

## Azure OpenAPI TTS

```bash
# API密钥
AZURE_TTS_KEY=""
# 端点
AZURE_TTS_ENDPOINT=""
# 语音类型
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 速度
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

Microsoft Azure提供的多语言语音合成服务。

### API密钥

设置Azure TTS API密钥。

### 端点

设置Azure TTS端点URL。

### 语音参数调整

- **语音类型**：选择要使用的语音类型
- **速度**：可在0.25至4.0范围内调整
