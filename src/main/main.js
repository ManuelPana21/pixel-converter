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

app.whenReady().then(createWindow);
// Esperamos a que electron este listo para iniciar los procesos
app.whenReady().then(() => {
    crearVentana();
    iniciarHandlers();
});

// Cerramos la aplicacion cuando todas las ventanas se cierren
app.on('window-all-closed', () => {
    // Evitamos cerrar el proceso en macOS por su comportamiento estandar
    if (process.platform !== 'darwin') {
        app.quit();
    }
});