# YouTube Settings

## Overview

Provides a function to retrieve comments from YouTube live streams and have AI characters respond. It can automatically pick up comments from users and generate responses from AI.

**Environment Variables**:

```bash
# Whether to enable YouTube mode (true/false)
NEXT_PUBLIC_YOUTUBE_MODE=false

# YouTube API key
NEXT_PUBLIC_YOUTUBE_API_KEY=

# YouTube live stream ID
NEXT_PUBLIC_YOUTUBE_LIVE_ID=
```

## YouTube Mode

When YouTube mode is enabled, comments can be retrieved from YouTube live streams, allowing AI characters to respond automatically.

::: warning Note
When YouTube mode is enabled, some features are automatically disabled.
:::

### YouTube API Settings

Settings for using the YouTube API.

### YouTube API Key

Set the API key to use the YouTube API. To retrieve YouTube comments, you need an API key from Google Cloud Platform.

::: tip How to Get an API Key

1. Access [Google Cloud Platform](https://console.cloud.google.com/), create an account or log in
2. Create a project
3. Enable "YouTube Data API v3" from "APIs & Services" > "Library"
4. Generate an API key from "Credentials" > "Create Credentials" > "API Key"
5. Enter the generated API key in this settings field
   :::

### YouTube Live ID

Enter the ID of the YouTube live stream from which you want to retrieve comments. This value can be obtained from the URL of the YouTube live stream.

Example: If the YouTube URL is `https://www.youtube.com/watch?v=abcdefghijk`, the Live ID is `abcdefghijk`.

::: warning Note
The YouTube Live ID is the ID of a specific live stream, not a channel ID.
:::

### How to Use

When YouTube mode is enabled, a YouTube mode button appears in the upper left corner of the screen.

![YouTube Mode](/images/youtube_s045n.png)

You can toggle comment retrieval on/off by clicking this button.

### Comment Processing Mechanism

AITuber Kit processes YouTube comments in the following flow:

1. Retrieve comments from the live stream using YouTube Data API v3 at set intervals
2. Add retrieved comments to the processing queue
3. Sequentially send comments in the queue to AI to generate responses
4. Have the character speak the generated responses

### Error Handling and Notes

- **Comment Retrieval Error**: Comments may not be retrieved if the API key is invalid or has reached its limit
- **Rate Limit**: YouTube Data API has usage limits, so you may reach the limit during long broadcasts
- **Comment Filtering**: Comments starting with "#" are ignored
- **Resource Consumption**: Memory usage may increase during long live streams

## Conversation Continuation Mode (Beta)

A mode where AI continues the conversation on its own when there are no comments. Even if there are no comments for a while, the AI character will proactively develop the conversation.

::: warning About Beta Version
**This Conversation Continuation Mode is currently provided as a beta version.**

- Specifications may change without notice
- Operation may be unstable
- Please thoroughly test before using in a production environment
- We would appreciate your feedback if you discover any bugs or issues
  :::

### Supported AI Services

- OpenAI
- Anthropic Claude
- Google Gemini

### Feature Details

In Conversation Continuation Mode, if there are no comments for a certain period of time, the AI refers to the past conversation context and provides new topics to maintain the natural flow of conversation.

### Notes

::: warning About Usage Costs

- Since LLM is called multiple times for a single response, API usage fees may increase
  :::

### How to Use

You can toggle Conversation Continuation Mode on/off by clicking the "Conversation Continuation Mode" button when YouTube mode is enabled.
