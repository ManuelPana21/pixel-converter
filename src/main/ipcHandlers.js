const { ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function iniciarHandlers() {
    ipcMain.handle('procesar-imagen', async (event, datos) => {
        const { ruta, ancho, alto, mantenerOriginal } = datos;
        let comando = '';

        if (app.isPackaged) {
            const esWindows = process.platform === 'win32';
            const nombreMotor = esWindows ? 'engine.exe' : 'engine';
            const enginePath = path.join(process.resourcesPath, nombreMotor);

            if (!esWindows && fs.existsSync(enginePath)) {
                fs.chmodSync(enginePath, '755');
            }

            comando = `"${enginePath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal}`;
        } else {
            const scriptPath = path.join(__dirname, '../python/engine.py');
            comando = `python "${scriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal}`;
        }

        return new Promise((resolve, reject) => {
            exec(comando, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    reject(`Stderr: ${stderr}`);
                    return;
                }
                resolve(stdout);
            });
        });
    });
}

module.exports = { iniciarHandlers };