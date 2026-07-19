import os
import tempfile
from PIL import Image

def convertir_a_pixel_art(ruta_input, ancho, alto, mantener_original, colores):
    imagen = Image.open(ruta_input)
    imagen = imagen.convert("RGBA")
    
    ancho_original, alto_original = imagen.size

    # Usamos las dimensiones independientes en la reduccion
    imagen_pequena = imagen.resize((ancho, alto), Image.NEAREST)
    imagen_pixelada = imagen_pequena.quantize(colors=colores, method=Image.FASTOCTREE)

    # Extraemos los colores únicos de la imagen reducida para mayor velocidad
    imagen_rgba = imagen_pixelada.convert("RGBA")
    unique_colors = imagen_rgba.getcolors(maxcolors=1000)
    
    hex_colors = []
    if unique_colors:
        # Ordenamos por cantidad de píxeles (de mayor a menor)
        unique_colors.sort(key=lambda x: x[0], reverse=True)
        for count, rgba in unique_colors:
            r, g, b, a = rgba
            if a > 0: # Ignorar píxeles totalmente transparentes
                hex_val = f"#{r:02x}{g:02x}{b:02x}".upper()
                if hex_val not in hex_colors:
                    hex_colors.append(hex_val)

    if mantener_original:
        imagen_pixelada = imagen_pixelada.resize((ancho_original, alto_original), Image.NEAREST)

    temp_dir = tempfile.gettempdir()
    ruta_output = os.path.join(temp_dir, "pixel_converter_temp.png")
    
    imagen_pixelada.save(ruta_output)
    return ruta_output, hex_colors