# Advanced Settings

## Reset Settings

You can reset AITuberKit settings and return to the initial state.

:::warning Note
When you perform a reset operation, all settings except conversation history will be restored to their default values, and the page will be reloaded. If environment variables are set, those values will be applied with priority.
:::

## Background Video Settings

You can use a shared screen or webcam video as the background.

**Environment Variables**:

```bash
# Use video as background setting (true/false)
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false
```

## English Word Pronunciation Settings

When using in a Japanese environment, you can set whether to pronounce English words in Japanese.

:::tip
This setting is only displayed in a Japanese environment.
:::

**Environment Variables**:

```bash
# Read English words in Japanese setting (true/false)
NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE=false
```

## Timestamp Settings

You can set whether to include a timestamp (UTC) in user statements. Including a timestamp allows the AI to generate responses considering the time.

:::tip
To utilize this feature, include the following text in your system prompt:

"User input may be requested with a [timestamp]. This represents the time in UTC timezone at the time of the request, so please generate a response considering that time."
:::

**Environment Variables**:

```bash
# Include timestamp in user message setting (true/false)
NEXT_PUBLIC_INCLUDE_TIMESTAMP_IN_USER_MESSAGE=false
```

## No Speech Timeout

You can set the time to automatically end input when silence continues during voice input. Setting to 0 seconds disables automatic submission by silence detection.

**Environment Variables**:

```bash
# No speech timeout (seconds)
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2.0
```
