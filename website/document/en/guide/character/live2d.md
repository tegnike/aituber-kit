# Live2D Settings

## Overview

Live2D is a model format that allows realistic movement to be added to 2D illustrations, and in AITuberKit, you can use Live2D models to display AI characters.

**Environment Variables**:

```bash
# Path to the selected Live2D model file
NEXT_PUBLIC_SELECTED_LIVE2D_PATH=/live2d/modername/model3.json

# Emotion settings (multiple can be specified with commas)
NEXT_PUBLIC_NEUTRAL_EMOTIONS=Neutral
NEXT_PUBLIC_HAPPY_EMOTIONS=Happy,Happy2
NEXT_PUBLIC_SAD_EMOTIONS=Sad,Sad2,Troubled
NEXT_PUBLIC_ANGRY_EMOTIONS=Angry,Focus
NEXT_PUBLIC_RELAXED_EMOTIONS=Relaxed

# Motion group settings
NEXT_PUBLIC_IDLE_MOTION_GROUP=Idle
NEXT_PUBLIC_NEUTRAL_MOTION_GROUP=Neutral
NEXT_PUBLIC_HAPPY_MOTION_GROUP=Happy
NEXT_PUBLIC_SAD_MOTION_GROUP=Sad
NEXT_PUBLIC_ANGRY_MOTION_GROUP=Angry
NEXT_PUBLIC_RELAXED_MOTION_GROUP=Relaxed
```

## Technical Implementation

For Live2D display, we use the unofficial library [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display).
Live2D provides a library called Cubism as a development SDK, and AITuberKit uses the official SDK with permission from Live2D.

### Cubism Core Setup

To use the Live2D feature, please place the following file in `public/scripts`:

`live2dcubismcore.min.js` (for Cubism 4/5)

- Available for download from the [official site](https://www.live2d.com/sdk/download/web/)
- Or available [here](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js) (Note: Not recommended for production use)

When publishing software that incorporates Live2D's Cubism SDK, you may need to enter into a publishing license agreement with Live2D. For details, please refer to the following page:
https://www.live2d.com/sdk/license/

## Preparing Live2D Models

AITuberKit supports Live2D Cubism 3 and later models. To use a Live2D model, follow these steps:

1. Prepare a Live2D model folder
2. Place the model folder in the `public/live2d` directory (the `model3.json` file must exist directly under this folder)
3. Select the Live2D model in the application

## Selecting Models

Live2D models available in the application can be selected from a dropdown menu. The model switches in real-time when selected.

## How to Manipulate the Model

The 2D model can be freely adjusted with the following mouse operations:

### Adjusting Position and Size

- **Left-click or Right-click + Drag**: Moves the character's position
- **Mouse wheel scroll**: Enlarges or reduces the character's size

By combining these operations, you can adjust the placement of the character on the screen to an optimal state. Feel free to customize how the character appears to match your broadcast screen layout.

## Expression Settings

You can set the Live2D model's expressions into five emotion categories:

- **Neutral**: Normal expression displayed after conversation completion, etc.
- **Happy**: Expressions that represent joy or fun
- **Sad**: Expressions that represent sadness or confusion
- **Angry**: Expressions that represent anger or focus
- **Relaxed**: Expressions that represent a relaxed state

For each emotion category, you can assign any number of expressions from those available in the model. If multiple are specified with commas, one will be selected randomly.

## Motion Group Settings

You can set the Live2D model's motions into six categories:

- **Idle**: Idle state motion displayed after conversation completion, etc.
- **Neutral**: Motion for the normal emotional state
- **Happy**: Motion for the joyful emotional state
- **Sad**: Motion for the sad emotional state
- **Angry**: Motion for the angry emotional state
- **Relaxed**: Motion for the relaxed emotional state

For each category, you can select one motion group from those available in the model.

## Notes About Models

- Some models may take time to load
- If using an original Live2D model, please customize the expression and motion group settings to match your model
- The default values correspond to the models provided with AITuberKit

### Model Compatibility

AITuberKit supports Cubism 3 and later models, but some models may not work properly due to compatibility issues.

- Many free Live2D models distributed on platforms like Booth have been confirmed to work, but some models may not work for unknown reasons
- Regarding Cubism Editor versions, there are reports that models up to version 4 are mostly compatible, but we cannot guarantee complete compatibility with the latest version 5 models

## About Live2D Model Licenses

Be sure to check the license of the Live2D model you use. There may be restrictions on commercial use or redistribution. When using Live2D models, follow the creator's terms of use.

## Notes for Commercial Use

When using Live2D models commercially with AITuberKit, please note the following:

### About Live2D's License

When using Live2D commercially, you may need to purchase a license from Live2D.

- Please check the official site for commercial use conditions and details:
  [Live2D SDK License](https://www.live2d.com/sdk/license/)

- If you fall under conditions requiring a license purchase, the seller of AITuberKit will also incur payment obligations, resulting in a 25% surcharge

- For detailed questions about Live2D licensing, please contact Live2D directly

Please note that the above information may change, so always check the latest information on Live2D's official website.
