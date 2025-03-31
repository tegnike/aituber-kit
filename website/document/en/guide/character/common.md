# Character Common Settings

## Overview

In the character settings screen, you can set the AI character's name, the model to use (VRM or Live2D), and the character prompt.

**Environment Variables**:

```bash
# Character name
NEXT_PUBLIC_CHARACTER_NAME=Nike-chan

# Model type to use (vrm or live2d)
NEXT_PUBLIC_MODEL_TYPE=vrm

# System prompt
NEXT_PUBLIC_SYSTEM_PROMPT="You are an AI assistant named Nike. Please speak in a friendly and cheerful manner. Use the following emotion tags to change your expression and tone of voice as appropriate: [neutral] - normal expression, [happy] - happy expression, [sad] - sad expression, [angry] - angry expression, [relaxed] - relaxed expression"
```

## Setting the Character Name

Set the name of the character. This name is used as the character name displayed when the AI responds (if the "Show Display Name" setting is on).

However, this name is not used when generating AI responses. It needs to be set separately in the system prompt.

## Selecting the Character Model

You can select "VRM" or "Live2D" as the character's model type. The setting items change depending on the model type. For detailed settings of each model type, please see the settings page for each model.

- [VRM Settings](./vrm.md)
- [Live2D Settings](./live2d.md)

## Character Prompt

Set the system prompt that defines the character's personality and response style. This prompt is used when generating AI responses and is an important element that determines the character's individuality.

Be sure to include the character name here.

### Using Emotion Tags

In AITuberKit, you can use emotion tags to control the character's expressions and motions. The following emotion tags are supported:

- `[neutral]` - Normal expression
- `[happy]` - Happy expression
- `[sad]` - Sad expression
- `[angry]` - Angry expression
- `[relaxed]` - Relaxed expression

Prompt example:

```
You will behave as a human who is good friends with the user and have a conversation.
There are five types of emotions: "neutral" indicating normal, "happy" indicating joy, "angry" indicating anger, "sad" indicating sadness, and "relaxed" indicating ease.

The format for conversation text is as follows:
[{neutral|happy|angry|sad|relaxed}]{conversation text}

Examples of your statements are as follows:
[neutral]Hello. [happy]How have you been?
[happy]This outfit is cute, don't you think?
[happy]I've been into this shop's clothes lately!
[sad]I forgot, I'm sorry.
[sad]Has anything interesting happened lately?
[angry]What! [angry]That's mean to keep it a secret!
[neutral]Summer vacation plans, huh. [happy]Maybe I'll go to the beach!

Please respond with only one most appropriate conversation text.
Don't use formal speech or honorifics.
Now let's start the conversation.
```

### Resetting the Prompt

You can reset the system prompt to its default value by clicking the "Reset Character Settings" button.

::: warning Note
If you are using **Dify** as your AI service, this system prompt will not be used. Character settings need to be configured within the Dify chatbot settings.
:::
