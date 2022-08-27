const path = require('path');
const { app, shell, BrowserWindow } = require('electron');
const loadMenu = require('./menu');
const isDev = require('electron-is-dev');
const autoUpdater = require("electron-updater");

const registerHandlers = require('./handlers');

//https://www.section.io/engineering-education/desktop-application-with-react/
//https://fmacedoo.medium.com/standalone-application-with-electron-react-and-sqlite-stack-9536a8b5a7b9
//https://github.com/marketplace/actions/electron-builder-action
function createWindow() {
    const icon = path.join(__dirname, isDev ? `../../public/favicon.ico` : 'favicon.ico');
    // Create the browser window.
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    // and load the index.html of the app.
    // win.loadFile("index.html");
    const basePath = isDev ? 'http://localhost:80/index.html'
        : `file://${path.join(__dirname, 'index.html')}`;
    win.loadURL(basePath);
    // Open the DevTools.
    if (isDev) {
        win.webContents.openDevTools({ mode: 'detach' });
    }

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    loadMenu(win, basePath);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    registerHandlers();
    createWindow();
    autoUpdater.checkForUpdatesAndNotify();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});