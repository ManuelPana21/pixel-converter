const { ipcMain, app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function iniciarHandlers() {
    // Abrir archivo de imagen
    ipcMain.on('abrir-archivo', async (event) => {
        const resultado = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Imagenes', extensions: ['jpg', 'png', 'jpeg'] }]
        });

        if (!resultado.canceled) {
            event.reply('archivo-seleccionado', resultado.filePaths[0]);
        }
    });

    // Procesar imagen llamando al motor compilado o al script de Python
    ipcMain.on('procesar-imagen', async (event, datos) => {
        const { ruta, ancho, alto, mantenerOriginal, colores } = datos;
        let comando = '';

        if (app.isPackaged) {
            const esWindows = process.platform === 'win32';
            const nombreMotor = esWindows ? 'engine.exe' : 'engine';
            let enginePath = path.join(process.resourcesPath, nombreMotor);

            if (!esWindows) {
                // En Linux/Unix empaquetados en AppImage, process.resourcesPath es de solo lectura.
                // Intentar hacer fs.chmodSync directamente en la ruta de recursos provocará un error EROFS.
                // Copiaremos el motor a una carpeta escribible (userData) para asignarle permisos de ejecución.
                const destPath = path.join(app.getPath('userData'), nombreMotor);
                try {
                    let copyNeeded = true;
                    if (fs.existsSync(destPath)) {
                        const srcStats = fs.statSync(enginePath);
                        const destStats = fs.statSync(destPath);
                        if (srcStats.size === destStats.size) {
                            copyNeeded = false;
                        }
                    }

                    if (copyNeeded) {
                        fs.copyFileSync(enginePath, destPath);
                    }

                    fs.chmodSync(destPath, '755');
                    enginePath = destPath; // Usar el binario copiado y con permisos correctos
                } catch (error) {
                    console.error('Error al preparar el motor ejecutable en Linux:', error);
                    // Si falla, intentamos usar el original con try/catch en chmodSync como fallback
                    try {
                        fs.chmodSync(enginePath, '755');
                    } catch (chmodError) {
                        console.error('Error al intentar chmod en ruta original:', chmodError);
                    }
                }
            }

            // Agregamos colores como quinto argumento (siempre entero)
            comando = `"${enginePath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;
        } else {
            const scriptPath = path.join(__dirname, '../python/engine.py');
            // Agregamos colores como quinto argumento
            comando = `python "${scriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;
        }

        exec(comando, (error, stdout, stderr) => {
            if (error) {
                console.error("Error en motor/script de Python:", error);
                return;
            }
            if (stderr) {
                console.error("Stderr de Python:", stderr);
            }
            try {
                const respuesta = JSON.parse(stdout);
                if (respuesta.status === "ok") {
                    // Enviamos tanto la ruta procesada como la lista de colores
                    event.reply('proceso-terminado', {
                        path: respuesta.path,
                        colors: respuesta.colors || []
                    });
                }
            } catch (e) {
                console.error("Error interpretando respuesta de Python:", e, "Stdout recibido:", stdout);
            }
        });
    });

    // Guardar archivo procesado a ubicación final
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
            try {
                fs.copyFileSync(temp, resultado.filePath);
                event.reply('guardado-exitoso');
            } catch (err) {
                console.error("Error al guardar archivo:", err);
            }
        }
    });

    // Limpiar archivo temporal al presionar volver
    ipcMain.on('limpiar-temp', (event, rutaTemp) => {
        if (rutaTemp && fs.existsSync(rutaTemp)) {
            try {
                fs.unlinkSync(rutaTemp);
            } catch (err) {
                console.error("Error al eliminar temp:", err);
            }
        }
    });
}

module.exports = { iniciarHandlers };