// Importamos solo el modulo de aplicacion de electron
const { app } = require('electron');

// Importamos nuestros propios modulos de ventana y comunicacion
const { crearVentana } = require('./window');
const { iniciarHandlers } = require('./ipcHandlers');

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