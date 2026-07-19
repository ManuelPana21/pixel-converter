import sys
import json
from processor import convertir_a_pixel_art

def main():
    # Aseguramos que nos envian la ruta el ancho el alto, el booleano y opcionalmente la cantidad de colores
    if len(sys.argv) < 5:
        return

    ruta_input = sys.argv[1]
    ancho = int(sys.argv[2])
    alto = int(sys.argv[3])
    mantener_original = sys.argv[4].lower() == 'true'
    
    colores = 16
    if len(sys.argv) >= 6:
        try:
            colores = int(sys.argv[5])
        except ValueError:
            pass

    # Pasamos las medidas y el número de colores a la función
    resultado, lista_colores = convertir_a_pixel_art(ruta_input, ancho, alto, mantener_original, colores)
    
    print(json.dumps({"status": "ok", "path": resultado, "colors": lista_colores}))

if __name__ == "__main__":
    main()