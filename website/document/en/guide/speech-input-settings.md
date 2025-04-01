# Voice Input Settings

## Overview

Voice input settings allow you to configure how voice recognition works with a microphone. You can choose between two methods: using the browser's voice recognition API (WebSpeech API) or using OpenAI's Text-to-Speech API.

**Environment Variables**:

```bash
# Speech recognition mode (browser/whisper)
NEXT_PUBLIC_SPEECH_RECOGNITION_MODE=browser

# Speech recognition timeout (seconds)
NEXT_PUBLIC_INITIAL_SPEECH_TIMEOUT=30

# Silence detection timeout (seconds)
NEXT_PUBLIC_NO_SPEECH_TIMEOUT=2

# Show silence progress bar (true/false)
NEXT_PUBLIC_SHOW_SILENCE_PROGRESS_BAR=true

# Continuous microphone input mode (true/false)
NEXT_PUBLIC_CONTINUOUS_MIC_LISTENING_MODE=false

# OpenAI API key (for OpenAI TTS mode)
NEXT_PUBLIC_OPENAI_KEY=

# Transcription model (whisper-1, gpt-4o-transcribe, gpt-4o-mini-transcribe)
NEXT_PUBLIC_WHISPER_TRANSCRIPTION_MODEL=whisper-1
```

## Microphone Input Methods

There are the following methods for microphone input:

1. **Using keyboard shortcuts**

   - Hold down the Alt key (Option key on Mac) to accept voice input
   - Release the key when you finish speaking to send the request

2. **Using the microphone button**
   - Click the microphone button at the bottom of the screen to start voice input
   - Click the button again when you finish speaking to send the request
   - You can also set the "Silence detection timeout" in other settings to automatically stop voice input and send it

## Speech Recognition Mode

Select the recognition engine to use for voice input.

1. **Browser speech recognition**: Uses the browser's built-in WebSpeech API. No internet connection is required, and recognition results are displayed in real-time. The language automatically follows the browser's settings.
2. **OpenAI TTS**: Uses OpenAI's TTS API. More accurate recognition is possible, but an API key is required. Voice data is sent to the server after recording is complete, so it takes a little time before recognition occurs.

You can switch between these by clicking the button.

::: warning Note
Generally, browser speech recognition mode is recommended as it has higher accuracy and faster recognition speed. However, if you are using a browser that does not support the WebSpeech API, such as Firefox, please select OpenAI TTS mode.
:::

::: warning Note
In Realtime API mode and Audio mode, only browser speech recognition is available.
:::

## 1. Browser Speech Recognition Settings

When browser speech recognition mode is selected, the following settings are available.

### Speech Recognition Timeout

Set the waiting time for the first utterance to be detected after speech recognition starts. If no utterance is detected within this time, speech recognition automatically stops.<br>
If set to 0 seconds, the waiting time is unlimited.

You can adjust this from 0 to 60 seconds using the slider.

### Silence Detection Timeout

Set the time to automatically complete speech recognition when silence is detected during voice input. If set to 0 seconds, automatic completion due to silence detection will not occur.

You can adjust this from 0 to 10 seconds using the slider.

### Show Silence Progress Bar

Set whether to display a progress bar when silence is detected during voice input. When enabled, the remaining time until the silence timeout is displayed as a progress bar.

### Continuous Microphone Input

Automatically restart microphone input when the AI finishes speaking. It will automatically send after the set silence time has elapsed.<br>
If speech recognition does not occur and exceeds the set time, continuous microphone input will automatically turn OFF. If you want to keep it ON at all times, set the speech recognition timeout to 0 seconds.

::: warning Note
In Realtime API mode, speech recognition timeout, silence detection timeout, silence progress bar display, and continuous microphone input settings are disabled.
:::

## 2. OpenAI API Settings

When OpenAI TTS mode is selected, the following settings are required.

### OpenAI API Key

Enter the OpenAI API key for using OpenAI TTS mode. You can obtain an API key from the OpenAI dashboard.

### Model Selection

Select the OpenAI model to use.

The following models are available:

- **whisper-1**: Standard Whisper model
- **gpt-4o-transcribe**: High-performance model based on GPT-4o
- **gpt-4o-mini-transcribe**: Lightweight model based on GPT-4o-mini

Models differ in accuracy, speed, and cost.

## Notes

- Browser speech recognition accuracy and supported languages vary depending on the browser and OS used.
- When using the OpenAI API, API key usage fees may apply.
