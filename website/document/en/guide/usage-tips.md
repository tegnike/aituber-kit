# Usage Tips

## Overview

This page introduces tips and techniques for using AITuberKit more effectively. By learning about features that may be difficult to find in the settings screen and techniques for comfortable use, you can expand the possibilities of AITuberKit.

## Changing the Color Theme

You can easily change the color theme of AITuberKit by editing the `colors` section in the `tailwind.config.js` file. This file defines the colors used throughout the application.

```javascript
colors: {
  primary: '#856292',
  'primary-hover': '#8E76A1',
  'primary-press': '#988BB0',
  // Other color definitions...
}
```

Simply changing these color codes can refresh the entire look of the application. For example, to create a monochrome theme, change the values as follows:

```javascript
colors: {
  primary: '#505050',
  'primary-hover': '#707070',
  'primary-press': '#909090',
  'primary-disabled': '#5050504D',
  secondary: '#303030',
  'secondary-hover': '#404040',
  'secondary-press': '#606060',
  'secondary-disabled': '#3030304D',
  'text-primary': '#202020',
  'base-light': '#F5F5F5',
  'base-dark': '#1A1A1A',
  // Toast colors should also be changed as needed
}
```

![Changing the Color Theme](/images/usage-tips_lfsd4.png)

:::tip
Changing color settings might seem a bit complex, but it's easy with the help of an AI assistant. For example, simply asking the AI "Please change the color theme in tailwind.config.js to monochrome" will get you appropriate color code suggestions. AI can also help with creating custom color themes or fine-tuning existing themes.
:::
