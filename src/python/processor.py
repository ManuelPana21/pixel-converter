import os
import tempfile
from PIL import Image

def convertir_a_pixel_art(ruta_input, ancho, alto, mantener_original):
    imagen = Image.open(ruta_input)
    imagen = imagen.convert("RGBA")
    
    ancho_original, alto_original = imagen.size

    # Usamos las dimensiones independientes en la reduccion
    imagen_pequena = imagen.resize((ancho, alto), Image.NEAREST)
    imagen_pixelada = imagen_pequena.quantize(colors=16, method=Image.FASTOCTREE)

    if mantener_original:
        imagen_pixelada = imagen_pixelada.resize((ancho_original, alto_original), Image.NEAREST)

    temp_dir = tempfile.gettempdir()
    ruta_output = os.path.join(temp_dir, "pixel_converter_temp.png")
    
    imagen_pixelada.save(ruta_output)
    return ruta_output