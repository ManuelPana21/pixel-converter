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

    // Procesar imagen llamando al motor compilado o al script de Python con fallbacks en Linux
    ipcMain.on('procesar-imagen', async (event, datos) => {
        const { ruta, ancho, alto, mantenerOriginal, colores } = datos;
        
        // Helper para ejecutar un comando y devolver una promesa
        const runCommand = (cmd) => {
            return new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        reject({ error, stderr, stdout });
                        return;
                    }
                    try {
                        const respuesta = JSON.parse(stdout);
                        if (respuesta.status === "ok") {
                            resolve(respuesta);
                        } else {
                            reject({ error: new Error(respuesta.message || "Status no ok"), stderr, stdout });
                        }
                    } catch (e) {
                        reject({ error: e, stderr, stdout });
                    }
                });
            });
        };

        const esWindows = process.platform === 'win32';
        
        if (app.isPackaged) {
            const nombreMotor = esWindows ? 'engine.exe' : 'engine';
            let enginePath = path.join(process.resourcesPath, nombreMotor);

            if (esWindows) {
                // En Windows, ejecutar el binario .exe directamente
                const comando = `"${enginePath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;
                runCommand(comando)
                    .then(res => event.reply('proceso-terminado', { path: res.path, colors: res.colors || [] }))
                    .catch(err => console.error("Error ejecutando engine.exe en Windows:", err));
            } else {
                // En Linux/Unix (AppImage)
                const destPath = path.join(app.getPath('userData'), nombreMotor);
                let binarioListo = false;

                try {
                    let copyNeeded = true;
                    // Verificamos si ya existe el binario copiado y si coincide en tamaño
                    if (fs.existsSync(destPath) && fs.existsSync(enginePath)) {
                        const srcStats = fs.statSync(enginePath);
                        const destStats = fs.statSync(destPath);
                        if (srcStats.size === destStats.size) {
                            copyNeeded = false;
                        }
                    }

                    // Copiamos el binario a userData si es necesario
                    if (copyNeeded && fs.existsSync(enginePath)) {
                        fs.copyFileSync(enginePath, destPath);
                    }

                    // Asignamos permisos de ejecución en la ruta escribible
                    if (fs.existsSync(destPath)) {
                        fs.chmodSync(destPath, '755');
                        binarioListo = true;
                    }
                } catch (err) {
                    console.error('Error al preparar el motor ejecutable en Linux/Unix:', err);
                }

                // Definimos la ruta de ejecución primaria
                const binarioPath = binarioListo ? destPath : enginePath;
                const comandoBinario = `"${binarioPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;

                console.log("Intentando ejecutar binario compilado en Linux:", comandoBinario);

                runCommand(comandoBinario)
                    .then(res => {
                        event.reply('proceso-terminado', { path: res.path, colors: res.colors || [] });
                    })
                    .catch(binErr => {
                        console.warn("Fallo la ejecución del binario compilado en Linux. Intentando fallback con python3 local...", binErr);
                        
                        // Fallback: Ejecutar el script original .py usando python3 de la distribución local
                        const pythonScriptPath = path.join(process.resourcesPath, 'engine.py');
                        
                        if (fs.existsSync(pythonScriptPath)) {
                            // Intentamos primero con python3
                            const comandoPython3 = `python3 "${pythonScriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;
                            console.log("Ejecutando comando fallback (python3):", comandoPython3);
                            
                            runCommand(comandoPython3)
                                .then(res => {
                                    event.reply('proceso-terminado', { path: res.path, colors: res.colors || [] });
                                })
                                .catch(py3Err => {
                                    console.warn("Fallo fallback con python3. Intentando con comando python...", py3Err);
                                    // Intentamos con python (por si python3 no está en PATH pero python sí)
                                    const comandoPython = `python "${pythonScriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;
                                    console.log("Ejecutando comando fallback (python):", comandoPython);
                                    
                                    runCommand(comandoPython)
                                        .then(res => {
                                            event.reply('proceso-terminado', { path: res.path, colors: res.colors || [] });
                                        })
                                        .catch(finalErr => {
                                            console.error("Todos los métodos de ejecución fallaron en Linux:", finalErr);
                                        });
                                });
                        } else {
                            console.error("El binario falló y no se encontró el script de Python en recursos para el fallback.");
                        }
                    });
            }
        } else {
            // Modo desarrollo
            const scriptPath = path.join(__dirname, '../python/engine.py');
            const pythonCmd = esWindows ? 'python' : 'python3';
            const comando = `${pythonCmd} "${scriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;
            
            console.log("Ejecutando en desarrollo:", comando);
            
            runCommand(comando)
                .then(res => event.reply('proceso-terminado', { path: res.path, colors: res.colors || [] }))
                .catch(err => {
                    if (!esWindows && pythonCmd === 'python3') {
                        // Fallback a comando 'python' en Unix de desarrollo
                        const comandoFallback = `python "${scriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal} ${colores}`;
                        runCommand(comandoFallback)
                            .then(res => event.reply('proceso-terminado', { path: res.path, colors: res.colors || [] }))
                            .catch(fallbackErr => console.error("Error en desarrollo con fallback a python:", fallbackErr));
                    } else {
                        console.error("Error en desarrollo:", err);
                    }
                });
        }
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