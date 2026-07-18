// Requerimos el modulo base para crear interfaces en electron
const { BrowserWindow } = require('electron');

// Requerimos path para resolver las rutas internas del proyecto
const path = require('path');

// Declaramos la variable fuera de la funcion para que no sea recolectada por la memoria
let mainWindow;

// Centralizamos la configuracion de la ventana en una sola funcion
function crearVentana() {
    
    // Instanciamos la ventana con resoluciones comodas para herramientas de edicion
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Apuntamos al archivo HTML que construimos como base
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Esperamos a que el motor grafico renderice el html antes de mostrarlo
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

// Hacemos que esta funcion este disponible para nuestro main.js
module.exports = { crearVentana };