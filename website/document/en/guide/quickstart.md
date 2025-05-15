# Quick Start

## Prerequisites

To use AITuberKit, you need the following software:

- Node.js: ^20.0.0
- npm: ^10.0.0

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/tegnike/aituber-kit.git
cd aituber-kit
```

### 2. Install Packages

```bash
npm install
```

### 3. Set Environment Variables (Optional)

If needed, copy the `.env.example` file to `.env` and set the environment variables.

```bash
cp .env.example .env
```

::: info
Values set in environment variables have lower priority than values entered in the settings screen.
:::

## Start the Development Server

```bash
npm run dev
```

You can start using AITuberKit by opening [http://localhost:3000](http://localhost:3000) in your browser.

## Screen Description

![Screen Description](/images/quickstart_cm3w4.png)

- The settings button with a gear icon at the top left allows you to configure various settings related to AI characters and voice
- The conversation log button (right of the settings button) allows you to display the conversation history with the character by clicking it (adjustable width by dragging)
- The character is displayed in the center, and its size and position can be freely adjusted by dragging
- There is an input form with a microphone icon at the bottom, which allows you to text or voice input to the character
- Click the send button (right arrow) or press Enter to send a message

## Basic Usage

### Interacting with AI Characters

1. Enter the API key for the LLM selected in the settings screen
2. Edit the character's setting prompt as needed
3. Upload a VRM file or Live2D file for the character, and a background file if needed
4. Select a voice synthesis engine and configure voice settings as needed
5. Start a conversation with the character from the input form

### AITuber Streaming

1. Turn ON Youtube mode in the settings screen
2. Enter your Youtube API key and Youtube Live ID
3. Configure other settings similar to "Interacting with AI Characters"
4. Start streaming on Youtube and confirm that the character responds to comments
5. Turn ON conversation continuation mode to allow the AI to speak proactively when there are no comments

## Next Steps

- Configure detailed settings in [Basic Settings](/en/guide/basic-settings)
- Customize AI characters in [Character Settings](/en/guide/character/common)
- Adjust AI behavior in [AI Settings](/en/guide/ai/common)
- Configure voice synthesis in [Voice Settings](/en/guide/voice-settings)
- Configure speech input in [Speech Input Settings](/en/guide/speech-input-settings)
- Set up AITuber streaming in [Youtube Settings](/en/guide/youtube-settings)
- Configure slide mode in [Slide Settings](/en/guide/slide-settings)
