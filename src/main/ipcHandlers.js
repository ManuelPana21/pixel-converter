const { ipcMain, dialog, app } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function iniciarHandlers() {
    
    // Manejador para abrir el dialogo de seleccion de archivos
    // Filtra para permitir unicamente formatos de imagen compatibles
    // Si el usuario confirma envia la ruta del archivo a la interfaz visual
    ipcMain.on('abrir-archivo', async (event) => {
        const resultado = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Imagenes', extensions: ['jpg', 'png', 'jpeg'] }]
        });

        if (!resultado.canceled) {
            event.reply('archivo-seleccionado', resultado.filePaths[0]);
        }
    });

    // Manejador para procesar la imagen en el motor secundario
    // Extrae los datos necesarios que envia el usuario
    ipcMain.on('procesar-imagen', (event, datos) => {
        const { ruta, ancho, alto, mantenerOriginal } = datos;
        
        let comando;
        
        // Verifica si la aplicacion ya esta compilada para produccion
        // Construye la ruta hacia el ejecutable empaquetado en resources
        // Define el comando ejecutando directamente el binario
        if (app.isPackaged) {
            const enginePath = path.join(process.resourcesPath, 'engine.exe');
            comando = `"${enginePath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal}`;
        } 
        // Ejecuta la version de desarrollo si no esta empaquetada
        // Construye la ruta hacia el script original de Python
        // Define el comando llamando al interprete local de Python
        else {
            const scriptPath = path.join(__dirname, '../python/engine.py');
            comando = `python "${scriptPath}" "${ruta}" ${ancho} ${alto} ${mantenerOriginal}`;
        }

        // Llama a la consola del sistema para iniciar el procesamiento
        // Gestiona posibles errores de ejecucion y respuestas exitosas
        exec(comando, (error, stdout, stderr) => {
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

    // Manejador para guardar la imagen ya convertida en el sistema
    // Construye un nuevo nombre sugerido tomando el nombre base
    // Abre la ventana de guardado y copia el archivo temporal a su destino
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

    // Manejador para eliminar el archivo temporal de la imagen
    // Valida que el archivo exista en la ruta antes de intentar borrarlo
    ipcMain.on('limpiar-temp', (event, rutaTemp) => {
        if (rutaTemp && fs.existsSync(rutaTemp)) {
            fs.unlinkSync(rutaTemp);
        }
    });
}

module.exports = { iniciarHandlers };