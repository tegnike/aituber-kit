# 使用技巧

## 概述

本页面介绍了更有效地使用AITuberKit的提示和技巧。通过了解设置界面中可能难以找到的功能和舒适使用的技术，您可以扩展AITuberKit的可能性。

## 更改颜色主题

您可以通过编辑`tailwind.config.js`文件中的`colors`部分轻松更改AITuberKit的颜色主题。该文件定义了应用程序中使用的颜色。

```javascript
colors: {
  primary: '#856292',
  'primary-hover': '#8E76A1',
  'primary-press': '#988BB0',
  // 其他颜色定义...
}
```

只需更改这些颜色代码就可以刷新应用程序的整体外观。例如，要创建单色主题，请按如下方式更改值：

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
  // 根据需要也应更改提示框颜色
}
```

![更改颜色主题](/images/usage-tips_lfsd4.png)

:::tip
更改颜色设置可能看起来有点复杂，但借助AI助手很容易完成。例如，只需向AI请求"请将tailwind.config.js中的颜色主题更改为单色"，就能获得适当的颜色代码建议。AI还可以帮助创建自定义颜色主题或微调现有主题。
:::
