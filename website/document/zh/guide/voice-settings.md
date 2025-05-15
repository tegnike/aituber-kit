# 语音合成设置

## 概述

语音合成设置允许您配置与AI角色语音合成相关的设置。您可以选择各种语音合成引擎，并调整声音质量和参数。

```bash
# 使用的语音合成引擎
# voicevox, koeiromap, google, stylebertvits2, aivis_speech,
# gsvitts, elevenlabs, openai, azure, nijivoice
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

::: warning 注意
当启用实时API模式或音频模式时，不使用语音合成设置。
:::

## 选择语音合成引擎

选择您的AI角色将使用的语音合成引擎。支持以下引擎：

- VOICEVOX：专为日语设计的高质量语音合成引擎
- Koeiromap：情感表达丰富的日语语音合成引擎
- Google Text-to-Speech：支持多种语言的Google Cloud Text-to-Speech服务
- Style-Bert-VITS2：可控制风格的高质量语音合成引擎（支持日语、英语和中文）
- AivisSpeech：使Style-Bert-VITS2模型易于使用的日语语音合成引擎
- GSVI TTS：可定制的语音合成引擎
- ElevenLabs：支持多种语言的高质量语音合成服务
- OpenAI TTS：OpenAI提供的支持多种语言的语音合成服务
- Azure TTS：Microsoft Azure提供的多语言语音合成服务
- Nijivoice：提供100多种声音的日语语音合成服务

## 语音测试

语音测试允许您播放所选语音合成引擎的声音。

### 执行语音测试

1. 选择语音合成引擎。
2. 在语音测试中输入您想要播放的文本。
3. 点击"播放"按钮。
4. 语音将会播放。

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

[Koeiromap](https://koemotion.rinna.co.jp)是一种情感表达丰富的日语语音合成引擎。现已更名为Koemotion。

### API密钥

设置使用Koeiromap API的API密钥。API密钥可从[Koemotion](https://koemotion.rinna.co.jp)获取。

### 预设和调整

- **预设**：您可以从"可爱"、"有活力"、"酷"和"深沉"等预设中选择
- **X轴**：在-10至10范围内调整声音质量
- **Y轴**：在-10至10范围内调整声音质量

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

## Style-Bert-VITS2

```bash
# 服务器URL
STYLEBERTVITS2_SERVER_URL=""
# API密钥
STYLEBERTVITS2_API_KEY=""
# 模型ID
NEXT_PUBLIC_STYLEBERTVITS2_MODEL_ID=0
# 风格
NEXT_PUBLIC_STYLEBERTVITS2_STYLE=Neutral
# SDP/DP混合比例
NEXT_PUBLIC_STYLEBERTVITS2_SDP_RATIO=0.2
# 说话速度
NEXT_PUBLIC_STYLEBERTVITS2_LENGTH=1.0
```

[Style-Bert-VITS2](https://github.com/litagin02/Style-Bert-VITS2)是一种可控制风格的高质量语音合成引擎。它支持日语、英语和中文。

### 服务器URL

设置Style-Bert-VITS2服务器的URL。

### API密钥

使用RunPod启动时需要此项。通常不需要设置。

### 语音参数调整

- **模型ID**：指定要使用的模型ID
- **风格**：指定语音风格（例如，Neutral）
- **SDP/DP混合比例**：可在0.0至1.0范围内调整
- **说话速度**：可在0.0至2.0范围内调整

## AivisSpeech

```bash
# 服务器URL
AIVIS_SPEECH_SERVER_URL=http://localhost:10101
# 说话者ID
NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER=888753760
# 速度
NEXT_PUBLIC_AIVIS_SPEECH_SPEED=1.0
# 音高
NEXT_PUBLIC_AIVIS_SPEECH_PITCH=0.0
# 语调
NEXT_PUBLIC_AIVIS_SPEECH_INTONATION=1.0
```

[AivisSpeech](https://aivis-project.com/)是一种日语语音合成引擎。

### 服务器URL

设置AivisSpeech服务器的URL。本地运行AivisSpeech的标准URL是`http://localhost:10101`。

### 说话者选择

从AivisSpeech中可用的说话者中选择。您可以使用"更新说话者列表"按钮更新说话者列表。

### 语音参数调整

- **速度**：可在0.5至2.0范围内调整（值越大，说话越快）
- **说话者选择**：从可用的说话者中选择
- **速度**：可在0.5至2.0范围内调整
- **音高**：可在-0.15至0.15范围内调整
- **语调**：可在0.0至2.0范围内调整

## GSVI TTS

```bash
# 服务器URL
NEXT_PUBLIC_GSVI_TTS_URL=http://127.0.0.1:5000/tts
# 模型ID
NEXT_PUBLIC_GSVI_TTS_MODEL_ID=0
# 批处理大小
NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE=2
# 说话速率
NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE=1.0
```

GSVI TTS是一种可定制的语音合成引擎。

### 服务器URL

设置GSVI TTS服务器的URL。本地运行GSVI TTS的标准URL是`http://127.0.0.1:5000/tts`。

### 语音参数调整

- **模型ID**：指定要使用的模型ID
- **批处理大小**：影响推理速度（1-100，越大越快但内存使用量也越大）
- **说话速率**：可在0.5至2.0范围内调整

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

设置要使用的语音ID（可从[ElevenLabs API](https://api.elevenlabs.io/v1/voices)查看）

## OpenAI TTS

```bash
# API密钥
OPENAI_TTS_KEY=""
# 语音类型
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 模型
NEXT_PUBLIC_OPENAI_TTS_MODEL=tts-1
# 说话速度
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

OpenAI提供的多语言语音合成服务。

### API密钥

设置使用OpenAI API的API密钥。

### 语音参数调整

- **语音类型**：从alloy、echo、fable、onyx、nova、shimmer中选择
- **模型**：从tts-1（标准）、tts-1-hd（高质量）或gpt-4o-mini-tts中选择
- **说话速度**：可在0.25至4.0范围内调整

## Azure OpenAPI TTS

```bash
# API密钥
AZURE_TTS_KEY=""
# 端点
AZURE_TTS_ENDPOINT=""
# 语音类型
NEXT_PUBLIC_OPENAI_TTS_VOICE=shimmer
# 说话速度
NEXT_PUBLIC_OPENAI_TTS_SPEED=1.0
```

Microsoft Azure提供的多语言语音合成服务。

### API密钥

设置Azure TTS API密钥。

### 端点

设置Azure TTS端点URL。

### 语音参数调整

- **语音类型**：选择要使用的语音类型
- **说话速度**：可在0.25至4.0范围内调整

## Nijivoice

```bash
# API密钥
NIJIVOICE_API_KEY=""
# 说话者ID
NEXT_PUBLIC_NIJIVOICE_ACTOR_ID=""
# 说话速度
NEXT_PUBLIC_NIJIVOICE_SPEED=1.0
# 情感水平
NEXT_PUBLIC_NIJIVOICE_EMOTIONAL_LEVEL=0.0
# 语音持续时间
NEXT_PUBLIC_NIJIVOICE_SOUND_DURATION=1.0
```

[Nijivoice](https://app.nijivoice.com/)是一种日语语音合成服务。

### API密钥

设置Nijivoice API密钥。

### 语音参数调整

- **说话者ID**：选择要使用的说话者
- **说话速度**：可在0.4至3.0范围内调整。默认情况下，会自动设置每个角色推荐的说话速度
- **情感水平**：可在0至1.5范围内调整
- **语音持续时间**：可在0至1.7范围内调整
