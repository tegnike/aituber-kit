# Slide Settings

## Overview

Slide settings provide functionality for AI characters to give presentations. You can configure presentation-related settings, such as a mode where AI automatically presents slides and a function to convert PDF files to slide data.

**Environment Variables**:

```bash
# Set the initial state of slide mode (true/false)
NEXT_PUBLIC_SLIDE_MODE=false
```

## Slide Mode

Slide mode is a mode where AI automatically presents slides. When this mode is enabled, the AI will give a presentation while reading out the content of the slides.

### Limitations

Slide mode is only available when the following AI services are selected:

- OpenAI
- Anthropic Claude
- Google Gemini

::: warning Note
When slide mode is enabled, some features are automatically disabled.
:::

### How to Use

1. Click the settings button for "Slide Mode" to enable it
2. Select the slide set you want to use from the "Slide to Use" dropdown menu (how to add new slides will be explained later)
3. Click the slide button in the upper right corner of the main window to start the slide display

![Slide Mode](/images/slide_ndu53.png)

### About Slide Display

- Slides are created in Marp format and designed to display optimally with a **16:9** aspect ratio
- If the screen ratio is significantly different, the design may break
- The AI character's position can be freely moved, so place it appropriately according to the slide content
- You can toggle the slide display on/off by clicking the slide icon (screen 1) in the upper left corner
- You can switch slide pages with the left and right buttons, and play/stop audio with the middle button (screen 2)

### Running Demo Slides

AITuberKit includes demo slides by default. To check the functionality of slide mode, we recommend trying the demo slides first.

1. Enable slide mode in the settings screen
2. Select "demo" in "Slide to Use"
3. Set a prompt for question answering in the character settings (system prompt)
4. When you close the settings screen, the slides will be displayed

::: tip Prompt Example
You can set the following as an example prompt for question answering:

```
You are a slide presenter.
You are currently in the middle of presenting slides.

Please answer questions from the audience based on the following material information.
However, use the information correctly and do not hallucinate.
It's fine to respond normally to regular questions.

## Script Information

{{SCRIPTS}}

## Additional Information

{{SUPPLEMENT}}

Please format your responses as follows, combining emotions and conversation text:
[{neutral|happy|angry|sad|relaxed}]{conversation text}

When responding, there are five types of emotions: "neutral" indicating normal, "happy" indicating joy, "angry" indicating anger, "sad" indicating sadness, and "relaxed" indicating ease.

Examples of your statements are as follows:
[neutral]Thank you all for gathering today.
[happy]I'm pleased to be able to talk about this interesting topic in today's presentation.
[neutral]Now, do you have any questions about the current slide?
[happy]Thank you for your excellent question!
[relaxed]I'll explain that point in more detail in the next slide.
[sad]I'm sorry. I don't have that information at the moment.
[angry]No, that's a misunderstanding. Let me give you the accurate information.
[neutral]Are there any other questions?[happy]Thank you for your active participation.
```

:::

### Question and Answer Function

In slide mode, there is a function for AI characters to answer questions from viewers.

1. Enter a question from the chat input field
2. The AI generates an answer by referring to script information and supplementary information
3. The AI character responds to the question with emotional expressions

#### How Question Answering Works

In the question answering function, the following processing is performed:

- Question answering does not use RAG (Retrieval-Augmented Generation) but processes with long context
- It includes all information prepared in the system prompt (script information and additional information) to generate appropriate answers
- If there is a slide related to the question, the AI automatically switches to that slide to answer
- Since questions cannot be asked during the presentation, you need to press the pause button before asking a question

#### Preparing Files for Question Answering

To use the question answering function, you need to prepare the following files:

1. **scripts.json** (required): Script file. Includes the content of each slide and additional information.

   ```json
   [
     {
       "page": 0,
       "line": "I will now begin explaining the slide mode of AITuberKit.",
       "notes": ""
     },
     {
       "page": 1,
       "line": "Before starting to develop slide mode, you need to be able to converse with AITuberKit, so please prepare for that.",
       "notes": "AI services that can be selected are OpenAI, Anthropic Claude, Google Gemini, Groq, Local LLM, and Dify. However, slide mode only supports OpenAI, Anthropic Claude, and Google Gemini."
     }
   ]
   ```

2. **supplement.txt** (optional): Text file for additional information. Contains information that cannot be included in scripts.json.

## How to Use Custom Slides

You can use slides you have created yourself. Prepare custom slides with the following steps.

### File Structure

1. Create a new folder in `public/slides/[folder name]` (e.g., `public/slides/myslide`)
2. Create and place the following files:

   - **slides.md** (required): Slide file created in Marp format
   - **theme.css** (optional): CSS file to customize slide design
   - **scripts.json** (required): Script file
   - **supplement.txt** (optional): Additional information file
   - **images/** (optional): Folder to store images used in slides

## PDF Slide Conversion

This is a function to convert PDF files to data that can be used in slide mode. It analyzes the content of PDFs using multimodal AI and saves it as slide data.

::: warning Note
Currently, the PDF slide conversion function is only available when OpenAI API is selected.
Support for other AI services is planned for the future.
:::

### How to Use

1. Click the "Select PDF File" button to select the PDF file you want to convert
2. Enter the folder name where you want to save the converted slide data in "Save Folder Name"
3. Select the AI model to use for PDF analysis from "Select Model"
4. Click the "Convert PDF to Slide" button to start the conversion

### How Conversion Works

In PDF slide conversion, the following processing is performed:

1. Convert and save each PDF slide as an image
2. Analyze the content of each slide using multimodal AI
3. Automatically generate a script (scripts.json) from the analysis results
4. Save the images and scripts as a set of slide data

### Points for Slide Creation

Points to maximize the use of the PDF slide conversion function:

- It is recommended to create with a **16:9** aspect ratio (landscape)
- Slides with rich designs including images can also be converted
- Slides created with PowerPoint, etc. can be used after converting to PDF format
- Edit the script file (scripts.json) manually as needed after conversion

### Checking Converted Data

1. After conversion is complete, the converted data is saved in the `public/slides/{folder name}` folder
2. The `scripts.json` file is an automatically generated script file
3. Check the content and modify as needed
4. You can use it by selecting the converted slide from "Slide to Use" in the settings screen

### Benefits of PDF Slide Conversion

- Easily convert existing slides created with PowerPoint, etc. for use with AITuberKit
- With multimodal AI analysis, images and graphs in slides are also recognized
- Saves the trouble of manually creating slides in Marp format

## YouTube Comment Integration (Planned)

In the future, a function to retrieve comments from YouTube live streams and answer questions is planned to be added. This function will allow real-time answers to questions from viewers during live broadcasts.

## Notes and Limitations

- Slides and scripts need to be prepared **in advance**
- Does not include functionality to create slides or speech content in real-time
- Depending on the content of the PDF, it may not be converted accurately
- Since slide conversion is performed on the server side, conversion may take time for large PDF files
- PDF slide conversion currently only supports OpenAI API
- It is recommended to always check the content of automatically generated scripts in advance
- Slides are optimized for a 16:9 aspect ratio
