# Troubleshooting

## Overview

This page summarizes common problems and their solutions when using AITuberKit. We will continue to add typical errors and issues along with their causes and solutions, providing detailed explanations based on specific cases to support smooth operation.

## TypeError: \_currentFrameNo when loading Live2D models

::: warning Symptoms
When selecting a custom Live2D model in AITuberKit, the following error appears and the model does not render.

```text
Unhandled Runtime Error
TypeError: Cannot set properties of undefined (setting '_currentFrameNo')
  at Cubism4InternalModel.updateWebGLContext (...)
  ...
```

:::

### Cause

- This is a known bug in the `pixi-live2d-display` library family.
- If the model does not have any clipping masks (ArtMesh ▶ Drawing ▶ Generate Mask), the `_clippingManager` is not created and remains `undefined`.
- Inside `Cubism4InternalModel.updateWebGLContext`, `this._clippingManager._currentFrameNo = ++frame;` is executed, causing a TypeError.
- Additionally, models exported in Cubism 5 format (.moc3 v4) are not compatible with the libraries included in AITuberKit.

### Solution

1. Open the model in Live2D Cubism Editor.
2. Select any ArtMesh, then enable **Generate Mask** in [Inspector] ▶ [Drawing].
3. Select [File] ▶ [Export] ▶ **Model(.moc3)**, and specify the following in the dialog:
   - **SDK**: SDK for Web
   - **Version**: Cubism 4.2 (or 4.0/4.1)
4. Place the output folder in `public/live2d/model-name/` and reselect `model-name.model3.json` in AITuberKit.
5. To enable lip-syncing, add `LipSync` to **Groups** in model3.json.

::: tip Hint
Adding a mask to lightweight meshes like eyebrows or highlights will also resolve the issue. If you want to avoid visual impact, you can create a new invisible small mesh and generate a mask on it.
:::

### Quick Reference for Relevant Live2D Settings

| Setting Location                    | Requirements for Normal Operation              | Notes                                                                 |
| ----------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| ArtMesh ▶ Drawing ▶ Generate Mask | At least 1 ON                                  | Any part can be used (eyebrows, hair highlights, etc.)                |
| Model Export                        | Select **SDK for Web / Cubism 4.2 or earlier** | Cubism 5 format (.moc3 v4) is not supported                           |
| model3.json → Groups                | Add EyeBlink and LipSync                       | No error occurs without them, but expressions and lip-sync won't work |

If your model renders correctly in AITuberKit after following these steps, you're all set.
For Live2D settings, please refer to [this page](character/live2d.md).
