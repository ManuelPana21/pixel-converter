const path = require('path');
const { app, BrowserWindow } = require('electron');
const { iniciarHandlers } = require('./ipcHandlers');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        icon: path.join(__dirname, '../../pig-icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('src/renderer/index.html');
    iniciarHandlers();
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});