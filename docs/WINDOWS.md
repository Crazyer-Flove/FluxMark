# Windows 便携版

在 Releases 下载 `FluxMark-1.0.1-Windows-x64.exe`，保存到计划长期保留的位置，双击启动。Windows x64 便携版自带运行时。项目当前没有配置代码签名。

从窗口菜单选择「FluxMark → 创建桌面快捷方式」。快捷方式指向 exe 的当前位置，移动文件后可以再次创建。应用数据与浏览器版使用各自的存储空间，可通过导出和导入 Markdown 迁移文档。

## 从源码构建

在 Windows 上安装 Node.js 22.12+ 和 npm，然后运行：

```powershell
npm ci
npm run lint
npm run package:win
Get-FileHash -Algorithm SHA256 release/FluxMark-1.0.1-Windows-x64.exe
```

首次打包需要联网下载 Electron 和打包工具。发布前在 Windows 上验证首次启动、重新启动、快捷方式、Markdown 导入导出和放映。
