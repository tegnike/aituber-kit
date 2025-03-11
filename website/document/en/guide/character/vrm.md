# VRM Settings

## Overview

VRM (Virtual Reality Model) is a 3D character model format, and in AITuberKit, you can use VRM models to display AI characters.

**Environment Variables**:

```bash
# Path to the selected VRM model
NEXT_PUBLIC_SELECTED_VRM_PATH=/vrm/default.vrm
```

## Preparing VRM Models

AITuberKit supports the following VRM versions:

- VRM 0.0
- VRM 1.0

To use a VRM model, follow these steps:

1. Prepare a VRM file (.vrm extension)
2. Place the VRM file in the `public/vrm` directory
3. Select the VRM model in the application

## Loading Models

### Selecting from Options

VRM models available in the application can be selected from a dropdown menu. The model switches in real-time when selected.

### Uploading New VRM Models

By clicking the "Open VRM" button, you can upload a local VRM file to use in the application. The uploaded VRM file is automatically saved in the `public/vrm` directory and added to the selection options.

## How to Manipulate the Model

The 3D model can be freely adjusted with the following mouse operations:

### Adjusting Position, Orientation, and Size

- **Right-click + Drag**: Moves the avatar's position
- **Left-click + Drag**: Rotates the avatar's orientation
- **Mouse wheel scroll**: Enlarges or reduces the avatar's size

By combining these operations, you can adjust the placement of the avatar on the screen to an optimal state. Feel free to customize how the character appears to match your screen composition.

## Notes About Models

- Some models may take time to load during initial display
- Display may vary depending on the browser type and version
- Large VRM files may affect performance

## About VRM Model Licenses

Be sure to check the license of the VRM model you use. There may be restrictions on commercial use or redistribution. When using VRM models, follow the creator's terms of use.
