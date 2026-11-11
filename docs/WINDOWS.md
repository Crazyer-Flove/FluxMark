# Windows 安装版

在 Releases 下载 `FluxMark-Setup-1.1.0-Windows-x64.exe`，双击启动安装向导。可选择安装位置。安装后可从开始菜单或桌面打开 FluxMark，也可从 Windows 设置卸载。安装程序自带运行时，目前未签名。

桌面快捷方式也可从窗口菜单「FluxMark → 创建桌面快捷方式」重建。桌面版和浏览器版各有自己的存储空间，可通过导出和导入 Markdown 迁移文档。

## 从源码构建

在 Windows 上安装 Node.js 22.12+ 和 npm，然后运行：

```powershell
npm ci
npm run lint
npm run package:win
Get-FileHash -Algorithm SHA256 release/FluxMark-Setup-1.1.0-Windows-x64.exe
```

首次打包需要联网下载 Electron 和打包工具。发布前在 Windows 上验证首次启动、重新启动、快捷方式、Markdown 导入导出和放映。
