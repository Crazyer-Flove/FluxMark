const { app, BrowserWindow, Menu, dialog, net, protocol, shell } = require('electron');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const origin = 'fluxmark://workspace';
protocol.registerSchemesAsPrivileged([
  { scheme: 'fluxmark', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

function createShortcut(window) {
  const target = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
  const shortcut = path.join(app.getPath('desktop'), 'FluxMark.lnk');
  const created = shell.writeShortcutLink(shortcut, existsSync(shortcut) ? 'replace' : 'create', {
    target, cwd: path.dirname(target), description: 'FluxMark Markdown 编辑与放映',
    icon: target, iconIndex: 0,
  });
  void dialog.showMessageBox(window, {
    type: created ? 'info' : 'error',
    message: created ? '已创建桌面快捷方式' : '无法创建桌面快捷方式',
    detail: shortcut,
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app.whenReady().then(async () => {
    const root = path.join(__dirname, '..', 'dist');
    protocol.handle('fluxmark', request => {
      const url = new URL(request.url);
      if (url.host !== 'workspace') return new Response(null, { status: 404 });
      const requested = path.resolve(root, '.' + decodeURIComponent(url.pathname || '/'));
      const relative = path.relative(root, requested);
      if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
        return new Response(null, { status: 404 });
      }
      const file = relative ? requested : path.join(root, 'index.html');
      return net.fetch(pathToFileURL(file).href);
    });

    const window = new BrowserWindow({
      width: 1280, height: 850, minWidth: 480, minHeight: 420,
      icon: path.join(__dirname, 'fluxmark.ico'),
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
    });
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
      return { action: 'deny' };
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'FluxMark', submenu: [
        { label: '创建桌面快捷方式', click: () => createShortcut(window), enabled: app.isPackaged },
        { type: 'separator' },
        { label: '退出', role: 'quit' },
      ] },
      { label: '编辑', role: 'editMenu' },
    ]));
    await window.loadURL(origin + '/');
  }).catch(error => {
    dialog.showErrorBox('FluxMark 启动失败', error.message);
    app.quit();
  });
  app.on('window-all-closed', () => app.quit());
}
