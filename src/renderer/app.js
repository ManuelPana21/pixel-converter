const { ipcRenderer } = require('electron');

const zonaArrastre = document.getElementById('zona-arrastre');
const btnSeleccionar = document.getElementById('btn-seleccionar');
const pantallaInicio = document.getElementById('pantalla-inicio');
const pantallaEdicion = document.getElementById('pantalla-edicion');
const imgOriginal = document.getElementById('img-original');
const imgPixelada = document.getElementById('img-pixelada');
const botonesRes = document.querySelectorAll('.btn-res');
const inputW = document.getElementById('input-w');
const inputH = document.getElementById('input-h');
const btnAplicar = document.getElementById('btn-aplicar');
const btnVolver = document.getElementById('btn-volver');
const btnGuardar = document.getElementById('btn-guardar');

// Capturamos el nuevo elemento
const checkMantenerRes = document.getElementById('check-mantener-res');

let rutaActual = '';
let rutaTempActual = ''; 

['dragover', 'dragleave', 'drop'].forEach(event => {
    window.addEventListener(event, e => e.preventDefault());
});

zonaArrastre.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) iniciarEdicion(file.path);
});

btnSeleccionar.addEventListener('click', () => {
    ipcRenderer.send('abrir-archivo');
});

ipcRenderer.on('archivo-seleccionado', (event, ruta) => {
    iniciarEdicion(ruta);
});

function iniciarEdicion(ruta) {
    rutaActual = ruta;
    pantallaInicio.classList.add('oculto');
    pantallaEdicion.classList.remove('oculto');
    imgOriginal.src = ruta;
    document.querySelector('[data-size="64"]').click();
}

function mandarAProcesar(ancho, alto) {
    pantallaEdicion.classList.add('oculto');
    document.getElementById('pantalla-carga').classList.remove('oculto');
    
    // Enviamos ambos valores empaquetados a Node
    ipcRenderer.send('procesar-imagen', { 
        ruta: rutaActual, 
        ancho: ancho,
        alto: alto,
        mantenerOriginal: checkMantenerRes.checked
    });
}

// Evento para reprocesar si el usuario marca o desmarca la casilla
checkMantenerRes.addEventListener('change', () => {
    if (rutaActual) {
        // Leemos ambos inputs si el usuario cambia la casilla
        const w = inputW.value;
        const h = inputH.value;
        mandarAProcesar(w, h);
    }
});

botonesRes.forEach(boton => {
    boton.addEventListener('click', (e) => {
        botonesRes.forEach(b => b.classList.remove('btn-activo'));
        e.target.classList.add('btn-activo');
        
        const tamano = e.target.getAttribute('data-size');
        inputW.value = tamano;
        inputH.value = tamano;
        
        // Enviamos el mismo tamaño para ambos lados al ser botones cuadrados
        mandarAProcesar(tamano, tamano);
    });
});

btnAplicar.addEventListener('click', () => {
    botonesRes.forEach(b => b.classList.remove('btn-activo'));
    
    // Capturamos los valores de ancho y alto de sus respectivos inputs
    const anchoPersonalizado = inputW.value;
    const altoPersonalizado = inputH.value;
    
    mandarAProcesar(anchoPersonalizado, altoPersonalizado);
});

ipcRenderer.on('proceso-terminado', (event, rutaProcesada) => {
    document.getElementById('pantalla-carga').classList.add('oculto');
    pantallaEdicion.classList.remove('oculto');
    rutaTempActual = rutaProcesada;
    imgPixelada.src = rutaProcesada + '?' + Date.now();
});

btnGuardar.addEventListener('click', () => {
    if (rutaTempActual) {
        ipcRenderer.send('guardar-archivo', {
            temp: rutaTempActual,
            original: rutaActual
        });
    }
});

btnVolver.addEventListener('click', () => {
    if (rutaTempActual) {
        ipcRenderer.send('limpiar-temp', rutaTempActual);
        rutaTempActual = '';
        rutaActual = '';
    }
    pantallaEdicion.classList.add('oculto');
    pantallaInicio.classList.remove('oculto');
    imgOriginal.src = '';
    imgPixelada.src = '';
});