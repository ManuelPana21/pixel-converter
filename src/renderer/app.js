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

// Capturamos los nuevos elementos de la interfaz
const checkMantenerRes = document.getElementById('check-mantener-res');
const inputColores = document.getElementById('input-colores');
const labelColores = document.getElementById('label-colores');
const listaColores = document.getElementById('lista-colores');

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
    
    // Enviamos valores empaquetados a Node, incluyendo cantidad de colores
    ipcRenderer.send('procesar-imagen', { 
        ruta: rutaActual, 
        ancho: parseInt(ancho),
        alto: parseInt(alto),
        mantenerOriginal: checkMantenerRes.checked,
        colores: parseInt(inputColores.value)
    });
}

// Evento para reprocesar si el usuario marca o desmarca la casilla
checkMantenerRes.addEventListener('change', () => {
    if (rutaActual) {
        const w = inputW.value;
        const h = inputH.value;
        mandarAProcesar(w, h);
    }
});

// Eventos para el slider de cantidad de colores
inputColores.addEventListener('input', (e) => {
    labelColores.textContent = e.target.value;
});

inputColores.addEventListener('change', () => {
    if (rutaActual) {
        mandarAProcesar(inputW.value, inputH.value);
    }
});

botonesRes.forEach(boton => {
    boton.addEventListener('click', (e) => {
        botonesRes.forEach(b => b.classList.remove('btn-activo'));
        e.target.classList.add('btn-activo');
        
        const tamano = e.target.getAttribute('data-size');
        inputW.value = tamano;
        inputH.value = tamano;
        
        mandarAProcesar(tamano, tamano);
    });
});

btnAplicar.addEventListener('click', () => {
    botonesRes.forEach(b => b.classList.remove('btn-activo'));
    
    const anchoPersonalizado = inputW.value;
    const altoPersonalizado = inputH.value;
    
    mandarAProcesar(anchoPersonalizado, altoPersonalizado);
});

// Al terminar el procesamiento, recibimos el path de la imagen y la lista de colores
ipcRenderer.on('proceso-terminado', (event, datos) => {
    document.getElementById('pantalla-carga').classList.add('oculto');
    pantallaEdicion.classList.remove('oculto');
    
    const { path: rutaProcesada, colors } = datos;
    rutaTempActual = rutaProcesada;
    imgPixelada.src = rutaProcesada + '?' + Date.now();
    
    // Renderizamos la paleta de colores utilizados
    renderizarPaleta(colors);
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
    listaColores.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--lineas-borde); margin: 20px 0;">Carga una imagen para ver su paleta de colores</p>';
});

// Lista de nombres de colores base (CSS) con sus códigos hexadecimales y RGB correspondientes
const NOMBRES_COLORES = [
    { name: "Negro", hex: "#000000", rgb: [0, 0, 0] },
    { name: "Blanco", hex: "#FFFFFF", rgb: [255, 255, 255] },
    { name: "Rojo", hex: "#FF0000", rgb: [255, 0, 0] },
    { name: "Verde Lima", hex: "#00FF00", rgb: [0, 255, 0] },
    { name: "Azul", hex: "#0000FF", rgb: [0, 0, 255] },
    { name: "Amarillo", hex: "#FFFF00", rgb: [255, 255, 0] },
    { name: "Cian", hex: "#00FFFF", rgb: [0, 255, 255] },
    { name: "Magenta", hex: "#FF00FF", rgb: [255, 0, 255] },
    { name: "Gris", hex: "#808080", rgb: [128, 128, 128] },
    { name: "Gris Oscuro", hex: "#A9A9A9", rgb: [169, 169, 169] },
    { name: "Gris Claro", hex: "#D3D3D3", rgb: [211, 211, 211] },
    { name: "Granate", hex: "#800000", rgb: [128, 0, 0] },
    { name: "Oliva", hex: "#808000", rgb: [128, 128, 0] },
    { name: "Verde", hex: "#008000", rgb: [0, 128, 0] },
    { name: "Púrpura", hex: "#800080", rgb: [128, 0, 128] },
    { name: "Teal (Azul Verde)", hex: "#008080", rgb: [0, 128, 128] },
    { name: "Azul Marino", hex: "#000080", rgb: [0, 0, 128] },
    { name: "Naranja", hex: "#FFA500", rgb: [255, 165, 0] },
    { name: "Marrón", hex: "#A52A2A", rgb: [165, 42, 42] },
    { name: "Rosa", hex: "#FFC0CB", rgb: [255, 192, 203] },
    { name: "Oro", hex: "#FFD700", rgb: [255, 215, 0] },
    { name: "Beige", hex: "#F5F5DC", rgb: [245, 245, 220] },
    { name: "Violeta", hex: "#EE82EE", rgb: [238, 130, 238] },
    { name: "Turquesa", hex: "#40E0D0", rgb: [64, 224, 208] },
    { name: "Salmón", hex: "#FA8072", rgb: [250, 128, 114] },
    { name: "Chocolate", hex: "#D2691E", rgb: [210, 105, 30] },
    { name: "Trigo", hex: "#F5DEB3", rgb: [245, 222, 179] },
    { name: "Tomate", hex: "#FF6347", rgb: [255, 99, 71] },
    { name: "Lavanda", hex: "#E6E6FA", rgb: [230, 230, 250] },
    { name: "Orquídea", hex: "#DA70D6", rgb: [218, 112, 214] },
    { name: "Coral", hex: "#FF7F50", rgb: [255, 127, 80] },
    { name: "Khaki", hex: "#F0E68C", rgb: [240, 230, 140] },
    { name: "Plata", hex: "#C0C0C0", rgb: [192, 192, 192] },
    { name: "Azul Cielo", hex: "#87CEEB", rgb: [135, 206, 235] },
    { name: "Azul Acero", hex: "#4682B4", rgb: [70, 130, 180] },
    { name: "Verde Bosque", hex: "#228B22", rgb: [34, 139, 34] },
    { name: "Verde Mar", hex: "#2E8B57", rgb: [46, 139, 87] },
    { name: "Siena", hex: "#A0522D", rgb: [160, 82, 45] },
    { name: "Ciruela", hex: "#DDA0DD", rgb: [221, 160, 221] }
];

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

// Encuentra el nombre del color más cercano usando distancia euclidiana en el espacio RGB
function obtenerNombreColor(hex) {
    try {
        const rgb = hexToRgb(hex);
        let minDistance = Infinity;
        let nearestColor = "Desconocido";

        for (const color of NOMBRES_COLORES) {
            const d = Math.sqrt(
                Math.pow(rgb[0] - color.rgb[0], 2) +
                Math.pow(rgb[1] - color.rgb[1], 2) +
                Math.pow(rgb[2] - color.rgb[2], 2)
            );
            if (d < minDistance) {
                minDistance = d;
                nearestColor = color.name;
            }
        }
        return nearestColor;
    } catch (e) {
        return "Desconocido";
    }
}

// Crea los chips visuales de la paleta y los inserta en el DOM
function renderizarPaleta(colors) {
    listaColores.innerHTML = '';
    if (!colors || colors.length === 0) {
        listaColores.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--lineas-borde); margin: 20px 0;">No se detectaron colores</p>';
        return;
    }
    
    colors.forEach(hex => {
        const nombre = obtenerNombreColor(hex);
        
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-color';
        
        const muestra = document.createElement('div');
        muestra.className = 'muestra-color';
        muestra.style.backgroundColor = hex;
        
        const info = document.createElement('div');
        info.className = 'info-color';
        
        const spanHex = document.createElement('span');
        spanHex.className = 'hex-color';
        spanHex.textContent = hex;
        
        const spanNombre = document.createElement('span');
        spanNombre.className = 'nombre-color';
        spanNombre.textContent = nombre;
        
        info.appendChild(spanHex);
        info.appendChild(spanNombre);
        tarjeta.appendChild(muestra);
        tarjeta.appendChild(info);
        listaColores.appendChild(tarjeta);
    });
}