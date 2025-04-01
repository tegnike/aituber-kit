# Live2D设置

## 概述

Live2D是一种可以为2D插图添加真实动作的模型格式，在AITuberKit中，您可以使用Live2D模型来显示AI角色。

**环境变量**:

```bash
# 选择的Live2D模型文件路径
NEXT_PUBLIC_SELECTED_LIVE2D_PATH=/live2d/modername/model3.json

# 情感设置（可以用逗号分隔指定多个）
NEXT_PUBLIC_NEUTRAL_EMOTIONS=Neutral
NEXT_PUBLIC_HAPPY_EMOTIONS=Happy,Happy2
NEXT_PUBLIC_SAD_EMOTIONS=Sad,Sad2,Troubled
NEXT_PUBLIC_ANGRY_EMOTIONS=Angry,Focus
NEXT_PUBLIC_RELAXED_EMOTIONS=Relaxed
NEXT_PUBLIC_SURPRISED_EMOTIONS=Surprised

# 动作组设置
NEXT_PUBLIC_IDLE_MOTION_GROUP=Idle
NEXT_PUBLIC_NEUTRAL_MOTION_GROUP=Neutral
NEXT_PUBLIC_HAPPY_MOTION_GROUP=Happy
NEXT_PUBLIC_SAD_MOTION_GROUP=Sad
NEXT_PUBLIC_ANGRY_MOTION_GROUP=Angry
NEXT_PUBLIC_RELAXED_MOTION_GROUP=Relaxed
NEXT_PUBLIC_SURPRISED_MOTION_GROUP=Surprised
```

## 技术实现

对于Live2D显示，我们使用非官方库[pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display)。
Live2D提供了一个名为Cubism的库作为开发SDK，AITuberKit在获得Live2D公司许可的情况下使用官方SDK。

### Cubism Core设置

要使用Live2D功能，请将以下文件放置在`public/scripts`中：

`live2dcubismcore.min.js`（适用于Cubism 4/5）

- 可从[官方网站](https://www.live2d.com/sdk/download/web/)下载
- 或从[这里](https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js)获取（注意：不推荐在生产环境中使用）

发布包含Live2D的Cubism SDK的软件时，可能需要与Live2D公司签订出版许可协议。详情请参阅以下页面：
https://www.live2d.com/sdk/license/

## 准备Live2D模型

AITuberKit支持Live2D Cubism 3及更高版本的模型。要使用Live2D模型，请按照以下步骤操作：

1. 准备Live2D模型文件夹
2. 将模型文件夹放置在`public/live2d`目录中（`model3.json`文件必须直接存在于此文件夹下）
3. 在应用程序中选择Live2D模型

## 选择模型

应用程序中可用的Live2D模型可以从下拉菜单中选择。选择后，模型会实时切换。

## 模型操作方法

2D模型可以通过以下操作自由调整：

### 位置和大小调整

#### 电脑操作

- **左键点击或右键点击 + 拖动**：移动角色位置
- **鼠标滚轮滚动**：放大或缩小角色大小

#### 智能手机操作

- **点击 + 拖动**：移动角色位置
- **双指捏合或张开**：放大或缩小角色大小

通过组合这些操作，您可以将角色在屏幕上的位置调整到最佳状态。根据您的直播画面布局，自由定制角色的外观。

## 表情设置

您可以将Live2D模型的表情设置为五个情感类别：

- **普通（Neutral）**：对话完成后等显示的正常表情
- **高兴（Happy）**：表示喜悦或乐趣的表情
- **悲伤（Sad）**：表示悲伤或困惑的表情
- **愤怒（Angry）**：表示愤怒或专注的表情
- **放松（Relaxed）**：表示放松状态的表情

对于每个情感类别，您可以从模型中可用的表情中分配任意数量的表情。如果用逗号指定多个，将随机选择一个。

## 动作组设置

您可以将Live2D模型的动作设置为六个类别：

- **空闲（Idle）**：对话完成后等显示的空闲状态动作
- **普通（Neutral）**：正常情感状态的动作
- **高兴（Happy）**：喜悦情感状态的动作
- **悲伤（Sad）**：悲伤情感状态的动作
- **愤怒（Angry）**：愤怒情感状态的动作
- **放松（Relaxed）**：放松情感状态的动作

对于每个类别，您可以从模型中可用的动作组中选择一个。

## 关于模型的注意事项

- 某些模型可能需要时间加载
- 如果使用原创Live2D模型，请根据您的模型自定义表情和动作组设置
- 默认值对应于AITuberKit提供的模型

### 模型兼容性

AITuberKit支持Cubism 3及更高版本的模型，但由于兼容性问题，某些模型可能无法正常工作。

- 在Booth等平台上分发的许多免费Live2D模型已确认可以工作，但有些模型可能因未知原因而无法工作
- 关于Cubism Editor版本，有报告称最高到版本4的模型大多兼容，但我们不能保证与最新版本5模型的完全兼容性

## 关于Live2D模型许可证

请务必检查您使用的Live2D模型的许可证。可能有商业使用或再分发的限制。使用Live2D模型时，请遵循创作者的使用条款。

## 商业使用注意事项

在AITuberKit中商业使用Live2D模型时，请注意以下几点：

### 关于Live2D的许可证

商业使用Live2D时，可能需要从Live2D购买许可证。

- 请在官方网站上查看商业使用条件和详情：
  [Live2D SDK许可证](https://www.live2d.com/sdk/license/)

- 如果您符合需要购买许可证的条件，AITuberKit的销售方也将产生付款义务，导致25%的附加费用

- 有关Live2D许可的详细问题，请直接联系Live2D

请注意，上述信息可能会发生变化，因此请务必在Live2D的官方网站上查看最新信息。
