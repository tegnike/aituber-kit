# 高级设置

## 重置设置

您可以重置AITuberKit设置并返回到初始状态。

:::warning 注意
执行重置操作时，除对话历史外的所有设置都将恢复为默认值，并且页面将重新加载。如果设置了环境变量，这些值将优先应用。
:::

## 背景视频设置

您可以使用共享屏幕或网络摄像头视频作为背景。

**环境变量**:

```bash
# 使用视频作为背景设置（true/false）
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false
```

## 英语单词发音设置

在日语环境中使用时，您可以设置是否用日语发音英语单词。

:::tip
此设置仅在日语环境中显示。
:::

**环境变量**:

```bash
# 用日语读取英语单词设置（true/false）
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false
```

## 时间戳设置

您可以设置是否在用户语句中包含时间戳（UTC）。包含时间戳允许AI考虑时间生成响应。

:::tip
要利用此功能，请在系统提示中包含以下文本：

"用户输入可能带有[timestamp]请求。这表示请求时的UTC时区时间，因此请考虑该时间生成响应。"
:::

**环境变量**:

```bash
# 在用户消息中包含时间戳设置（true/false）
NEXT_PUBLIC_INCLUDE_TIMESTAMP_IN_USER_MESSAGE=false
```

## 无语音超时

您可以设置在语音输入过程中持续静音时自动结束输入的时间。设置为0秒将禁用静音检测自动提交。

**环境变量**:

```bash
# 无语音超时（秒）
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2.0
```
