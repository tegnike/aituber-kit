# Environment Variables List

## Overview

This page explains all the environment variables that can be used in AITuberKit. These environment variables can be set in the `.env` file to customize the behavior of the application.

::: tip
Samples of all environment variables are listed in the `.env.example` file. Copy this file to create a `.env` file.
:::

## Basic Settings

For details, see [Basic Settings](/en/guide/basic-settings).

```bash
# Default language setting
NEXT_PUBLIC_SELECT_LANGUAGE=en

# Background image path
NEXT_PUBLIC_BACKGROUND_IMAGE_PATH=/bg-c.png

# Answer box display setting (true/false)
NEXT_PUBLIC_SHOW_ASSISTANT_TEXT=true

# Character name display setting (true/false)
NEXT_PUBLIC_SHOW_CHARACTER_NAME=true

# Control panel display setting (true/false)
NEXT_PUBLIC_SHOW_CONTROL_PANEL=true
```

## Character Settings

For details, see [Character Settings](/en/guide/character/common).

```bash
# Character name
NEXT_PUBLIC_CHARACTER_NAME=Nike-chan

# Model type to use (vrm or live2d)
NEXT_PUBLIC_MODEL_TYPE=vrm

# System prompt
NEXT_PUBLIC_SYSTEM_PROMPT="You are an AI assistant named Nike..."
```

## AI Settings

For details, see [AI Settings](/en/guide/ai/common).

```bash
# AI service selection
NEXT_PUBLIC_SELECT_AI_SERVICE=openai

# Selected AI model name
NEXT_PUBLIC_SELECT_AI_MODEL=gpt-4o-2024-11-20

# Number of past messages to retain
NEXT_PUBLIC_MAX_PAST_MESSAGES=10

# Temperature parameter (0.0-2.0)
NEXT_PUBLIC_TEMPERATURE=0.7

# Maximum number of tokens
NEXT_PUBLIC_MAX_TOKENS=4096
```

## Voice Settings

For details, see [Voice Settings](/en/guide/voice-settings).

```bash
# Voice synthesis engine to use
NEXT_PUBLIC_SELECT_VOICE=voicevox
```

## YouTube Settings

For details, see [YouTube Settings](/en/guide/youtube-settings).

```bash
# Whether to enable YouTube mode (true/false)
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTube API key
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTube live stream ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## Slide Settings

For details, see [Slide Settings](/en/guide/slide-settings).

```bash
# Set the initial state of slide mode (true/false)
NEXT_PUBLIC_SLIDE_MODE=false
```

## Other Settings

For details, see [Advanced Settings](/en/guide/other/advanced-settings) and [API Settings](/en/guide/other/message-receiver).

```bash
# Use video as background setting (true/false)
NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND=false

# Enable external instruction acceptance setting (true/false)
NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED=false

# Introduction screen display setting (true/false)
NEXT_PUBLIC_SHOW_INTRODUCTION="true"
```

For a complete list of all environment variables, please refer to the `.env.example` file in the project root directory.
