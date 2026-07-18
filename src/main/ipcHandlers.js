const { ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function iniciarHandlers() {
    
    ipcMain.on('abrir-archivo', async (event) => {
        const resultado = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Imagenes', extensions: ['jpg', 'png', 'jpeg'] }]
        });

        if (!resultado.canceled) {
            event.reply('archivo-seleccionado', resultado.filePaths[0]);
        }
    });

    ipcMain.on('procesar-imagen', (event, datos) => {
        // Extraemos ancho y alto separados
        const { ruta, ancho, alto, mantenerOriginal } = datos;
        
        const scriptPath = path.join(__dirname, '../python/engine.py');
        
        // Concatenamos ambas variables en el orden correcto para Python
        const comando = `python "${scriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal}`;

        exec(comando, (error, stdout, stderr) => {
            // Logica intacta del manejo de errores
            if (error) {
                console.error("Error en Python:", error);
                return;
            }
            try {
                const respuesta = JSON.parse(stdout);
                if (respuesta.status === "ok") {
                    event.reply('proceso-terminado', respuesta.path);
                }
            } catch (e) {
                console.error("Error interpretando respuesta:", e);
            }
        });
    });

    ipcMain.on('guardar-archivo', async (event, rutas) => {
        
        const { temp, original } = rutas;
        
        const datosOriginales = path.parse(original);
        
        const nuevoNombre = `${datosOriginales.name}-pixeled.png`;

        const resultado = await dialog.showSaveDialog({
            title: 'Guardar Sprite',
            defaultPath: nuevoNombre,
            filters: [{ name: 'Imagenes PNG', extensions: ['png'] }]
        });

        if (!resultado.canceled) {
            fs.copyFileSync(temp, resultado.filePath);
            event.reply('guardado-exitoso');
        }
    });

    // Nuevo manejador para borrar el rastro del archivo temporal
    ipcMain.on('limpiar-temp', (event, rutaTemp) => {
        if (rutaTemp && fs.existsSync(rutaTemp)) {
            fs.unlinkSync(rutaTemp);
        }
    });
}

module.exports = { iniciarHandlers };